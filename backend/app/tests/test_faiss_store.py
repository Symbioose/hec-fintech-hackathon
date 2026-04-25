"""FaissStore: add / search / save / load / hash gating."""
from __future__ import annotations

import numpy as np

from app.core.faiss_store import FaissStore


def _norm(v: np.ndarray) -> np.ndarray:
    return v / float(np.linalg.norm(v))


def test_add_and_search_top_k(tmp_path):
    store = FaissStore(dim=4, path=tmp_path / "ix")
    rng = np.random.default_rng(0)
    for i in range(5):
        v = _norm(rng.standard_normal(4).astype("float32"))
        store.add(v, {"id": f"x-{i}"})

    assert len(store) == 5

    results = store.search(_norm(rng.standard_normal(4).astype("float32")), k=3)
    assert len(results) == 3
    assert all("id" in r["metadata"] for r in results)
    # Results must be sorted by score (higher = more similar)
    scores = [r["score"] for r in results]
    assert scores == sorted(scores, reverse=True)


def test_search_self_returns_score_one(tmp_path):
    store = FaissStore(dim=4, path=tmp_path / "ix")
    v = _norm(np.array([1.0, 2.0, 3.0, 4.0], dtype="float32"))
    store.add(v, {"id": "self"})
    results = store.search(v, k=1)
    assert results[0]["metadata"]["id"] == "self"
    # Cosine of unit vectors with themselves = 1
    assert abs(results[0]["score"] - 1.0) < 1e-5


def test_save_and_load_round_trip(tmp_path):
    p = tmp_path / "persist"
    store = FaissStore(dim=4, path=p)
    rng = np.random.default_rng(7)
    for i in range(3):
        store.add(_norm(rng.standard_normal(4).astype("float32")), {"id": str(i)})

    payload = {"provider": "mock", "model": "x", "dim": 4, "version": 1, "row_id_hash": "abc"}
    store.save(payload)

    fresh = FaissStore(dim=4, path=p)
    assert fresh.load_if_matches(payload) is True
    assert len(fresh) == 3
    assert fresh.metadata == [{"id": "0"}, {"id": "1"}, {"id": "2"}]


def test_load_returns_false_on_hash_mismatch(tmp_path):
    p = tmp_path / "persist"
    store = FaissStore(dim=4, path=p)
    store.add(_norm(np.array([1, 0, 0, 0], dtype="float32")), {"id": "a"})
    store.save({"row_id_hash": "old"})

    fresh = FaissStore(dim=4, path=p)
    assert fresh.load_if_matches({"row_id_hash": "new"}) is False


def test_load_returns_false_when_files_missing(tmp_path):
    fresh = FaissStore(dim=4, path=tmp_path / "never_saved")
    assert fresh.load_if_matches({"x": 1}) is False


def test_empty_search_returns_empty(tmp_path):
    store = FaissStore(dim=4, path=tmp_path / "ix")
    v = _norm(np.array([1, 0, 0, 0], dtype="float32"))
    assert store.search(v, k=5) == []
