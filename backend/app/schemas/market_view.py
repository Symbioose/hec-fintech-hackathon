"""Pydantic schema for MarketView — mirror of Lovable/src/types/marketView.ts."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict

RatesView = Literal["up", "down", "stable", "uncertain"]
EquityView = Literal["bullish", "bearish", "neutral", "volatile"]
VolatilityView = Literal["low", "medium", "high"]
CreditSpreadView = Literal["tightening", "widening", "stable"]


class MarketViewSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    date: str
    region: str | None = None
    asset_class: str | None = None
    rates_view: RatesView | None = None
    equity_view: EquityView | None = None
    volatility_view: VolatilityView | None = None
    credit_spread_view: CreditSpreadView | None = None
    text: str
    author: str
