"""Bill Upload MVP: a user uploads a PDF/image bill and gets back a
normalized basket plus, per item, the same provider-driven recommendations
that power live product search — including how their bill price compares.
"""

from fastapi import APIRouter, HTTPException, UploadFile

from app.core.config import settings
from app.domain.schemas import RecommendationOut, RecommendationSetOut
from app.domain.schemas_bills import BasketItemOut, BasketItemRecommendationOut, BillUploadResponse
from app.domain.schemas_providers import ProviderListingOut, ProviderStatusOut
from app.services.basket_service import build_basket
from app.services.bill_parsing_service import parse_bill_text
from app.services.bill_recommendation_service import build_recommendations_for_basket
from app.services.ocr.base import OCRProvider, OCRStatus
from app.services.ocr.mock_ocr_provider import MockOCRProvider
from app.services.ocr.tesseract_provider import TesseractOCRProvider
from app.services.providers.bigbasket_provider import BigBasketProvider
from app.services.providers.csv_provider import CSVProvider
from app.services.providers.mock_provider import MockProvider

router = APIRouter(prefix="/api/v1/bills", tags=["bills"])


def _build_ocr_provider() -> OCRProvider:
    if settings.ocr_engine == "mock":
        return MockOCRProvider()
    return TesseractOCRProvider()


def _build_price_providers() -> list:
    return [CSVProvider(settings.curated_prices_path), MockProvider(), BigBasketProvider()]


_OCR_ERROR_STATUS_CODE = {
    OCRStatus.UNSUPPORTED_FORMAT: 415,
    OCRStatus.UNAVAILABLE: 503,
    OCRStatus.PARSE_ERROR: 422,
}


@router.post("/upload", response_model=BillUploadResponse)
async def upload_bill(file: UploadFile) -> BillUploadResponse:
    file_bytes = await file.read()
    content_type = file.content_type or ""

    ocr_result = _build_ocr_provider().extract_text(file_bytes, content_type)
    if ocr_result.status != OCRStatus.SUCCESS:
        raise HTTPException(
            status_code=_OCR_ERROR_STATUS_CODE.get(ocr_result.status, 422),
            detail=ocr_result.message,
        )

    line_items = parse_bill_text(ocr_result.raw_text)
    basket = build_basket(line_items)

    if not basket.items:
        return BillUploadResponse(basket=[], recommendations=[], message="No recognizable line items found on this bill.")

    item_recommendations = build_recommendations_for_basket(_build_price_providers(), basket)

    basket_out = [
        BasketItemOut(
            product_name=item.product_name,
            quantity=item.quantity,
            unit=item.unit,
            total_price=item.total_price,
            unit_price=item.unit_price,
        )
        for item in basket.items
    ]

    recommendations_out = []
    for item_rec in item_recommendations:
        providers_out = [
            ProviderStatusOut(
                platform_slug=r.platform_slug,
                status=r.status.value,
                message=r.message,
                listings=[
                    ProviderListingOut(
                        platform_slug=listing.platform_slug,
                        platform_name=listing.platform_name,
                        product_name=listing.product_name,
                        mrp=listing.mrp,
                        selling_price=listing.selling_price,
                        delivery_fee=listing.delivery_fee,
                        platform_fee=listing.platform_fee,
                        handling_fee=listing.handling_fee,
                        product_rating=listing.product_rating,
                        delivery_rating=listing.delivery_rating,
                        eta_minutes=listing.eta_minutes,
                        in_stock=listing.in_stock,
                        product_url=listing.product_url,
                    )
                    for listing in r.listings
                ],
            )
            for r in item_rec.result.provider_results
        ]

        recommendations_set_out = None
        if item_rec.result.recommendations is not None:
            rs = item_rec.result.recommendations
            recommendations_set_out = RecommendationSetOut(
                best_overall=RecommendationOut(**rs.best_overall.__dict__),
                cheapest=RecommendationOut(**rs.cheapest.__dict__),
                fastest=RecommendationOut(**rs.fastest.__dict__),
                highest_rated=RecommendationOut(**rs.highest_rated.__dict__),
                best_value=RecommendationOut(**rs.best_value.__dict__),
            )

        recommendations_out.append(
            BasketItemRecommendationOut(
                basket_item=BasketItemOut(
                    product_name=item_rec.basket_item.product_name,
                    quantity=item_rec.basket_item.quantity,
                    unit=item_rec.basket_item.unit,
                    total_price=item_rec.basket_item.total_price,
                    unit_price=item_rec.basket_item.unit_price,
                ),
                providers=providers_out,
                recommendations=recommendations_set_out,
            )
        )

    return BillUploadResponse(basket=basket_out, recommendations=recommendations_out)
