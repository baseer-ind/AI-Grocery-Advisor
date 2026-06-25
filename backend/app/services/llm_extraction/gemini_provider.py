"""Gemini-backed fallback extraction — the free-tier stopgap until paid
LLM usage is justified by revenue.

Plain REST via httpx rather than the `google-generativeai` SDK: this is a
single JSON-in/JSON-out call, so a full SDK dependency buys nothing and
keeps the provider easy to delete or replace later. Any vendor outage,
quota exhaustion, or malformed response degrades to a failed extraction —
never an exception — matching every other provider in this codebase.
"""

import json
import re

import httpx

from app.services.bill_parsing_service import BillLineItem
from app.services.llm_extraction.base import LLMExtractionProvider, LLMExtractionResult

_API_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.0-flash:generateContent"
)
_TIMEOUT_SECONDS = 20
_MAX_INPUT_CHARS = 8000  # bounds cost/latency on unusually long OCR text

_PROMPT = (
    "Extract grocery/retail bill line items from this OCR text as a JSON array. "
    "Each element must have exactly these keys: product_name (string), "
    "quantity (number), unit (string, e.g. 'kg', 'g', 'ml', 'unit'), "
    "price (number, the line's total price, not unit price). "
    "Skip header/footer/tax/total/summary lines — only actual purchased items. "
    "Return ONLY the JSON array, no other text.\n\nOCR TEXT:\n"
)


class GeminiExtractionProvider(LLMExtractionProvider):
    def __init__(self, api_key: str):
        self._api_key = api_key

    async def extract_line_items(self, raw_text: str) -> LLMExtractionResult:
        body = {
            "contents": [{"parts": [{"text": _PROMPT + raw_text[:_MAX_INPUT_CHARS]}]}],
            "generationConfig": {"responseMimeType": "application/json", "temperature": 0},
        }
        text = ""
        try:
            async with httpx.AsyncClient(timeout=_TIMEOUT_SECONDS) as client:
                response = await client.post(_API_URL, params={"key": self._api_key}, json=body)
            response.raise_for_status()
            payload = response.json()
            text = payload["candidates"][0]["content"]["parts"][0]["text"]
            items = self._parse_items(text)
        except Exception as exc:  # noqa: BLE001 - any vendor/network/shape failure must degrade, never crash the caller
            return LLMExtractionResult(
                items=[], succeeded=False, message=f"Gemini extraction failed: {exc}", raw_response=text
            )

        if not items:
            return LLMExtractionResult(
                items=[], succeeded=False, message="Gemini returned no extractable line items.", raw_response=text
            )
        return LLMExtractionResult(items=items, succeeded=True, raw_response=text)

    def _parse_items(self, text: str) -> list[BillLineItem]:
        match = re.search(r"\[.*\]", text, re.DOTALL)
        raw_items = json.loads(match.group(0) if match else text)
        items = []
        for raw in raw_items:
            try:
                items.append(
                    BillLineItem(
                        product_name=str(raw["product_name"]).strip(),
                        quantity=float(raw["quantity"]),
                        unit=str(raw.get("unit") or "unit").strip().lower(),
                        price=float(raw["price"]),
                    )
                )
            except (KeyError, TypeError, ValueError):
                continue  # one malformed item must not discard the rest
        return items
