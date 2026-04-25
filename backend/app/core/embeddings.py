"""Embedding client.

When ``GOOGLE_API_KEY`` is set, calls Gemini's ``embed_content`` and L2-normalises
the result. Otherwise uses a deterministic md5-seeded RNG so the rest of the
pipeline runs end-to-end without any network access. Both paths return
``np.float32`` vectors of the same dim (default 768) so FAISS indices stay
swap-compatible.
"""
from __future__ import annotations

import hashlib
import logging

import numpy as np

from app.config import Settings
from app.config import settings as default_settings

log = logging.getLogger(__name__)


class EmbeddingClient:
    def __init__(self, settings: Settings | None = None):
        s = settings or default_settings
        self.dim = s.embedding_dim
        self.model = s.embedding_model
        self._gemini_client = None

        if s.use_gemini:
            try:
                from google import genai

                self._gemini_client = genai.Client(api_key=s.google_api_key)
                self.use_gemini = True
                log.info(
                    "EmbeddingClient: Gemini enabled (model=%s, dim=%d)",
                    self.model,
                    self.dim,
                )
            except Exception as exc:  # noqa: BLE001
                log.warning("Gemini init failed (%s) — falling back to mock", exc)
                self.use_gemini = False
        else:
            self.use_gemini = False

        if not self.use_gemini:
            log.info("EmbeddingClient: deterministic mock embeddings (dim=%d)", self.dim)

    @property
    def provider(self) -> str:
        return "gemini" if self.use_gemini else "mock"

    def embed(self, text: str) -> np.ndarray:
        if self.use_gemini:
            return self._embed_gemini(text)
        return self._embed_mock(text)

    def embed_batch(self, texts: list[str]) -> np.ndarray:
        if not texts:
            return np.zeros((0, self.dim), dtype="float32")
        return np.vstack([self.embed(t) for t in texts]).astype("float32")

    # --- providers ---------------------------------------------------------

    def _embed_mock(self, text: str) -> np.ndarray:
        seed = int(hashlib.md5(text.encode("utf-8")).hexdigest(), 16) % (2**32)
        rng = np.random.default_rng(seed)
        v = rng.standard_normal(self.dim).astype("float32")
        norm = float(np.linalg.norm(v))
        return v / norm if norm > 0 else v

    def _embed_gemini(self, text: str) -> np.ndarray:
        from google.genai import types

        client = self._gemini_client
        assert client is not None  # use_gemini==True guarantees this
        result = client.models.embed_content(
            model=self.model,
            contents=text,
            config=types.EmbedContentConfig(output_dimensionality=self.dim),
        )
        embeddings = result.embeddings
        assert embeddings is not None and len(embeddings) > 0
        v = np.asarray(embeddings[0].values, dtype="float32")
        norm = float(np.linalg.norm(v))
        return v / norm if norm > 0 else v
