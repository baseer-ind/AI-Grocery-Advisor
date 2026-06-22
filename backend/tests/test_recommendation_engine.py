from types import SimpleNamespace

from app.services.pricing_engine import compute_pricing
from app.services.recommendation_engine import ListingView, build_recommendations


def make_view(platform_name, **overrides):
    defaults = dict(
        id=1, mrp=399, selling_price=299, delivery_fee=40, platform_fee=5, handling_fee=10,
        product_rating=4.0, delivery_rating=4.0, eta_minutes=30, in_stock=True,
    )
    defaults.update(overrides)
    listing = SimpleNamespace(**defaults)
    platform = SimpleNamespace(name=platform_name)
    return ListingView(listing=listing, platform=platform, pricing=compute_pricing(listing))


def test_cheapest_picks_lowest_effective_cost():
    views = [
        make_view("Blinkit", selling_price=299, delivery_fee=40),
        make_view("Zepto", selling_price=309, delivery_fee=10),
    ]
    recs = build_recommendations(views)
    assert recs.cheapest.platform_name == "Zepto"


def test_fastest_picks_lowest_eta():
    views = [
        make_view("Blinkit", eta_minutes=12),
        make_view("BigBasket", eta_minutes=90),
    ]
    recs = build_recommendations(views)
    assert recs.fastest.platform_name == "Blinkit"


def test_highest_rated_picks_top_rating():
    views = [
        make_view("Blinkit", product_rating=4.3),
        make_view("BigBasket", product_rating=4.6),
    ]
    recs = build_recommendations(views)
    assert recs.highest_rated.platform_name == "BigBasket"


def test_out_of_stock_listings_are_excluded_when_alternatives_exist():
    views = [
        make_view("Blinkit", in_stock=False, selling_price=100),
        make_view("Zepto", in_stock=True, selling_price=300),
    ]
    recs = build_recommendations(views)
    assert recs.cheapest.platform_name == "Zepto"
