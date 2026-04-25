"""Build ranked recommendations for product↔AM matches.

Mirrors `recommendationsForProduct` and `recommendationsFor` at
Lovable/src/lib/matchingMock.ts:185-201: score every pair, sort by descending
final score. Hard-fail products are not filtered out — the frontend surfaces
them with their reduced score so the manager still sees what was screened.

Optionally accepts a ``prose_generator`` callable (Phase 5) that fills the
``prose_rationale`` field per recommendation. Pass ``None`` to skip prose
entirely (e.g., the bulk asset-manager endpoint, or when no Gemini key set).
"""
from __future__ import annotations

import logging
from collections.abc import Callable

from sqlalchemy.orm import Session

from app.core.explanation import build_rationale_bullets
from app.core.matching import passes_hard_constraints
from app.core.scoring import compute_final_score, compute_sub_scores
from app.db.models import AssetManager, Product
from app.schemas.asset_manager import AssetManagerProfileSchema
from app.schemas.product import ProductSchema
from app.schemas.recommendation import (
    RationaleBulletSchema,
    RecommendationSchema,
    SubScoresSchema,
)

log = logging.getLogger(__name__)

ProseGenerator = Callable[
    [
        ProductSchema,
        AssetManagerProfileSchema,
        SubScoresSchema,
        list[RationaleBulletSchema],
        list[str],
    ],
    str | None,
]


def _build_recommendation(
    product: ProductSchema,
    am: AssetManagerProfileSchema,
    prose_generator: ProseGenerator | None = None,
) -> RecommendationSchema:
    passes, reasons = passes_hard_constraints(product, am)
    sub = compute_sub_scores(product, am)
    score = compute_final_score(sub, hard_fail=not passes)
    rationale = build_rationale_bullets(product, am, reasons)
    prose = prose_generator(product, am, sub, rationale, reasons) if prose_generator else None
    return RecommendationSchema(
        id=f"R-{am.id}-{product.id}",
        product_id=product.id,
        asset_manager_id=am.id,
        score=score,
        hard_fail=not passes,
        hard_fail_reasons=reasons,
        sub_scores=sub,
        rationale=rationale,
        prose_rationale=prose,
    )


def recommend_for_product(
    db: Session,
    product_id: str,
    prose_generator: ProseGenerator | None = None,
) -> list[RecommendationSchema]:
    product_orm = db.query(Product).filter(Product.id == product_id).first()
    if product_orm is None:
        raise ValueError(f"Product {product_id} not found")
    product = ProductSchema.model_validate(product_orm)

    ams = db.query(AssetManager).order_by(AssetManager.id).all()
    am_schemas = [AssetManagerProfileSchema.model_validate(a) for a in ams]

    recs = [_build_recommendation(product, am, prose_generator) for am in am_schemas]
    return sorted(recs, key=lambda r: r.score, reverse=True)


def recommend_for_asset_manager(
    db: Session,
    am_id: str,
    prose_generator: ProseGenerator | None = None,
) -> list[RecommendationSchema]:
    am_orm = db.query(AssetManager).filter(AssetManager.id == am_id).first()
    if am_orm is None:
        raise ValueError(f"Asset manager {am_id} not found")
    am = AssetManagerProfileSchema.model_validate(am_orm)

    products = db.query(Product).order_by(Product.id).all()
    product_schemas = [ProductSchema.model_validate(p) for p in products]

    recs = [_build_recommendation(p, am, prose_generator) for p in product_schemas]
    return sorted(recs, key=lambda r: r.score, reverse=True)
