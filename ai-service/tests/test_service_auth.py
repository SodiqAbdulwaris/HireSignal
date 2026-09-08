from app.config.settings import get_settings
from app.routers.parse import router as parse_router
from tests.conftest import make_router_test_client


def test_unset_key_enforces_nothing(monkeypatch):
    get_settings.cache_clear()
    monkeypatch.delenv("AI_SERVICE_API_KEY", raising=False)
    client = make_router_test_client(parse_router)

    response = client.post("/parse/", files={"file": ("r.pdf", b"x", "application/pdf")})

    # No X-Service-Key sent, no key configured — request proceeds past the
    # auth dependency (the 400 that follows is the parsing logic rejecting
    # garbage file content, not the auth check).
    assert response.status_code != 401
    get_settings.cache_clear()


def test_configured_key_rejects_missing_header(monkeypatch):
    get_settings.cache_clear()
    monkeypatch.setenv("AI_SERVICE_API_KEY", "secret-value")
    client = make_router_test_client(parse_router)

    response = client.post("/parse/", files={"file": ("r.pdf", b"x", "application/pdf")})

    assert response.status_code == 401
    get_settings.cache_clear()


def test_configured_key_rejects_wrong_header(monkeypatch):
    get_settings.cache_clear()
    monkeypatch.setenv("AI_SERVICE_API_KEY", "secret-value")
    client = make_router_test_client(parse_router)

    response = client.post(
        "/parse/",
        files={"file": ("r.pdf", b"x", "application/pdf")},
        headers={"X-Service-Key": "wrong-value"},
    )

    assert response.status_code == 401
    get_settings.cache_clear()


def test_configured_key_accepts_matching_header(monkeypatch):
    get_settings.cache_clear()
    monkeypatch.setenv("AI_SERVICE_API_KEY", "secret-value")
    client = make_router_test_client(parse_router)

    response = client.post(
        "/parse/",
        files={"file": ("r.pdf", b"x", "application/pdf")},
        headers={"X-Service-Key": "secret-value"},
    )

    assert response.status_code != 401
    get_settings.cache_clear()
