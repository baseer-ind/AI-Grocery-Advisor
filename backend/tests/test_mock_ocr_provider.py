from app.services.ocr.base import OCRStatus
from app.services.ocr.mock_ocr_provider import MockOCRProvider


def test_always_returns_canned_success_text():
    result = MockOCRProvider().extract_text(b"irrelevant", "image/png")
    assert result.status == OCRStatus.SUCCESS
    assert "Atta" in result.raw_text
