from pydantic import BaseModel


class CategorySpendOut(BaseModel):
    category: str
    amount: float
    pct_of_event: float


class RecurringProductOut(BaseModel):
    product_id: int
    product_name: str
    occurrences_in_last_n_events: int
    last_purchased_bill_date: str | None = None


class ShoppingEventIntelligenceOut(BaseModel):
    shopping_event_id: int
    total_spend: float
    household_trailing_average_spend: float | None = None
    """None when the household has no prior events to average against."""
    spend_delta_pct: float | None = None
    """(total_spend - trailing_average) / trailing_average * 100; None without a baseline."""
    category_breakdown: list[CategorySpendOut]
    days_since_previous_event: int | None = None
    recurring_products: list[RecurringProductOut]
    estimated_savings: float | None = None
    """Reuses the existing basket-optimization engine's `estimated_savings`, when available for this event."""


class PredictedPantryItemOut(BaseModel):
    product_id: int
    product_name: str
    category: str
    last_purchased_bill_date: str | None = None
    typical_repurchase_interval_days: float | None = None
    estimated_days_of_stock_remaining: float | None = None
    confidence: str
    """'low' | 'medium' | 'high' — gated on number of historical purchases of this product."""
    purchase_count: int


class PredictedPantryOut(BaseModel):
    household_id: int
    items: list[PredictedPantryItemOut]
    confidence: str
    """Overall confidence for the household: 'low' below 2 shopping events, else the items' own confidence applies."""


class ShoppingEventSummaryOut(BaseModel):
    shopping_event_id: int
    bill_date: str | None = None
    store_name: str | None = None
    total_spend: float | None = None
    purchase_method: str | None = None
