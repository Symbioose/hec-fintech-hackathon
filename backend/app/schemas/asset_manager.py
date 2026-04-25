"""Pydantic schema for AssetManagerProfile — mirror of Lovable/src/types/assetManager.ts:13-35.

Note: The TS interface uses `avatarColor` (camelCase) — every other field is snake_case.
We alias it so JSON wire format matches the frontend exactly.
"""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Strategy = Literal[
    "defensive_income",
    "balanced_income",
    "yield_enhancement",
    "capital_protection",
    "opportunistic",
    "esg_income",
    "custom",
]
RiskAppetite = Literal["low", "medium", "medium_high", "high"]
LiquidityNeed = Literal["low", "medium", "high"]


class AssetManagerProfileSchema(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
    )

    id: str
    name: str
    firm: str
    avatar_color: str = Field(alias="avatarColor", serialization_alias="avatarColor")
    strategy: Strategy
    risk_appetite: RiskAppetite
    allowed_currencies: list[str]
    max_tenor_years: float | None = None
    min_issuer_rating: str | None = None
    preferred_issuers: list[str] = []
    excluded_issuers: list[str] = []
    allowed_underlying_types: list[str] = []
    forbidden_underlyings: list[str] = []
    requires_capital_protection: bool = False
    max_barrier_risk: float | None = None
    target_yield_min: float | None = None
    liquidity_need: LiquidityNeed | None = None
    esg_constraints: list[str] = []
    current_exposures: dict[str, float] = {}
    aum_eur_m: float
    description: str
