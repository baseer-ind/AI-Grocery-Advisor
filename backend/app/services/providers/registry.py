"""Single place that decides which `PriceProvider` implementations are
active. Both bill processing and basket comparison need "all configured
providers" — pulled out so adding/removing a provider doesn't require
editing every caller.
"""

from app.core.config import settings
from app.services.providers.base import PriceProvider
from app.services.providers.bigbasket_provider import BigBasketProvider
from app.services.providers.csv_provider import CSVProvider
from app.services.providers.mock_provider import MockProvider


def build_price_providers() -> list[PriceProvider]:
    providers: list[PriceProvider] = [CSVProvider(settings.curated_prices_path), BigBasketProvider()]
    # MockProvider's "demo-mart" catalog is fine in dev/tests, but a real
    # beta user must never see fictional store prices mixed into a live
    # comparison, so it's excluded unless explicitly running outside prod.
    if settings.environment != "production":
        providers.append(MockProvider())
    return providers
