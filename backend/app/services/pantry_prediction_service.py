"""Predicted Pantry: a read-time computation over shopping history, never a
manually-maintained inventory table. For each product a household has
bought at least twice, estimates how many days of stock are likely left
from purchase frequency and pack size; confidence is gated on purchase
count so a thin history never produces a falsely confident number (mirrors
the no-fabrication gating the frontend already applies to other "real
data" surfaces).
"""

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models import Product, ShoppingEvent, ShoppingEventItem
from app.domain.schemas_shopping_intelligence import PredictedPantryItemOut, PredictedPantryOut

MIN_PURCHASES_FOR_CONFIDENCE = 2
MIN_PURCHASES_FOR_HIGH_CONFIDENCE = 4


async def predict_pantry(session: AsyncSession, household_id: int) -> PredictedPantryOut:
    rows = (
        await session.execute(
            select(
                ShoppingEventItem.matched_product_id,
                ShoppingEventItem.quantity,
                ShoppingEvent.created_at,
            )
            .join(ShoppingEvent, ShoppingEvent.id == ShoppingEventItem.basket_id)
            .where(ShoppingEvent.household_id == household_id)
            .where(ShoppingEventItem.matched_product_id.is_not(None))
            .order_by(ShoppingEvent.created_at.asc())
        )
    ).all()

    event_count = (
        await session.execute(select(ShoppingEvent.id).where(ShoppingEvent.household_id == household_id))
    ).all()

    if len(event_count) < MIN_PURCHASES_FOR_CONFIDENCE:
        return PredictedPantryOut(household_id=household_id, items=[], confidence="low")

    purchases_by_product: dict[int, list[tuple[float, datetime]]] = {}
    for product_id, quantity, created_at in rows:
        purchases_by_product.setdefault(product_id, []).append((float(quantity), created_at))

    product_ids = list(purchases_by_product.keys())
    products_by_id = {}
    if product_ids:
        products = (await session.execute(select(Product).where(Product.id.in_(product_ids)))).scalars().all()
        products_by_id = {p.id: p for p in products}

    now = datetime.utcnow()
    items: list[PredictedPantryItemOut] = []
    for product_id, purchases in purchases_by_product.items():
        product = products_by_id.get(product_id)
        if product is None or len(purchases) < MIN_PURCHASES_FOR_CONFIDENCE:
            continue

        purchases.sort(key=lambda p: p[1])
        last_quantity, last_purchased_at = purchases[-1]

        gaps_days = [
            (purchases[i][1] - purchases[i - 1][1]).total_seconds() / 86400
            for i in range(1, len(purchases))
            if (purchases[i][1] - purchases[i - 1][1]).total_seconds() > 0
        ]
        typical_interval_days = sum(gaps_days) / len(gaps_days) if gaps_days else None

        days_since_last_purchase = (now - last_purchased_at).total_seconds() / 86400
        estimated_days_remaining = (
            round(typical_interval_days - days_since_last_purchase, 1) if typical_interval_days is not None else None
        )

        if len(purchases) >= MIN_PURCHASES_FOR_HIGH_CONFIDENCE:
            confidence = "high"
        elif len(purchases) >= MIN_PURCHASES_FOR_CONFIDENCE:
            confidence = "medium"
        else:
            confidence = "low"

        items.append(
            PredictedPantryItemOut(
                product_id=product_id,
                product_name=product.name,
                category=product.category,
                last_purchased_bill_date=last_purchased_at.date().isoformat(),
                typical_repurchase_interval_days=(
                    round(typical_interval_days, 1) if typical_interval_days is not None else None
                ),
                estimated_days_of_stock_remaining=estimated_days_remaining,
                confidence=confidence,
                purchase_count=len(purchases),
            )
        )

    items.sort(
        key=lambda i: i.estimated_days_of_stock_remaining
        if i.estimated_days_of_stock_remaining is not None
        else float("inf")
    )

    overall_confidence = "low" if len(event_count) < MIN_PURCHASES_FOR_HIGH_CONFIDENCE else "medium"
    return PredictedPantryOut(household_id=household_id, items=items, confidence=overall_confidence)
