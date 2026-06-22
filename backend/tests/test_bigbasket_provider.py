from unittest.mock import AsyncMock, patch

import httpx
import pytest

from app.services.providers.base import ProviderStatus
from app.services.providers.bigbasket_provider import BigBasketProvider


def _response(status_code, text=""):
    return httpx.Response(status_code, text=text, request=httpx.Request("GET", "https://www.bigbasket.com/ps/"))


@pytest.mark.asyncio
async def test_403_returns_blocked():
    with patch.object(BigBasketProvider, "_request", AsyncMock(return_value=_response(403))):
        result = await BigBasketProvider().fetch("atta")
    assert result.status == ProviderStatus.BLOCKED


@pytest.mark.asyncio
async def test_network_error_returns_unavailable():
    with patch.object(BigBasketProvider, "_request", AsyncMock(side_effect=httpx.ConnectError("connection refused"))):
        result = await BigBasketProvider().fetch("atta")
    assert result.status == ProviderStatus.UNAVAILABLE


@pytest.mark.asyncio
async def test_unexpected_status_returns_unavailable():
    with patch.object(BigBasketProvider, "_request", AsyncMock(return_value=_response(500))):
        result = await BigBasketProvider().fetch("atta")
    assert result.status == ProviderStatus.UNAVAILABLE


@pytest.mark.asyncio
async def test_200_with_no_matching_cards_returns_not_found():
    with patch.object(
        BigBasketProvider, "_request", AsyncMock(return_value=_response(200, text="<html><body>no products here</body></html>"))
    ):
        result = await BigBasketProvider().fetch("atta")
    assert result.status == ProviderStatus.NOT_FOUND


@pytest.mark.asyncio
async def test_200_with_parseable_cards_returns_success():
    html = """
    <html><body>
      <div qa-locator="product">
        <div qa-locator="product-name">Aashirvaad Atta 5kg</div>
        <div qa-locator="product-price">Rs 321</div>
        <div qa-locator="product-mrp">Rs 399</div>
      </div>
    </body></html>
    """
    with patch.object(BigBasketProvider, "_request", AsyncMock(return_value=_response(200, text=html))):
        result = await BigBasketProvider().fetch("atta")
    assert result.status == ProviderStatus.SUCCESS
    assert result.listings[0].selling_price == 321.0
    assert result.listings[0].mrp == 399.0


@pytest.mark.asyncio
async def test_parse_exception_returns_parse_error():
    with patch.object(BigBasketProvider, "_request", AsyncMock(return_value=_response(200, text="<html></html>"))), \
         patch.object(BigBasketProvider, "_parse", side_effect=ValueError("boom")):
        result = await BigBasketProvider().fetch("atta")
    assert result.status == ProviderStatus.PARSE_ERROR
