# StructuredMatch Backend — Phases 1–5

FastAPI backend that mirrors the scoring algorithm in `frontend/src/lib/matchingMock.ts` field-for-field. **The frontend is the source of truth for the matching algorithm — any divergence here is a bug.**

## Local development

```bash
# 1. Configure
cp ../.env.example ../.env   # fill in GOOGLE_API_KEY later if you want; mock embeddings work without it

# 2. Postgres only (run uvicorn locally for hot reload)
docker compose up -d postgres
cd backend
pip install -e ".[dev]"
uvicorn app.main:app --reload

# OR full stack via Docker
docker compose up
```

## Smoke test

```bash
curl http://localhost:8000/health
# → {"status":"ok","embedding_provider":"mock","indices_built":false,"db":"connected"}
```

`embedding_provider` flips to `"gemini"` once `GOOGLE_API_KEY` is set in `.env` and the backend restarts.

## Refresh seed data from the frontend mocks (Phase 2)

```bash
cd backend
npx tsx scripts/export_mocks.ts
```

This re-emits `app/data/sample_*.json` from `../frontend/src/mocks/*.ts`. Run whenever the frontend mocks change.

## Regenerate the scoring fixture (Phase 4)

```bash
cd backend
npx tsx scripts/golden_scores.ts
pytest -k golden -v
```

The golden fixture asserts the Python scorer produces the same `(score, hard_fail, sub_scores, rationale)` as `matchingMock.ts` for every (product, AM) pair.

## Tests

```bash
cd backend
pytest
```
