"""POST /indices/rebuild — manual trigger for re-embedding everything."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.api.deps import get_db

router = APIRouter(prefix="/indices", tags=["indices"])


@router.post("/rebuild")
def rebuild_indices(request: Request, db: Session = Depends(get_db)) -> dict[str, int]:
    indices = request.app.state.index_registry
    embedder = request.app.state.embedding_client
    return indices.rebuild(db, embedder)


@router.get("/status")
def indices_status(request: Request) -> dict:
    indices = request.app.state.index_registry
    return {
        "built": indices.is_built(),
        "counts": indices.counts(),
        "dim": indices.dim,
    }
