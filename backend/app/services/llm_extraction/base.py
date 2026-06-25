"""Provider-agnostic interface for the LLM extraction fallback.

Mirrors the `OCRProvider` / `PriceProvider` pattern already used elsewhere
in this codebase: every caller only ever sees this interface, never a
specific vendor's SDK or request shape. Swapping Gemini for Claude, OpenAI,
or a self-hosted model later means writing one new file here and flipping
`settings.llm_fallback_provider` — nothing else in the pipeline changes.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass

from app.services.bill_parsing_service import BillLineItem


@dataclass
class LLMExtractionResult:
    items: list[BillLineItem]
    succeeded: bool
    message: str = ""
    # Raw text the vendor returned (or attempted to), kept on both success
    # and failure so a debug view can show exactly what the model said
    # rather than just "it failed" — needed to tell a vendor/network error
    # apart from "the model responded but its JSON didn't parse."
    raw_response: str = ""


class LLMExtractionProvider(ABC):
    @abstractmethod
    async def extract_line_items(self, raw_text: str) -> LLMExtractionResult:
        """Extract structured line items from raw OCR text.

        Must never raise — any vendor/network/parsing failure is reported
        via `LLMExtractionResult(succeeded=False, ...)`, not an exception,
        so a fallback failure degrades to "couldn't read this bill" rather
        than crashing the upload.
        """
