"""Feeds a parsed basket into the existing provider/recommendation pipeline.

For each basket item, the price actually paid on the bill is injected as a
"Your Bill" listing alongside whatever the configured `PriceProvider`s find
for that product, so the recommendation engine can tell the user whether
their bill was a good deal relative to other platforms — using the same
`provider_aggregator` that powers live product search.
"""

import asyncio
from dataclasses import dataclass

from app.services.basket_service import Basket, BasketItem
from app.services.provider_aggregator import AggregatedSearchResult, search_providers
from app.services.providers.base import NormalizedListing, PriceProvider

_BILL_PLATFORM_SLUG = "your-bill"
_BILL_PLATFORM_NAME = "Your Bill"


@dataclass
class BasketItemRecommendation:
    basket_item: BasketItem
    result: AggregatedSearchResult


def _bill_listing(item: BasketItem) -> NormalizedListing:
    return NormalizedListing(
        platform_slug=_BILL_PLATFORM_SLUG,
        platform_name=_BILL_PLATFORM_NAME,
        product_name=item.product_name,
        mrp=item.unit_price,
        selling_price=item.unit_price,
        delivery_fee=0.0,
        platform_fee=0.0,
        handling_fee=0.0,
        product_rating=0.0,
        delivery_rating=0.0,
        eta_minutes=0,
        in_stock=True,
        product_url="",
    )


async def build_recommendations_for_basket(
    providers: list[PriceProvider], basket: Basket, location_key: str | None = None
) -> list[BasketItemRecommendation]:
    results = await asyncio.gather(
        *(
            search_providers(providers, item.product_name, location_key=location_key, extra_listings=[_bill_listing(item)])
            for item in basket.items
        )
    )
    return [BasketItemRecommendation(basket_item=item, result=result) for item, result in zip(basket.items, results)]
