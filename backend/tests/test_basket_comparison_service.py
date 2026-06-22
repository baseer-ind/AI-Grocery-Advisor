from app.services.basket_comparison_service import basket_from_items, compare_basket, optimization_to_out
from app.services.basket_service import BasketItem
from app.services.providers.base import NormalizedListing, PriceProvider, ProviderResult, ProviderStatus


class _StaticProvider(PriceProvider):
    platform_slug = "mart"
    platform_name = "Mart"

    async def fetch(self, query: str, location_key: str | None = None) -> ProviderResult:
        listing = NormalizedListing(
            platform_slug=self.platform_slug,
            platform_name=self.platform_name,
            product_name=query,
            mrp=100.0,
            selling_price=80.0,
            delivery_fee=0.0,
            platform_fee=0.0,
            handling_fee=0.0,
            product_rating=4.2,
            delivery_rating=4.2,
            eta_minutes=20,
            in_stock=True,
            product_url="https://example.com",
        )
        return ProviderResult(status=ProviderStatus.SUCCESS, platform_slug=self.platform_slug, listings=[listing])


async def test_manual_basket_runs_through_full_pipeline():
    items = [
        BasketItem(product_name="Rice 1kg", quantity=1, unit="kg", total_price=0.0),
        BasketItem(product_name="Dal 1kg", quantity=1, unit="kg", total_price=0.0),
    ]
    basket = basket_from_items(items)

    result = await compare_basket([_StaticProvider()], basket, location_key="110001")

    assert len(result.item_recommendations) == 2
    assert result.optimization.multi_platform_optimized_cost == 160.0
    # Manual basket items with unknown price (total_price=0) must not be
    # treated as a real, winning "Your Bill" listing.
    assert result.optimization.current_basket_cost is None


def test_optimization_to_out_round_trips_dataclass_fields():
    items = [BasketItem(product_name="Rice 1kg", quantity=1, unit="kg", total_price=0.0)]
    basket = basket_from_items(items)

    async def _run():
        return await compare_basket([_StaticProvider()], basket)

    import asyncio

    result = asyncio.run(_run())
    out = optimization_to_out(result.optimization)
    assert out.multi_platform_optimized_cost == result.optimization.multi_platform_optimized_cost
    assert out.cheapest is not None
    assert out.cheapest.platform_name == "Mart"
