"""Platform-agnostic interface every OCR engine implements.

Mirrors the `PriceProvider` pattern: bill upload, parsing, and basket
construction only ever see `OCRResult` / raw text, so swapping the engine
(Tesseract today, a cloud OCR API or a different local engine later) means
writing one new file here, not touching the parsing or basket logic.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum


class OCRStatus(str, Enum):
    SUCCESS = "success"
    UNSUPPORTED_FORMAT = "unsupported_format"
    UNAVAILABLE = "unavailable"
    PARSE_ERROR = "parse_error"


@dataclass
class OCRResult:
    status: OCRStatus
    raw_text: str = ""
    message: str = ""


class OCRProvider(ABC):
    @abstractmethod
    def extract_text(self, file_bytes: bytes, content_type: str) -> OCRResult:
        """Extract raw text from a bill file (image or PDF).

        Must never raise — engine/format failures are reported via
        OCRStatus, not exceptions, so one bad upload can't crash the caller.
        """
