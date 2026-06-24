"""Pure aggregation over already-stored data — no AI, no new tracking
infra. The product-intelligence learning system's health is judged by
whether `alias_coverage_pct`/`auto_match_rate_pct` climb and
`user_correction_rate_pct` falls as `total_aliases` grows over time; this
module just computes those numbers from `basket_items`/`product_aliases`/
`bill_uploads` on demand.
"""

from datetime import datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models import BasketItem, BillUpload, ProductAlias
from app.domain.schemas_product_intelligence import ProductIntelligenceMetricsOut


def _pct(numerator: int, denominator: int) -> float:
    return round(100.0 * numerator / denominator, 2) if denominator else 0.0


async def compute_product_intelligence_metrics(session: AsyncSession) -> ProductIntelligenceMetricsOut:
    bills_processed = (
        await session.execute(select(func.count()).where(BillUpload.status == "done"))
    ).scalar_one()

    total_basket_items = (await session.execute(select(func.count()).select_from(BasketItem))).scalar_one()

    matched_items = (
        await session.execute(select(func.count()).where(BasketItem.matched_product_id.is_not(None)))
    ).scalar_one()

    auto_matched_items = (
        await session.execute(select(func.count()).where(BasketItem.match_tier == "auto"))
    ).scalar_one()

    user_corrected_items = (
        await session.execute(
            select(func.count()).where(BasketItem.review_status.in_(["user_edited", "user_rejected"]))
        )
    ).scalar_one()

    reviewed_or_pending_items = (
        await session.execute(
            select(func.count()).where(
                BasketItem.review_status.in_(
                    ["pending_review", "user_confirmed", "user_edited", "user_rejected"]
                )
            )
        )
    ).scalar_one()

    total_aliases = (await session.execute(select(func.count()).select_from(ProductAlias))).scalar_one()

    one_week_ago = datetime.utcnow() - timedelta(days=7)
    new_aliases_last_7_days = (
        await session.execute(select(func.count()).where(ProductAlias.created_at >= one_week_ago))
    ).scalar_one()

    return ProductIntelligenceMetricsOut(
        bills_processed=bills_processed,
        total_basket_items=total_basket_items,
        alias_coverage_pct=_pct(matched_items, total_basket_items),
        auto_match_rate_pct=_pct(auto_matched_items, total_basket_items),
        user_correction_rate_pct=_pct(user_corrected_items, reviewed_or_pending_items),
        new_aliases_last_7_days=new_aliases_last_7_days,
        total_aliases=total_aliases,
    )
