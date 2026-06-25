from fastapi.testclient import TestClient

from app.main import app


def test_create_household_profile_returns_per_person_insight():
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/household",
            json={
                "size": 4,
                "adults": 2,
                "children": 2,
                "seniors": 0,
                "city": "Mumbai",
                "monthly_grocery_budget": 20000,
            },
        )

    assert response.status_code == 200
    body = response.json()
    assert body["household_id"] > 0
    assert "5,000" in body["insight"]


def test_create_household_profile_without_budget_prompts_for_it():
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/household",
            json={"size": 3, "adults": 2, "children": 1, "city": "Pune"},
        )

    assert response.status_code == 200
    body = response.json()
    assert "budget" in body["insight"].lower()


def test_set_shopping_behavior_quick_commerce_insight():
    with TestClient(app) as client:
        create_response = client.post(
            "/api/v1/household",
            json={"size": 2, "adults": 2, "city": "Bengaluru"},
        )
        household_id = create_response.json()["household_id"]

        response = client.post(
            f"/api/v1/household/{household_id}/shopping-behavior",
            json={"stores": ["Blinkit", "Zepto"], "frequency": "weekly"},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["household_id"] == household_id
    assert "quick-commerce" in body["insight"]

    with TestClient(app) as client:
        update_response = client.post(
            f"/api/v1/household/{household_id}/shopping-behavior",
            json={"stores": ["Blinkit"], "frequency": "monthly"},
        )
    assert update_response.status_code == 200
    assert update_response.json()["stores"] == ["Blinkit"]


def test_set_shopping_behavior_unknown_household_returns_404():
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/household/999999/shopping-behavior",
            json={"stores": ["Reliance Fresh"], "frequency": "weekly"},
        )

    assert response.status_code == 404


def test_set_shopping_style_returns_label():
    with TestClient(app) as client:
        create_response = client.post(
            "/api/v1/household",
            json={"size": 1, "adults": 1, "city": "Delhi"},
        )
        household_id = create_response.json()["household_id"]

        response = client.post(
            f"/api/v1/household/{household_id}/shopping-style",
            json={"priorities": ["save_money", "bulk_buyer"]},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["priorities"] == ["save_money", "bulk_buyer"]
    assert "Price-conscious planner" in body["insight"]

    with TestClient(app) as client:
        update_response = client.post(
            f"/api/v1/household/{household_id}/shopping-style",
            json={"priorities": []},
        )
    assert update_response.status_code == 200
    assert "Select at least one priority" in update_response.json()["insight"]
