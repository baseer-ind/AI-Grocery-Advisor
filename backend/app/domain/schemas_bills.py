from pydantic import BaseModel

from app.domain.schemas import RecommendationSetOut
from app.domain.schemas_providers import ProviderStatusOut


class MatchSuggestionOut(BaseModel):
    product_id: int
    product_name: str
    confidence: float


class BasketItemOut(BaseModel):
    product_name: str
    quantity: float
    unit: str
    total_price: float
    unit_price: float
    basket_item_id: int | None = None
    matched_product_id: int | None = None
    match_tier: str | None = None  # 'auto' | 'suggest' | 'manual'
    match_confidence: float | None = None
    review_status: str = "auto_confirmed"
    suggestions: list[MatchSuggestionOut] = []


class BasketItemRecommendationOut(BaseModel):
    basket_item: BasketItemOut
    providers: list[ProviderStatusOut]
    recommendations: RecommendationSetOut | None


class BillUploadResponse(BaseModel):
    basket: list[BasketItemOut]
    recommendations: list[BasketItemRecommendationOut]
    message: str = ""
    store: str | None = None
    bill_date: str | None = None
