from fastapi.testclient import TestClient

from app.main import app


def test_upload_async_enqueues_job_then_reports_pending_then_404_for_unknown_id():
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/bills/upload-async",
            files={"file": ("bill.png", b"irrelevant bytes", "image/png")},
        )

        assert response.status_code == 202
        body = response.json()
        assert body["job_id"]
        assert body["status"] == "pending"

        status_response = client.get(f"/api/v1/bills/upload-async/{body['bill_upload_id']}")
        assert status_response.status_code == 200
        assert status_response.json()["status"] == "pending"

        not_found_response = client.get("/api/v1/bills/upload-async/999999")
        assert not_found_response.status_code == 404
