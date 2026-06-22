"""Core OCR -> basket -> recommendation pipeline, shared by the synchronous
upload route and the background worker job.

Pulled out of the route handler so the same logic can run either inline
(small/quick bills, immediate response) or off-thread via the arq worker
(larger bills, OCR-heavy formats) without duplicating it.
"""

from dataclasses import dataclass

from app.core.config import settings
from app.domain.schemas_bills import BillUploadResponse
from app.services.basket_comparison_service import basket_item_out, item_recommendations_to_out
from app.services.basket_optimization_engine import BasketOptimizationResult, build_basket_optimization
from app.services.basket_service import Basket, build_basket
from app.services.bill_parsing_service import parse_bill_text
from app.services.bill_recommendation_service import BasketItemRecommendation, build_recommendations_for_basket
from app.services.ocr.base import OCRProvider, OCRStatus
from app.services.ocr.mock_ocr_provider import MockOCRProvider
from app.services.ocr.tesseract_provider import TesseractOCRProvider
from app.services.providers.registry import build_price_providers


class BillProcessingError(Exception):
    def __init__(self, status_code: int, message: str):
        super().__init__(message)
        self.status_code = status_code
        self.message = message


@dataclass
class BillProcessingResult:
    response: BillUploadResponse
    basket: Basket | None = None
    item_recommendations: list[BasketItemRecommendation] | None = None
    optimization: BasketOptimizationResult | None = None


def _build_ocr_provider() -> OCRProvider:
    if settings.ocr_engine == "mock":
        return MockOCRProvider()
    return TesseractOCRProvider()


_OCR_ERROR_STATUS_CODE = {
    OCRStatus.UNSUPPORTED_FORMAT: 415,
    OCRStatus.UNAVAILABLE: 503,
    OCRStatus.PARSE_ERROR: 422,
}


async def process_bill(file_bytes: bytes, content_type: str, location: str | None = None) -> BillProcessingResult:
    ocr_result = _build_ocr_provider().extract_text(file_bytes, content_type)
    if ocr_result.status != OCRStatus.SUCCESS:
        raise BillProcessingError(
            status_code=_OCR_ERROR_STATUS_CODE.get(ocr_result.status, 422),
            message=ocr_result.message,
        )

    line_items = parse_bill_text(ocr_result.raw_text)
    basket = build_basket(line_items)

    if not basket.items:
        return BillProcessingResult(
            response=BillUploadResponse(basket=[], recommendations=[], message="No recognizable line items found on this bill."),
            basket=basket,
        )

    item_recommendations = await build_recommendations_for_basket(
        build_price_providers(), basket, location_key=location
    )
    optimization = build_basket_optimization(item_recommendations)

    basket_out = [basket_item_out(item) for item in basket.items]
    recommendations_out = item_recommendations_to_out(item_recommendations)

    return BillProcessingResult(
        response=BillUploadResponse(basket=basket_out, recommendations=recommendations_out),
        basket=basket,
        item_recommendations=item_recommendations,
        optimization=optimization,
    )
