"""The verification/learning loop: lets a user resolve a low-confidence
match (or correct a wrong auto-match) for one basket item, permanently
recording the correction as a learned `ProductAlias`; plus a read-only
metrics endpoint so the health of the product-intelligence data moat
(alias coverage, auto-match rate, correction rate, weekly alias growth) is
visible without querying the database by hand.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.domain.models import ShoppingEvent, ShoppingEventItem
from app.domain.schemas_bills import MatchSuggestionOut
from app.domain.schemas_product_intelligence import (
    ItemConfirmationRequest,
    ItemConfirmationResponse,
    ProductIntelligenceMetricsOut,
)
from app.services.product_alias_service import match_product, record_correction
from app.services.product_intelligence_metrics_service import compute_product_intelligence_metrics

router = APIRouter(prefix="/api/v1/bills", tags=["product-intelligence"])


@router.get("/items/{basket_item_id}/suggestions", response_model=list[MatchSuggestionOut])
async def basket_item_suggestions(
    basket_item_id: int, session: AsyncSession = Depends(get_session)
) -> list[MatchSuggestionOut]:
    """Re-runs alias matching against the item's OCR'd product name. Top-3
    suggestions are recomputed on demand rather than persisted as a JSON blob
    on `BasketItem`, so they always reflect the latest alias dictionary —
    including aliases learned from *other* users' corrections since this
    bill was originally processed.
    """
    basket_item = await session.get(ShoppingEventItem, basket_item_id)
    if basket_item is None:
        raise HTTPException(status_code=404, detail="Basket item not found")

    result = await match_product(session, basket_item.product_name)
    return [
        MatchSuggestionOut(product_id=c.product_id, product_name=c.product_name, confidence=c.confidence)
        for c in result.suggestions
    ]


@router.post("/items/{basket_item_id}/confirm", response_model=ItemConfirmationResponse)
async def confirm_basket_item(
    basket_item_id: int,
    body: ItemConfirmationRequest,
    session: AsyncSession = Depends(get_session),
) -> ItemConfirmationResponse:
    basket_item = await session.get(ShoppingEventItem, basket_item_id)
    if basket_item is None:
        raise HTTPException(status_code=404, detail="Basket item not found")

    if body.action == "not_sure":
        basket_item.matched_product_id = None
        basket_item.review_status = "user_rejected"
    else:
        if body.product_id is None:
            raise HTTPException(status_code=400, detail="product_id is required for this action")

        basket = await session.get(ShoppingEvent, basket_item.basket_id)
        source_bill_id = basket.bill_upload_id if basket else None

        await record_correction(
            session,
            raw_text=basket_item.product_name,
            product_id=body.product_id,
            source_bill_id=source_bill_id,
            user_confirmed=True,
        )

        basket_item.matched_product_id = body.product_id
        basket_item.review_status = "user_confirmed" if body.action in ("confirm", "select_suggestion") else "user_edited"

    await session.commit()

    return ItemConfirmationResponse(
        basket_item_id=basket_item.id,
        matched_product_id=basket_item.matched_product_id,
        review_status=basket_item.review_status,
    )


@router.get("/metrics/product-intelligence", response_model=ProductIntelligenceMetricsOut)
async def product_intelligence_metrics(session: AsyncSession = Depends(get_session)) -> ProductIntelligenceMetricsOut:
    return await compute_product_intelligence_metrics(session)
