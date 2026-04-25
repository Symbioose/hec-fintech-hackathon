"""Pydantic schemas for Recommendation, SubScores, RationaleBullet.

Mirror of Lovable/src/types/recommendation.ts. The optional `prose_rationale`
field is additive — populated by the Phase 5 Gemini-based explainer when
GOOGLE_API_KEY is set; absent otherwise so the existing frontend contract
(rationale: RationaleBullet[]) is unchanged.
"""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict

RationaleKind = Literal["positive", "neutral", "warning", "blocker"]


class SubScoresSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    semantic: float
    constraints: float
    yield_fit: float
    exposure_fit: float
    market_fit: float


class RationaleBulletSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    kind: RationaleKind
    text: str


class RecommendationSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    product_id: str
    asset_manager_id: str
    score: int  # 0..100
    hard_fail: bool
    hard_fail_reasons: list[str] = []
    sub_scores: SubScoresSchema
    rationale: list[RationaleBulletSchema]
    prose_rationale: str | None = None
