"""Turns a basket's per-item provider results into a basket-level verdict.

Mirrors `recommendation_engine.py`'s shape (pure function, no I/O, no
framework dependency) but operates one level up: instead of ranking listings
for a single product, it ranks *platforms* across an entire basket, plus
computes the cherry-picked multi-platform optimum. Built on top of
`bill_recommendation_service.build_recommendations_for_basket`'s output, so it
is agnostic to whether those per-item listings came from mock providers, CSV
providers, or a future live provider — it only ever sees `NormalizedListing`
objects.
"""

from dataclasses import dataclass

from app.services.bill_recommendation_service import BasketItemRecommendation
from app.services.pricing_engine import compute_pricing
from app.services.providers.base import NormalizedListing

_BILL_PLATFORM_SLUG = "your-bill"


@dataclass
class PlatformBasketTotal:
    platform_slug: str
    platform_name: str
    total_cost: float
    covers_full_basket: bool
    items_covered: int
    items_total: int


@dataclass
class ItemPlatformChoice:
    product_name: str
    platform_slug: str
    platform_name: str
    effective_cost: float


@dataclass
class BasketRecommendation:
    label: str
    platform_name: str
    total_cost: float
    reason: str


@dataclass
class BasketOptimizationResult:
    current_basket_cost: float | None
    cheapest_platform_cost: PlatformBasketTotal | None
    best_overall_platform_cost: PlatformBasketTotal | None
    multi_platform_optimized_cost: float | None
    multi_platform_breakdown: list[ItemPlatformChoice]
    estimated_savings: float | None
    best_overall: BasketRecommendation | None
    cheapest: BasketRecommendation | None
    best_value: BasketRecommendation | None
    fastest: BasketRecommendation | None


def _real_listings(listings: list[NormalizedListing]) -> list[NormalizedListing]:
    return [l for l in listings if l.platform_slug != _BILL_PLATFORM_SLUG and l.in_stock]


def _best_per_platform(listings: list[NormalizedListing]) -> dict[str, NormalizedListing]:
    """Best (lowest effective cost) in-stock listing per platform for one item."""
    best: dict[str, NormalizedListing] = {}
    best_cost: dict[str, float] = {}
    for listing in listings:
        cost = compute_pricing(listing).effective_cost
        if listing.platform_slug not in best or cost < best_cost[listing.platform_slug]:
            best[listing.platform_slug] = listing
            best_cost[listing.platform_slug] = cost
    return best


def build_basket_optimization(item_recs: list[BasketItemRecommendation]) -> BasketOptimizationResult:
    items_total = len(item_recs)
    if items_total == 0:
        return BasketOptimizationResult(
            current_basket_cost=None,
            cheapest_platform_cost=None,
            best_overall_platform_cost=None,
            multi_platform_optimized_cost=None,
            multi_platform_breakdown=[],
            estimated_savings=None,
            best_overall=None,
            cheapest=None,
            best_value=None,
            fastest=None,
        )

    current_basket_cost = (
        sum(rec.basket_item.total_price for rec in item_recs)
        if all(rec.basket_item.total_price > 0 for rec in item_recs)
        else None
    )

    # per_item_best[i] = {platform_slug: NormalizedListing}
    per_item_best = [
        _best_per_platform(_real_listings([l for r in rec.result.provider_results for l in r.listings]))
        for rec in item_recs
    ]

    all_platform_slugs = {slug for item_best in per_item_best for slug in item_best}

    platform_totals: dict[str, PlatformBasketTotal] = {}
    for slug in all_platform_slugs:
        total_cost = 0.0
        covered = 0
        platform_name = ""
        for item_best in per_item_best:
            if slug in item_best:
                listing = item_best[slug]
                total_cost += compute_pricing(listing).effective_cost
                covered += 1
                platform_name = listing.platform_name
        platform_totals[slug] = PlatformBasketTotal(
            platform_slug=slug,
            platform_name=platform_name,
            total_cost=round(total_cost, 2),
            covers_full_basket=covered == items_total,
            items_covered=covered,
            items_total=items_total,
        )

    full_coverage = [p for p in platform_totals.values() if p.covers_full_basket]
    coverage_pool = full_coverage or list(platform_totals.values())

    cheapest_platform_cost = min(coverage_pool, key=lambda p: p.total_cost) if coverage_pool else None

    # Best overall: average the same weighted score recommendation_engine uses
    # (cost 40% / rating 25% / delivery 20% / speed 15%), per platform, only
    # over items that platform actually covers.
    def _platform_overall_score(slug: str) -> float:
        scores = []
        for item_best in per_item_best:
            if slug not in item_best:
                continue
            listing = item_best[slug]
            cheapest_cost_for_item = min(compute_pricing(l).effective_cost for l in item_best.values())
            cost = compute_pricing(listing).effective_cost
            cost_score = cheapest_cost_for_item / cost if cost else 0
            rating_score = float(listing.product_rating) / 5
            delivery_score = float(listing.delivery_rating) / 5
            speed_score = 1 - min(listing.eta_minutes / 120, 1)
            scores.append(cost_score * 0.4 + rating_score * 0.25 + delivery_score * 0.2 + speed_score * 0.15)
        return sum(scores) / len(scores) if scores else 0.0

    best_overall_platform_cost = (
        max(coverage_pool, key=lambda p: _platform_overall_score(p.platform_slug)) if coverage_pool else None
    )

    # Multi-platform optimized: cherry-pick the cheapest platform per item.
    multi_platform_breakdown: list[ItemPlatformChoice] = []
    multi_platform_total = 0.0
    for rec, item_best in zip(item_recs, per_item_best):
        if not item_best:
            continue
        chosen_slug, chosen_listing = min(item_best.items(), key=lambda kv: compute_pricing(kv[1]).effective_cost)
        cost = compute_pricing(chosen_listing).effective_cost
        multi_platform_breakdown.append(
            ItemPlatformChoice(
                product_name=rec.basket_item.product_name,
                platform_slug=chosen_slug,
                platform_name=chosen_listing.platform_name,
                effective_cost=cost,
            )
        )
        multi_platform_total += cost
    multi_platform_optimized_cost = round(multi_platform_total, 2) if multi_platform_breakdown else None

    estimated_savings = (
        round(current_basket_cost - multi_platform_optimized_cost, 2)
        if current_basket_cost is not None and multi_platform_optimized_cost is not None
        else None
    )

    # Best value: lowest total cost per average rating point, full-coverage platforms preferred.
    def _platform_avg_rating(slug: str) -> float:
        ratings = [item_best[slug].product_rating for item_best in per_item_best if slug in item_best]
        return sum(ratings) / len(ratings) if ratings else 0.0

    best_value_platform = (
        max(coverage_pool, key=lambda p: _platform_avg_rating(p.platform_slug) / p.total_cost if p.total_cost else 0)
        if coverage_pool
        else None
    )

    def _platform_avg_eta(slug: str) -> float:
        etas = [item_best[slug].eta_minutes for item_best in per_item_best if slug in item_best]
        return sum(etas) / len(etas) if etas else float("inf")

    fastest_platform = min(coverage_pool, key=lambda p: _platform_avg_eta(p.platform_slug)) if coverage_pool else None

    best_overall = (
        BasketRecommendation(
            label="Best Overall",
            platform_name=best_overall_platform_cost.platform_name,
            total_cost=best_overall_platform_cost.total_cost,
            reason=(
                f"Best balance of cost (₹{best_overall_platform_cost.total_cost}), product rating and "
                f"delivery speed across all {best_overall_platform_cost.items_covered} items in your basket."
            ),
        )
        if best_overall_platform_cost
        else None
    )

    cheapest = (
        BasketRecommendation(
            label="Cheapest",
            platform_name=cheapest_platform_cost.platform_name,
            total_cost=cheapest_platform_cost.total_cost,
            reason=(
                f"Lowest total basket cost at ₹{cheapest_platform_cost.total_cost} for all "
                f"{cheapest_platform_cost.items_covered} items on a single platform."
            ),
        )
        if cheapest_platform_cost
        else None
    )

    best_value = (
        BasketRecommendation(
            label="Best Value",
            platform_name=best_value_platform.platform_name,
            total_cost=best_value_platform.total_cost,
            reason=(
                f"Strongest rating-per-rupee across your basket at ₹{best_value_platform.total_cost} total — "
                "the best quality-to-cost tradeoff among platforms compared."
            ),
        )
        if best_value_platform
        else None
    )

    fastest = (
        BasketRecommendation(
            label="Fastest Delivery",
            platform_name=fastest_platform.platform_name,
            total_cost=fastest_platform.total_cost,
            reason=(
                f"Quickest average delivery across your basket, at ₹{fastest_platform.total_cost} total "
                f"for all {fastest_platform.items_covered} items."
            ),
        )
        if fastest_platform
        else None
    )

    return BasketOptimizationResult(
        current_basket_cost=round(current_basket_cost, 2) if current_basket_cost is not None else None,
        cheapest_platform_cost=cheapest_platform_cost,
        best_overall_platform_cost=best_overall_platform_cost,
        multi_platform_optimized_cost=multi_platform_optimized_cost,
        multi_platform_breakdown=multi_platform_breakdown,
        estimated_savings=estimated_savings,
        best_overall=best_overall,
        cheapest=cheapest,
        best_value=best_value,
        fastest=fastest,
    )
