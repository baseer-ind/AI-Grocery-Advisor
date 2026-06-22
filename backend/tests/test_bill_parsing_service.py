from app.services.bill_parsing_service import parse_bill_text

_SAMPLE = """\
FreshMart Grocery Store
Aashirvaad Whole Wheat Atta 5kg x1 399.00
Amul Butter 500g x2 275.00
Tata Salt 1kg x1 28.00
"""


def test_parses_known_line_items():
    items = parse_bill_text(_SAMPLE)
    assert len(items) == 3

    atta = items[0]
    assert atta.product_name == "Aashirvaad Whole Wheat Atta 5kg"
    assert atta.quantity == 1.0
    assert atta.unit == "kg"
    assert atta.price == 399.0


def test_ignores_non_line_item_text():
    items = parse_bill_text("FreshMart Grocery Store\nThank you for shopping!\n")
    assert items == []


def test_defaults_unit_when_no_size_in_name():
    items = parse_bill_text("Mystery Item x1 50.00")
    assert items[0].unit == "unit"
