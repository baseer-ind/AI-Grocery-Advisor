"""Bill Upload MVP: a user uploads a PDF/image bill and gets back a
normalized basket plus, per item, the same provider-driven recommendations
that power live product search — including how their bill price compares.

This endpoint processes the bill inline and blocks until done, persisting
the same Basket/BasketItem rows (with match data) that the queued variant in
`routes_bill_upload_async.py` produces, so the product-intelligence
verification endpoints work against either path. Deliberately not deferred
to the arq worker here — that requires a background-worker process and
Redis, which isn't always available (e.g. free-tier hosting), so this stays
the dependable default the frontend can always call.
"""

from dataclasses import asdict

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.domain.models import BasketOptimization, BasketRecommendation, BillUpload, ShoppingEvent, ShoppingEventItem
from app.domain.schemas_bills import BillUploadResponse
from app.services.bill_processing_service import BillProcessingError, process_bill
from app.services.shopping_event_intelligence_service import compute_shopping_event_intelligence

router = APIRouter(prefix="/api/v1/bills", tags=["bills"])


@router.post("/upload", response_model=BillUploadResponse)
async def upload_bill(
    file: UploadFile,
    location: str | None = Query(None),
    debug: bool = Query(False, description="Include OCR/matching/Gemini diagnostics in the response."),
    session: AsyncSession = Depends(get_session),
) -> BillUploadResponse:
    file_bytes = await file.read()
    content_type = file.content_type or ""

    bill_upload = BillUpload(original_filename=file.filename or "", content_type=content_type, status="pending")
    session.add(bill_upload)
    await session.flush()

    try:
        result = await process_bill(file_bytes, content_type, location=location, session=session, debug=debug)
    except BillProcessingError as exc:
        bill_upload.status = "failed"
        bill_upload.error_message = exc.message
        await session.commit()
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc

    if result.unparsed_ocr_text:
        bill_upload.unparsed_ocr_text = result.unparsed_ocr_text

    if result.response.basket:
        basket = ShoppingEvent(
            bill_upload_id=bill_upload.id,
            source="bill_upload",
            receipt_source="bill",
            location_key=location,
            store_name=result.response.store,
            bill_date=result.response.bill_date,
            total_spend=sum(item.total_price for item in result.response.basket),
            used_llm_fallback=result.used_llm_fallback,
        )
        session.add(basket)
        await session.flush()

        recs_by_index = dict(enumerate(result.response.recommendations))
        basket_items: list[ShoppingEventItem] = []
        for idx, item_out in enumerate(result.response.basket):
            basket_item = ShoppingEventItem(
                basket_id=basket.id,
                product_name=item_out.product_name,
                quantity=item_out.quantity,
                unit=item_out.unit,
                total_price=item_out.total_price,
                matched_product_id=item_out.matched_product_id if item_out.match_tier == "auto" else None,
                match_confidence=item_out.match_confidence,
                match_tier=item_out.match_tier,
                review_status=item_out.review_status,
            )
            session.add(basket_item)
            await session.flush()
            item_out.basket_item_id = basket_item.id
            basket_items.append(basket_item)

            rec_out = recs_by_index.get(idx)
            if rec_out is not None:
                session.add(
                    BasketRecommendation(basket_item_id=basket_item.id, recommendation_json=rec_out.model_dump())
                )

        if result.optimization is not None:
            session.add(BasketOptimization(basket_id=basket.id, optimization_json=asdict(result.optimization)))

        bill_upload.status = "done"
        await session.commit()

        result.response.intelligence = await compute_shopping_event_intelligence(session, basket, basket_items)
        return result.response

    bill_upload.status = "done"
    await session.commit()

    return result.response
