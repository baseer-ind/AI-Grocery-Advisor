from app.services.bill_metadata_service import extract_bill_metadata


def test_extracts_known_store_from_header():
    text = "D-Mart\nAvenue Supermarts Ltd\nTAX INVOICE\nItem x1 10.00\n"
    metadata = extract_bill_metadata(text)
    assert metadata.store == "D-Mart"


def test_returns_none_for_unknown_store():
    metadata = extract_bill_metadata("Random Local Shop\nItem x1 10.00\n")
    assert metadata.store is None


def test_extracts_slash_date():
    metadata = extract_bill_metadata("Date/Time:2023-02-18T21:03:09\n18/02/2023 9:03PM\n")
    assert metadata.bill_date == "18/02/2023"


def test_extracts_month_name_date():
    metadata = extract_bill_metadata("Bill generated on 18 February 2023\n")
    assert metadata.bill_date is not None
    assert "2023" in metadata.bill_date


def test_returns_none_when_no_date_present():
    metadata = extract_bill_metadata("Thank you for shopping\n")
    assert metadata.bill_date is None
