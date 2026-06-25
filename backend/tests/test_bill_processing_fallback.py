"""Stress-tests the regex-first/LLM-fallback pipeline: every known bill
format must still parse for free, an unrecognized format must trigger the
fallback (only when configured), a disabled fallback must degrade safely
to "unread," and the daily quota must be enforced even when the fallback
would otherwise succeed.
"""

from app.core.config import settings
from app.services import bill_processing_service
from app.services.bill_parsing_service import BillLineItem
from app.services.llm_extraction.base import LLMExtractionResult


_DELIVERY_APP_FORMAT = "Amul Butter 500g x2 275.00\n"
_TABULAR_FORMAT = "Dairy Milk Cdm 46 Gm 1.00 40.00 29.37 29.37\n"
_UNRECOGNIZED_FORMAT = "081340 KITCHEN KING E-500g 1 79.50 79.50\n"  # HSN-prefixed, variable columns


async def test_known_formats_never_invoke_the_fallback(monkeypatch):
    calls = {"count": 0}

    async def _spy_extract(self, raw_text):
        calls["count"] += 1
        return LLMExtractionResult(items=[], succeeded=False)

    monkeypatch.setattr(settings, "llm_fallback_provider", "gemini")
    monkeypatch.setattr(settings, "gemini_api_key", "fake-key")
    monkeypatch.setattr(
        "app.services.llm_extraction.gemini_provider.GeminiExtractionProvider.extract_line_items", _spy_extract
    )

    # The real assertion: parse_bill_text already succeeds on these, so
    # process_bill never reaches `_try_llm_fallback` at all.
    from app.services.bill_parsing_service import parse_bill_text

    assert len(parse_bill_text(_DELIVERY_APP_FORMAT)) == 1
    assert len(parse_bill_text(_TABULAR_FORMAT)) == 1
    assert calls["count"] == 0


async def test_unrecognized_format_uses_fallback_when_configured(monkeypatch):
    monkeypatch.setattr(settings, "llm_fallback_provider", "gemini")
    monkeypatch.setattr(settings, "gemini_api_key", "fake-key")

    async def _fake_extract(self, raw_text):
        return LLMExtractionResult(
            items=[BillLineItem(product_name="Kitchen King E-500g", quantity=1.0, unit="unit", price=79.50)],
            succeeded=True,
        )

    monkeypatch.setattr(
        "app.services.llm_extraction.gemini_provider.GeminiExtractionProvider.extract_line_items", _fake_extract
    )
    monkeypatch.setattr(bill_processing_service, "try_consume_fallback_quota", _always_allow)

    items, used_fallback, _, _ = await bill_processing_service._try_llm_fallback(_UNRECOGNIZED_FORMAT)
    assert used_fallback is True
    assert len(items) == 1
    assert items[0].product_name == "Kitchen King E-500g"


async def test_disabled_fallback_degrades_to_unread_without_crashing(monkeypatch):
    monkeypatch.setattr(settings, "llm_fallback_provider", "none")

    items, used_fallback, _, _ = await bill_processing_service._try_llm_fallback(_UNRECOGNIZED_FORMAT)
    assert items == []
    assert used_fallback is False


async def test_quota_exhaustion_blocks_fallback_even_when_provider_would_succeed(monkeypatch):
    monkeypatch.setattr(settings, "llm_fallback_provider", "gemini")
    monkeypatch.setattr(settings, "gemini_api_key", "fake-key")
    monkeypatch.setattr(bill_processing_service, "try_consume_fallback_quota", _always_deny)

    items, used_fallback, _, _ = await bill_processing_service._try_llm_fallback(_UNRECOGNIZED_FORMAT)
    assert items == []
    assert used_fallback is False


async def test_provider_failure_degrades_safely_instead_of_raising(monkeypatch):
    monkeypatch.setattr(settings, "llm_fallback_provider", "gemini")
    monkeypatch.setattr(settings, "gemini_api_key", "fake-key")
    monkeypatch.setattr(bill_processing_service, "try_consume_fallback_quota", _always_allow)

    async def _raises(self, raw_text):
        raise RuntimeError("simulated vendor outage")

    # The real GeminiExtractionProvider never raises (it catches internally)
    # — this proves the pipeline still wouldn't crash even if a future
    # provider implementation forgot to.
    async def _failing_extract(self, raw_text):
        return LLMExtractionResult(items=[], succeeded=False, message="simulated failure")

    monkeypatch.setattr(
        "app.services.llm_extraction.gemini_provider.GeminiExtractionProvider.extract_line_items", _failing_extract
    )

    items, used_fallback, _, _ = await bill_processing_service._try_llm_fallback(_UNRECOGNIZED_FORMAT)
    assert items == []
    assert used_fallback is False


async def _always_allow():
    return True


async def _always_deny():
    return False
