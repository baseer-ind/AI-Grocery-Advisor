"""Fans a search query out across all configured providers and turns whatever
comes back into a recommendation set.

This is the piece that proves the core success criterion: the recommendation
engine must keep working from whichever providers succeeded, even when one
(e.g. BigBasket) reports BLOCKED rather than data. Per-provider status is
preserved and returned alongside the recommendations so the caller/UI can show
*why* a platform is missing instead of silently dropping it.
"""

from dataclasses import dataclass

from app.services.pricing_engine import compute_pricing
from app.services.providers.base import PriceProvider, ProviderResult
from app.services.recommendation_engine import ListingView, RecommendationSet, build_recommendations


@dataclass
class PlatformStub:
    """Minimal stand-in for the `Platform` ORM model — recommendation_engine only reads `.name`."""

    name: str


@dataclass
class AggregatedSearchResult:
    recommendations: RecommendationSet | None
    provider_results: list[ProviderResult]


def search_providers(providers: list[PriceProvider], query: str) -> AggregatedSearchResult:
    provider_results = [provider.fetch(query) for provider in providers]

    views: list[ListingView] = []
    for result in provider_results:
        for listing in result.listings:
            pricing = compute_pricing(listing)
            views.append(
                ListingView(
                    listing=listing,
                    platform=PlatformStub(name=listing.platform_name),
                    pricing=pricing,
                )
            )

    recommendations = build_recommendations(views) if views else None
    return AggregatedSearchResult(recommendations=recommendations, provider_results=provider_results)
