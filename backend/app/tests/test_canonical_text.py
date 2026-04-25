"""Canonical-text functions are deterministic and contain key fields."""
from __future__ import annotations

from app.core.canonical_text import (
    asset_manager_to_canonical_text,
    mandate_clause_to_canonical_texts,
    market_view_to_canonical_text,
    product_to_canonical_text,
    purchase_history_to_canonical_text,
)
from app.schemas.asset_manager import AssetManagerProfileSchema
from app.schemas.market_view import MarketViewSchema
from app.schemas.product import ProductSchema
from app.schemas.purchase_history import PurchaseHistoryItemSchema


def _sample_product() -> ProductSchema:
    return ProductSchema(
        id="P-1001",
        issuer="Bank Helios",
        product_name="EUR Autocallable SX5E 5Y",
        product_type="autocallable",
        currency="EUR",
        tenor_years=5.0,
        coupon=0.062,
        coupon_type="conditional",
        underlying=["EuroStoxx 50"],
        underlying_type="equity_index",
        barrier=0.6,
        capital_protection=False,
        autocall=True,
        autocall_frequency="quarterly",
        issuer_rating="A",
        liquidity="medium",
        risk_level="medium_high",
        ingested_at="2026-04-21T08:32:00Z",
    )


def _sample_am() -> AssetManagerProfileSchema:
    return AssetManagerProfileSchema(
        id="AM-01",
        name="Aurelia Capital",
        firm="Aurelia Capital Partners",
        avatarColor="primary",
        strategy="defensive_income",
        risk_appetite="low",
        allowed_currencies=["EUR", "CHF"],
        max_tenor_years=5.0,
        min_issuer_rating="A",
        preferred_issuers=["Crédit Atlantique"],
        excluded_issuers=["Banco Iberia"],
        allowed_underlying_types=["rates", "credit"],
        forbidden_underlyings=["AAPL US"],
        requires_capital_protection=True,
        target_yield_min=0.025,
        liquidity_need="medium",
        esg_constraints=["no_controversial_weapons"],
        current_exposures={"rates": 0.5},
        aum_eur_m=1850.0,
        description="Defensive credit",
    )


def test_product_text_deterministic():
    p = _sample_product()
    assert product_to_canonical_text(p) == product_to_canonical_text(p)
    assert "Bank Helios" in product_to_canonical_text(p)
    assert "autocallable" in product_to_canonical_text(p)
    # 6.2% coupon formatted as percentage
    assert "6.20%" in product_to_canonical_text(p)


def test_asset_manager_text_deterministic():
    am = _sample_am()
    text = asset_manager_to_canonical_text(am)
    assert text == asset_manager_to_canonical_text(am)
    assert "Aurelia Capital" in text
    assert "defensive_income" in text
    # Lists are sorted for stability
    assert "CHF, EUR" in text


def test_purchase_history_text():
    h = PurchaseHistoryItemSchema(
        id="PH-1",
        asset_manager_id="AM-01",
        product_id="P-1001",
        action="bought",
        amount=5_000_000,
        date="2026-02-12",
        feedback="Good fit.",
    )
    text = purchase_history_to_canonical_text(h, _sample_product(), _sample_am())
    assert "previously bought" in text
    assert "EUR Autocallable SX5E 5Y" in text


def test_market_view_text():
    v = MarketViewSchema(
        id="MV-1",
        date="2026-04-22",
        region="Europe",
        asset_class="rates",
        rates_view="down",
        text="ECB cuts priced for Q3.",
        author="Macro Desk",
    )
    text = market_view_to_canonical_text(v)
    assert "Macro Desk" in text
    assert "ECB cuts priced" in text


def test_mandate_clauses_emits_per_constraint():
    am = _sample_am()
    clauses = mandate_clause_to_canonical_texts(am)
    assert any("prefers issuers" in c for c in clauses)
    assert any("targets a minimum yield" in c for c in clauses)
    assert any("requires capital protection" in c for c in clauses)
    assert any("forbids underlyings" in c for c in clauses)
