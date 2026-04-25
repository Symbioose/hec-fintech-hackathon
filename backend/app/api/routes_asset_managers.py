"""Read-only asset-manager routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.asset_manager import AssetManagerProfileSchema
from app.services import asset_manager_service

router = APIRouter(prefix="/asset-managers", tags=["asset-managers"])


@router.get("", response_model=list[AssetManagerProfileSchema])
def list_asset_managers(db: Session = Depends(get_db)) -> list[AssetManagerProfileSchema]:
    return [
        AssetManagerProfileSchema.model_validate(am)
        for am in asset_manager_service.list_asset_managers(db)
    ]


@router.get("/{am_id}", response_model=AssetManagerProfileSchema)
def get_asset_manager(am_id: str, db: Session = Depends(get_db)) -> AssetManagerProfileSchema:
    am = asset_manager_service.get_asset_manager(db, am_id)
    if am is None:
        raise HTTPException(status_code=404, detail=f"Asset manager {am_id} not found")
    return AssetManagerProfileSchema.model_validate(am)
