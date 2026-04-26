"""Seed sample data into Postgres on startup.

Reads from app/data/sample_*.json (refreshed via scripts/export_seed.ts).
Idempotent: only inserts into a table if it's empty.
"""
from __future__ import annotations

import json
import logging
from pathlib import Path

from sqlalchemy.orm import Session

from app.db.models import AssetManager, MarketView, Product, PurchaseHistory
from app.schemas.asset_manager import AssetManagerProfileSchema
from app.schemas.market_view import MarketViewSchema
from app.schemas.product import ProductSchema
from app.schemas.purchase_history import PurchaseHistoryItemSchema

log = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def _load_json(name: str) -> list[dict]:
    with (DATA_DIR / name).open() as f:
        return json.load(f)


def seed_if_empty(db: Session) -> dict[str, int]:
    """Insert sample rows where target tables are empty. Returns inserted counts."""
    inserted: dict[str, int] = {}

    if db.query(Product).count() == 0:
        products = [
            ProductSchema.model_validate(d) for d in _load_json("sample_products.json")
        ]
        db.add_all([Product(**p.model_dump()) for p in products])
        inserted["products"] = len(products)

    if db.query(AssetManager).count() == 0:
        ams = [
            AssetManagerProfileSchema.model_validate(d)
            for d in _load_json("sample_asset_managers.json")
        ]
        db.add_all([AssetManager(**a.model_dump()) for a in ams])
        inserted["asset_managers"] = len(ams)

    if db.query(PurchaseHistory).count() == 0:
        history = [
            PurchaseHistoryItemSchema.model_validate(d)
            for d in _load_json("sample_purchase_history.json")
        ]
        db.add_all([PurchaseHistory(**h.model_dump()) for h in history])
        inserted["purchase_history"] = len(history)

    if db.query(MarketView).count() == 0:
        views = [
            MarketViewSchema.model_validate(d) for d in _load_json("sample_market_views.json")
        ]
        db.add_all([MarketView(**v.model_dump()) for v in views])
        inserted["market_views"] = len(views)

    if inserted:
        db.commit()
        log.info("Seeded: %s", inserted)
    else:
        log.info("DB already populated — skipping seed")
    return inserted
