"""Live, multi-platform search built on the pluggable provider architecture.

Distinct from `routes_search.py` (which reads pre-seeded DB rows): this endpoint
fans a query out across `PriceProvider`s at request time and reports each
provider's status — including BLOCKED — alongside whatever recommendations
could be built from the providers that did return data.
"""

from fastapi import APIRouter, Query

from app.core.config import settings
from app.domain.schemas import RecommendationOut, RecommendationSetOut
from app.domain.schemas_providers import ProviderListingOut, ProviderSearchResult, ProviderStatusOut
from app.services.provider_aggregator import search_providers
from app.services.providers.bigbasket_provider import BigBasketProvider
from app.services.providers.csv_provider import CSVProvider
from app.services.providers.mock_provider import MockProvider

router = APIRouter(prefix="/api/v1/providers/search", tags=["providers-search"])


def _build_providers() -> list:
    return [
        CSVProvider(settings.curated_prices_path),
        MockProvider(),
        BigBasketProvider(),
    ]


@router.get("", response_model=ProviderSearchResult)
async def search(q: str = Query(..., min_length=2)) -> ProviderSearchResult:
    result = search_providers(_build_providers(), q)

    providers_out = [
        ProviderStatusOut(
            platform_slug=r.platform_slug,
            status=r.status.value,
            message=r.message,
            listings=[
                ProviderListingOut(
                    platform_slug=listing.platform_slug,
                    platform_name=listing.platform_name,
                    product_name=listing.product_name,
                    mrp=listing.mrp,
                    selling_price=listing.selling_price,
                    delivery_fee=listing.delivery_fee,
                    platform_fee=listing.platform_fee,
                    handling_fee=listing.handling_fee,
                    product_rating=listing.product_rating,
                    delivery_rating=listing.delivery_rating,
                    eta_minutes=listing.eta_minutes,
                    in_stock=listing.in_stock,
                    product_url=listing.product_url,
                )
                for listing in r.listings
            ],
        )
        for r in result.provider_results
    ]

    recommendations_out = None
    if result.recommendations is not None:
        rs = result.recommendations
        recommendations_out = RecommendationSetOut(
            best_overall=RecommendationOut(**rs.best_overall.__dict__),
            cheapest=RecommendationOut(**rs.cheapest.__dict__),
            fastest=RecommendationOut(**rs.fastest.__dict__),
            highest_rated=RecommendationOut(**rs.highest_rated.__dict__),
            best_value=RecommendationOut(**rs.best_value.__dict__),
        )

    return ProviderSearchResult(query=q, providers=providers_out, recommendations=recommendations_out)
