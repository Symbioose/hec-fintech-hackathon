# Webi — Structured Products Copilot

AI-powered deal flow engine for asset managers receiving structured product proposals from banks. Ingests raw bank emails and Bloomberg chats, extracts every product into a typed schema via **Gemini 2.0 Flash**, scores it against the fund's investment mandate, and surfaces only the deals that matter — ranked, explained, and ready to negotiate.

---

## Architecture

```
Bank email / Bloomberg chat / PDF
        │
        ▼
┌─────────────────────────────────┐
│  POST /extract                  │  Gemini 2.0 Flash — server-side
│  Structured JSON extraction     │  responseMimeType: application/json
│  + per-field confidence scores  │  backend/app/api/routes_extract.py
└──────────────┬──────────────────┘
               ▼
┌─────────────────────────────────┐
│  Hard filter engine             │  Currency · Rating · ESG · Tenor
│  + 5-dimension weighted score   │  Seniority · Forbidden underlyings
│  (deterministic, auditable)     │  backend/app/core/scoring.py
└──────────────┬──────────────────┘
               ├── MATCH (≥78)     → IC Note · PDF export
               ├── NEAR-MISS (50–77) → Negotiation recs · Counter-offer (Gemini)
               └── REJECT (<50)   → Compliance log
               ▼
┌─────────────────────────────────┐
│  POST /recommendations/score    │  Gemini prose rationale
│  Narrative explanation          │  with_prose=true → Gemini 2.0 Flash
│  per (product, mandate) pair    │  backend/app/api/routes_score.py
└─────────────────────────────────┘
```

---

## Stack

**Frontend** — `Lovable/`
- React 18 · Vite 5 · TypeScript 5
- TanStack Query · React Router v6 · Sonner
- JetBrains Mono · terminal dark design system

**Backend** — `backend/`
- FastAPI · Pydantic v2 · SQLAlchemy · Python 3.11
- PostgreSQL · FAISS (IndexFlatIP, cosine similarity)
- Google Gemini API (`gemini-2.0-flash` · `gemini-embedding-2` 768-dim)
- Docker Compose

---

## Quickstart

### Frontend only (no backend required)

```bash
cd Lovable
npm install
npm run dev
# → http://localhost:8080
```

Log in with any email + password — signs in as **François Martin (Carmignac Credit Fund A, EUR 1.24B AUM, UCITS Article 8 SFDR)**.

To enable Gemini features (live extraction + AI counter-offer drafting):

```bash
# Lovable/.env.local
VITE_GEMINI_API_KEY=your_google_api_key
```

### Full stack

```bash
# 1. Start Postgres
docker compose up -d postgres

# 2. Start backend
cd backend
pip install -e ".[dev]"
GOOGLE_API_KEY=your_key uvicorn app.main:app --reload
# → http://localhost:8000

# 3. Start frontend
cd ../Lovable
npm run dev
```

Health check:

```bash
curl http://localhost:8000/health
# {"status":"ok","embedding_provider":"gemini","indices_built":true,"prose_available":true}
```

---

## API

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Backend status · embedding provider · FAISS index state |
| `POST` | `/extract` | Gemini JSON extraction from raw text. Returns `ExtractedProductOut` + confidence map. 503 if no `GOOGLE_API_KEY`. |
| `POST` | `/recommendations/score` | Stateless scoring. Body: `{ product, am, with_prose }`. Returns `RecommendationSchema` with optional Gemini prose. |
| `POST` | `/recommendations/product/{id}` | Score one product against all seeded AMs |
| `POST` | `/recommendations/asset-manager/{id}` | Score all products for one AM. `?with_prose=true` adds Gemini rationale. |
| `GET` | `/products` | List seeded products |
| `GET` | `/asset-managers` | List seeded AM profiles |
| `GET` | `/market-views` | PM house views |
| `POST` | `/indices/rebuild` | Force-rebuild FAISS indices |

---

## Scoring model

Hard filters applied first — any failure sets `hard_fail=true` and multiplies weighted score by **0.35**:

- Currency in mandate's allowed list
- Issuer not in exclusion list
- Capital protection present if required
- Tenor ≤ mandate cap
- Issuer rating ≥ minimum (S&P worst-of)
- No forbidden underlyings (ESG exclusions)

Weighted sub-scores (0–1):

```
semantic        × 0.25  — strategy-affinity × underlying-type allowance
constraints     × 0.25  — barrier floor · preferred issuer bonus
yield_fit       × 0.20  — coupon vs target yield
exposure_fit    × 0.15  — rewards underweight portfolio buckets
market_fit      × 0.15  — product risk level vs AM risk appetite
```

Buckets: **MATCH** ≥ 78 · **NEAR-MISS** 50–77 · **REJECT** < 50 or hard_fail

Frontend (`src/lib/matchingMock.ts`) and backend (`backend/app/core/scoring.py`) are kept in sync by **180 golden-fixture assertions**.

---

## AI integration

| Feature | Path | Implementation |
|---|---|---|
| Server-side extraction | `POST /extract` | Gemini 2.0 Flash · `response_mime_type: application/json` · 17-field schema + confidence |
| Client-side extraction fallback | `src/lib/gemini.ts` | Same schema · fires if backend offline |
| Regex fallback | `src/lib/extractionMock.ts` | Always works offline |
| Prose rationale | `POST /recommendations/score` | Gemini generates 2–3 sentence narrative per (product, mandate) pair |
| Counter-offer email | `src/lib/gemini.ts` | `generateAICounterOffer()` — contextual email grounded on mandate gaps |
| IC Note exec summary | `src/lib/gemini.ts` | `generateAIExecSummary()` — formal IC memorandum opening paragraph |
| Embeddings | `backend/app/core/embeddings.py` | `gemini-embedding-2` 768-dim L2-normalized · FAISS IndexFlatIP · md5-mock fallback |

Extraction priority chain (Inbox):
1. `POST /extract` — Gemini server-side (requires `GOOGLE_API_KEY` on backend)
2. `extractProductWithGemini()` — Gemini client-side (requires `VITE_GEMINI_API_KEY`)
3. `extractFromText()` — regex heuristics (always available)

---

## Negotiation engine

`src/lib/negotiation.ts` — 11 rules generating specific counter-asks for near-miss products:

| Rule | Action | Priority |
|---|---|---|
| Coupon below yield target | REQUEST coupon increase | CRITICAL |
| Barrier below mandate floor | ASK barrier lift | CRITICAL |
| Tenor exceeds mandate | REQUEST shorter tenor | CRITICAL |
| Currency mismatch | COUNTER quanto sleeve | CRITICAL |
| Missing capital protection | REQUEST 90% protection | CRITICAL |
| Issuer rating below floor | FLAG — cannot negotiate | CRITICAL |
| Issuer rating at exact floor | ASK rating-trigger clause | IMPORTANT |
| Forbidden underlying | COUNTER substitute | CRITICAL |
| Underlying type not allowed | COUNTER equivalent structure | CRITICAL |
| No memory coupon on autocall | ASK memory feature | IMPORTANT |
| American barrier on reverse convertible | ASK European observation | IMPORTANT |

Each `NegoRec`: `action · priority · param · from · to · costBps · rationale`

---

## Frontend routes

| Route | Feature |
|---|---|
| `/` | Opportunity feed — 3 buckets · score rings · 4-tab detail panel |
| `/inbox` | Research inbox — Gemini extraction · read/unread state |
| `/processing` | AI processing — multi-agent simulation · backend health |
| `/products` | Product catalog — filters · triage · multi-select compare |
| `/products/:id` | Detail view — sub-score radar · market view alignment |
| `/recommendations` | Ranked matches · what-if constraint relaxation |
| `/mandate` | Editable mandate — currencies · tenor · rating · ESG · yield |
| `/market` | PM house views · product alignment signals |
| `/watchlist` | Flagged products |
| `/outbox` | Sent term-sheet requests · simulated status progression |

Detail panel tabs: **ANALYSIS** (12 compliance checks · Gemini rationale · 5 sub-scores · PM signals · cross-mandate routing · history) · **NEGOTIATION** (gap cards · Gemini counter-offer draft) · **IC NOTE** (full memorandum · PDF export) · **SOURCE** (raw message)

---

## Tests

```bash
cd backend
pip install -e ".[dev]"
pytest app/tests/ -v
```

- 48 unit tests (matching · scoring · embeddings · FAISS · API · explanation)
- 180 golden-fixture assertions — parity between `matchingMock.ts` and `scoring.py` across all (product, AM) pairs

---

## Dataset

12 products from real bank research notes dated 25 April 2026:

**5 MATCH** — BNP Paribas SA Senior Preferred 2028 · SocGen Senior Preferred 2027 · ING Groep NV Senior Preferred 2029 · ING Groep NV Senior Preferred 2028 · Volkswagen AG Senior Unsecured 2028

**3 NEAR-MISS** — ING Groep NV FRN 2028 (float→fixed gap) · Barclays PLC Callable Senior Preferred 2029 (yield −25bps) · BNP Paribas SA Phoenix Autocall EuroStoxx50 (equity underlying)

**4 REJECT** — TotalEnergies SE 2028 (ESG fossil fuels) · Glencore PLC 2030 (ESG thermal coal) · Deutsche Bank AG Tier 2 2030 (subordinated) · Deutsche Lufthansa AG 2028 (BB+ High Yield)

5 AM profiles: Carmignac Credit Fund A (primary) · BlueBridge Capital · Caisse Piliers Gestion · Nordlys Wealth Family Office · Atelier Patrimoine MFO

---

## Environment variables

**Backend:**

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | — | PostgreSQL connection string |
| `GOOGLE_API_KEY` | — | Enables Gemini extraction · embeddings · prose |
| `EMBEDDING_MODEL` | `gemini-embedding-2` | Gemini embedding model |
| `EMBEDDING_DIM` | `768` | Vector dimension |
| `FAISS_DIR` | `./storage/faiss` | FAISS index persistence path |
| `RESET_DB` | `0` | Set to `1` to drop and reseed on startup |
| `CORS_ORIGINS` | `http://localhost:8080` | Allowed frontend origins |

**Frontend:**

| Variable | Description |
|---|---|
| `VITE_GEMINI_API_KEY` | Client-side Gemini (extraction fallback · counter-offer · IC Note) |
| `VITE_API_URL` | Backend URL (defaults to `http://localhost:8000`) |

---

## License

MIT
