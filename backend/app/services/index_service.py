"""Builds and manages the five FAISS indices.

Five indices, one per object type:
    product, asset_manager, purchase_history, mandate_constraints, market_views
"""
from __future__ import annotations

import hashlib
import json
import logging
import threading
from pathlib import Path

from sqlalchemy.orm import Session

from app.core.canonical_text import (
    asset_manager_to_canonical_text,
    mandate_clause_to_canonical_texts,
    market_view_to_canonical_text,
    product_to_canonical_text,
    purchase_history_to_canonical_text,
)
from app.core.embeddings import EmbeddingClient
from app.core.faiss_store import FaissStore
from app.db.models import AssetManager, MarketView, Product, PurchaseHistory
from app.schemas.asset_manager import AssetManagerProfileSchema
from app.schemas.market_view import MarketViewSchema
from app.schemas.product import ProductSchema
from app.schemas.purchase_history import PurchaseHistoryItemSchema

log = logging.getLogger(__name__)

INDEX_NAMES: tuple[str, ...] = (
    "product",
    "asset_manager",
    "purchase_history",
    "mandate_constraints",
    "market_views",
)


class IndexRegistry:
    """Holds five FaissStore instances, persisted under {faiss_dir}/{name}/."""

    def __init__(self, dim: int, faiss_dir: str | Path):
        self.dim = dim
        self.root = Path(faiss_dir)
        self.lock = threading.Lock()
        self.stores: dict[str, FaissStore] = {
            name: FaissStore(dim=dim, path=self.root / name) for name in INDEX_NAMES
        }
        self._built = False

    def is_built(self) -> bool:
        return self._built

    def __getitem__(self, name: str) -> FaissStore:
        return self.stores[name]

    def counts(self) -> dict[str, int]:
        return {name: len(store) for name, store in self.stores.items()}

    # --- public API --------------------------------------------------------

    def load_or_rebuild(
        self,
        db: Session,
        embedding_client: EmbeddingClient,
    ) -> dict[str, int]:
        """Try to reuse persisted indices; rebuild if any hash mismatches."""
        hash_payload = self._build_hash(db, embedding_client)
        with self.lock:
            all_loaded = True
            for name, store in self.stores.items():
                if not store.load_if_matches({**hash_payload, "index": name}):
                    all_loaded = False
                    break
            if all_loaded:
                self._built = True
                log.info("Reusing persisted FAISS indices: %s", self.counts())
                return self.counts()
        return self.rebuild(db, embedding_client)

    def rebuild(self, db: Session, embedding_client: EmbeddingClient) -> dict[str, int]:
        """Drop and rebuild every index from current DB state. Persists to disk."""
        with self.lock:
            for store in self.stores.values():
                store.reset()

            products = db.query(Product).order_by(Product.id).all()
            ams = db.query(AssetManager).order_by(AssetManager.id).all()
            history = db.query(PurchaseHistory).order_by(PurchaseHistory.id).all()
            views = db.query(MarketView).order_by(MarketView.id).all()

            product_schemas = [ProductSchema.model_validate(p) for p in products]
            am_schemas = [AssetManagerProfileSchema.model_validate(a) for a in ams]
            history_schemas = [PurchaseHistoryItemSchema.model_validate(h) for h in history]
            view_schemas = [MarketViewSchema.model_validate(v) for v in views]

            product_map = {p.id: p for p in product_schemas}
            am_map = {a.id: a for a in am_schemas}

            # product
            self._populate(
                "product",
                texts=[product_to_canonical_text(p) for p in product_schemas],
                metas=[{"id": p.id, "type": "product"} for p in product_schemas],
                embedding_client=embedding_client,
            )

            # asset_manager
            self._populate(
                "asset_manager",
                texts=[asset_manager_to_canonical_text(a) for a in am_schemas],
                metas=[
                    {"id": a.id, "type": "asset_manager", "strategy": a.strategy}
                    for a in am_schemas
                ],
                embedding_client=embedding_client,
            )

            # purchase_history — skip orphaned rows
            history_texts: list[str] = []
            history_metas: list[dict] = []
            for h in history_schemas:
                p = product_map.get(h.product_id)
                a = am_map.get(h.asset_manager_id)
                if p is None or a is None:
                    log.warning("PurchaseHistory %s references missing product/AM — skipping", h.id)
                    continue
                history_texts.append(purchase_history_to_canonical_text(h, p, a))
                history_metas.append(
                    {
                        "id": h.id,
                        "asset_manager_id": h.asset_manager_id,
                        "product_id": h.product_id,
                        "action": h.action,
                        "type": "purchase_history",
                    }
                )
            self._populate(
                "purchase_history",
                texts=history_texts,
                metas=history_metas,
                embedding_client=embedding_client,
            )

            # mandate_constraints — one row per AM per soft clause
            mandate_texts: list[str] = []
            mandate_metas: list[dict] = []
            for a in am_schemas:
                for clause in mandate_clause_to_canonical_texts(a):
                    mandate_texts.append(clause)
                    mandate_metas.append(
                        {"asset_manager_id": a.id, "type": "mandate_clause"}
                    )
            self._populate(
                "mandate_constraints",
                texts=mandate_texts,
                metas=mandate_metas,
                embedding_client=embedding_client,
            )

            # market_views
            self._populate(
                "market_views",
                texts=[market_view_to_canonical_text(v) for v in view_schemas],
                metas=[{"id": v.id, "type": "market_view"} for v in view_schemas],
                embedding_client=embedding_client,
            )

            hash_payload = self._build_hash(db, embedding_client)
            for name, store in self.stores.items():
                store.save({**hash_payload, "index": name})

            self._built = True
            counts = self.counts()
            log.info("FAISS indices rebuilt: %s", counts)
            return counts

    # --- helpers -----------------------------------------------------------

    def _populate(
        self,
        name: str,
        texts: list[str],
        metas: list[dict],
        embedding_client: EmbeddingClient,
    ) -> None:
        if not texts:
            log.info("Index '%s' has no rows to embed", name)
            return
        vectors = embedding_client.embed_batch(texts)
        self.stores[name].add_batch(vectors, metas)

    def _build_hash(self, db: Session, embedding_client: EmbeddingClient) -> dict:
        product_ids = [p[0] for p in db.query(Product.id).order_by(Product.id).all()]
        am_ids = [a[0] for a in db.query(AssetManager.id).order_by(AssetManager.id).all()]
        history_ids = [
            h[0] for h in db.query(PurchaseHistory.id).order_by(PurchaseHistory.id).all()
        ]
        view_ids = [v[0] for v in db.query(MarketView.id).order_by(MarketView.id).all()]

        digest = hashlib.sha256(
            json.dumps(
                {"p": product_ids, "a": am_ids, "h": history_ids, "v": view_ids},
                sort_keys=True,
            ).encode("utf-8")
        ).hexdigest()
        return {
            "provider": embedding_client.provider,
            "model": embedding_client.model,
            "dim": self.dim,
            "version": FaissStore.VERSION,
            "row_id_hash": digest,
        }
