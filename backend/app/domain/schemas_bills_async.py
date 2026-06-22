from pydantic import BaseModel

from app.domain.schemas_baskets import BasketOptimizationOut
from app.domain.schemas_bills import BillUploadResponse


class BillUploadAsyncAccepted(BaseModel):
    bill_upload_id: int
    job_id: str
    status: str


class BillUploadStatusOut(BaseModel):
    bill_upload_id: int
    status: str
    error_message: str | None = None
    result: BillUploadResponse | None = None
    optimization: BasketOptimizationOut | None = None
