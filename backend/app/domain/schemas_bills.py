from pydantic import BaseModel

from app.domain.schemas import RecommendationSetOut
from app.domain.schemas_providers import ProviderStatusOut


class BasketItemOut(BaseModel):
    product_name: str
    quantity: float
    unit: str
    total_price: float
    unit_price: float


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
