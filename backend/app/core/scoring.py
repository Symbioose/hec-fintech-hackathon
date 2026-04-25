"""Sub-score and final-score functions.

Direct port of Lovable/src/lib/matchingMock.ts:78-142. The five sub-scores and
their weights are pinned to the frontend so backend ranks match the UI.

Weights:    0.25 semantic + 0.25 constraints + 0.20 yield_fit + 0.15 exposure_fit + 0.15 market_fit
Hard-fail:  multiply weighted total by 0.35 before rounding to int 0..100.
Rounding:   `math.floor(x + 0.5)` to match JavaScript's `Math.round` (ties → +∞).
"""
from __future__ import annotations

import math

from app.core.matching import APPETITE_RANK, RISK_RANK
from app.schemas.asset_manager import AssetManagerProfileSchema
from app.schemas.product import ProductSchema
from app.schemas.recommendation import SubScoresSchema


def _clamp01(x: float) -> float:
    return max(0.0, min(1.0, x))


def _js_round(x: float) -> int:
    """Match JavaScript's `Math.round`: round half toward +Infinity."""
    return math.floor(x + 0.5)


def _strategy_affinity(product: ProductSchema, strategy: str) -> float:
    """Mirror of matchingMock.ts:81-94."""
    if strategy == "defensive_income":
        return (0.95 if product.capital_protection else 0.35) * (
            1.0 if product.coupon else 0.7
        )
    if strategy == "balanced_income":
        return (
            0.55
            + (0.25 if product.product_type == "fixed_rate_note" else 0)
            + (0.1 if product.autocall else 0)
        )
    if strategy == "yield_enhancement":
        return 0.45 + (
            0.4 if product.product_type in ("autocallable", "reverse_convertible") else 0
        )
    if strategy == "capital_protection":
        return 0.92 if product.capital_protection else 0.2
    if strategy == "opportunistic":
        return 0.4 + (
            0.45 if product.product_type in ("autocallable", "reverse_convertible") else 0
        )
    if strategy == "esg_income":
        return 0.5 + (0.45 if any("esg" in u.lower() for u in product.underlying) else 0)
    return 0.5  # custom


def compute_semantic(product: ProductSchema, am: AssetManagerProfileSchema) -> float:
    if product.underlying_type:
        allowed = product.underlying_type in am.allowed_underlying_types
    else:
        allowed = True
    return _clamp01(_strategy_affinity(product, am.strategy) * (1.0 if allowed else 0.5))


def compute_constraints(product: ProductSchema, am: AssetManagerProfileSchema) -> float:
    score = 1.0
    if product.barrier and am.max_barrier_risk and product.barrier < am.max_barrier_risk:
        score -= 0.25
    if product.issuer in am.preferred_issuers:
        score = min(1.0, score + 0.15)
    return _clamp01(score)


def compute_yield_fit(product: ProductSchema, am: AssetManagerProfileSchema) -> float:
    target = am.target_yield_min if am.target_yield_min is not None else 0.0
    coupon = product.coupon if product.coupon is not None else 0.0
    if target == 0:
        return _clamp01(0.6)
    if coupon >= target:
        return _clamp01(0.7 + min(0.3, (coupon - target) * 4))
    return _clamp01(coupon / target * 0.6)


def compute_exposure_fit(product: ProductSchema, am: AssetManagerProfileSchema) -> float:
    bucket = product.underlying_type or "other"
    current = am.current_exposures.get(bucket, 0.0)
    return _clamp01(1.0 - current * 0.8)


def compute_market_fit(product: ProductSchema, am: AssetManagerProfileSchema) -> float:
    pr = RISK_RANK[product.risk_level] if product.risk_level else 2
    ar = APPETITE_RANK[am.risk_appetite]
    diff = pr - ar
    return _clamp01(1.0 - max(0, diff) * 0.3 - max(0, -diff) * 0.05)


def compute_sub_scores(
    product: ProductSchema, am: AssetManagerProfileSchema
) -> SubScoresSchema:
    return SubScoresSchema(
        semantic=compute_semantic(product, am),
        constraints=compute_constraints(product, am),
        yield_fit=compute_yield_fit(product, am),
        exposure_fit=compute_exposure_fit(product, am),
        market_fit=compute_market_fit(product, am),
    )


def compute_final_score(sub: SubScoresSchema, hard_fail: bool) -> int:
    weighted = (
        sub.semantic * 0.25
        + sub.constraints * 0.25
        + sub.yield_fit * 0.20
        + sub.exposure_fit * 0.15
        + sub.market_fit * 0.15
    )
    return _js_round((weighted * 0.35 if hard_fail else weighted) * 100)
