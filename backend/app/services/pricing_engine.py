"""Computes the real cost of a listing — what the platform's discount badge doesn't tell you."""

from dataclasses import dataclass

from app.domain.models import ProductListing


@dataclass
class PricingBreakdown:
    listing_id: int
    mrp: float
    selling_price: float
    delivery_fee: float
    platform_fee: float
    handling_fee: float
    effective_cost: float
    platform_discount_pct: float
    real_discount_pct: float


def compute_pricing(listing: ProductListing) -> PricingBreakdown:
    mrp = float(listing.mrp)
    selling_price = float(listing.selling_price)
    delivery_fee = float(listing.delivery_fee)
    platform_fee = float(listing.platform_fee)
    handling_fee = float(listing.handling_fee)

    effective_cost = selling_price + delivery_fee + platform_fee + handling_fee

    platform_discount_pct = ((mrp - selling_price) / mrp * 100) if mrp else 0.0
    real_discount_pct = ((mrp - effective_cost) / mrp * 100) if mrp else 0.0

    return PricingBreakdown(
        listing_id=listing.id,
        mrp=mrp,
        selling_price=selling_price,
        delivery_fee=delivery_fee,
        platform_fee=platform_fee,
        handling_fee=handling_fee,
        effective_cost=round(effective_cost, 2),
        platform_discount_pct=round(platform_discount_pct, 2),
        real_discount_pct=round(real_discount_pct, 2),
    )
