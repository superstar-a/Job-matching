from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


def test_health_endpoint_returns_service_status():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "ai-service",
        "version": "1.0.0",
    }


def test_root_endpoint_uses_health_contract():
    response = client.get("/")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
