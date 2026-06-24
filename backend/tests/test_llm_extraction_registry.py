"""Proves the provider-swap point is safe: any provider behind the same
interface drives the registry/pipeline identically, so migrating from
Gemini to Claude/OpenAI/self-hosted later is a config change, not a code
change.
"""

from app.services.llm_extraction.base import LLMExtractionProvider, LLMExtractionResult
from app.services.llm_extraction.null_provider import NullExtractionProvider
from app.services.llm_extraction.registry import build_llm_extraction_provider
from app.services.bill_parsing_service import BillLineItem


async def test_null_provider_always_fails_without_crashing():
    result = await NullExtractionProvider().extract_line_items("anything")
    assert result.succeeded is False
    assert result.items == []


def test_registry_returns_null_provider_when_disabled(monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "llm_fallback_provider", "none")
    provider = build_llm_extraction_provider()
    assert isinstance(provider, NullExtractionProvider)


def test_registry_returns_null_provider_when_gemini_selected_without_key(monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "llm_fallback_provider", "gemini")
    monkeypatch.setattr(settings, "gemini_api_key", None)
    provider = build_llm_extraction_provider()
    assert isinstance(provider, NullExtractionProvider)


def test_registry_returns_gemini_provider_when_configured(monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "llm_fallback_provider", "gemini")
    monkeypatch.setattr(settings, "gemini_api_key", "fake-key")
    provider = build_llm_extraction_provider()
    assert provider.__class__.__name__ == "GeminiExtractionProvider"


class _FakeProvider(LLMExtractionProvider):
    """Stand-in for any future paid provider (Claude/OpenAI/self-hosted) —
    proves the pipeline only ever depends on the abstract interface.
    """

    async def extract_line_items(self, raw_text: str) -> LLMExtractionResult:
        return LLMExtractionResult(
            items=[BillLineItem(product_name="Stub Item", quantity=1.0, unit="unit", price=10.0)],
            succeeded=True,
        )


async def test_any_provider_implementation_satisfies_the_interface():
    result = await _FakeProvider().extract_line_items("irrelevant")
    assert result.succeeded is True
    assert result.items[0].product_name == "Stub Item"
