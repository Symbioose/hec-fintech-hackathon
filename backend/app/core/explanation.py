"""Rule-based rationale bullets + optional Gemini prose.

``build_rationale_bullets`` is a direct port of
Lovable/src/lib/matchingMock.ts:144-171 (branch-for-branch: positive matches,
warnings, blocker per hard-fail reason, neutral fallback).

``generate_prose_rationale`` is the Phase 5 addition: when a Gemini client is
provided it returns a one-paragraph prose explanation (additive to the
bullets). The caller is responsible for passing ``None`` when the API key is
absent — the function then short-circuits to ``None``.
"""
from __future__ import annotations

import json
import logging

from app.core.matching import APPETITE_RANK, RISK_RANK
from app.schemas.asset_manager import AssetManagerProfileSchema
from app.schemas.product import ProductSchema
from app.schemas.recommendation import RationaleBulletSchema, SubScoresSchema

log = logging.getLogger(__name__)


def build_rationale_bullets(
    product: ProductSchema,
    am: AssetManagerProfileSchema,
    hard_fail_reasons: list[str],
) -> list[RationaleBulletSchema]:
    bullets: list[RationaleBulletSchema] = []
    coupon = product.coupon or 0.0
    target = am.target_yield_min or 0.0
    bucket = product.underlying_type or "other"
    current = am.current_exposures.get(bucket, 0.0)

    if product.issuer in am.preferred_issuers:
        bullets.append(
            RationaleBulletSchema(
                kind="positive",
                text=f"{product.issuer} is a preferred issuer for this mandate.",
            )
        )
    if product.capital_protection and am.requires_capital_protection:
        bullets.append(
            RationaleBulletSchema(
                kind="positive",
                text="100% capital protection matches mandate requirement.",
            )
        )
    if coupon >= target and target > 0:
        bullets.append(
            RationaleBulletSchema(
                kind="positive",
                text=(
                    f"Coupon of {coupon * 100:.2f}% meets target yield of "
                    f"{target * 100:.2f}%."
                ),
            )
        )
    if current < 0.2 and bucket != "other":
        bullets.append(
            RationaleBulletSchema(
                kind="positive",
                text=(
                    f"Underweight in {bucket.replace('_', ' ')} "
                    f"({current * 100:.0f}%) — adds diversification."
                ),
            )
        )
    if product.barrier and am.max_barrier_risk and product.barrier < am.max_barrier_risk:
        bullets.append(
            RationaleBulletSchema(
                kind="warning",
                text=(
                    f"Barrier at {product.barrier * 100:.0f}% is more aggressive than "
                    f"mandate floor ({am.max_barrier_risk * 100:.0f}%)."
                ),
            )
        )
    pr = RISK_RANK[product.risk_level] if product.risk_level else 2
    ar = APPETITE_RANK[am.risk_appetite]
    if pr > ar:
        bullets.append(
            RationaleBulletSchema(
                kind="warning",
                text=(
                    f'Risk level "{product.risk_level}" sits above mandate appetite '
                    f'"{am.risk_appetite}".'
                ),
            )
        )
    bullets.extend(RationaleBulletSchema(kind="blocker", text=r) for r in hard_fail_reasons)
    if not bullets:
        bullets.append(
            RationaleBulletSchema(
                kind="neutral",
                text="Product matches the mandate on all checked dimensions.",
            )
        )
    return bullets


# --- Optional Gemini prose -------------------------------------------------


def build_prose_prompt(
    product: ProductSchema,
    am: AssetManagerProfileSchema,
    sub_scores: SubScoresSchema,
    bullets: list[RationaleBulletSchema],
    hard_fail_reasons: list[str],
) -> str:
    """Build the prompt for the prose rationale (codex Section 13.2 shape)."""
    return (
        "You are an investment assistant for structured products.\n\n"
        "Generate a concise (2–3 sentences) investment rationale for the "
        "recommendation below. Plain English, no bullet points, no JSON.\n\n"
        f"Asset manager profile:\n{am.model_dump_json(indent=2)}\n\n"
        f"Product:\n{product.model_dump_json(indent=2)}\n\n"
        f"Sub-scores (0..1):\n{sub_scores.model_dump_json(indent=2)}\n\n"
        f"Hard-constraint violations: "
        f"{json.dumps(hard_fail_reasons) if hard_fail_reasons else 'none'}\n\n"
        f"Existing rule-based bullets: {json.dumps([b.text for b in bullets])}\n"
    )


def generate_prose_rationale(
    product: ProductSchema,
    am: AssetManagerProfileSchema,
    sub_scores: SubScoresSchema,
    bullets: list[RationaleBulletSchema],
    hard_fail_reasons: list[str],
    client,
    model: str = "gemini-2.5-flash",
) -> str | None:
    """Call Gemini's ``generate_content`` and return one paragraph, or ``None``.

    A ``None`` client (no ``GOOGLE_API_KEY``) returns ``None`` immediately so the
    caller can wire this in unconditionally and let the demo run offline.
    """
    if client is None:
        return None
    prompt = build_prose_prompt(product, am, sub_scores, bullets, hard_fail_reasons)
    try:
        response = client.models.generate_content(model=model, contents=prompt)
    except Exception as exc:  # noqa: BLE001
        log.warning("Gemini prose generation failed: %s", exc)
        return None
    text = (getattr(response, "text", "") or "").strip()
    return text or None
