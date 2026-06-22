"""Platform-agnostic interface every price provider implements.

Providers are the only place platform-specific logic (HTTP calls, HTML
parsing, file formats) is allowed to live. Everything downstream — pricing,
recommendations, the API layer — only ever sees `NormalizedListing` and
`ProviderResult`, so adding Blinkit/Zepto/Instamart/Amazon Fresh/JioMart later
means writing one new file here, not touching the engines.

`fetch` is async so a slow/blocked provider (BigBasket today, any live
platform tomorrow) can't stall the event loop or the other providers being
queried alongside it — `provider_aggregator` runs every provider's `fetch`
concurrently via `asyncio.gather`.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum


class ProviderStatus(str, Enum):
    SUCCESS = "success"
    BLOCKED = "blocked"
    UNAVAILABLE = "unavailable"
    NOT_FOUND = "not_found"
    PARSE_ERROR = "parse_error"


@dataclass
class NormalizedListing:
    """The common shape every provider must normalize its data into.

    `location_key` is an opaque pincode/city/dark-store identifier. Every
    current provider ignores it (it's location-agnostic data), but it's
    threaded through end-to-end so a location-aware provider can be added
    without changing this shape or anything downstream of it.
    """

    platform_slug: str
    platform_name: str
    product_name: str
    mrp: float
    selling_price: float
    delivery_fee: float
    platform_fee: float
    handling_fee: float
    product_rating: float
    delivery_rating: float
    eta_minutes: int
    in_stock: bool
    product_url: str
    id: int = 0
    location_key: str | None = None


@dataclass
class ProviderResult:
    status: ProviderStatus
    platform_slug: str
    listings: list[NormalizedListing] = field(default_factory=list)
    message: str = ""


class PriceProvider(ABC):
    platform_slug: str
    platform_name: str

    @abstractmethod
    async def fetch(self, query: str, location_key: str | None = None) -> ProviderResult:
        """Look up `query` (optionally scoped to `location_key`) against this
        platform and return a normalized result.

        Must never raise — network/parse failures are reported via
        ProviderStatus, not exceptions, so one broken provider can't take
        down a multi-platform search.
        """
