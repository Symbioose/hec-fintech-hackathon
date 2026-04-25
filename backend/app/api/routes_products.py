"""Read-only product routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.product import ProductSchema
from app.services import product_service

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=list[ProductSchema])
def list_products(db: Session = Depends(get_db)) -> list[ProductSchema]:
    return [ProductSchema.model_validate(p) for p in product_service.list_products(db)]


@router.get("/{product_id}", response_model=ProductSchema)
def get_product(product_id: str, db: Session = Depends(get_db)) -> ProductSchema:
    product = product_service.get_product(db, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail=f"Product {product_id} not found")
    return ProductSchema.model_validate(product)
