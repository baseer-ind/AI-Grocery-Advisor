"""Normalizes parsed bill line items into a basket — the shape the
recommendation engine integration consumes, independent of how many
duplicate lines a bill had for the same product.
"""

from dataclasses import dataclass

from app.services.bill_parsing_service import BillLineItem


@dataclass
class BasketItem:
    product_name: str
    quantity: float
    unit: str
    total_price: float

    @property
    def unit_price(self) -> float:
        return round(self.total_price / self.quantity, 2) if self.quantity else 0.0


@dataclass
class Basket:
    items: list[BasketItem]


def build_basket(line_items: list[BillLineItem]) -> Basket:
    grouped: dict[str, BasketItem] = {}

    for line in line_items:
        key = line.product_name.lower()
        if key in grouped:
            existing = grouped[key]
            existing.quantity += line.quantity
            existing.total_price += line.price
        else:
            grouped[key] = BasketItem(
                product_name=line.product_name,
                quantity=line.quantity,
                unit=line.unit,
                total_price=line.price,
            )

    return Basket(items=list(grouped.values()))
