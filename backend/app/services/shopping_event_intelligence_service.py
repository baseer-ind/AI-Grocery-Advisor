"""Computes intelligence for one shopping event immediately after it's
persisted — spend vs. household baseline, category mix, shopping cadence,
recurring purchases, and savings (reusing the existing optimization engine's
output rather than recomputing it). No new background job: this runs inline
in the same request that created the event, per the product requirement that
every shopping event must generate immediate intelligence.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models import BasketOptimization, Product, ShoppingEvent, ShoppingEventItem
from app.domain.schemas_shopping_intelligence import (
    CategorySpendOut,
    RecurringProductOut,
    ShoppingEventIntelligenceOut,
)

RECURRING_LOOKBACK_EVENTS = 6
RECURRING_MIN_OCCURRENCES = 3


async def compute_shopping_event_intelligence(
    session: AsyncSession, event: ShoppingEvent, items: list[ShoppingEventItem]
) -> ShoppingEventIntelligenceOut:
    total_spend = float(event.total_spend) if event.total_spend is not None else sum(float(i.total_price) for i in items)

    prior_events: list[ShoppingEvent] = []
    if event.household_id is not None:
        prior_events = list(
            (
                await session.execute(
                    select(ShoppingEvent)
                    .where(ShoppingEvent.household_id == event.household_id)
                    .where(ShoppingEvent.id != event.id)
                    .order_by(ShoppingEvent.created_at.desc())
                    .limit(RECURRING_LOOKBACK_EVENTS - 1)
                )
            )
            .scalars()
            .all()
        )

    household_trailing_average_spend = None
    spend_delta_pct = None
    prior_spends = [float(e.total_spend) for e in prior_events if e.total_spend is not None]
    if prior_spends:
        household_trailing_average_spend = sum(prior_spends) / len(prior_spends)
        if household_trailing_average_spend:
            spend_delta_pct = round(
                (total_spend - household_trailing_average_spend) / household_trailing_average_spend * 100, 2
            )

    days_since_previous_event = None
    if prior_events:
        most_recent_prior = max(prior_events, key=lambda e: e.created_at)
        days_since_previous_event = (event.created_at - most_recent_prior.created_at).days

    category_breakdown = await _category_breakdown(session, items, total_spend)
    recurring_products = await _recurring_products(session, event, items, prior_events)

    optimization_row = (
        await session.execute(BasketOptimization.__table__.select().where(BasketOptimization.basket_id == event.id))
    ).first()
    estimated_savings = (
        optimization_row.optimization_json.get("estimated_savings") if optimization_row is not None else None
    )

    return ShoppingEventIntelligenceOut(
        shopping_event_id=event.id,
        total_spend=total_spend,
        household_trailing_average_spend=(
            round(household_trailing_average_spend, 2) if household_trailing_average_spend is not None else None
        ),
        spend_delta_pct=spend_delta_pct,
        category_breakdown=category_breakdown,
        days_since_previous_event=days_since_previous_event,
        recurring_products=recurring_products,
        estimated_savings=float(estimated_savings) if estimated_savings is not None else None,
    )


async def _category_breakdown(
    session: AsyncSession, items: list[ShoppingEventItem], total_spend: float
) -> list[CategorySpendOut]:
    product_ids = [i.matched_product_id for i in items if i.matched_product_id is not None]
    products_by_id = {}
    if product_ids:
        products = (await session.execute(select(Product).where(Product.id.in_(product_ids)))).scalars().all()
        products_by_id = {p.id: p for p in products}

    spend_by_category: dict[str, float] = {}
    for item in items:
        product = products_by_id.get(item.matched_product_id) if item.matched_product_id else None
        category = product.category if product else "Uncategorized"
        spend_by_category[category] = spend_by_category.get(category, 0.0) + float(item.total_price)

    return [
        CategorySpendOut(
            category=category,
            amount=round(amount, 2),
            pct_of_event=round(100 * amount / total_spend, 2) if total_spend else 0.0,
        )
        for category, amount in sorted(spend_by_category.items(), key=lambda kv: kv[1], reverse=True)
    ]


async def _recurring_products(
    session: AsyncSession,
    event: ShoppingEvent,
    items: list[ShoppingEventItem],
    prior_events: list[ShoppingEvent],
) -> list[RecurringProductOut]:
    if not prior_events:
        return []

    event_ids = [event.id] + [e.id for e in prior_events]
    rows = (
        await session.execute(
            select(ShoppingEventItem.matched_product_id, ShoppingEventItem.basket_id, ShoppingEvent.bill_date)
            .join(ShoppingEvent, ShoppingEvent.id == ShoppingEventItem.basket_id)
            .where(ShoppingEventItem.basket_id.in_(event_ids))
            .where(ShoppingEventItem.matched_product_id.is_not(None))
        )
    ).all()

    occurrences: dict[int, set[int]] = {}
    last_bill_date: dict[int, str | None] = {}
    for product_id, basket_id, bill_date in rows:
        occurrences.setdefault(product_id, set()).add(basket_id)
        last_bill_date[product_id] = bill_date

    recurring_ids = [pid for pid, baskets in occurrences.items() if len(baskets) >= RECURRING_MIN_OCCURRENCES]
    if not recurring_ids:
        return []

    products = (await session.execute(select(Product).where(Product.id.in_(recurring_ids)))).scalars().all()
    products_by_id = {p.id: p for p in products}

    return [
        RecurringProductOut(
            product_id=pid,
            product_name=products_by_id[pid].name,
            occurrences_in_last_n_events=len(occurrences[pid]),
            last_purchased_bill_date=last_bill_date.get(pid),
        )
        for pid in recurring_ids
        if pid in products_by_id
    ]
