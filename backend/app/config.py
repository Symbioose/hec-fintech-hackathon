"""Application settings loaded from environment / .env file."""
from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=("../.env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    database_url: str = "postgresql://postgres:postgres@localhost:5432/fintech"
    google_api_key: str = ""
    embedding_model: str = "gemini-embedding-2"
    embedding_dim: int = 768
    faiss_dir: str = "./storage/faiss"
    reset_db: bool = False
    cors_origins: str = "http://localhost:8080,http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def use_gemini(self) -> bool:
        return bool(self.google_api_key.strip())


settings = Settings()
