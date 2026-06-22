"""Reads listings from a CSV file maintained by a human — the recommended
MVP data-sourcing path in DATA_ACQUISITION_STRATEGY.md: legally clean,
slow to scale, but real and immediately usable while a sustainable
live-data strategy is decided.

The parsed rows are cached in-process keyed on the file's mtime, so a
request only re-reads/re-parses the CSV when it has actually changed on
disk — re-parsing on every search doesn't scale once the curated feed grows
past a handful of rows.
"""

import asyncio
import csv
from pathlib import Path

from app.services.providers.base import NormalizedListing, PriceProvider, ProviderResult, ProviderStatus

_NUMERIC_FIELDS = ("mrp", "selling_price", "delivery_fee", "platform_fee", "handling_fee", "product_rating", "delivery_rating")

# Keyed on resolved path; each entry is (mtime, parsed_listings). Shared across
# instances so every CSVProvider pointed at the same file benefits from one
# cache rather than each request re-parsing it.
_cache: dict[Path, tuple[float, list[NormalizedListing]]] = {}


class CSVParseError(Exception):
    pass


class CSVProvider(PriceProvider):
    platform_slug = "curated"
    platform_name = "Curated Feed"

    def __init__(self, csv_path: str | Path):
        self.csv_path = Path(csv_path)

    async def fetch(self, query: str, location_key: str | None = None) -> ProviderResult:
        if not self.csv_path.exists():
            return ProviderResult(
                status=ProviderStatus.UNAVAILABLE,
                platform_slug=self.platform_slug,
                message=f"Curated price file not found at {self.csv_path}",
            )

        try:
            all_listings = await asyncio.to_thread(self._load_cached)
        except CSVParseError as exc:
            return ProviderResult(
                status=ProviderStatus.PARSE_ERROR,
                platform_slug=self.platform_slug,
                message=f"Could not parse curated price file: {exc}",
            )

        query_lower = query.lower()
        listings = [listing for listing in all_listings if query_lower in listing.product_name.lower()]

        if not listings:
            return ProviderResult(status=ProviderStatus.NOT_FOUND, platform_slug=self.platform_slug)

        return ProviderResult(status=ProviderStatus.SUCCESS, platform_slug=self.platform_slug, listings=listings)

    def _load_cached(self) -> list[NormalizedListing]:
        mtime = self.csv_path.stat().st_mtime
        cached = _cache.get(self.csv_path)
        if cached is not None and cached[0] == mtime:
            return cached[1]

        listings = self._parse_file()
        _cache[self.csv_path] = (mtime, listings)
        return listings

    def _parse_file(self) -> list[NormalizedListing]:
        listings = []
        try:
            with self.csv_path.open(newline="", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    listing = self._row_to_listing(row)
                    if listing is not None:
                        listings.append(listing)
        except (csv.Error, KeyError) as exc:
            raise CSVParseError(str(exc)) from exc
        return listings

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
            location_key=row.get("location_key") or None,
        )
