import csv

from app.services.providers.base import ProviderStatus
from app.services.providers.csv_provider import CSVProvider

_HEADER = [
    "platform_slug", "platform_name", "product_name", "mrp", "selling_price",
    "delivery_fee", "platform_fee", "handling_fee", "product_rating",
    "delivery_rating", "eta_minutes", "in_stock", "product_url",
]


def _write_csv(path, rows):
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(_HEADER)
        writer.writerows(rows)


async def test_missing_file_returns_unavailable(tmp_path):
    result = await CSVProvider(tmp_path / "missing.csv").fetch("atta")
    assert result.status == ProviderStatus.UNAVAILABLE


async def test_match_returns_success(tmp_path):
    csv_path = tmp_path / "prices.csv"
    _write_csv(
        csv_path,
        [["jiomart", "JioMart", "Aashirvaad Atta 5kg", "399", "321", "30", "0", "0", "4.0", "3.9", "120", "true", "https://example.com"]],
    )
    result = await CSVProvider(csv_path).fetch("atta")
    assert result.status == ProviderStatus.SUCCESS
    assert result.listings[0].selling_price == 321.0


async def test_no_match_returns_not_found(tmp_path):
    csv_path = tmp_path / "prices.csv"
    _write_csv(csv_path, [["jiomart", "JioMart", "Amul Butter 500g", "275", "255", "30", "0", "0", "4.4", "3.9", "120", "true", "https://example.com"]])
    result = await CSVProvider(csv_path).fetch("atta")
    assert result.status == ProviderStatus.NOT_FOUND


async def test_malformed_numeric_row_is_skipped(tmp_path):
    csv_path = tmp_path / "prices.csv"
    _write_csv(
        csv_path,
        [["jiomart", "JioMart", "Aashirvaad Atta 5kg", "not-a-number", "321", "30", "0", "0", "4.0", "3.9", "120", "true", "https://example.com"]],
    )
    result = await CSVProvider(csv_path).fetch("atta")
    assert result.status == ProviderStatus.NOT_FOUND
