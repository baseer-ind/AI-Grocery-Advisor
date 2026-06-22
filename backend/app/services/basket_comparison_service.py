"""Source-agnostic entry point for basket comparison.

Accepts a `Basket` built from any input source — a parsed bill, an
OCR-derived basket, a manually entered list, or (in future) a saved basket
loaded from the database — and runs it through the same provider fan-out and
optimization pipeline. Callers only need to produce a `Basket`/`BasketItem`;
this module has no opinion on where those items came from.
"""

from dataclasses import dataclass

from app.domain.schemas import RecommendationOut, RecommendationSetOut
from app.domain.schemas_baskets import (
    BasketOptimizationOut,
    BasketRecommendationOut,
    ItemPlatformChoiceOut,
    PlatformBasketTotalOut,
)
from app.domain.schemas_bills import BasketItemOut, BasketItemRecommendationOut
from app.domain.schemas_providers import ProviderListingOut, ProviderStatusOut
from app.services.basket_optimization_engine import BasketOptimizationResult, build_basket_optimization
from app.services.basket_service import Basket, BasketItem
from app.services.bill_recommendation_service import BasketItemRecommendation, build_recommendations_for_basket
from app.services.providers.base import PriceProvider


@dataclass
class BasketComparisonResult:
    basket: Basket
    item_recommendations: list[BasketItemRecommendation]
    optimization: BasketOptimizationResult


def basket_from_items(items: list[BasketItem]) -> Basket:
    """Manually entered baskets skip bill parsing/OCR but land on the same shape."""
    return Basket(items=items)


async def compare_basket(
    providers: list[PriceProvider],
    basket: Basket,
    location_key: str | None = None,
) -> BasketComparisonResult:
    item_recommendations = await build_recommendations_for_basket(providers, basket, location_key=location_key)
    optimization = build_basket_optimization(item_recommendations)
    return BasketComparisonResult(
        basket=basket,
        item_recommendations=item_recommendations,
        optimization=optimization,
    )


def basket_item_out(item: BasketItem) -> BasketItemOut:
    return BasketItemOut(
        product_name=item.product_name,
        quantity=item.quantity,
        unit=item.unit,
        total_price=item.total_price,
        unit_price=item.unit_price,
    )


def item_recommendations_to_out(item_recommendations: list[BasketItemRecommendation]) -> list[BasketItemRecommendationOut]:
    """API-boundary conversion shared by the bill-upload and manual-basket
    routes: turns the engine's `BasketItemRecommendation`s into the
    Pydantic shape both surfaces already expose."""
    out = []
    for item_rec in item_recommendations:
        providers_out = [
            ProviderStatusOut(
                platform_slug=r.platform_slug,
                status=r.status.value,
                message=r.message,
                listings=[
                    ProviderListingOut(
                        platform_slug=listing.platform_slug,
                        platform_name=listing.platform_name,
                        product_name=listing.product_name,
                        mrp=listing.mrp,
                        selling_price=listing.selling_price,
                        delivery_fee=listing.delivery_fee,
                        platform_fee=listing.platform_fee,
                        handling_fee=listing.handling_fee,
                        product_rating=listing.product_rating,
                        delivery_rating=listing.delivery_rating,
                        eta_minutes=listing.eta_minutes,
                        in_stock=listing.in_stock,
                        product_url=listing.product_url,
                        location_key=listing.location_key,
                    )
                    for listing in r.listings
                ],
            )
            for r in item_rec.result.provider_results
        ]

        recommendations_set_out = None
        if item_rec.result.recommendations is not None:
            rs = item_rec.result.recommendations
            recommendations_set_out = RecommendationSetOut(
                best_overall=RecommendationOut(**rs.best_overall.__dict__),
                cheapest=RecommendationOut(**rs.cheapest.__dict__),
                fastest=RecommendationOut(**rs.fastest.__dict__),
                highest_rated=RecommendationOut(**rs.highest_rated.__dict__),
                best_value=RecommendationOut(**rs.best_value.__dict__),
            )

        out.append(
            BasketItemRecommendationOut(
                basket_item=basket_item_out(item_rec.basket_item),
                providers=providers_out,
                recommendations=recommendations_set_out,
            )
        )
    return out


def _platform_total_out(total) -> PlatformBasketTotalOut | None:
    if total is None:
        return None
    return PlatformBasketTotalOut(**total.__dict__)


def _basket_recommendation_out(rec) -> BasketRecommendationOut | None:
    if rec is None:
        return None
    return BasketRecommendationOut(**rec.__dict__)


def optimization_to_out(optimization: BasketOptimizationResult) -> BasketOptimizationOut:
    """API-boundary conversion shared by the bill-upload and manual-basket
    routes, so both expose the same `BasketOptimizationOut` shape."""
    return BasketOptimizationOut(
        current_basket_cost=optimization.current_basket_cost,
        cheapest_platform_cost=_platform_total_out(optimization.cheapest_platform_cost),
        best_overall_platform_cost=_platform_total_out(optimization.best_overall_platform_cost),
        multi_platform_optimized_cost=optimization.multi_platform_optimized_cost,
        multi_platform_breakdown=[
            ItemPlatformChoiceOut(**choice.__dict__) for choice in optimization.multi_platform_breakdown
        ],
        estimated_savings=optimization.estimated_savings,
        best_overall=_basket_recommendation_out(optimization.best_overall),
        cheapest=_basket_recommendation_out(optimization.cheapest),
        best_value=_basket_recommendation_out(optimization.best_value),
        fastest=_basket_recommendation_out(optimization.fastest),
    )
