"""Recommendation endpoints.

``with_prose=true`` query parameter enables Gemini-generated prose alongside
the rule-based bullets, but only when a Gemini client was wired into
``app.state.gemini_client`` at startup (i.e., ``GOOGLE_API_KEY`` was set).
Otherwise prose silently stays ``None`` — the rule-based bullets always work.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.explanation import generate_prose_rationale
from app.schemas.recommendation import RecommendationSchema
from app.services.recommendation_service import (
    ProseGenerator,
    recommend_for_asset_manager,
    recommend_for_product,
)

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


def _prose_generator_or_none(request: Request, with_prose: bool) -> ProseGenerator | None:
    if not with_prose:
        return None
    client = getattr(request.app.state, "gemini_client", None)
    if client is None:
        return None

    def gen(product, am, sub_scores, bullets, reasons):
        return generate_prose_rationale(
            product, am, sub_scores, bullets, reasons, client=client
        )

    return gen


@router.post("/product/{product_id}", response_model=list[RecommendationSchema])
def recommendations_for_product(
    product_id: str,
    request: Request,
    with_prose: bool = False,
    db: Session = Depends(get_db),
) -> list[RecommendationSchema]:
    try:
        return recommend_for_product(
            db, product_id, prose_generator=_prose_generator_or_none(request, with_prose)
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/asset-manager/{am_id}", response_model=list[RecommendationSchema])
def recommendations_for_asset_manager(
    am_id: str,
    request: Request,
    with_prose: bool = False,
    db: Session = Depends(get_db),
) -> list[RecommendationSchema]:
    try:
        return recommend_for_asset_manager(
            db, am_id, prose_generator=_prose_generator_or_none(request, with_prose)
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
