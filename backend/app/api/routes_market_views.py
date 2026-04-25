"""Read-only market-view routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.market_view import MarketViewSchema
from app.services import market_view_service

router = APIRouter(prefix="/market-views", tags=["market-views"])


@router.get("", response_model=list[MarketViewSchema])
def list_market_views(db: Session = Depends(get_db)) -> list[MarketViewSchema]:
    return [
        MarketViewSchema.model_validate(mv)
        for mv in market_view_service.list_market_views(db)
    ]
