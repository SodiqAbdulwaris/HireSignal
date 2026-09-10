from pathlib import Path

import app.services.embedding_service as embedding_service_module
from app.services.embedding_service import load_embedding_model


class FakeModel:
    def __init__(self, source):
        self.source = source

    def save(self, path):
        p = Path(path)
        p.mkdir(parents=True, exist_ok=True)
        (p / "config.json").write_text("{}")


def test_recovers_from_a_stray_partial_cache_left_by_a_crashed_save(tmp_path, monkeypatch):
    monkeypatch.setattr(embedding_service_module, "SentenceTransformer", FakeModel)
    cache_dir = tmp_path / "models"
    model_name = "fake-model"

    # A previous restart crashed mid-save, leaving a half-written staging dir.
    stray = cache_dir / f".{model_name}.tmp"
    stray.mkdir(parents=True)
    (stray / "truncated.bin").write_bytes(b"not a full file")

    model = load_embedding_model(model_name=model_name, cache_dir=str(cache_dir))

    assert isinstance(model, FakeModel)
    assert (cache_dir / model_name / "config.json").exists()
    assert not stray.exists()


def test_uses_existing_cache_without_redownloading(tmp_path, monkeypatch):
    calls = []
    monkeypatch.setattr(
        embedding_service_module,
        "SentenceTransformer",
        lambda src: calls.append(src) or FakeModel(src),
    )
    cache_dir = tmp_path / "models"
    model_name = "fake-model"
    local_path = cache_dir / model_name
    local_path.mkdir(parents=True)
    (local_path / "config.json").write_text("{}")

    load_embedding_model(model_name=model_name, cache_dir=str(cache_dir))

    assert calls == [str(local_path)]
