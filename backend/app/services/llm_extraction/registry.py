"""Picks the active LLM extraction provider from settings.

This is the *only* place that should ever know which vendor is active.
Moving from the free Gemini stopgap to a paid provider (Claude, OpenAI) or
back to none — for cost-control, outage, or quality reasons — is a one-line
change here, never a change to `bill_processing_service` or any caller.
"""

from app.services.llm_extraction.base import LLMExtractionProvider
from app.services.llm_extraction.null_provider import NullExtractionProvider
from app.core.config import settings


def build_llm_extraction_provider() -> LLMExtractionProvider:
    provider = settings.llm_fallback_provider.lower()

    if provider == "gemini" and settings.gemini_api_key:
        from app.services.llm_extraction.gemini_provider import GeminiExtractionProvider

        return GeminiExtractionProvider(settings.gemini_api_key)

    # "none", an unrecognized value, or a selected provider missing its
    # API key all fall back to the no-op provider — misconfiguration must
    # never crash uploads, it should just mean the fallback is inactive.
    return NullExtractionProvider()
