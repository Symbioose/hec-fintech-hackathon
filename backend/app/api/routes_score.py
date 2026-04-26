"""POST /recommendations/score — stateless on-demand scoring.

Accepts a product payload + asset manager profile directly (no DB lookup).
This decouples the endpoint from seeded data: the frontend can score any
extracted product against the logged-in AM's mandate in real time.

Optional `with_prose=true` calls Gemini for a narrative rationale paragraph
alongside the rule-based bullets — the key differentiator for the demo.
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, Request
from pydantic import BaseModel

from app.core.explanation import generate_prose_rationale
from app.core.matching import passes_hard_constraints
from app.core.scoring import compute_final_score, compute_sub_scores
from app.core.explanation import build_rationale_bullets
from app.schemas.asset_manager import AssetManagerProfileSchema
from app.schemas.product import ProductSchema
from app.schemas.recommendation import RecommendationSchema

log = logging.getLogger(__name__)

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


class ScoreRequest(BaseModel):
    product: ProductSchema
    am: AssetManagerProfileSchema
    with_prose: bool = False


@router.post("/score", response_model=RecommendationSchema)
async def score_product(body: ScoreRequest, request: Request) -> RecommendationSchema:
    product = body.product
    am = body.am

    embedder = getattr(request.app.state, "embedding_client", None)

    passes, reasons = passes_hard_constraints(product, am)
    sub = compute_sub_scores(product, am, embedder=embedder)
    final_score = compute_final_score(sub, hard_fail=not passes)
    rationale = build_rationale_bullets(product, am, reasons)

    prose: str | None = None
    if body.with_prose:
        client = getattr(request.app.state, "gemini_client", None)
        if client:
            prose = generate_prose_rationale(
                product, am, sub, rationale, reasons, client=client
            )
        else:
            log.debug("with_prose=true but no Gemini client — skipping prose")

    return RecommendationSchema(
        id=f"R-{am.id}-{product.id}",
        product_id=product.id,
        asset_manager_id=am.id,
        score=final_score,
        hard_fail=not passes,
        hard_fail_reasons=reasons,
        sub_scores=sub,
        rationale=rationale,
        prose_rationale=prose,
    )
