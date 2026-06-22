"""Bill Upload MVP: a user uploads a PDF/image bill and gets back a
normalized basket plus, per item, the same provider-driven recommendations
that power live product search — including how their bill price compares.

This endpoint processes the bill inline and blocks until done. See
`routes_bill_upload_async.py` for the queued variant that hands OCR off to
the background worker instead of running it on the request thread.
"""

from fastapi import APIRouter, HTTPException, Query, UploadFile

from app.domain.schemas_bills import BillUploadResponse
from app.services.bill_processing_service import BillProcessingError, process_bill

router = APIRouter(prefix="/api/v1/bills", tags=["bills"])


@router.post("/upload", response_model=BillUploadResponse)
async def upload_bill(file: UploadFile, location: str | None = Query(None)) -> BillUploadResponse:
    file_bytes = await file.read()
    content_type = file.content_type or ""

    try:
        return await process_bill(file_bytes, content_type, location=location)
    except BillProcessingError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
