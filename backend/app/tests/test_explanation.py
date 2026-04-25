"""Rationale-bullet branches and prose-generator wiring."""
from __future__ import annotations

from unittest.mock import MagicMock

from app.core.explanation import (
    build_prose_prompt,
    build_rationale_bullets,
    generate_prose_rationale,
)
from app.schemas.asset_manager import AssetManagerProfileSchema
from app.schemas.product import ProductSchema
from app.schemas.recommendation import RationaleBulletSchema, SubScoresSchema


def _product(**overrides) -> ProductSchema:
    base = dict(
        id="P-1001",
        issuer="Bank Helios",
        product_type="autocallable",
        currency="EUR",
        underlying=["EuroStoxx 50"],
        underlying_type="equity_index",
        capital_protection=False,
        autocall=True,
        coupon=0.062,
        barrier=0.6,
        risk_level="medium_high",
        ingested_at="2026-04-21T08:32:00Z",
    )
    base.update(overrides)
    return ProductSchema(**base)


def _am(**overrides) -> AssetManagerProfileSchema:
    base = dict(
        id="AM-01",
        name="Test",
        firm="Test",
        avatarColor="primary",
        strategy="defensive_income",
        risk_appetite="low",
        allowed_currencies=["EUR"],
        preferred_issuers=[],
        excluded_issuers=[],
        allowed_underlying_types=["equity_index"],
        forbidden_underlyings=[],
        requires_capital_protection=False,
        esg_constraints=[],
        current_exposures={},
        aum_eur_m=1000.0,
        description="t",
        target_yield_min=0.04,
        max_barrier_risk=0.7,
    )
    base.update(overrides)
    return AssetManagerProfileSchema(**base)


def test_neutral_fallback_when_no_branches_fire():
    bullets = build_rationale_bullets(
        _product(
            issuer="Other Bank",
            capital_protection=False,
            coupon=0.01,
            barrier=0.9,
            underlying_type="other",  # disables the diversification-bonus branch
            risk_level="low",
        ),
        _am(
            preferred_issuers=[],
            requires_capital_protection=False,
            target_yield_min=0.04,
            max_barrier_risk=0.5,
            risk_appetite="high",
        ),
        hard_fail_reasons=[],
    )
    assert len(bullets) == 1
    assert bullets[0].kind == "neutral"


def test_blocker_per_hard_fail_reason():
    reasons = ["Currency USD not in mandate.", "Issuer X is excluded."]
    bullets = build_rationale_bullets(_product(), _am(), reasons)
    blockers = [b for b in bullets if b.kind == "blocker"]
    assert {b.text for b in blockers} == set(reasons)


def test_preferred_issuer_emits_positive():
    bullets = build_rationale_bullets(
        _product(),
        _am(preferred_issuers=["Bank Helios"]),
        hard_fail_reasons=[],
    )
    assert any(b.kind == "positive" and "preferred issuer" in b.text for b in bullets)


def test_barrier_warning_when_below_floor():
    bullets = build_rationale_bullets(
        _product(barrier=0.5),
        _am(max_barrier_risk=0.7),
        hard_fail_reasons=[],
    )
    assert any(b.kind == "warning" and "Barrier" in b.text for b in bullets)


# --- Prose generator -------------------------------------------------------


def _basic_args():
    p = _product()
    a = _am()
    s = SubScoresSchema(
        semantic=0.8, constraints=1.0, yield_fit=0.7, exposure_fit=0.9, market_fit=0.6
    )
    bullets = [RationaleBulletSchema(kind="positive", text="Coupon meets target.")]
    return p, a, s, bullets, []


def test_generate_prose_returns_none_when_no_client():
    p, a, s, b, r = _basic_args()
    assert generate_prose_rationale(p, a, s, b, r, client=None) is None


def test_generate_prose_calls_gemini_and_strips_text():
    p, a, s, b, r = _basic_args()
    fake_response = MagicMock()
    fake_response.text = "  This product is a strong fit because of the matching strategy.  "
    client = MagicMock()
    client.models.generate_content.return_value = fake_response

    result = generate_prose_rationale(p, a, s, b, r, client=client, model="gemini-test")

    assert result == "This product is a strong fit because of the matching strategy."
    client.models.generate_content.assert_called_once()
    call_kwargs = client.models.generate_content.call_args.kwargs
    assert call_kwargs["model"] == "gemini-test"
    assert "Asset manager profile" in call_kwargs["contents"]
    assert "Bank Helios" in call_kwargs["contents"]


def test_generate_prose_returns_none_on_exception():
    p, a, s, b, r = _basic_args()
    client = MagicMock()
    client.models.generate_content.side_effect = RuntimeError("boom")
    assert generate_prose_rationale(p, a, s, b, r, client=client) is None


def test_prose_prompt_contains_key_inputs():
    p, a, s, b, r = _basic_args()
    prompt = build_prose_prompt(p, a, s, b, ["mandate violated"])
    assert "Bank Helios" in prompt
    assert "defensive_income" in prompt
    assert "mandate violated" in prompt
    assert "Coupon meets target." in prompt
