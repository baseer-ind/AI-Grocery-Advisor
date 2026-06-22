from app.services.provider_aggregator import search_providers
from app.services.providers.base import NormalizedListing, PriceProvider, ProviderResult, ProviderStatus


class _WorkingProvider(PriceProvider):
    platform_slug = "working"
    platform_name = "Working Mart"

    async def fetch(self, query: str, location_key: str | None = None) -> ProviderResult:
        listing = NormalizedListing(
            platform_slug=self.platform_slug,
            platform_name=self.platform_name,
            product_name="Aashirvaad Atta 5kg",
            mrp=399.0,
            selling_price=300.0,
            delivery_fee=20.0,
            platform_fee=0.0,
            handling_fee=0.0,
            product_rating=4.3,
            delivery_rating=4.2,
            eta_minutes=30,
            in_stock=True,
            product_url="https://example.com",
        )
        return ProviderResult(status=ProviderStatus.SUCCESS, platform_slug=self.platform_slug, listings=[listing])


class _BlockedProvider(PriceProvider):
    platform_slug = "blocked-platform"
    platform_name = "Blocked Platform"

    async def fetch(self, query: str, location_key: str | None = None) -> ProviderResult:
        return ProviderResult(status=ProviderStatus.BLOCKED, platform_slug=self.platform_slug, message="blocked")


async def test_recommendations_built_from_working_provider_despite_blocked_one():
    result = await search_providers([_WorkingProvider(), _BlockedProvider()], "atta")

    assert result.recommendations is not None
    assert result.recommendations.cheapest.platform_name == "Working Mart"

    statuses = {r.platform_slug: r.status for r in result.provider_results}
    assert statuses["working"] == ProviderStatus.SUCCESS
    assert statuses["blocked-platform"] == ProviderStatus.BLOCKED


async def test_all_providers_blocked_returns_no_recommendations_but_reports_status():
    result = await search_providers([_BlockedProvider()], "atta")
    assert result.recommendations is None
    assert result.provider_results[0].status == ProviderStatus.BLOCKED
