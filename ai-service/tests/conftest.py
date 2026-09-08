import sys
import types
from pathlib import Path

import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Every test in this suite injects a FakeEmbeddingService instead of loading a
# real model, so sentence-transformers' actual model weights are never needed.
# Stub the import here so tests stay fast and hermetic (no ~90MB model
# download, no network dependency) whether or not the real package happens to
# be installed — `app.services.embedding_service` only needs the symbol to
# exist at import time.
if "sentence_transformers" not in sys.modules:
    _stub = types.ModuleType("sentence_transformers")

    class _StubSentenceTransformer:
        pass

    _stub.SentenceTransformer = _StubSentenceTransformer
    sys.modules["sentence_transformers"] = _stub


class FakeEmbeddingService:
    """Deterministic stand-in for the real sentence-transformers model —
    tests exercise scoring/parsing logic, not the embedding model itself."""

    def __init__(self, fixed_similarity: float = 0.5):
        self.fixed_similarity = fixed_similarity

    def generate_embedding(self, text):
        if not text or not text.strip():
            raise ValueError("Cannot generate embedding for empty text.")
        return np.array([1.0, 0.0])

    def generate_batch_embeddings(self, texts):
        if not texts:
            return np.array([])
        return np.array([[1.0, 0.0] for _ in texts])

    def calculate_similarity(self, a, b):
        return self.fixed_similarity


@pytest.fixture
def fake_embedding_service():
    return FakeEmbeddingService()
