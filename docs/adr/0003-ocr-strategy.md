# ADR-003: OCR Strategy

## Status
Accepted

## Context
Bill Upload Intelligence requires extracting line items from photos of
grocery receipts. Building a custom OCR/ML model is high effort and
unnecessary at this stage; a hosted OCR API would add external cost
and a network dependency for every upload; a free, locally-runnable
OCR engine (Tesseract) is sufficient for the MVP and avoids per-request
external API cost.

## Decision
Define an `OCRProvider` interface (`services/ocr/base.py`) with
`extract(image_bytes) -> OCRResult`, returning an `OCRStatus` so
failures degrade gracefully rather than raising. Two implementations
exist: `TesseractOCRProvider` (real OCR, used by default and exercised
against a real sample image in tests) and `MockOCRProvider` (fixed
output for fast, deterministic tests and dev without a Tesseract
binary installed). Selection is via `settings.ocr_engine`.

Synchronous (`/bills/upload`) and asynchronous (`/bills/upload-async`,
backed by the `arq` worker) endpoints both call the same
`process_bill()` coordinator, so OCR engine selection and bill
processing logic are not duplicated between the two paths.

## Consequences
- Tesseract is CPU-bound and can take seconds on larger images; this
  is the reason the async upload path (PR #4) exists — OCR work moves
  off the request-handling event loop onto the arq worker process.
- Swapping in a hosted OCR API later (e.g., for better accuracy) only
  requires a new `OCRProvider` implementation, not a route or worker
  change.
- The mock/real split means the test suite doesn't require Tesseract
  to be installed for most tests, with one test
  (`test_upload_with_real_sample_image_via_tesseract`) explicitly
  exercising the real engine against a checked-in sample image.
