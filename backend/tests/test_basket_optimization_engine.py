from app.services.basket_optimization_engine import build_basket_optimization
from app.services.basket_service import Basket, BasketItem
from app.services.bill_recommendation_service import build_recommendations_for_basket
from app.services.providers.base import NormalizedListing, PriceProvider, ProviderResult, ProviderStatus


class _FixedProvider(PriceProvider):
    def __init__(self, platform_slug, platform_name, prices_by_product, **kwargs):
        self.platform_slug = platform_slug
        self.platform_name = platform_name
        self._prices = prices_by_product
        self._overrides = kwargs

    async def fetch(self, query: str, location_key: str | None = None) -> ProviderResult:
        if query not in self._prices:
            return ProviderResult(status=ProviderStatus.NOT_FOUND, platform_slug=self.platform_slug, listings=[])
        listing = NormalizedListing(
            platform_slug=self.platform_slug,
            platform_name=self.platform_name,
            product_name=query,
            mrp=self._prices[query],
            selling_price=self._prices[query],
            delivery_fee=self._overrides.get("delivery_fee", 0.0),
            platform_fee=0.0,
            handling_fee=0.0,
            product_rating=self._overrides.get("product_rating", 4.0),
            delivery_rating=self._overrides.get("delivery_rating", 4.0),
            eta_minutes=self._overrides.get("eta_minutes", 30),
            in_stock=True,
            product_url="https://example.com",
        )
        return ProviderResult(status=ProviderStatus.SUCCESS, platform_slug=self.platform_slug, listings=[listing])


def _basket():
    return Basket(
        items=[
            BasketItem(product_name="Atta 5kg", quantity=1, unit="kg", total_price=400.0),
            BasketItem(product_name="Milk 1L", quantity=1, unit="l", total_price=60.0),
        ]
    )


async def test_cheapest_platform_wins_when_it_covers_the_whole_basket():
    cheap = _FixedProvider("cheap-mart", "Cheap Mart", {"Atta 5kg": 300.0, "Milk 1L": 50.0})
    pricey = _FixedProvider("pricey-mart", "Pricey Mart", {"Atta 5kg": 350.0, "Milk 1L": 55.0})

    item_recs = await build_recommendations_for_basket([cheap, pricey], _basket())
    result = build_basket_optimization(item_recs)

    assert result.cheapest_platform_cost.platform_name == "Cheap Mart"
    assert result.cheapest_platform_cost.covers_full_basket is True
    assert result.cheapest_platform_cost.total_cost == 350.0


async def test_multi_platform_optimized_cherry_picks_per_item():
    cheap_atta = _FixedProvider("a-mart", "A Mart", {"Atta 5kg": 300.0})
    cheap_milk = _FixedProvider("b-mart", "B Mart", {"Milk 1L": 40.0})

    item_recs = await build_recommendations_for_basket([cheap_atta, cheap_milk], _basket())
    result = build_basket_optimization(item_recs)

    assert result.multi_platform_optimized_cost == 340.0
    chosen = {c.product_name: c.platform_name for c in result.multi_platform_breakdown}
    assert chosen["Atta 5kg"] == "A Mart"
    assert chosen["Milk 1L"] == "B Mart"


async def test_current_basket_cost_and_savings():
    cheap = _FixedProvider("cheap-mart", "Cheap Mart", {"Atta 5kg": 300.0, "Milk 1L": 40.0})

    item_recs = await build_recommendations_for_basket([cheap], _basket())
    result = build_basket_optimization(item_recs)

    assert result.current_basket_cost == 460.0
    assert result.multi_platform_optimized_cost == 340.0
    assert result.estimated_savings == 120.0


async def test_fastest_recommendation_reflects_lowest_average_eta():
    fast = _FixedProvider("speedy", "Speedy", {"Atta 5kg": 400.0, "Milk 1L": 60.0}, eta_minutes=10)
    slow = _FixedProvider("slowpoke", "Slowpoke", {"Atta 5kg": 400.0, "Milk 1L": 60.0}, eta_minutes=90)

    item_recs = await build_recommendations_for_basket([fast, slow], _basket())
    result = build_basket_optimization(item_recs)

    assert result.fastest.platform_name == "Speedy"


async def test_partial_coverage_platform_is_only_used_as_fallback():
    full = _FixedProvider("full-mart", "Full Mart", {"Atta 5kg": 500.0, "Milk 1L": 100.0})
    partial = _FixedProvider("partial-mart", "Partial Mart", {"Atta 5kg": 10.0})

    item_recs = await build_recommendations_for_basket([full, partial], _basket())
    result = build_basket_optimization(item_recs)

    assert result.cheapest_platform_cost.platform_name == "Full Mart"
    assert result.cheapest_platform_cost.covers_full_basket is True


def test_empty_basket_returns_no_optimization():
    result = build_basket_optimization([])
    assert result.current_basket_cost is None
    assert result.cheapest_platform_cost is None
    assert result.multi_platform_optimized_cost is None
