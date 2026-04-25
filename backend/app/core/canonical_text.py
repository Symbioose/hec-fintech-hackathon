"""Deterministic text representations of domain objects, used as embedding input.

Inputs are Pydantic schemas (not ORM rows) so this module is testable without
a DB and consistent regardless of where the data originates.
"""
from __future__ import annotations

from app.schemas.asset_manager import AssetManagerProfileSchema
from app.schemas.market_view import MarketViewSchema
from app.schemas.product import ProductSchema
from app.schemas.purchase_history import PurchaseHistoryItemSchema


def _fmt_decimal(x: float | None) -> str:
    return f"{x:.4f}" if x is not None else "n/a"


def _fmt_pct(x: float | None) -> str:
    return f"{x * 100:.2f}%" if x is not None else "n/a"


def _join(items: list[str] | None) -> str:
    return ", ".join(sorted(items)) if items else "none"


def product_to_canonical_text(p: ProductSchema) -> str:
    parts = [
        f"Structured product issued by {p.issuer}.",
        f"Product type: {p.product_type}.",
        f"Currency: {p.currency}.",
        f"Tenor: {_fmt_decimal(p.tenor_years)} years.",
        f"Coupon: {_fmt_pct(p.coupon)}.",
        f"Coupon type: {p.coupon_type or 'n/a'}.",
        f"Underlying: {_join(p.underlying)}.",
        f"Underlying type: {p.underlying_type or 'n/a'}.",
        f"Barrier: {_fmt_pct(p.barrier)}.",
        f"Capital protection: {p.capital_protection}.",
        f"Autocall: {p.autocall}.",
        f"Autocall frequency: {p.autocall_frequency or 'n/a'}.",
        f"Issuer rating: {p.issuer_rating or 'n/a'}.",
        f"Liquidity: {p.liquidity or 'n/a'}.",
        f"Risk level: {p.risk_level or 'n/a'}.",
    ]
    return " ".join(parts)


def asset_manager_to_canonical_text(am: AssetManagerProfileSchema) -> str:
    parts = [
        f"Asset manager profile: {am.name} at {am.firm}.",
        f"Strategy: {am.strategy}.",
        f"Risk appetite: {am.risk_appetite}.",
        f"Allowed currencies: {_join(am.allowed_currencies)}.",
        f"Maximum tenor: {_fmt_decimal(am.max_tenor_years)} years.",
        f"Minimum issuer rating: {am.min_issuer_rating or 'n/a'}.",
        f"Preferred issuers: {_join(am.preferred_issuers)}.",
        f"Excluded issuers: {_join(am.excluded_issuers)}.",
        f"Allowed underlying types: {_join(am.allowed_underlying_types)}.",
        f"Forbidden underlyings: {_join(am.forbidden_underlyings)}.",
        f"Requires capital protection: {am.requires_capital_protection}.",
        f"Max barrier risk: {_fmt_pct(am.max_barrier_risk)}.",
        f"Target yield min: {_fmt_pct(am.target_yield_min)}.",
        f"Liquidity need: {am.liquidity_need or 'n/a'}.",
        f"ESG constraints: {_join(am.esg_constraints)}.",
    ]
    return " ".join(parts)


def purchase_history_to_canonical_text(
    h: PurchaseHistoryItemSchema,
    p: ProductSchema,
    am: AssetManagerProfileSchema,
) -> str:
    return (
        f"Asset manager {am.name} previously {h.action} product "
        f"{p.product_name or p.id} on {h.date}. "
        f"Product type: {p.product_type}. "
        f"Currency: {p.currency}. "
        f"Tenor: {_fmt_decimal(p.tenor_years)} years. "
        f"Coupon: {_fmt_pct(p.coupon)}. "
        f"Risk level: {p.risk_level or 'n/a'}. "
        f"Reason: {h.reason or 'n/a'}. "
        f"Feedback: {h.feedback or 'n/a'}."
    )


def market_view_to_canonical_text(v: MarketViewSchema) -> str:
    parts = [
        f"Market view from {v.author} dated {v.date}.",
        f"Region: {v.region or 'n/a'}.",
        f"Asset class: {v.asset_class or 'n/a'}.",
        f"Rates view: {v.rates_view or 'n/a'}.",
        f"Equity view: {v.equity_view or 'n/a'}.",
        f"Volatility view: {v.volatility_view or 'n/a'}.",
        f"Credit spread view: {v.credit_spread_view or 'n/a'}.",
        f"Note: {v.text}",
    ]
    return " ".join(parts)


def mandate_clause_to_canonical_texts(am: AssetManagerProfileSchema) -> list[str]:
    """Emit one canonical sentence per soft-mandate clause for the given AM."""
    name = am.name
    clauses: list[str] = []
    if am.preferred_issuers:
        clauses.append(f"{name}'s mandate prefers issuers: {_join(am.preferred_issuers)}.")
    if am.target_yield_min is not None:
        clauses.append(
            f"{name}'s mandate targets a minimum yield of {_fmt_pct(am.target_yield_min)}."
        )
    if am.allowed_underlying_types:
        clauses.append(
            f"{name}'s mandate allows underlying types: {_join(am.allowed_underlying_types)}."
        )
    if am.forbidden_underlyings:
        clauses.append(
            f"{name}'s mandate forbids underlyings: {_join(am.forbidden_underlyings)}."
        )
    if am.requires_capital_protection:
        clauses.append(f"{name}'s mandate requires capital protection.")
    if am.max_barrier_risk is not None:
        clauses.append(
            f"{name}'s mandate caps barrier risk at {_fmt_pct(am.max_barrier_risk)}."
        )
    if am.esg_constraints:
        clauses.append(
            f"{name}'s mandate enforces ESG constraints: {_join(am.esg_constraints)}."
        )
    if am.liquidity_need:
        clauses.append(f"{name}'s mandate requires {am.liquidity_need} liquidity.")
    return clauses
