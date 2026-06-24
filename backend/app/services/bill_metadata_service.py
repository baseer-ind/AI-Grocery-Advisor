"""Extracts bill-level metadata (store, date) deterministically.

Deliberately separate from `bill_parsing_service` (which extracts line
items) — store/date detection is header/footer scanning across the whole
text, not a per-line pattern, and keeping it isolated means it can be
extended (more store names, more date formats) without touching item
parsing at all.
"""

import re
from dataclasses import dataclass

# Known storefront names as printed on receipts/bill headers. Matched
# case-insensitively against the first few lines of OCR text. Extend this
# list as real beta-user bills reveal new sources — it's a data change,
# not a logic change.
_KNOWN_STORES = [
    "D-Mart", "DMart", "BigBasket", "Blinkit", "Zepto", "Swiggy Instamart",
    "Reliance Fresh", "Reliance Smart", "Spencer's", "More Supermarket",
    "Nature's Basket", "JioMart", "Amazon Fresh", "Star Bazaar",
]
_STORE_HEADER_LINES = 5

_DATE_PATTERNS = [
    re.compile(r"\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b"),
    re.compile(r"\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{4})\b", re.IGNORECASE),
]


@dataclass
class BillMetadata:
    store: str | None = None
    bill_date: str | None = None


def extract_bill_metadata(raw_text: str) -> BillMetadata:
    lines = raw_text.splitlines()
    return BillMetadata(
        store=_extract_store(lines),
        bill_date=_extract_date(raw_text),
    )


def _extract_store(lines: list[str]) -> str | None:
    header = "\n".join(lines[:_STORE_HEADER_LINES]).lower()
    for store in _KNOWN_STORES:
        if store.lower() in header:
            return store
    return None


def _extract_date(raw_text: str) -> str | None:
    for pattern in _DATE_PATTERNS:
        match = pattern.search(raw_text)
        if match:
            return match.group(1)
    return None
