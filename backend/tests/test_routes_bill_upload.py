from pathlib import Path

from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app

_SAMPLE_DIR = Path(__file__).resolve().parent.parent / "data" / "sample_bills"
client = TestClient(app)


def test_upload_with_mock_ocr_returns_basket_and_recommendations(monkeypatch):
    monkeypatch.setattr(settings, "ocr_engine", "mock")

    response = client.post(
        "/api/v1/bills/upload",
        files={"file": ("bill.png", b"irrelevant bytes", "image/png")},
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body["basket"]) == 3
    product_names = {item["product_name"] for item in body["basket"]}
    assert "Aashirvaad Whole Wheat Atta 5kg" in product_names

    atta_rec = next(r for r in body["recommendations"] if r["basket_item"]["product_name"] == "Aashirvaad Whole Wheat Atta 5kg")
    assert atta_rec["recommendations"] is not None
    platform_slugs = {p["platform_slug"] for p in atta_rec["providers"]}
    assert "curated" in platform_slugs
    assert "bigbasket" in platform_slugs


def test_upload_with_real_sample_image_via_tesseract(monkeypatch):
    monkeypatch.setattr(settings, "ocr_engine", "tesseract")
    image_bytes = (_SAMPLE_DIR / "sample_bill_image.png").read_bytes()

    response = client.post(
        "/api/v1/bills/upload",
        files={"file": ("bill.png", image_bytes, "image/png")},
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body["basket"]) >= 2
    assert any("Atta" in item["product_name"] for item in body["basket"])


def test_unsupported_file_type_returns_415(monkeypatch):
    monkeypatch.setattr(settings, "ocr_engine", "tesseract")

    response = client.post(
        "/api/v1/bills/upload",
        files={"file": ("bill.txt", b"plain text bill", "text/plain")},
    )

    assert response.status_code == 415
