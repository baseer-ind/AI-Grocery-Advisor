"""Queued bill upload: hands OCR/parsing off to the arq worker instead of
blocking the request on it. Returns immediately with a `bill_upload_id` to
poll; `routes_bill_upload.py` remains the inline/synchronous variant.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user_optional
from app.db.session import get_session
from app.domain.models import BasketOptimization, BasketRecommendation, BillUpload, ShoppingEvent, ShoppingEventItem, User
from app.domain.schemas_baskets import BasketOptimizationOut
from app.domain.schemas_bills import BasketItemRecommendationOut, BillUploadResponse
from app.domain.schemas_bills_async import BillUploadAsyncAccepted, BillUploadStatusOut
from app.queue import get_arq_pool
from app.services.shopping_event_intelligence_service import compute_shopping_event_intelligence

router = APIRouter(prefix="/api/v1/bills", tags=["bills"])


@router.post("/upload-async", response_model=BillUploadAsyncAccepted, status_code=202)
async def upload_bill_async(
    file: UploadFile,
    location: str | None = Query(None),
    user: User | None = Depends(get_current_user_optional),
    session: AsyncSession = Depends(get_session),
) -> BillUploadAsyncAccepted:
    file_bytes = await file.read()
    content_type = file.content_type or ""

    bill_upload = BillUpload(
        original_filename=file.filename or "",
        content_type=content_type,
        status="pending",
        user_id=user.id if user else None,
    )
    session.add(bill_upload)
    await session.commit()

    pool = await get_arq_pool()
    job = await pool.enqueue_job("process_bill_job", bill_upload.id, file_bytes, content_type, location)

    bill_upload.job_id = job.job_id
    await session.commit()

    return BillUploadAsyncAccepted(bill_upload_id=bill_upload.id, job_id=job.job_id, status=bill_upload.status)


@router.get("/upload-async/{bill_upload_id}", response_model=BillUploadStatusOut)
async def get_bill_upload_status(
    bill_upload_id: int, session: AsyncSession = Depends(get_session)
) -> BillUploadStatusOut:
    bill_upload = await session.get(BillUpload, bill_upload_id)
    if bill_upload is None:
        raise HTTPException(status_code=404, detail="Bill upload not found")

    if bill_upload.status != "done":
        return BillUploadStatusOut(
            bill_upload_id=bill_upload.id, status=bill_upload.status, error_message=bill_upload.error_message
        )

    basket = (
        await session.execute(select(ShoppingEvent).where(ShoppingEvent.bill_upload_id == bill_upload.id))
    ).scalar_one_or_none()
    if basket is None:
        return BillUploadStatusOut(bill_upload_id=bill_upload.id, status=bill_upload.status, result=None)

    basket_id = basket.id
    items = (
        (await session.execute(select(ShoppingEventItem).where(ShoppingEventItem.basket_id == basket_id)))
        .scalars()
        .all()
    )
    recs = (
        await session.execute(
            BasketRecommendation.__table__.select().where(
                BasketRecommendation.basket_item_id.in_([i.id for i in items])
            )
        )
    ).all()
    recs_by_item_id = {r.basket_item_id: r.recommendation_json for r in recs}

    result = BillUploadResponse(
        basket=[
            {
                "basket_item_id": i.id,
                "product_name": i.product_name,
                "quantity": float(i.quantity),
                "unit": i.unit,
                "total_price": float(i.total_price),
                "unit_price": float(i.total_price) / float(i.quantity) if float(i.quantity) else 0.0,
                "matched_product_id": i.matched_product_id,
                "match_tier": i.match_tier,
                "match_confidence": float(i.match_confidence) if i.match_confidence is not None else None,
                "review_status": i.review_status,
            }
            for i in items
        ],
        recommendations=[
            BasketItemRecommendationOut(**recs_by_item_id[i.id]) for i in items if i.id in recs_by_item_id
        ],
        store=basket.store_name,
        bill_date=basket.bill_date,
    )
    result.intelligence = await compute_shopping_event_intelligence(session, basket, items)

    optimization_row = (
        await session.execute(BasketOptimization.__table__.select().where(BasketOptimization.basket_id == basket_id))
    ).first()
    optimization_out = BasketOptimizationOut(**optimization_row.optimization_json) if optimization_row else None

    return BillUploadStatusOut(
        bill_upload_id=bill_upload.id, status=bill_upload.status, result=result, optimization=optimization_out
    )
