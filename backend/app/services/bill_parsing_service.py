"""Turns raw OCR text into structured line items.

Deliberately engine-agnostic: this only ever sees the plain text an
`OCRProvider` produced, never image bytes or PDF internals, so it works
identically regardless of which OCR engine extracted that text.
"""

import re
from dataclasses import dataclass

_LINE_RE = re.compile(
    r"^(?P<name>.+?)\s+x(?P<qty>\d+(?:\.\d+)?)\s+(?:rs\.?\s*)?(?P<price>\d+(?:\.\d+)?)\s*$",
    re.IGNORECASE,
)
_UNIT_RE = re.compile(r"(\d+(?:\.\d+)?)\s*(kg|g|ml|ltr|l|pcs|pack)\b", re.IGNORECASE)
_DEFAULT_UNIT = "unit"


@dataclass
class BillLineItem:
    product_name: str
    quantity: float
    unit: str
    price: float


def _extract_unit(product_name: str) -> str:
    match = _UNIT_RE.search(product_name)
    return match.group(2).lower() if match else _DEFAULT_UNIT


def parse_bill_text(raw_text: str) -> list[BillLineItem]:
    items = []
    for line in raw_text.splitlines():
        line = line.strip()
        if not line:
            continue

        match = _LINE_RE.match(line)
        if not match:
            continue

        name = match.group("name").strip()
        items.append(
            BillLineItem(
                product_name=name,
                quantity=float(match.group("qty")),
                unit=_extract_unit(name),
                price=float(match.group("price")),
            )
        )
    return items
