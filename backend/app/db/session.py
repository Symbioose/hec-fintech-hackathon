"""SQLAlchemy engine, session factory, and DB readiness helpers."""
from __future__ import annotations

import logging
import time

from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

log = logging.getLogger(__name__)


class Base(DeclarativeBase):
    pass


engine = create_engine(settings.database_url, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def wait_for_db(max_attempts: int = 5, delay_seconds: float = 2.0) -> None:
    """Block until Postgres accepts a connection.

    Useful in docker-compose where the backend container may start before
    Postgres is fully ready, even with a healthcheck (race window during exec).
    """
    last_error: Exception | None = None
    for attempt in range(1, max_attempts + 1):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            log.info("Database connection established (attempt %d)", attempt)
            return
        except OperationalError as exc:
            last_error = exc
            log.warning("DB connect attempt %d/%d failed", attempt, max_attempts)
            time.sleep(delay_seconds)
    raise RuntimeError(f"Database unreachable after {max_attempts} attempts: {last_error}")
