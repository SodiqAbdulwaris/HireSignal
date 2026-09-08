from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.exceptions import AppException
from app.routers.parse import router as parse_router
from app.config.settings import get_settings


def _make_client():
    app = FastAPI()
    app.include_router(parse_router)

    @app.exception_handler(AppException)
    async def app_exception_handler(request, exc):
        from fastapi.responses import JSONResponse

        return JSONResponse(status_code=400, content={"message": exc.message})

    return TestClient(app)


def test_oversized_upload_is_rejected_without_reading_it_whole():
    client = _make_client()
    max_bytes = get_settings().MAX_FILE_SIZE_MB * 1024 * 1024
    oversized = b"x" * (max_bytes + 1024)

    response = client.post(
        "/parse/",
        files={"file": ("big.pdf", oversized, "application/pdf")},
    )

    assert response.status_code == 400
    assert "exceeds the maximum allowed size" in response.json()["message"]
