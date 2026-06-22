"""Fans a search query out across all configured providers and turns whatever
comes back into a recommendation set.

This is the piece that proves the core success criterion: the recommendation
engine must keep working from whichever providers succeeded, even when one
(e.g. BigBasket) reports BLOCKED rather than data. Per-provider status is
preserved and returned alongside the recommendations so the caller/UI can show
*why* a platform is missing instead of silently dropping it.

Providers are fetched concurrently via `asyncio.gather` rather than awaited
one at a time, so one slow provider (BigBasket's 8s timeout) adds latency
once, not once per provider in the list.

Provider results and, for the plain-search case (no extra listings),
the final recommendation set are cached in Redis for a short TTL — repeat
searches for the same query/location don't re-run every provider or
re-derive the same ranking on every request.
"""

import asyncio
from dataclasses import asdict, dataclass

from app.core.cache import cache_get, cache_set
from app.services.pricing_engine import compute_pricing
from app.services.providers.base import NormalizedListing, PriceProvider, ProviderResult, ProviderStatus
from app.services.recommendation_engine import ListingView, RecommendationSet, build_recommendations

_PROVIDER_RESULTS_TTL_SECONDS = 60
_RECOMMENDATIONS_TTL_SECONDS = 60


@dataclass
class PlatformStub:
    """Minimal stand-in for the `Platform` ORM model — recommendation_engine only reads `.name`."""

    name: str


@dataclass
class AggregatedSearchResult:
    recommendations: RecommendationSet | None
    provider_results: list[ProviderResult]


def _provider_results_cache_key(providers: list[PriceProvider], query: str, location_key: str | None) -> str:
    slugs = ",".join(sorted(p.platform_slug for p in providers))
    return f"provider_results:{slugs}:{query.lower()}:{location_key or ''}"


def _recommendations_cache_key(providers: list[PriceProvider], query: str, location_key: str | None) -> str:
    slugs = ",".join(sorted(p.platform_slug for p in providers))
    return f"recommendations:{slugs}:{query.lower()}:{location_key or ''}"


def _serialize_provider_results(provider_results: list[ProviderResult]) -> list[dict]:
    return [
        {
            "status": r.status.value,
            "platform_slug": r.platform_slug,
            "message": r.message,
            "listings": [asdict(listing) for listing in r.listings],
        }
        for r in provider_results
    ]


def _deserialize_provider_results(raw: list[dict]) -> list[ProviderResult]:
    return [
        ProviderResult(
            status=ProviderStatus(r["status"]),
            platform_slug=r["platform_slug"],
            message=r["message"],
            listings=[NormalizedListing(**listing) for listing in r["listings"]],
        )
        for r in raw
    ]


async def _fetch_provider_results(
    providers: list[PriceProvider], query: str, location_key: str | None
) -> list[ProviderResult]:
    cache_key = _provider_results_cache_key(providers, query, location_key)
    cached = await cache_get(cache_key)
    if cached is not None:
        return _deserialize_provider_results(cached)

    provider_results = list(
        await asyncio.gather(*(provider.fetch(query, location_key) for provider in providers))
    )
    await cache_set(cache_key, _serialize_provider_results(provider_results), _PROVIDER_RESULTS_TTL_SECONDS)
    return provider_results


def _build_recommendations(listings: list[NormalizedListing]) -> RecommendationSet | None:
    views = [
        ListingView(listing=listing, platform=PlatformStub(name=listing.platform_name), pricing=compute_pricing(listing))
        for listing in listings
    ]
    return build_recommendations(views) if views else None


async def search_providers(
    providers: list[PriceProvider],
    query: str,
    location_key: str | None = None,
    extra_listings: list[NormalizedListing] | None = None,
) -> AggregatedSearchResult:
    provider_results = await _fetch_provider_results(providers, query, location_key)
    provider_listings = [listing for result in provider_results for listing in result.listings]

    if extra_listings:
        # A caller-supplied listing (e.g. a bill's own price) makes this
        # result specific to that caller — not safe to share across users,
        # so recommendations are computed fresh rather than cached.
        recommendations = _build_recommendations(extra_listings + provider_listings)
        return AggregatedSearchResult(recommendations=recommendations, provider_results=provider_results)

    rec_cache_key = _recommendations_cache_key(providers, query, location_key)
    cached_recommendations = await cache_get(rec_cache_key)
    if cached_recommendations is not None:
        return AggregatedSearchResult(
            recommendations=RecommendationSet(**{k: _recommendation_from_dict(v) for k, v in cached_recommendations.items()}),
            provider_results=provider_results,
        )

    recommendations = _build_recommendations(provider_listings)
    if recommendations is not None:
        await cache_set(rec_cache_key, _serialize_recommendations(recommendations), _RECOMMENDATIONS_TTL_SECONDS)
    return AggregatedSearchResult(recommendations=recommendations, provider_results=provider_results)


def _serialize_recommendations(recommendations: RecommendationSet) -> dict:
    return asdict(recommendations)


def _recommendation_from_dict(data: dict):
    from app.services.recommendation_engine import Recommendation

    return Recommendation(**data)
