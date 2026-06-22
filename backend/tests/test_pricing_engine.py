from types import SimpleNamespace

from app.services.pricing_engine import compute_pricing


def make_listing(**overrides):
    defaults = dict(id=1, mrp=399, selling_price=299, delivery_fee=40, platform_fee=5, handling_fee=10)
    defaults.update(overrides)
    return SimpleNamespace(**defaults)


def test_effective_cost_includes_all_fees():
    pricing = compute_pricing(make_listing())
    assert pricing.effective_cost == 354.0


def test_real_discount_is_lower_than_platform_discount():
    pricing = compute_pricing(make_listing())
    assert pricing.platform_discount_pct > pricing.real_discount_pct
    assert pricing.platform_discount_pct == 25.06
    assert pricing.real_discount_pct == 11.28


def test_zero_mrp_does_not_divide_by_zero():
    pricing = compute_pricing(make_listing(mrp=0))
    assert pricing.platform_discount_pct == 0.0
    assert pricing.real_discount_pct == 0.0
