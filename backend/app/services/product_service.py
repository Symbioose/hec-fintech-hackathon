"""Read-only repo for products."""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.db.models import Product


def list_products(db: Session) -> list[Product]:
    return db.query(Product).order_by(Product.id).all()


def get_product(db: Session, product_id: str) -> Product | None:
    return db.query(Product).filter(Product.id == product_id).first()
