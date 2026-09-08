from fastapi.testclient import TestClient

from app.main import app


def test_liveness_is_always_ok():
    with TestClient(app) as client:
        response = client.get("/health/live")
    assert response.status_code == 200


def test_readiness_fails_when_model_not_loaded():
    with TestClient(app) as client:
        client.app.state.model_ready = False
        response = client.get("/health")
    assert response.status_code == 503
    assert response.json()["model_ready"] is False


def test_readiness_succeeds_when_model_loaded():
    with TestClient(app) as client:
        client.app.state.model_ready = True
        response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["model_ready"] is True
