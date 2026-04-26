# Webi — Structured Products Copilot

**AI-powered deal flow engine for asset managers receiving structured product proposals from banks.**

Webi ingests the daily firehose of bank proposals — Bloomberg chats, emails, term-sheet PDFs — extracts every product into a typed schema using **Gemini 2.0 Flash**, scores it against the fund's investment mandate, and surfaces only the deals that matter: ranked, explained, and ready to act on.

> Built at **Paris Fintech Hackathon 2026** (HEC Paris, April 25–26). Full-stack: React/TypeScript frontend + FastAPI/PostgreSQL/FAISS backend. Both are production-ready and connected.

---

## The problem

Asset managers receive 50–100 structured product proposals per week across fragmented channels. Each one must be manually read, checked against mandate constraints (credit rating, tenor, ESG exclusions, seniority, yield target…), and either rejected, approved, or negotiated. This takes 4–6 hours per analyst per day. Most near-miss deals are never followed up on.

## The solution

Three-phase AI pipeline:

1. **Auto-reject** — hard mandate breaches (ESG exclusion, below-IG rating, wrong seniority) are flagged instantly. Zero analyst time.
2. **High-confidence match** — products scoring ≥ 78/100 surface in the MATCH bucket with an investment committee memo auto-generated and ready to export as PDF.
3. **Gap analysis** — near-miss products (score 50–77) get specific negotiation recommendations: *"Request coupon +25bps. Barclays can accommodate this within current spread environment."* One click drafts the counter-offer email via Gemini.

---

## AI integration

| Feature | Implementation |
|---|---|
| **Document extraction** | Paste any bank email → Gemini 2.0 Flash extracts structured `Product` JSON with per-field confidence scores. Falls back to regex heuristics if offline. |
| **Counter-offer drafting** | Negotiation tab → "AI DRAFT WITH GEMINI" → Gemini generates a contextual counter-proposal email grounded on the product's specific mandate gaps. |
| **IC Note generation** | Investment committee memorandum auto-generated from scoring data, compliance checks, PM view alignment, and portfolio analytics. Export as PDF via browser print dialog. |
| **Gemini embeddings** | Backend uses `gemini-embedding-2` (768-dim, L2-normalized) + FAISS for semantic similarity search across products, mandates, and purchase history. |
| **Backend prose rationale** | `POST /recommendations/asset-manager/{id}?with_prose=true` calls Gemini for free-form rationale alongside rule-based bullets. |

---

## Run it locally

### Frontend only (no backend required)

```bash
cd Lovable
npm install
npm run dev
# → http://localhost:8080
```

Log in with **any** email + password — signs you in as **François Martin (Carmignac Credit Fund A, EUR 1.24B AUM, UCITS Article 8 SFDR)**.

To enable Gemini features (live extraction + AI counter-offer drafting):

```bash
# Lovable/.env.local
VITE_GEMINI_API_KEY=your_google_api_key
```

### Full stack (frontend + backend)

```bash
# 1. Start Postgres
docker compose up -d postgres

# 2. Start backend (auto-seeds DB, builds FAISS indices)
cd backend
pip install -e ".[dev]"
GOOGLE_API_KEY=your_key uvicorn app.main:app --reload
# → http://localhost:8000

# 3. Start frontend
cd ../Lovable
npm run dev
```

Backend health check:
```bash
curl http://localhost:8000/health
# {"status":"ok","embedding_provider":"gemini","indices_built":true,"prose_available":true}
```

---

## What's built

### Frontend (`Lovable/`)

| Route | Feature |
|---|---|
| `/` | **Opportunity feed** — 3 buckets (MATCH/NEAR-MISS/REJECT), score rings, 4-tab detail panel |
| `/inbox` | **Research inbox** — Gemini extraction from pasted text, sample bank messages, read/unread state |
| `/processing` | **AI processing** — multi-agent simulation (BNP, Goldman, SocGen), live Gemini/backend status |
| `/products` | Product catalog with filters, triage, multi-select compare |
| `/products/:id` | Detail view with sub-score radar, market view alignment, term-sheet request |
| `/recommendations` | Ranked matches + What-if constraint relaxation panel |
| `/mandate` | Editable mandate (currencies, tenor, min rating, ESG constraints, yield target) |
| `/market` | PM house views with product alignment signals |
| `/watchlist` | Flagged products (Watch / Interested) |
| `/outbox` | Sent term-sheet requests with simulated status (sent → acknowledged → received) |

**Detail panel — 4 tabs:**
- **ANALYSIS**: 12 compliance checks (green/orange/red grid), 5 AI score bars, PM view alignment (5 signals), cross-mandate routing (5 AM profiles scored), investment history
- **NEGOTIATION**: per-gap negotiation cards + Gemini-powered counter-offer draft with loading state
- **IC NOTE**: full investment committee memorandum, Export PDF, Send to Compliance
- **SOURCE**: raw bank message, copy to clipboard, flag for compliance

### Backend (`backend/`)

Built across 5 phases, fully tested:

| Phase | Status | Description |
|---|---|---|
| 1 — Skeleton | ✅ Done | FastAPI + `/health`, Postgres + Docker Compose, Pydantic schemas |
| 2 — Seed data | ✅ Done | 30 products, 6 AM profiles, 10 purchase history items, 4 market views |
| 3 — Embeddings + FAISS | ✅ Done | Gemini `gemini-embedding-2` (768-dim), 5-way multi-index, hash-based mock fallback |
| 4 — Matching + scoring | ✅ Done | Hard filters + 5 sub-scores, mirrors `src/lib/matchingMock.ts` field-for-field, 180 golden-fixture assertions |
| 5 — Explanations | ✅ Done | Rule-based bullets + optional Gemini prose via `?with_prose=true` |

---

## Scoring model

For each (product, mandate) pair, the engine runs hard filters then computes a weighted score:

**Hard filters** — any failure sets `hard_fail=true` and applies a 65% score penalty:
- Currency in mandate's allowed list
- Issuer not in exclusion list
- Capital protection present if required
- Tenor ≤ mandate cap
- Issuer rating ≥ minimum (S&P worst-of)
- No forbidden underlyings (ESG exclusions)

**Sub-scores (0–1):**
```
semantic       × 0.25  — strategy-affinity table × underlying-type allowance
constraints    × 0.25  — barrier floor, preferred issuer bonus
yield_fit      × 0.20  — coupon vs target yield
exposure_fit   × 0.15  — rewards underweight portfolio buckets
market_fit     × 0.15  — product risk level vs AM risk appetite delta
```

**Buckets:** MATCH ≥ 78 · NEAR-MISS 50–77 · REJECT < 50 or hard_fail

The frontend scoring (`src/lib/matchingMock.ts`) and backend scoring (`backend/app/core/scoring.py`) are kept in sync by 180 golden-fixture assertions.

---

## Negotiation engine

For near-miss products, `src/lib/negotiation.ts` generates specific counter-asks:

11 rules including: coupon below yield target, barrier too aggressive, tenor exceeds mandate, currency mismatch, missing capital protection, issuer rating at floor (→ auto-unwind clause ask), forbidden underlying substitution, memory coupon on autocall, American→European barrier conversion, underlying type not in mandate.

Each `NegoRec` has: `action` (REQUEST/ASK/COUNTER/FLAG), `priority` (CRITICAL/IMPORTANT/NICE-TO-HAVE), `param`, `from`, `to`, `costBps`, `costLabel`, `rationale`.

---

## Dataset

12 products based on real bank research notes dated April 25, 2026:

**5 MATCH:** BNP Paribas SA Senior Preferred 2028 · SocGen Senior Preferred 2027 · ING Groep NV Senior Preferred 2029 · ING Groep NV Senior Preferred 2028 · Volkswagen AG Senior Unsecured 2028

**3 NEAR-MISS:** ING Groep NV FRN 2028 (float→fixed gap) · Barclays PLC Callable Senior Preferred 2029 (yield −25bps + callable risk) · BNP Paribas SA Phoenix Autocall EuroStoxx50 (equity underlying not in mandate)

**4 REJECT:** TotalEnergies SE 2028 (ESG — fossil fuels) · Glencore PLC 2030 (ESG — thermal coal) · Deutsche Bank AG Tier 2 2030 (seniority — subordinated) · Deutsche Lufthansa AG 2028 (High Yield — BB+)

5 asset manager profiles for cross-mandate routing: Carmignac Credit Fund A (primary) · BlueBridge Capital · Caisse Piliers Gestion · Nordlys Wealth Family Office · Atelier Patrimoine MFO

---

## Tech stack

**Frontend:**
- React 18 · Vite 5 · TypeScript 5
- JetBrains Mono · custom CSS design tokens (terminal aesthetic)
- TanStack Query · React Router v6 · Sonner toasts
- Vitest + Testing Library

**Backend:**
- FastAPI · Pydantic v2 · SQLAlchemy · Python 3.11
- PostgreSQL · FAISS (IndexFlatIP, cosine similarity)
- Google Gemini API (`gemini-embedding-2` 768-dim · `gemini-2.0-flash` for extraction + prose)
- Docker Compose (postgres + backend)
- 180 golden-fixture assertions for scoring parity

---

## Production architecture

```
Bank email / Bloomberg chat / PDF
        │
        ▼
┌─────────────────────────────┐
│  Gemini 2.0 Flash           │  ← extractProductWithGemini()
│  structured JSON extraction │    responseMimeType: application/json
│  + per-field confidence     │    src/lib/gemini.ts
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  Hard filter engine         │  ← currency, rating, ESG, tenor,
│  + 5-dimension scoring      │    seniority, forbidden underlyings
│  (rule-based, deterministic)│    src/lib/matchingMock.ts
└──────────────┬──────────────┘
               ├── MATCH  → IC Note (Gemini prose) → PM approval
               ├── NEAR-MISS → Negotiation recs → Counter-offer (Gemini)
               └── REJECT → Compliance log
```

---

## License

MIT
