"""Read-only repo for market views."""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.db.models import MarketView


def list_market_views(db: Session) -> list[MarketView]:
    return db.query(MarketView).order_by(MarketView.date.desc(), MarketView.id).all()
