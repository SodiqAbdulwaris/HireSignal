import hmac

from fastapi import Header, HTTPException

from app.config.settings import get_settings


async def require_service_key(x_service_key: str | None = Header(default=None)):
    """Reject requests missing/mismatching X-Service-Key, but only when
    AI_SERVICE_API_KEY is configured. Unset means no boundary is enforced
    at this layer — the deployment's network isolation is doing the job
    instead, which is the expected local-dev and same-network setup."""
    settings = get_settings()
    if not settings.AI_SERVICE_API_KEY:
        return

    if not x_service_key or not hmac.compare_digest(x_service_key, settings.AI_SERVICE_API_KEY):
        raise HTTPException(status_code=401, detail="Missing or invalid service credentials")
