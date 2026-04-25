"""Mock-embedding determinism and shape checks."""
from __future__ import annotations

import numpy as np
import pytest

from app.config import Settings
from app.core.embeddings import EmbeddingClient


@pytest.fixture()
def mock_client() -> EmbeddingClient:
    return EmbeddingClient(Settings(google_api_key="", embedding_dim=64))


def test_dim_and_dtype(mock_client):
    v = mock_client.embed("hello")
    assert v.dtype == np.float32
    assert v.shape == (64,)


def test_l2_normalised(mock_client):
    v = mock_client.embed("hello")
    assert pytest.approx(float(np.linalg.norm(v)), abs=1e-6) == 1.0


def test_deterministic(mock_client):
    a = mock_client.embed("the quick brown fox")
    b = mock_client.embed("the quick brown fox")
    assert np.array_equal(a, b)


def test_distinct_inputs_produce_distinct_vectors(mock_client):
    a = mock_client.embed("alpha")
    b = mock_client.embed("beta")
    assert not np.allclose(a, b)


def test_batch(mock_client):
    matrix = mock_client.embed_batch(["a", "b", "c"])
    assert matrix.shape == (3, 64)
    norms = np.linalg.norm(matrix, axis=1)
    assert np.allclose(norms, 1.0, atol=1e-6)


def test_empty_batch(mock_client):
    out = mock_client.embed_batch([])
    assert out.shape == (0, 64)


def test_provider_string():
    assert EmbeddingClient(Settings(google_api_key="")).provider == "mock"
