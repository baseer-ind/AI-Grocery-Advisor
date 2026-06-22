"""Reads listings from a CSV file maintained by a human — the recommended
MVP data-sourcing path in DATA_ACQUISITION_STRATEGY.md: legally clean,
slow to scale, but real and immediately usable while a sustainable
live-data strategy is decided.
"""

import csv
from pathlib import Path

from app.services.providers.base import NormalizedListing, PriceProvider, ProviderResult, ProviderStatus

_NUMERIC_FIELDS = ("mrp", "selling_price", "delivery_fee", "platform_fee", "handling_fee", "product_rating", "delivery_rating")


class CSVProvider(PriceProvider):
    platform_slug = "curated"
    platform_name = "Curated Feed"

    def __init__(self, csv_path: str | Path):
        self.csv_path = Path(csv_path)

    def fetch(self, query: str) -> ProviderResult:
        if not self.csv_path.exists():
            return ProviderResult(
                status=ProviderStatus.UNAVAILABLE,
                platform_slug=self.platform_slug,
                message=f"Curated price file not found at {self.csv_path}",
            )

        query_lower = query.lower()
        listings = []

        try:
            with self.csv_path.open(newline="", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if query_lower not in row["product_name"].lower():
                        continue
                    listing = self._row_to_listing(row)
                    if listing is not None:
                        listings.append(listing)
        except (csv.Error, KeyError) as exc:
            return ProviderResult(
                status=ProviderStatus.PARSE_ERROR,
                platform_slug=self.platform_slug,
                message=f"Could not parse curated price file: {exc}",
            )

        if not listings:
            return ProviderResult(status=ProviderStatus.NOT_FOUND, platform_slug=self.platform_slug)

        return ProviderResult(status=ProviderStatus.SUCCESS, platform_slug=self.platform_slug, listings=listings)

    @staticmethod
    def _row_to_listing(row: dict) -> NormalizedListing | None:
        try:
            values = {field: float(row[field]) for field in _NUMERIC_FIELDS}
        except (KeyError, ValueError):
            return None

        return NormalizedListing(
            platform_slug=row.get("platform_slug", "curated"),
            platform_name=row.get("platform_name", "Curated Feed"),
            product_name=row["product_name"],
            mrp=values["mrp"],
            selling_price=values["selling_price"],
            delivery_fee=values["delivery_fee"],
            platform_fee=values["platform_fee"],
            handling_fee=values["handling_fee"],
            product_rating=values["product_rating"],
            delivery_rating=values["delivery_rating"],
            eta_minutes=int(float(row.get("eta_minutes", 0))),
            in_stock=row.get("in_stock", "true").strip().lower() in ("1", "true", "yes"),
            product_url=row.get("product_url", ""),
        )
