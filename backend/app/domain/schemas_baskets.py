"""Pydantic boundary schemas for basket comparison/optimization — mirrors
the plain-`BaseModel` convention in `schemas_bills.py`, kept in a separate
file since basket comparison is a distinct API surface (manual baskets,
not just bill-derived ones).
"""

from pydantic import BaseModel

from app.domain.schemas_bills import BasketItemOut, BasketItemRecommendationOut


class PlatformBasketTotalOut(BaseModel):
    platform_slug: str
    platform_name: str
    total_cost: float
    covers_full_basket: bool
    items_covered: int
    items_total: int


class ItemPlatformChoiceOut(BaseModel):
    product_name: str
    platform_slug: str
    platform_name: str
    effective_cost: float


class BasketRecommendationOut(BaseModel):
    label: str
    platform_name: str
    total_cost: float
    reason: str


class BasketOptimizationOut(BaseModel):
    current_basket_cost: float | None
    cheapest_platform_cost: PlatformBasketTotalOut | None
    best_overall_platform_cost: PlatformBasketTotalOut | None
    multi_platform_optimized_cost: float | None
    multi_platform_breakdown: list[ItemPlatformChoiceOut]
    estimated_savings: float | None
    best_overall: BasketRecommendationOut | None
    cheapest: BasketRecommendationOut | None
    best_value: BasketRecommendationOut | None
    fastest: BasketRecommendationOut | None


class BasketItemInput(BaseModel):
    product_name: str
    quantity: float
    unit: str
    total_price: float = 0.0


class BasketCompareRequest(BaseModel):
    items: list[BasketItemInput]
    location_key: str | None = None


class BasketCompareResponse(BaseModel):
    basket_id: int | None = None
    basket: list[BasketItemOut]
    item_recommendations: list[BasketItemRecommendationOut]
    optimization: BasketOptimizationOut
