"""SQLAlchemy ORM models — mirrors of the TS types under Lovable/src/types/.

JSONB on Postgres, JSON on SQLite (so the in-memory test DB works without
a Postgres dependency). List/dict fields go in here to avoid join tables for
this hackathon MVP.
"""
from __future__ import annotations

from sqlalchemy import JSON, Boolean, Float, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base

# Cross-dialect JSON column: real JSONB in production, plain JSON in tests.
JsonCol = JSONB().with_variant(JSON(), "sqlite")


class Product(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    issuer: Mapped[str] = mapped_column(String, nullable=False)
    product_name: Mapped[str | None] = mapped_column(String, nullable=True)
    product_type: Mapped[str] = mapped_column(String, nullable=False)
    currency: Mapped[str] = mapped_column(String, nullable=False)
    notional: Mapped[float | None] = mapped_column(Float, nullable=True)
    tenor_years: Mapped[float | None] = mapped_column(Float, nullable=True)
    maturity_date: Mapped[str | None] = mapped_column(String, nullable=True)
    issue_date: Mapped[str | None] = mapped_column(String, nullable=True)
    coupon: Mapped[float | None] = mapped_column(Float, nullable=True)
    coupon_type: Mapped[str | None] = mapped_column(String, nullable=True)
    underlying: Mapped[list] = mapped_column(JsonCol, nullable=False, default=list)
    underlying_type: Mapped[str | None] = mapped_column(String, nullable=True)
    barrier: Mapped[float | None] = mapped_column(Float, nullable=True)
    protection_level: Mapped[float | None] = mapped_column(Float, nullable=True)
    capital_protection: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    autocall: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    autocall_frequency: Mapped[str | None] = mapped_column(String, nullable=True)
    autocall_trigger: Mapped[float | None] = mapped_column(Float, nullable=True)
    issuer_rating: Mapped[str | None] = mapped_column(String, nullable=True)
    liquidity: Mapped[str | None] = mapped_column(String, nullable=True)
    estimated_cost: Mapped[float | None] = mapped_column(Float, nullable=True)
    margin: Mapped[float | None] = mapped_column(Float, nullable=True)
    risk_level: Mapped[str | None] = mapped_column(String, nullable=True)
    source_type: Mapped[str | None] = mapped_column(String, nullable=True)
    source_reference: Mapped[str | None] = mapped_column(String, nullable=True)
    raw_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    ingested_at: Mapped[str] = mapped_column(String, nullable=False)
    confidence: Mapped[dict | None] = mapped_column(JsonCol, nullable=True)


class AssetManager(Base):
    __tablename__ = "asset_managers"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    firm: Mapped[str] = mapped_column(String, nullable=False)
    # Stored snake_case in DB; serialised as `avatarColor` to match the TS interface.
    avatar_color: Mapped[str] = mapped_column(String, nullable=False)
    strategy: Mapped[str] = mapped_column(String, nullable=False)
    risk_appetite: Mapped[str] = mapped_column(String, nullable=False)
    allowed_currencies: Mapped[list] = mapped_column(JsonCol, nullable=False, default=list)
    max_tenor_years: Mapped[float | None] = mapped_column(Float, nullable=True)
    min_issuer_rating: Mapped[str | None] = mapped_column(String, nullable=True)
    preferred_issuers: Mapped[list] = mapped_column(JsonCol, nullable=False, default=list)
    excluded_issuers: Mapped[list] = mapped_column(JsonCol, nullable=False, default=list)
    allowed_underlying_types: Mapped[list] = mapped_column(JsonCol, nullable=False, default=list)
    forbidden_underlyings: Mapped[list] = mapped_column(JsonCol, nullable=False, default=list)
    requires_capital_protection: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    max_barrier_risk: Mapped[float | None] = mapped_column(Float, nullable=True)
    target_yield_min: Mapped[float | None] = mapped_column(Float, nullable=True)
    liquidity_need: Mapped[str | None] = mapped_column(String, nullable=True)
    esg_constraints: Mapped[list] = mapped_column(JsonCol, nullable=False, default=list)
    current_exposures: Mapped[dict] = mapped_column(JsonCol, nullable=False, default=dict)
    aum_eur_m: Mapped[float] = mapped_column(Float, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)


class PurchaseHistory(Base):
    __tablename__ = "purchase_history"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    asset_manager_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    product_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    action: Mapped[str] = mapped_column(String, nullable=False)
    amount: Mapped[float | None] = mapped_column(Float, nullable=True)
    date: Mapped[str] = mapped_column(String, nullable=False)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)


class MarketView(Base):
    __tablename__ = "market_views"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    date: Mapped[str] = mapped_column(String, nullable=False)
    region: Mapped[str | None] = mapped_column(String, nullable=True)
    asset_class: Mapped[str | None] = mapped_column(String, nullable=True)
    rates_view: Mapped[str | None] = mapped_column(String, nullable=True)
    equity_view: Mapped[str | None] = mapped_column(String, nullable=True)
    volatility_view: Mapped[str | None] = mapped_column(String, nullable=True)
    credit_spread_view: Mapped[str | None] = mapped_column(String, nullable=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    author: Mapped[str] = mapped_column(String, nullable=False)
