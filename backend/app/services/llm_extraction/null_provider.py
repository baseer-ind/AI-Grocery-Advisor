"""No-op fallback provider — used whenever the fallback is disabled
(`settings.llm_fallback_provider == "none"`, the default) or no API key is
configured for the selected provider.

Exists so the rest of the pipeline can always call the same interface
without branching on "is the fallback even configured?" — disabling AI
entirely is just "the registry returns this instead," not a different
code path through `bill_processing_service`.
"""

from app.services.llm_extraction.base import LLMExtractionProvider, LLMExtractionResult


class NullExtractionProvider(LLMExtractionProvider):
    async def extract_line_items(self, raw_text: str) -> LLMExtractionResult:
        return LLMExtractionResult(items=[], succeeded=False, message="LLM extraction fallback is not configured.")
