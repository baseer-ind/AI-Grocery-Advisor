"""Turns raw price/rating/delivery data into an actual decision, not a data dump.

Every comparison must answer: best overall, cheapest, fastest, highest rated, best value —
each with a one-line reason a shopper can trust.
"""

from dataclasses import dataclass

from app.domain.models import Platform, ProductListing
from app.services.pricing_engine import PricingBreakdown, compute_pricing


@dataclass
class ListingView:
    listing: ProductListing
    platform: Platform
    pricing: PricingBreakdown


@dataclass
class Recommendation:
    label: str
    platform_name: str
    effective_cost: float
    reason: str


@dataclass
class RecommendationSet:
    best_overall: Recommendation
    cheapest: Recommendation
    fastest: Recommendation
    highest_rated: Recommendation
    best_value: Recommendation


def _overall_score(view: ListingView, cheapest_cost: float) -> float:
    """Weighted score: cost (40%), product rating (25%), delivery rating (20%), speed (15%)."""
    cost_score = cheapest_cost / view.pricing.effective_cost if view.pricing.effective_cost else 0
    rating_score = float(view.listing.product_rating) / 5
    delivery_score = float(view.listing.delivery_rating) / 5
    speed_score = 1 - min(view.listing.eta_minutes / 120, 1)
    return cost_score * 0.4 + rating_score * 0.25 + delivery_score * 0.2 + speed_score * 0.15


def build_recommendations(views: list[ListingView]) -> RecommendationSet:
    in_stock = [v for v in views if v.listing.in_stock] or views
    cheapest_cost = min(v.pricing.effective_cost for v in in_stock)

    overall = max(in_stock, key=lambda v: _overall_score(v, cheapest_cost))
    cheapest = min(in_stock, key=lambda v: v.pricing.effective_cost)
    fastest = min(in_stock, key=lambda v: v.listing.eta_minutes)
    highest_rated = max(in_stock, key=lambda v: v.listing.product_rating)

    # best value: best rating-per-rupee relative to the cheapest option
    best_value = max(
        in_stock,
        key=lambda v: float(v.listing.product_rating) / v.pricing.effective_cost,
    )

    return RecommendationSet(
        best_overall=Recommendation(
            label="Best Overall",
            platform_name=overall.platform.name,
            effective_cost=overall.pricing.effective_cost,
            reason=(
                f"Balances cost (₹{overall.pricing.effective_cost}), product rating "
                f"({overall.listing.product_rating}★) and delivery in {overall.listing.eta_minutes} min "
                "better than any other platform."
            ),
        ),
        cheapest=Recommendation(
            label="Cheapest",
            platform_name=cheapest.platform.name,
            effective_cost=cheapest.pricing.effective_cost,
            reason=(
                f"Lowest effective cost at ₹{cheapest.pricing.effective_cost} "
                f"after delivery, platform and handling fees."
            ),
        ),
        fastest=Recommendation(
            label="Fastest Delivery",
            platform_name=fastest.platform.name,
            effective_cost=fastest.pricing.effective_cost,
            reason=f"Delivers in {fastest.listing.eta_minutes} minutes, the quickest of all options compared.",
        ),
        highest_rated=Recommendation(
            label="Highest Rated",
            platform_name=highest_rated.platform.name,
            effective_cost=highest_rated.pricing.effective_cost,
            reason=f"Product rated {highest_rated.listing.product_rating}★, the highest among compared platforms.",
        ),
        best_value=Recommendation(
            label="Best Value",
            platform_name=best_value.platform.name,
            effective_cost=best_value.pricing.effective_cost,
            reason=(
                f"Best rating-per-rupee: {best_value.listing.product_rating}★ at "
                f"₹{best_value.pricing.effective_cost}, the strongest quality-to-cost ratio."
            ),
        ),
    )
