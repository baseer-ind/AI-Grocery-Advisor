from unittest.mock import patch

import httpx

from app.services.providers.base import ProviderStatus
from app.services.providers.bigbasket_provider import BigBasketProvider


def _response(status_code, text=""):
    return httpx.Response(status_code, text=text, request=httpx.Request("GET", "https://www.bigbasket.com/ps/"))


def test_403_returns_blocked():
    with patch("httpx.get", return_value=_response(403)):
        result = BigBasketProvider().fetch("atta")
    assert result.status == ProviderStatus.BLOCKED


def test_network_error_returns_unavailable():
    with patch("httpx.get", side_effect=httpx.ConnectError("connection refused")):
        result = BigBasketProvider().fetch("atta")
    assert result.status == ProviderStatus.UNAVAILABLE


def test_unexpected_status_returns_unavailable():
    with patch("httpx.get", return_value=_response(500)):
        result = BigBasketProvider().fetch("atta")
    assert result.status == ProviderStatus.UNAVAILABLE


def test_200_with_no_matching_cards_returns_not_found():
    with patch("httpx.get", return_value=_response(200, text="<html><body>no products here</body></html>")):
        result = BigBasketProvider().fetch("atta")
    assert result.status == ProviderStatus.NOT_FOUND


def test_200_with_parseable_cards_returns_success():
    html = """
    <html><body>
      <div qa-locator="product">
        <div qa-locator="product-name">Aashirvaad Atta 5kg</div>
        <div qa-locator="product-price">Rs 321</div>
        <div qa-locator="product-mrp">Rs 399</div>
      </div>
    </body></html>
    """
    with patch("httpx.get", return_value=_response(200, text=html)):
        result = BigBasketProvider().fetch("atta")
    assert result.status == ProviderStatus.SUCCESS
    assert result.listings[0].selling_price == 321.0
    assert result.listings[0].mrp == 399.0


def test_parse_exception_returns_parse_error():
    with patch("httpx.get", return_value=_response(200, text="<html></html>")), \
         patch.object(BigBasketProvider, "_parse", side_effect=ValueError("boom")):
        result = BigBasketProvider().fetch("atta")
    assert result.status == ProviderStatus.PARSE_ERROR
