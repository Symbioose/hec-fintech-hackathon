"""Schemas for the /extract endpoint.

Mirror of ExtractedProduct in Lovable/src/lib/gemini.ts — same field names,
same nullable semantics. `confidence` maps each field name to a 0–1 score.
"""
from __future__ import annotations

from pydantic import BaseModel


class RawTextIn(BaseModel):
    text: str


class ExtractedProductOut(BaseModel):
    issuer: str | None = None
    product_name: str | None = None
    product_type: str | None = None
    currency: str | None = None
    tenor_years: float | None = None
    coupon: float | None = None
    coupon_type: str | None = None
    underlying: list[str] = []
    underlying_type: str | None = None
    barrier: float | None = None
    capital_protection: bool = False
    autocall: bool = False
    issuer_rating: str | None = None
    risk_level: str | None = None
    notional: float | None = None
    maturity_date: str | None = None
    confidence: dict[str, float] = {}
