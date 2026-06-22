from pydantic import BaseModel

from app.domain.schemas import RecommendationSetOut


class ProviderListingOut(BaseModel):
    platform_slug: str
    platform_name: str
    product_name: str
    mrp: float
    selling_price: float
    delivery_fee: float
    platform_fee: float
    handling_fee: float
    product_rating: float
    delivery_rating: float
    eta_minutes: int
    in_stock: bool
    product_url: str
    location_key: str | None = None


class ProviderStatusOut(BaseModel):
    platform_slug: str
    status: str
    message: str
    listings: list[ProviderListingOut]


class ProviderSearchResult(BaseModel):
    query: str
    location: str | None
    providers: list[ProviderStatusOut]
    recommendations: RecommendationSetOut | None
