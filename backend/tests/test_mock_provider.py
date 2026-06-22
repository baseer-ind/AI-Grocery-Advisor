from app.services.providers.base import ProviderStatus
from app.services.providers.mock_provider import MockProvider


def test_match_returns_success_with_listings():
    result = MockProvider().fetch("atta")
    assert result.status == ProviderStatus.SUCCESS
    assert len(result.listings) == 1
    assert "Atta" in result.listings[0].product_name


def test_no_match_returns_not_found():
    result = MockProvider().fetch("nonexistent product xyz")
    assert result.status == ProviderStatus.NOT_FOUND
    assert result.listings == []
