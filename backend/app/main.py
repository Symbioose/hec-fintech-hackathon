"""FastAPI application entry."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes_asset_managers import router as asset_managers_router
from app.api.routes_extract import router as extract_router
from app.api.routes_health import router as health_router
from app.api.routes_indices import router as indices_router
from app.api.routes_market_views import router as market_views_router
from app.api.routes_products import router as products_router
from app.api.routes_recommendations import router as recommendations_router
from app.api.routes_score import router as score_router
from app.config import settings
from app.core.embeddings import EmbeddingClient
from app.db import models  # noqa: F401  — registers ORM tables on Base.metadata
from app.db.seed import seed_if_empty
from app.db.session import Base, SessionLocal, engine, wait_for_db
from app.services.index_service import IndexRegistry

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s | %(message)s",
)
log = logging.getLogger("app.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Starting StructuredMatch backend")
    wait_for_db()
    if settings.reset_db:
        log.warning("RESET_DB=1 — dropping all tables")
        Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    log.info("DB schema ready")

    with SessionLocal() as db:
        seed_if_empty(db)

    embedding_client = EmbeddingClient()
    index_registry = IndexRegistry(dim=embedding_client.dim, faiss_dir=settings.faiss_dir)
    with SessionLocal() as db:
        index_registry.load_or_rebuild(db, embedding_client)

    # Optional Gemini client for Phase 5 prose explanations.
    gemini_client = None
    if settings.use_gemini:
        try:
            from google import genai

            gemini_client = genai.Client(api_key=settings.google_api_key)
            log.info("Gemini client initialised for prose explanations")
        except Exception as exc:  # noqa: BLE001
            log.warning("Failed to initialise Gemini client: %s", exc)

    app.state.embedding_client = embedding_client
    app.state.index_registry = index_registry
    app.state.gemini_client = gemini_client

    log.info(
        "Backend ready (embeddings=%s, prose=%s)",
        embedding_client.provider,
        "gemini" if gemini_client else "off",
    )
    yield
    log.info("Shutting down")


app = FastAPI(title="StructuredMatch Backend", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(extract_router)
app.include_router(products_router)
app.include_router(asset_managers_router)
app.include_router(market_views_router)
app.include_router(indices_router)
app.include_router(recommendations_router)
app.include_router(score_router)
