from typing import Literal

from pydantic import BaseModel


class ItemConfirmationRequest(BaseModel):
    action: Literal["confirm", "select_suggestion", "manual_match", "not_sure"]
    product_id: int | None = None


class ItemConfirmationResponse(BaseModel):
    basket_item_id: int
    matched_product_id: int | None
    review_status: str


class ProductIntelligenceMetricsOut(BaseModel):
    bills_processed: int
    total_basket_items: int
    alias_coverage_pct: float
    auto_match_rate_pct: float
    user_correction_rate_pct: float
    new_aliases_last_7_days: int
    total_aliases: int
