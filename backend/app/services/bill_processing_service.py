"""Core OCR -> basket -> recommendation pipeline, shared by the synchronous
upload route and the background worker job.

Pulled out of the route handler so the same logic can run either inline
(small/quick bills, immediate response) or off-thread via the arq worker
(larger bills, OCR-heavy formats) without duplicating it.
"""

import logging
from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.domain.schemas_bills import BillDebugInfo, BillUploadResponse, MatchSuggestionOut
from app.services.basket_comparison_service import basket_item_out, item_recommendations_to_out
from app.services.basket_optimization_engine import BasketOptimizationResult, build_basket_optimization
from app.services.basket_service import Basket, build_basket
from app.services.bill_metadata_service import extract_bill_metadata
from app.services.bill_parsing_service import BillLineItem, parse_bill_text
from app.services.bill_recommendation_service import BasketItemRecommendation, build_recommendations_for_basket
from app.services.llm_extraction.registry import build_llm_extraction_provider
from app.services.llm_fallback_quota import try_consume_fallback_quota
from app.services.ocr.base import OCRProvider, OCRStatus
from app.services.ocr.mock_ocr_provider import MockOCRProvider
from app.services.ocr.tesseract_provider import TesseractOCRProvider
from app.services.product_alias_service import MatchResult, match_product
from app.services.providers.registry import build_price_providers

logger = logging.getLogger("bill_processing")


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
    # Populated only when both the rule-based parser AND the LLM fallback
    # (if any) found zero line items — the raw text behind every genuinely
    # unparsed bill, kept so new regex patterns can be written from real
    # failures instead of guessing at formats.
    unparsed_ocr_text: str | None = None
    used_llm_fallback: bool = False
    # Parallel to `basket.items` — the alias-matching outcome for each item,
    # so a persisting caller (the worker) can write `matched_product_id`/
    # `match_confidence`/`match_tier`/`review_status` onto each `BasketItem`
    # row without re-running the match.
    item_matches: list[MatchResult] | None = None
    debug: BillDebugInfo | None = None


def _build_ocr_provider() -> OCRProvider:
    if settings.ocr_engine == "mock":
        return MockOCRProvider()
    return TesseractOCRProvider()


_OCR_ERROR_STATUS_CODE = {
    OCRStatus.UNSUPPORTED_FORMAT: 415,
    OCRStatus.UNAVAILABLE: 503,
    OCRStatus.PARSE_ERROR: 422,
}


def _review_status_for_tier(tier: str) -> str:
    return "auto_confirmed" if tier == "auto" else "pending_review"


async def _match_basket_items(session: AsyncSession | None, basket: Basket) -> list[MatchResult] | None:
    """Returns None (no matching attempted) when no DB session is available
    — the synchronous upload route doesn't persist baskets at all today, so
    there's nothing to match against productively yet.
    """
    if session is None:
        return None
    return [await match_product(session, item.product_name) for item in basket.items]


def _basket_item_out_with_match(item, match: MatchResult | None):
    out = basket_item_out(item)
    if match is None:
        return out
    out.match_tier = match.tier
    out.match_confidence = match.best.confidence if match.best else None
    out.matched_product_id = match.best.product_id if match.best else None
    out.review_status = _review_status_for_tier(match.tier)
    out.suggestions = [
        MatchSuggestionOut(product_id=c.product_id, product_name=c.product_name, confidence=c.confidence)
        for c in match.suggestions
    ]
    return out


async def process_bill(
    file_bytes: bytes, content_type: str, location: str | None = None, session: AsyncSession | None = None,
    debug: bool = False,
) -> BillProcessingResult:
    ocr_result = _build_ocr_provider().extract_text(file_bytes, content_type)
    if ocr_result.status != OCRStatus.SUCCESS:
        logger.info("bill_ocr_failed status=%s message=%s", ocr_result.status, ocr_result.message)
        raise BillProcessingError(
            status_code=_OCR_ERROR_STATUS_CODE.get(ocr_result.status, 422),
            message=ocr_result.message,
        )

    metadata = extract_bill_metadata(ocr_result.raw_text)
    detected_line_count = len([l for l in ocr_result.raw_text.splitlines() if l.strip()])

    line_items = parse_bill_text(ocr_result.raw_text)
    used_llm_fallback = False
    gemini_response = ""
    gemini_message = ""

    if not line_items:
        # The free rule-based parser is always tried first — the LLM
        # fallback only ever runs on what it couldn't read, so the common
        # case (a recognized bill format) never costs anything.
        line_items, used_llm_fallback, gemini_response, gemini_message = await _try_llm_fallback(ocr_result.raw_text)

    basket = build_basket(line_items)

    item_matches = await _match_basket_items(session, basket) if basket.items else None
    matched_count = sum(1 for m in (item_matches or []) if m.best is not None)
    unmatched_count = len(item_matches or []) - matched_count

    logger.info(
        "bill_processed ocr_confidence=%s detected_lines=%d rule_based_items=%d used_llm_fallback=%s "
        "matched=%d unmatched=%d",
        ocr_result.confidence, detected_line_count, len(line_items), used_llm_fallback,
        matched_count, unmatched_count,
    )

    debug_info = (
        BillDebugInfo(
            raw_ocr_text=ocr_result.raw_text,
            ocr_confidence=ocr_result.confidence,
            detected_line_count=detected_line_count,
            matched_product_count=matched_count,
            unmatched_product_count=unmatched_count,
            llm_fallback_triggered=used_llm_fallback,
            llm_fallback_provider=settings.llm_fallback_provider,
            gemini_response=gemini_response,
            gemini_message=gemini_message,
        )
        if debug
        else None
    )

    if not basket.items:
        return BillProcessingResult(
            response=BillUploadResponse(
                basket=[], recommendations=[], message="No recognizable line items found on this bill.",
                store=metadata.store, bill_date=metadata.bill_date, debug=debug_info,
            ),
            basket=basket,
            unparsed_ocr_text=ocr_result.raw_text,
            used_llm_fallback=used_llm_fallback,
            debug=debug_info,
        )

    item_recommendations = await build_recommendations_for_basket(
        build_price_providers(), basket, location_key=location
    )
    optimization = build_basket_optimization(item_recommendations)

    matches_iter = item_matches if item_matches is not None else [None] * len(basket.items)
    basket_out = [
        _basket_item_out_with_match(item, match) for item, match in zip(basket.items, matches_iter)
    ]
    recommendations_out = item_recommendations_to_out(item_recommendations)

    return BillProcessingResult(
        response=BillUploadResponse(
            basket=basket_out, recommendations=recommendations_out,
            store=metadata.store, bill_date=metadata.bill_date, debug=debug_info,
        ),
        basket=basket,
        item_recommendations=item_recommendations,
        optimization=optimization,
        used_llm_fallback=used_llm_fallback,
        item_matches=item_matches,
        debug=debug_info,
    )


async def _try_llm_fallback(raw_text: str) -> tuple[list[BillLineItem], bool, str, str]:
    """Returns (items, used_fallback, raw_response, message). Never raises —
    a disabled fallback, an exhausted daily cap, or a vendor failure all
    just mean "no extra items," same as if the fallback didn't exist, but
    the reason is always reported back for debug visibility.
    """
    if settings.llm_fallback_provider.lower() == "none":
        return [], False, "", "LLM fallback disabled (LLM_FALLBACK_PROVIDER=none)."

    if not await try_consume_fallback_quota():
        return [], False, "", "LLM fallback daily quota exhausted."

    result = await build_llm_extraction_provider().extract_line_items(raw_text)
    if not result.succeeded:
        return [], False, result.raw_response, result.message
    return result.items, True, result.raw_response, result.message
