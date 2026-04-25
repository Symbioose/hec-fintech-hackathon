"""Hard-constraint logic and rank tables.

Direct port of Lovable/src/lib/matchingMock.ts:9-74 — backend ranks must match
frontend ranks, so the constants and predicates live in lock-step.
"""
from __future__ import annotations

from app.schemas.asset_manager import AssetManagerProfileSchema
from app.schemas.product import ProductSchema

RATING_RANK: dict[str, int] = {
    "AAA": 10,
    "AA+": 9,
    "AA": 8,
    "AA-": 7,
    "A+": 6,
    "A": 5,
    "A-": 4,
    "BBB+": 3,
    "BBB": 2,
    "BBB-": 1,
    "BB": 0,
}

RISK_RANK: dict[str, int] = {
    "low": 1,
    "medium": 2,
    "medium_high": 3,
    "high": 4,
}

APPETITE_RANK: dict[str, int] = {
    "low": 1,
    "medium": 2,
    "medium_high": 3,
    "high": 4,
}


def rating_meets(product_rating: str | None, min_rating: str | None) -> bool:
    """Mirror of matchingMock.ts:37-43."""
    if not min_rating:
        return True
    if not product_rating:
        return False
    p = RATING_RANK.get(product_rating, -1)
    m = RATING_RANK.get(min_rating, -1)
    return p >= m


def _num(x: float | int) -> str:
    """Format a number to match JavaScript's `Number.prototype.toString()`.

    JS prints integer-valued floats without a decimal (`5`, not `5.0`); Python's
    default `str(5.0)` is `'5.0'`. Match JS so hard-fail messages compare equal
    to the frontend's strings character-for-character.
    """
    if isinstance(x, float) and x.is_integer():
        return str(int(x))
    return str(x)


def passes_hard_constraints(
    product: ProductSchema, am: AssetManagerProfileSchema
) -> tuple[bool, list[str]]:
    """Mirror of matchingMock.ts:50-74. Returns (passes, reasons)."""
    reasons: list[str] = []

    if product.currency not in am.allowed_currencies:
        reasons.append(
            f"Currency {product.currency} not in mandate "
            f"({', '.join(am.allowed_currencies)})."
        )
    if product.issuer in am.excluded_issuers:
        reasons.append(f"Issuer {product.issuer} is excluded by mandate.")
    if am.requires_capital_protection and not product.capital_protection:
        reasons.append("Mandate requires capital protection — product is not protected.")
    if am.max_tenor_years and product.tenor_years and product.tenor_years > am.max_tenor_years:
        reasons.append(
            f"Tenor {_num(product.tenor_years)}y exceeds max {_num(am.max_tenor_years)}y."
        )
    if not rating_meets(product.issuer_rating, am.min_issuer_rating):
        reasons.append(
            f"Issuer rating {product.issuer_rating or 'n/a'} below minimum "
            f"{am.min_issuer_rating}."
        )
    forbidden_hit = next(
        (u for u in product.underlying if u in am.forbidden_underlyings), None
    )
    if forbidden_hit:
        reasons.append(f"Underlying {forbidden_hit} is forbidden by mandate.")

    return len(reasons) == 0, reasons
