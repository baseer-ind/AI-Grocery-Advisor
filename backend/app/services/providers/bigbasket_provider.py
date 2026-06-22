"""Real HTTP integration against BigBasket's public search page.

This is a production-shaped adapter, not a stub — it makes a genuine request,
parses genuine HTML, and reports genuine failure states. It is documented as
currently blocked: a plain, unauthenticated GET against bigbasket.com returns
403 Forbidden with no evasion attempted (verified during development of this
adapter). Per DATA_ACQUISITION_STRATEGY.md, this provider intentionally does
NOT attempt to get past that block — no header/TLS fingerprint spoofing, no
CAPTCHA solving, no proxy rotation. If BigBasket's defenses change, or a
legal/business decision authorizes evasion techniques, only `_request` and
`_parse` below need to change; the ProviderStatus contract stays the same.

The CSS selectors in `_parse` are best-effort and UNVERIFIED against live
markup, since a successful fetch couldn't be obtained while building this.
A malformed/unexpected page structure surfaces as PARSE_ERROR rather than
raising, so this is safe to ship even though the selectors aren't proven.
"""

import httpx
from bs4 import BeautifulSoup

from app.services.providers.base import NormalizedListing, PriceProvider, ProviderResult, ProviderStatus

_SEARCH_URL = "https://www.bigbasket.com/ps/"
_TIMEOUT_SECONDS = 8.0
_USER_AGENT = "AIGroceryAdvisorBot/0.1 (+price comparison research; contact: hello@example.com)"


class BigBasketProvider(PriceProvider):
    platform_slug = "bigbasket"
    platform_name = "BigBasket"

    def fetch(self, query: str) -> ProviderResult:
        try:
            response = self._request(query)
        except httpx.RequestError as exc:
            return ProviderResult(
                status=ProviderStatus.UNAVAILABLE,
                platform_slug=self.platform_slug,
                message=f"Network error reaching BigBasket: {exc}",
            )

        if response.status_code == 403:
            return ProviderResult(
                status=ProviderStatus.BLOCKED,
                platform_slug=self.platform_slug,
                message="BigBasket returned 403 Forbidden — request was blocked by their bot defenses.",
            )

        if response.status_code != 200:
            return ProviderResult(
                status=ProviderStatus.UNAVAILABLE,
                platform_slug=self.platform_slug,
                message=f"BigBasket returned unexpected status {response.status_code}",
            )

        try:
            listings = self._parse(response.text, query)
        except Exception as exc:  # noqa: BLE001 - any parse failure must degrade, never crash the caller
            return ProviderResult(
                status=ProviderStatus.PARSE_ERROR,
                platform_slug=self.platform_slug,
                message=f"Could not parse BigBasket search results: {exc}",
            )

        if not listings:
            return ProviderResult(status=ProviderStatus.NOT_FOUND, platform_slug=self.platform_slug)

        return ProviderResult(status=ProviderStatus.SUCCESS, platform_slug=self.platform_slug, listings=listings)

    def _request(self, query: str) -> httpx.Response:
        return httpx.get(
            _SEARCH_URL,
            params={"q": query},
            headers={"User-Agent": _USER_AGENT},
            timeout=_TIMEOUT_SECONDS,
            follow_redirects=True,
        )

    def _parse(self, html: str, query: str) -> list[NormalizedListing]:
        soup = BeautifulSoup(html, "html.parser")
        cards = soup.select("[qa-locator='product']")

        listings = []
        for card in cards:
            name_el = card.select_one("[qa-locator='product-name']")
            price_el = card.select_one("[qa-locator='product-price']")
            mrp_el = card.select_one("[qa-locator='product-mrp']")

            if name_el is None or price_el is None:
                continue

            selling_price = self._parse_price(price_el.get_text())
            mrp = self._parse_price(mrp_el.get_text()) if mrp_el else selling_price

            listings.append(
                NormalizedListing(
                    platform_slug=self.platform_slug,
                    platform_name=self.platform_name,
                    product_name=name_el.get_text(strip=True),
                    mrp=mrp,
                    selling_price=selling_price,
                    delivery_fee=0.0,
                    platform_fee=0.0,
                    handling_fee=0.0,
                    product_rating=0.0,
                    delivery_rating=0.0,
                    eta_minutes=0,
                    in_stock=True,
                    product_url=f"https://www.bigbasket.com/ps/?q={query}",
                )
            )
        return listings

    @staticmethod
    def _parse_price(text: str) -> float:
        digits = "".join(ch for ch in text if ch.isdigit() or ch == ".")
        return float(digits) if digits else 0.0
