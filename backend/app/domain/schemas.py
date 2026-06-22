from pydantic import BaseModel


class ListingResult(BaseModel):
    platform: str
    platform_slug: str
    mrp: float
    selling_price: float
    delivery_fee: float
    platform_fee: float
    handling_fee: float
    effective_cost: float
    platform_discount_pct: float
    real_discount_pct: float
    product_rating: float
    delivery_rating: float
    eta_minutes: int
    in_stock: bool
    product_url: str


class RecommendationOut(BaseModel):
    label: str
    platform_name: str
    effective_cost: float
    reason: str


class RecommendationSetOut(BaseModel):
    best_overall: RecommendationOut
    cheapest: RecommendationOut
    fastest: RecommendationOut
    highest_rated: RecommendationOut
    best_value: RecommendationOut


class ProductSearchResult(BaseModel):
    product_id: int
    product_name: str
    brand: str
    category: str
    canonical_quantity: float
    canonical_unit: str
    listings: list[ListingResult]
    recommendations: RecommendationSetOut
