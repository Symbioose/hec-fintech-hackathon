"""FastAPI dependency providers."""
from __future__ import annotations

from collections.abc import Generator

from fastapi import Request
from sqlalchemy.orm import Session

from app.db.session import SessionLocal


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_embedding_client(request: Request):
    """Phase 3+ — set in lifespan, available on app.state.embedding_client."""
    return request.app.state.embedding_client


def get_indices(request: Request):
    """Phase 3+ — set in lifespan, available on app.state.index_registry."""
    return request.app.state.index_registry
