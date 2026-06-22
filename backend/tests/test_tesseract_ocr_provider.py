from pathlib import Path
from unittest.mock import patch

import pytesseract

from app.services.ocr.base import OCRStatus
from app.services.ocr.tesseract_provider import TesseractOCRProvider

_SAMPLE_DIR = Path(__file__).resolve().parent.parent / "data" / "sample_bills"


def test_extracts_text_from_real_sample_image():
    image_bytes = (_SAMPLE_DIR / "sample_bill_image.png").read_bytes()
    result = TesseractOCRProvider().extract_text(image_bytes, "image/png")
    assert result.status == OCRStatus.SUCCESS
    assert "Atta" in result.raw_text


def test_extracts_text_from_real_sample_pdf():
    pdf_bytes = (_SAMPLE_DIR / "sample_bill.pdf").read_bytes()
    result = TesseractOCRProvider().extract_text(pdf_bytes, "application/pdf")
    assert result.status == OCRStatus.SUCCESS
    assert "Aashirvaad Whole Wheat Atta 5kg" in result.raw_text


def test_unsupported_content_type():
    result = TesseractOCRProvider().extract_text(b"whatever", "text/plain")
    assert result.status == OCRStatus.UNSUPPORTED_FORMAT


def test_corrupt_image_bytes_returns_parse_error():
    result = TesseractOCRProvider().extract_text(b"not-an-image", "image/png")
    assert result.status == OCRStatus.PARSE_ERROR


def test_corrupt_pdf_bytes_returns_parse_error():
    result = TesseractOCRProvider().extract_text(b"not-a-pdf", "application/pdf")
    assert result.status == OCRStatus.PARSE_ERROR


def test_missing_tesseract_binary_returns_unavailable():
    image_bytes = (_SAMPLE_DIR / "sample_bill_image.png").read_bytes()
    with patch(
        "pytesseract.image_to_string",
        side_effect=pytesseract.TesseractNotFoundError(),
    ):
        result = TesseractOCRProvider().extract_text(image_bytes, "image/png")
    assert result.status == OCRStatus.UNAVAILABLE
