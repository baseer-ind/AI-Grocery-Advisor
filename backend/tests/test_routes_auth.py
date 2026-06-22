"""Auth/User domain route tests.

Deliberately merged into a single test function sharing one `with
TestClient(app) as client:` block (one event-loop portal for the whole
suite), rather than one `with` block per test function. The async
engine's connection pool is a module-level singleton (`app/db/session.py`)
that isn't safe to reuse across separate anyio portals/event loops —
splitting these into independent test functions (each opening/closing
its own portal) reproduces the same `InterfaceError: cannot perform
operation: another operation is in progress` cross-event-loop hazard
already worked around in `test_routes_bill_upload_async.py`.
"""

import uuid
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app


def _unique_email(label: str) -> str:
    return f"{label}-{uuid.uuid4().hex[:12]}@example.com"


def test_auth_and_user_domain():
    with TestClient(app) as client:
        _assert_register_login_me_and_logout_flow(client)
        _assert_preferences_round_trip(client)
        _assert_password_reset_flow(client)
        _assert_password_reset_request_for_unknown_email_does_not_error(client)
        _assert_google_login_creates_and_reuses_account(client)
        _assert_google_login_returns_503_when_not_configured(client)
        _assert_bill_upload_async_associates_ownership_when_authenticated(client)


def _assert_register_login_me_and_logout_flow(client):
    email = _unique_email("shopper")

    register_response = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "correct-horse-battery", "full_name": "Shopper"},
    )
    assert register_response.status_code == 201
    token = register_response.json()["token"]
    assert register_response.json()["user"]["email"] == email

    duplicate_response = client.post(
        "/api/v1/auth/register", json={"email": email, "password": "another-password"}
    )
    assert duplicate_response.status_code == 409

    me_response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_response.status_code == 200
    assert me_response.json()["email"] == email

    unauthenticated_response = client.get("/api/v1/auth/me")
    assert unauthenticated_response.status_code == 401

    wrong_password_response = client.post("/api/v1/auth/login", json={"email": email, "password": "wrong"})
    assert wrong_password_response.status_code == 401

    login_response = client.post(
        "/api/v1/auth/login", json={"email": email, "password": "correct-horse-battery"}
    )
    assert login_response.status_code == 200
    login_token = login_response.json()["token"]

    logout_response = client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {login_token}"})
    assert logout_response.status_code == 204

    after_logout_response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {login_token}"})
    assert after_logout_response.status_code == 401

    first_token_still_valid = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert first_token_still_valid.status_code == 200


def _assert_preferences_round_trip(client):
    register_response = client.post(
        "/api/v1/auth/register",
        json={"email": _unique_email("prefs"), "password": "correct-horse-battery"},
    )
    token = register_response.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    update_response = client.put(
        "/api/v1/users/me/preferences",
        headers=headers,
        json={
            "grocery_preferences": {"prefers_organic": True},
            "cashback_preferences": {"card": "hdfc-millennia"},
            "membership_tier": "gold",
        },
    )
    assert update_response.status_code == 200
    body = update_response.json()
    assert body["grocery_preferences"] == {"prefers_organic": True}
    assert body["membership_tier"] == "gold"

    profile_response = client.get("/api/v1/users/me", headers=headers)
    assert profile_response.json()["preferences"]["membership_tier"] == "gold"


def _assert_password_reset_flow(client):
    email = _unique_email("reset")
    client.post("/api/v1/auth/register", json={"email": email, "password": "original-password"})

    previous_environment = settings.environment
    settings.environment = "development"
    try:
        request_response = client.post("/api/v1/auth/password-reset/request", json={"email": email})
        assert request_response.status_code == 202
        reset_token = request_response.json()["token"]
    finally:
        settings.environment = previous_environment

    assert reset_token

    confirm_response = client.post(
        "/api/v1/auth/password-reset/confirm",
        json={"token": reset_token, "new_password": "brand-new-password"},
    )
    assert confirm_response.status_code == 204

    old_password_login = client.post(
        "/api/v1/auth/login", json={"email": email, "password": "original-password"}
    )
    assert old_password_login.status_code == 401

    new_password_login = client.post(
        "/api/v1/auth/login", json={"email": email, "password": "brand-new-password"}
    )
    assert new_password_login.status_code == 200

    reuse_response = client.post(
        "/api/v1/auth/password-reset/confirm", json={"token": reset_token, "new_password": "irrelevant"}
    )
    assert reuse_response.status_code == 400


def _assert_password_reset_request_for_unknown_email_does_not_error(client):
    response = client.post(
        "/api/v1/auth/password-reset/request", json={"email": _unique_email("nobody")}
    )
    assert response.status_code == 202


def _assert_google_login_creates_and_reuses_account(client):
    settings.google_client_id = "test-client-id"
    email = _unique_email("googleuser")
    fake_payload = {"sub": f"google-sub-{uuid.uuid4().hex[:12]}", "email": email, "name": "Google User"}

    with patch("app.services.auth_service.google_id_token.verify_oauth2_token", return_value=fake_payload):
        response = client.post("/api/v1/auth/google", json={"id_token": "fake-token"})
        assert response.status_code == 200
        assert response.json()["user"]["email"] == email

        second_response = client.post("/api/v1/auth/google", json={"id_token": "fake-token"})
        assert second_response.status_code == 200
        assert second_response.json()["user"]["email"] == email

    settings.google_client_id = None


def _assert_google_login_returns_503_when_not_configured(client):
    settings.google_client_id = None
    response = client.post("/api/v1/auth/google", json={"id_token": "irrelevant"})
    assert response.status_code == 503


def _assert_bill_upload_async_associates_ownership_when_authenticated(client):
    register_response = client.post(
        "/api/v1/auth/register",
        json={"email": _unique_email("billowner"), "password": "correct-horse-battery"},
    )
    token = register_response.json()["token"]

    upload_response = client.post(
        "/api/v1/bills/upload-async",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("bill.png", b"irrelevant bytes", "image/png")},
    )
    assert upload_response.status_code == 202

    bill_history = client.get("/api/v1/users/me/bills", headers={"Authorization": f"Bearer {token}"})
    assert bill_history.status_code == 200
    assert upload_response.json()["bill_upload_id"] in bill_history.json()
