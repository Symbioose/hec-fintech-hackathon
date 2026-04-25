"""Read-only repo for asset-manager profiles."""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.db.models import AssetManager


def list_asset_managers(db: Session) -> list[AssetManager]:
    return db.query(AssetManager).order_by(AssetManager.id).all()


def get_asset_manager(db: Session, am_id: str) -> AssetManager | None:
    return db.query(AssetManager).filter(AssetManager.id == am_id).first()
