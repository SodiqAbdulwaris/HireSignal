import logging
import shutil
from pathlib import Path
import numpy as np
from fastapi import Request
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self, model: SentenceTransformer):
        self._model = model

    def generate_embedding(self, text: str) -> np.ndarray:
        if not text or not text.strip():
            raise ValueError("Cannot generate embedding for empty text.")
        text = self._normalize(text)
        return self._model.encode(text, normalize_embeddings=True)

    def generate_batch_embeddings(self, texts: list[str]) -> np.ndarray:
        if not texts:
            return np.array([])
        texts = [self._normalize(t) for t in texts]
        return self._model.encode(texts, normalize_embeddings=True)

    def calculate_similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        # Since vectors are L2 normalized, dot product equals cosine similarity
        score = float(np.dot(vec1, vec2))
        return max(0.0, min(1.0, score))

    def _normalize(self, text: str) -> str:
        return " ".join((text or "").split())


def load_embedding_model(model_name: str, cache_dir: str) -> SentenceTransformer:
    local_path = Path(cache_dir) / model_name

    if local_path.exists():
        logger.info(f"Loading embedding model from local cache: {local_path}")
        return SentenceTransformer(str(local_path))

    logger.info(f"Local model not found. Downloading '{model_name}' from Hugging Face.")
    model = SentenceTransformer(model_name)

    # Save to a staging dir and rename into place atomically. A process
    # restart mid-save (e.g. a crashing container) previously left a
    # half-written cache dir behind that the next restart would try to
    # load, failing with a safetensors deserialization error instead of
    # just re-downloading.
    staging_path = local_path.parent / f".{model_name}.tmp"
    if staging_path.exists():
        shutil.rmtree(staging_path)
    model.save(str(staging_path))
    staging_path.replace(local_path)
    return model


def get_embedding_service(request: Request) -> EmbeddingService:
    service = getattr(request.app.state, "embedding_service", None)
    if service is None:
        raise RuntimeError("EmbeddingService is not initialised in app state.")
    return service