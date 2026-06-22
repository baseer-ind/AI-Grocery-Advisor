from app.services.basket_service import BasketItem, Basket
from app.services.bill_recommendation_service import build_recommendations_for_basket
from app.services.providers.base import NormalizedListing, PriceProvider, ProviderResult, ProviderStatus


class _CheaperElsewhereProvider(PriceProvider):
    platform_slug = "cheaper-mart"
    platform_name = "Cheaper Mart"

    async def fetch(self, query: str, location_key: str | None = None) -> ProviderResult:
        listing = NormalizedListing(
            platform_slug=self.platform_slug,
            platform_name=self.platform_name,
            product_name="Aashirvaad Whole Wheat Atta 5kg",
            mrp=399.0,
            selling_price=250.0,
            delivery_fee=0.0,
            platform_fee=0.0,
            handling_fee=0.0,
            product_rating=4.5,
            delivery_rating=4.5,
            eta_minutes=30,
            in_stock=True,
            product_url="https://example.com",
        )
        return ProviderResult(status=ProviderStatus.SUCCESS, platform_slug=self.platform_slug, listings=[listing])


async def test_bills_own_price_is_fed_into_recommendation_engine():
    basket = Basket(items=[BasketItem(product_name="Aashirvaad Whole Wheat Atta 5kg", quantity=1, unit="kg", total_price=399.0)])

    results = await build_recommendations_for_basket([_CheaperElsewhereProvider()], basket)

    assert len(results) == 1
    recommendations = results[0].result.recommendations
    assert recommendations is not None
    assert recommendations.cheapest.platform_name == "Cheaper Mart"

    platform_names = {l.platform_name for r in results[0].result.provider_results for l in r.listings}
    assert "Cheaper Mart" in platform_names


async def test_bill_listing_wins_when_it_is_the_cheapest():
    basket = Basket(items=[BasketItem(product_name="Aashirvaad Whole Wheat Atta 5kg", quantity=1, unit="kg", total_price=200.0)])

    results = await build_recommendations_for_basket([_CheaperElsewhereProvider()], basket)

    assert results[0].result.recommendations.cheapest.platform_name == "Your Bill"
