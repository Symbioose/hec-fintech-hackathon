"""Test fixtures: SQLite in-memory DB + FastAPI TestClient.

Uses SQLite (not Postgres) for speed and isolation. JSONB columns degrade to
TEXT/JSON on SQLite — fine for hackathon-grade tests.
"""
from __future__ import annotations

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_db
from app.db import models  # noqa: F401
from app.db.seed import seed_if_empty
from app.db.session import Base
from app.main import app


@pytest.fixture(scope="session")
def test_engine():
    # StaticPool keeps the same connection across sessions so the in-memory
    # SQLite DB created by one session is visible to the next.
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        future=True,
    )
    Base.metadata.create_all(engine)
    return engine


@pytest.fixture(scope="session")
def TestSessionLocal(test_engine):  # noqa: N802
    return sessionmaker(bind=test_engine, autoflush=False, autocommit=False, future=True)


@pytest.fixture(scope="session", autouse=True)
def _seed(TestSessionLocal):  # noqa: N803
    with TestSessionLocal() as db:
        seed_if_empty(db)


@pytest.fixture()
def client(TestSessionLocal) -> Generator[TestClient, None, None]:  # noqa: N803
    def _override_get_db():
        db = TestSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = _override_get_db
    # NOT using `with TestClient(...)` — that would trigger the production
    # lifespan (Postgres + RESET_DB + seed + FAISS rebuild). Tests use the
    # SQLite engine via the dependency override instead.
    test_client = TestClient(app, raise_server_exceptions=True)
    try:
        yield test_client
    finally:
        app.dependency_overrides.clear()
