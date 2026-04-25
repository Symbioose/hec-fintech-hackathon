"""Pydantic schema for Product — mirror of Lovable/src/types/product.ts:38-69."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict

ProductType = Literal[
    "autocallable",
    "reverse_convertible",
    "capital_protected_note",
    "credit_linked_note",
    "fixed_rate_note",
    "floating_rate_note",
    "range_accrual",
    "other",
]
CouponType = Literal["fixed", "floating", "conditional", "memory", "zero_coupon"]
UnderlyingType = Literal[
    "equity_index",
    "single_stock",
    "rates",
    "credit",
    "fx",
    "fund",
    "multi_asset",
    "other",
]
AutocallFrequency = Literal["monthly", "quarterly", "semi_annual", "annual"]
Liquidity = Literal["high", "medium", "low"]
RiskLevel = Literal["low", "medium", "medium_high", "high"]
SourceType = Literal["email", "pdf", "chat", "call", "manual", "csv"]


class ProductSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    issuer: str
    product_name: str | None = None
    product_type: ProductType
    currency: str
    notional: float | None = None
    tenor_years: float | None = None
    maturity_date: str | None = None
    issue_date: str | None = None
    coupon: float | None = None
    coupon_type: CouponType | None = None
    underlying: list[str] = []
    underlying_type: UnderlyingType | None = None
    barrier: float | None = None
    protection_level: float | None = None
    capital_protection: bool = False
    autocall: bool = False
    autocall_frequency: AutocallFrequency | None = None
    autocall_trigger: float | None = None
    issuer_rating: str | None = None
    liquidity: Liquidity | None = None
    estimated_cost: float | None = None
    margin: float | None = None
    risk_level: RiskLevel | None = None
    source_type: SourceType | None = None
    source_reference: str | None = None
    raw_text: str | None = None
    ingested_at: str
    confidence: dict[str, float] | None = None
