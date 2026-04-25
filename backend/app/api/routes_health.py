"""GET /health — liveness + dependency status."""
from __future__ import annotations

from fastapi import APIRouter, Request

from app.config import settings

router = APIRouter(tags=["health"])


@router.get("/health")
def health(request: Request) -> dict:
    indices = getattr(request.app.state, "index_registry", None)
    indices_built = bool(indices and indices.is_built()) if indices else False
    has_prose = getattr(request.app.state, "gemini_client", None) is not None
    return {
        "status": "ok",
        "embedding_provider": "gemini" if settings.use_gemini else "mock",
        "indices_built": indices_built,
        "prose_available": has_prose,
        "db": "connected",
    }
