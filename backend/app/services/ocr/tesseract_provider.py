"""Real OCR integration using the Tesseract engine.

Images are OCR'd directly via pytesseract. PDFs are handled by reading their
embedded text layer with pypdf rather than rasterizing pages — most grocery
e-bills/invoices are generated as text PDFs, not scanned images, so this
avoids pulling in a Poppler/pdf2image dependency for the common case. A
scanned (image-only) PDF will yield no text and surface as PARSE_ERROR
rather than silently returning an empty basket.

If the `tesseract` binary isn't installed on the host, pytesseract raises
`TesseractNotFoundError` — caught here and reported as UNAVAILABLE so the
caller can degrade gracefully instead of crashing.
"""

import io

import pillow_heif
import pytesseract
from PIL import Image
from pypdf import PdfReader

from app.services.ocr.base import OCRProvider, OCRResult, OCRStatus

# Registers HEIC/HEIF as a Pillow-openable format — without this, PIL has no
# decoder for the format iPhones use by default, and every iPhone-photo
# upload would fail OCR outright.
pillow_heif.register_heif_opener()

_IMAGE_CONTENT_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
}
_PDF_CONTENT_TYPE = "application/pdf"


class TesseractOCRProvider(OCRProvider):
    def extract_text(self, file_bytes: bytes, content_type: str) -> OCRResult:
        if content_type in _IMAGE_CONTENT_TYPES:
            return self._extract_from_image(file_bytes)
        if content_type == _PDF_CONTENT_TYPE:
            return self._extract_from_pdf(file_bytes)
        return OCRResult(
            status=OCRStatus.UNSUPPORTED_FORMAT,
            message=f"Unsupported content type for OCR: {content_type}",
        )

    def _extract_from_image(self, file_bytes: bytes) -> OCRResult:
        try:
            image = Image.open(io.BytesIO(file_bytes))
            text = pytesseract.image_to_string(image)
        except pytesseract.TesseractNotFoundError as exc:
            return OCRResult(status=OCRStatus.UNAVAILABLE, message=f"Tesseract engine not available: {exc}")
        except Exception as exc:  # noqa: BLE001 - any decode/OCR failure must degrade, never crash the caller
            return OCRResult(status=OCRStatus.PARSE_ERROR, message=f"Could not OCR image: {exc}")

        if not text.strip():
            return OCRResult(status=OCRStatus.PARSE_ERROR, message="OCR produced no readable text from the image.")
        return OCRResult(status=OCRStatus.SUCCESS, raw_text=text)

    def _extract_from_pdf(self, file_bytes: bytes) -> OCRResult:
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            text = "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as exc:  # noqa: BLE001 - malformed PDFs must degrade, never crash the caller
            return OCRResult(status=OCRStatus.PARSE_ERROR, message=f"Could not read PDF: {exc}")

        if not text.strip():
            return OCRResult(
                status=OCRStatus.PARSE_ERROR,
                message="PDF has no extractable text layer (likely a scanned image PDF).",
            )
        return OCRResult(status=OCRStatus.SUCCESS, raw_text=text)
