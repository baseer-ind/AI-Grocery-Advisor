from app.services.basket_service import build_basket
from app.services.bill_parsing_service import BillLineItem


def test_distinct_products_become_distinct_items():
    items = [
        BillLineItem(product_name="Atta 5kg", quantity=1, unit="kg", price=399.0),
        BillLineItem(product_name="Butter 500g", quantity=2, unit="g", price=275.0),
    ]
    basket = build_basket(items)
    assert len(basket.items) == 2


def test_duplicate_product_lines_are_merged():
    items = [
        BillLineItem(product_name="Amul Butter 500g", quantity=1, unit="g", price=140.0),
        BillLineItem(product_name="amul butter 500g", quantity=1, unit="g", price=140.0),
    ]
    basket = build_basket(items)
    assert len(basket.items) == 1
    merged = basket.items[0]
    assert merged.quantity == 2
    assert merged.total_price == 280.0


def test_unit_price_divides_total_by_quantity():
    items = [BillLineItem(product_name="Atta 5kg", quantity=2, unit="kg", price=600.0)]
    basket = build_basket(items)
    assert basket.items[0].unit_price == 300.0
