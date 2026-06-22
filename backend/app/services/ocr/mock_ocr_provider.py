"""Canned OCR output, for demos and tests that shouldn't depend on the
Tesseract binary being installed. Always returns the same line items
regardless of the bytes given to it.
"""

from app.services.ocr.base import OCRProvider, OCRResult, OCRStatus

_CANNED_TEXT = """\
FreshMart Grocery Store
Aashirvaad Whole Wheat Atta 5kg x1 399.00
Amul Butter 500g x2 275.00
Tata Salt 1kg x1 28.00
"""


class MockOCRProvider(OCRProvider):
    def extract_text(self, file_bytes: bytes, content_type: str) -> OCRResult:
        return OCRResult(status=OCRStatus.SUCCESS, raw_text=_CANNED_TEXT)
