import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from huggingface_hub import login

from app.config.settings import get_settings
from app.core.exceptions import AppException
from app.core.middleware import RequestLoggingMiddleware
from app.routers.parse import router as parse_router
from app.routers.match import router as match_router
from app.services.embedding_service import EmbeddingService, load_embedding_model

settings = get_settings()
logger = logging.getLogger(__name__)

if settings.HF_TOKEN:
    try:
        login(token=settings.HF_TOKEN)
    except Exception as exc:
        print("Error:", exc)
        


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Loading embedding model: %s", settings.EMBEDDING_MODEL)
    try:
        raw_model = load_embedding_model(
            model_name=settings.EMBEDDING_MODEL,
            cache_dir=settings.MODEL_CACHE_DIR,
        )
        app.state.embedding_service = EmbeddingService(raw_model)
        app.state.model_ready = True
        logger.info("Embedding model loaded and ready.")
    except Exception as e:
        logger.error("Failed to load embedding model: %s", e)
        app.state.model_ready = False

    yield

    logger.info("AI service shutting down.")


app = FastAPI(title="AI Resume Screening Service", lifespan=lifespan)

app.add_middleware(RequestLoggingMiddleware)

app.include_router(parse_router)
app.include_router(match_router)


@app.get("/health/live")
def liveness():
    """Process-alive check: always 200 once the app can serve HTTP at all."""
    return {"status": "ok"}


@app.get("/health")
def readiness(response: Response):
    """Readiness check: fails with 503 until the embedding model is loaded,
    so an orchestrator (e.g. Railway's healthcheckPath) doesn't route
    matching traffic to an instance that can only 500 on /match/."""
    model_ready = getattr(app.state, "model_ready", False)
    response.status_code = 200 if model_ready else 503
    return {"status": "ok" if model_ready else "not_ready", "model_ready": model_ready}


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=400,
        content={
            "success": False,
            "message": exc.message,
            "error_code": exc.error_code,
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception during request")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error",
            "error_code": "INTERNAL_ERROR",
        },
    )