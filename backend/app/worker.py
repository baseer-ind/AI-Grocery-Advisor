"""arq worker: runs bill OCR/parsing/recommendation off the request thread.

Started separately from the API process (`arq app.worker.WorkerSettings`).
Jobs persist their outcome onto the `BillUpload` row created by the enqueuing
request, since the request has already returned by the time a job finishes
and has no other way to learn the result.
"""

from arq.connections import RedisSettings

from app.core.config import settings
from app.db.session import SessionLocal
from app.domain.models import Basket, BasketItem, BasketRecommendation, BillUpload
from app.services.bill_processing_service import BillProcessingError, process_bill


async def process_bill_job(ctx, bill_upload_id: int, file_bytes: bytes, content_type: str, location: str | None) -> None:
    async with SessionLocal() as session:
        bill_upload = await session.get(BillUpload, bill_upload_id)
        if bill_upload is None:
            return

        try:
            result = await process_bill(file_bytes, content_type, location=location)
        except BillProcessingError as exc:
            bill_upload.status = "failed"
            bill_upload.error_message = exc.message
            await session.commit()
            return
        except Exception as exc:  # noqa: BLE001 - a job crash must still mark the upload failed, not hang it at "pending" forever
            bill_upload.status = "failed"
            bill_upload.error_message = str(exc)
            await session.commit()
            return

        basket = Basket(bill_upload_id=bill_upload.id, user_id=bill_upload.user_id)
        session.add(basket)
        await session.flush()

        for item_out, item_rec_out in zip(result.basket, result.recommendations):
            basket_item = BasketItem(
                basket_id=basket.id,
                product_name=item_out.product_name,
                quantity=item_out.quantity,
                unit=item_out.unit,
                total_price=item_out.total_price,
            )
            session.add(basket_item)
            await session.flush()

            session.add(
                BasketRecommendation(
                    basket_item_id=basket_item.id,
                    recommendation_json=item_rec_out.model_dump(),
                )
            )

        bill_upload.status = "done"
        await session.commit()


class WorkerSettings:
    functions = [process_bill_job]
    redis_settings = RedisSettings.from_dsn(settings.redis_url)
