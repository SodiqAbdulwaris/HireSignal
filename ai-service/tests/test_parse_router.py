from app.routers.parse import router as parse_router
from app.config.settings import get_settings
from tests.conftest import make_router_test_client


def test_oversized_upload_is_rejected_without_reading_it_whole():
    client = make_router_test_client(parse_router)
    max_bytes = get_settings().MAX_FILE_SIZE_MB * 1024 * 1024
    oversized = b"x" * (max_bytes + 1024)

    response = client.post(
        "/parse/",
        files={"file": ("big.pdf", oversized, "application/pdf")},
    )

    assert response.status_code == 400
    assert "exceeds the maximum allowed size" in response.json()["message"]
