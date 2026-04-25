"""FAISS index wrapper with persistence and content-hash-based reuse.

On disk, each store occupies a directory:
  {path}/index.faiss      — the FAISS IndexFlatIP file
  {path}/metadata.pkl     — list[dict] keyed by index row order
  {path}/index_hash.json  — {provider, model, dim, version, row_id_hash, index}
"""
from __future__ import annotations

import json
import logging
import pickle
from pathlib import Path

import faiss
import numpy as np

log = logging.getLogger(__name__)


class FaissStore:
    INDEX_FILE = "index.faiss"
    META_FILE = "metadata.pkl"
    HASH_FILE = "index_hash.json"
    # Bump this when canonical_text.py changes meaningfully so persisted
    # indices are invalidated automatically.
    VERSION = 1

    def __init__(self, dim: int, path: str | Path):
        self.dim = dim
        self.path = Path(path)
        self.path.mkdir(parents=True, exist_ok=True)
        self.index: faiss.IndexFlatIP = faiss.IndexFlatIP(dim)
        self.metadata: list[dict] = []

    def __len__(self) -> int:
        return int(self.index.ntotal)

    def reset(self) -> None:
        self.index = faiss.IndexFlatIP(self.dim)
        self.metadata = []

    def add(self, vector: np.ndarray, metadata: dict) -> None:
        if vector.ndim == 1:
            vector = vector.reshape(1, -1)
        vector = np.ascontiguousarray(vector, dtype="float32")
        self.index.add(vector)
        self.metadata.append(metadata)

    def add_batch(self, vectors: np.ndarray, metadatas: list[dict]) -> None:
        if vectors.shape[0] != len(metadatas):
            raise ValueError(
                f"vector/metadata length mismatch: {vectors.shape[0]} vs {len(metadatas)}"
            )
        if vectors.shape[0] == 0:
            return
        vectors = np.ascontiguousarray(vectors, dtype="float32")
        self.index.add(vectors)
        self.metadata.extend(metadatas)

    def search(self, query: np.ndarray, k: int = 10) -> list[dict]:
        if self.index.ntotal == 0:
            return []
        if query.ndim == 1:
            query = query.reshape(1, -1)
        query = np.ascontiguousarray(query, dtype="float32")
        scores, idxs = self.index.search(query, min(k, int(self.index.ntotal)))
        results: list[dict] = []
        for score, idx in zip(scores[0].tolist(), idxs[0].tolist(), strict=True):
            if idx == -1:
                continue
            results.append({"score": float(score), "metadata": self.metadata[idx]})
        return results

    def save(self, hash_payload: dict) -> None:
        faiss.write_index(self.index, str(self.path / self.INDEX_FILE))
        with (self.path / self.META_FILE).open("wb") as f:
            pickle.dump(self.metadata, f)
        with (self.path / self.HASH_FILE).open("w") as f:
            json.dump(hash_payload, f, sort_keys=True)
        log.info("FaissStore[%s] saved %d vectors", self.path.name, self.index.ntotal)

    def load_if_matches(self, hash_payload: dict) -> bool:
        """Return True iff disk artefacts exist AND their hash matches."""
        idx_p = self.path / self.INDEX_FILE
        meta_p = self.path / self.META_FILE
        hash_p = self.path / self.HASH_FILE
        if not (idx_p.exists() and meta_p.exists() and hash_p.exists()):
            return False
        with hash_p.open() as f:
            saved = json.load(f)
        if saved != hash_payload:
            log.info("FaissStore[%s] hash mismatch — rebuild required", self.path.name)
            return False
        self.index = faiss.read_index(str(idx_p))
        with meta_p.open("rb") as f:
            self.metadata = pickle.load(f)
        log.info("FaissStore[%s] loaded %d vectors from disk", self.path.name, self.index.ntotal)
        return True
