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
    return [CSVProvider(settings.curated_prices_path), MockProvider(), BigBasketProvider()]
