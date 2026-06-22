"""A provider with canned in-memory data, for demos and as a fallback when
nothing else is available. Represents a hypothetical platform, not a real one.
"""

from app.services.providers.base import NormalizedListing, PriceProvider, ProviderResult, ProviderStatus

_CATALOG: list[NormalizedListing] = [
    NormalizedListing(
        platform_slug="demo-mart",
        platform_name="Demo Mart",
        product_name="Aashirvaad Whole Wheat Atta 5kg",
        mrp=399.0,
        selling_price=305.0,
        delivery_fee=20.0,
        platform_fee=0.0,
        handling_fee=5.0,
        product_rating=4.2,
        delivery_rating=4.4,
        eta_minutes=25,
        in_stock=True,
        product_url="https://example.com/demo-mart/search?q=aashirvaad+atta",
    ),
    NormalizedListing(
        platform_slug="demo-mart",
        platform_name="Demo Mart",
        product_name="Amul Butter 500g",
        mrp=275.0,
        selling_price=262.0,
        delivery_fee=20.0,
        platform_fee=0.0,
        handling_fee=0.0,
        product_rating=4.5,
        delivery_rating=4.4,
        eta_minutes=25,
        in_stock=True,
        product_url="https://example.com/demo-mart/search?q=amul+butter",
    ),
]


class MockProvider(PriceProvider):
    platform_slug = "demo-mart"
    platform_name = "Demo Mart"

    async def fetch(self, query: str, location_key: str | None = None) -> ProviderResult:
        query_lower = query.lower()
        matches = [item for item in _CATALOG if query_lower in item.product_name.lower()]

        if not matches:
            return ProviderResult(status=ProviderStatus.NOT_FOUND, platform_slug=self.platform_slug)

        return ProviderResult(status=ProviderStatus.SUCCESS, platform_slug=self.platform_slug, listings=matches)
