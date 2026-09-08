import os
import re
from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


APP_ENV = os.getenv("APP_ENV", "local").strip()
if not re.fullmatch(r"[A-Za-z0-9_-]+", APP_ENV):
    raise RuntimeError("APP_ENV may contain only letters, numbers, underscores, and hyphens.")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=f".env.{APP_ENV}",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Database
    MONGO_URI: str

    # Ports
    AI_SERVICE_PORT: int = 8000

    # Service URL
    AI_SERVICE_URL: str = "http://localhost:8000"

    # File upload
    MAX_FILE_SIZE_MB: int = 5

    # Embedding model
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    MODEL_CACHE_DIR: str = "app/embedding-models"
    
    HF_TOKEN: Optional[str] = None

    # AI parser fallback
    PARSER_AI_ENABLED: bool = False
    PARSER_AI_URL: Optional[str] = None
    PARSER_AI_API_KEY: Optional[str] = None
    PARSER_AI_TIMEOUT_SECONDS: float = 20.0


@lru_cache()
def get_settings() -> Settings:
    return Settings()
