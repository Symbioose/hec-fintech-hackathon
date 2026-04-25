"""Hard-constraint unit tests."""
from __future__ import annotations

from app.core.matching import passes_hard_constraints, rating_meets
from app.schemas.asset_manager import AssetManagerProfileSchema
from app.schemas.product import ProductSchema


def _product(**overrides) -> ProductSchema:
    base = dict(
        id="P-X",
        issuer="Bank A",
        product_type="autocallable",
        currency="EUR",
        underlying=["EuroStoxx 50"],
        underlying_type="equity_index",
        capital_protection=False,
        autocall=True,
        ingested_at="2026-04-21T08:32:00Z",
    )
    base.update(overrides)
    return ProductSchema(**base)


def _am(**overrides) -> AssetManagerProfileSchema:
    base = dict(
        id="AM-X",
        name="Test",
        firm="Test",
        avatarColor="primary",
        strategy="defensive_income",
        risk_appetite="low",
        allowed_currencies=["EUR"],
        preferred_issuers=[],
        excluded_issuers=[],
        allowed_underlying_types=["equity_index", "rates"],
        forbidden_underlyings=[],
        requires_capital_protection=False,
        esg_constraints=[],
        current_exposures={},
        aum_eur_m=1000.0,
        description="t",
    )
    base.update(overrides)
    return AssetManagerProfileSchema(**base)


def test_currency_mismatch_blocks():
    ok, reasons = passes_hard_constraints(_product(currency="USD"), _am())
    assert ok is False
    assert any("Currency USD" in r for r in reasons)


def test_excluded_issuer_blocks():
    ok, reasons = passes_hard_constraints(_product(), _am(excluded_issuers=["Bank A"]))
    assert ok is False
    assert any("excluded" in r for r in reasons)


def test_capital_protection_required_but_missing_blocks():
    ok, reasons = passes_hard_constraints(
        _product(capital_protection=False),
        _am(requires_capital_protection=True),
    )
    assert ok is False
    assert any("capital protection" in r for r in reasons)


def test_tenor_exceeds_cap_blocks():
    ok, reasons = passes_hard_constraints(
        _product(tenor_years=8.0),
        _am(max_tenor_years=5.0),
    )
    assert ok is False
    assert any("Tenor 8y exceeds max 5y" in r for r in reasons)


def test_rating_below_minimum_blocks():
    ok, reasons = passes_hard_constraints(
        _product(issuer_rating="BBB"),
        _am(min_issuer_rating="A"),
    )
    assert ok is False
    assert any("rating" in r for r in reasons)


def test_forbidden_underlying_blocks():
    ok, reasons = passes_hard_constraints(
        _product(underlying=["AAPL US"]),
        _am(forbidden_underlyings=["AAPL US"]),
    )
    assert ok is False
    assert any("forbidden" in r for r in reasons)


def test_clean_pass():
    ok, reasons = passes_hard_constraints(
        _product(issuer_rating="A", tenor_years=4.0, capital_protection=True),
        _am(
            min_issuer_rating="A-",
            max_tenor_years=5.0,
            requires_capital_protection=True,
        ),
    )
    assert ok is True
    assert reasons == []


def test_rating_meets_no_minimum_set():
    assert rating_meets("BBB", None) is True


def test_rating_meets_missing_product_rating_when_min_set():
    assert rating_meets(None, "A") is False


def test_rating_meets_inclusive():
    assert rating_meets("A", "A") is True


def test_rating_meets_unknown_rating_treated_as_below_minimum():
    assert rating_meets("ZZZ", "A") is False
