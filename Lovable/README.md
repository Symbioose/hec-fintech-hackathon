# StructuredMatch

**An asset-manager copilot for buying structured products.**

StructuredMatch ingests the firehose of bank flows that lands in an asset manager's inbox every morning — emails, Bloomberg chats, term-sheet PDFs, sales calls — extracts every product into a clean structured record, and ranks them against the asset manager's mandate and house views. The user triages, compares, and requests full term sheets in one place instead of in fifteen Outlook threads.

> This repository is the **frontend prototype**. All data is mocked, scoring runs in the browser, and triage state lives in `localStorage`. The architecture is designed so each mock module maps 1:1 onto a real backend service — see [Production architecture](#production-architecture) below.

---

## Run it locally

Requirements: **Node.js ≥ 18** and a package manager (`npm`, `bun`, `pnpm`, or `yarn`).

```bash
# 1. Clone
git clone <your-fork-url> structuredmatch
cd structuredmatch

# 2. Install dependencies (pick one)
npm install
# or: bun install
# or: pnpm install

# 3. Start the dev server
npm run dev
# → http://localhost:8080
```

Log in with **any** email + password — the demo signs you in as Marcus Lindqvist (Nordlys Wealth).

### Other scripts

```bash
npm run build      # production build → dist/
npm run preview    # serve the production build
npm run test       # run vitest
npm run lint       # eslint
```

No `.env` file is required for the demo. When you wire up a backend, add:

```bash
# .env.local
VITE_API_BASE_URL=http://localhost:8000
```

---

## What's in the demo

| Page | Purpose |
|---|---|
| `/dashboard` | KPIs, score distribution, mandate-failure breakdown, pass-reason analytics, coupon/barrier risk-return scatter. |
| `/inbox` | Raw incoming messages with extracted-field highlighting. *Simulate a new arrival* runs the mock LLM extractor. |
| `/products` | Full catalog with filters, triage actions (Watch / Interested / Pass), multi-select compare. |
| `/products/:id` | Extracted JSON, sub-score radar, market-view alignment, decision actions, term-sheet request. |
| `/recommendations` | Ranked matches for the current mandate + a *What-if* panel that relaxes constraints to surface near-misses. |
| `/watchlist` | Everything flagged Watch or Interested. |
| `/outbox` | Term-sheet requests sent to issuers, with simulated status progression (sent → acknowledged → received). |
| `/my-mandate` | Editable mandate (currencies, tenor cap, min rating, target yield, excluded issuers, …). |
| `/market-views` | House views from the strategy desk. Each product shows Aligned / Counter view. |

Press `⌘K` / `Ctrl+K` to open the global command palette.

The mock catalog (`src/mocks/products.ts`) is focused on **fixed-income structured products**: callable / step-up / fix-to-float notes, range accruals, snowballs, TARNs, CLNs, FTD baskets, AT1 CoCos, green bonds, CMS steepeners.

---

## Tech stack

**Frontend (this repo):**

- **React 18 · Vite 5 · TypeScript 5**
- **Tailwind CSS v3** with semantic tokens (`src/index.css`, `tailwind.config.ts`)
- **shadcn/ui** + **Radix** primitives
- **recharts** for charts
- **TanStack Query** (installed, ready for backend wiring)
- **Vitest** + **Testing Library**

**Planned backend** — full spec in [`../Code/codex_context_structured_products_matching.md`](../Code/codex_context_structured_products_matching.md):

- **FastAPI · Pydantic v2 · SQLAlchemy** on Python 3.11
- **PostgreSQL** for structured data; Redis optional for the ingestion queue
- **FAISS** (local, multi-index) for vector search
- **Gemini** (`gemini-embedding-2`, 768-dim) for embeddings + extraction + explanation, with a deterministic hash-based mock fallback when `GOOGLE_API_KEY` is unset
- **Docker Compose** for the dev stack (postgres + backend + frontend)

---

## Production architecture

The demo is intentionally structured so each mocked module can be replaced with a real service one-for-one. The full backend spec — schemas, prompts, scoring weights, endpoints, seed data — lives in [`../Code/codex_context_structured_products_matching.md`](../Code/codex_context_structured_products_matching.md); the diagram and tables below summarise it. Target stack for a self-hosted local deploy:

```text
                ┌──────────────────────────────┐
                │  Channel agents              │
                │  (Gmail · Outlook · BBG chat │
                │   PDF drop folder · Whisper) │
                └──────────────┬───────────────┘
                               │ raw payloads (text + metadata)
                               ▼
                ┌──────────────────────────────┐
                │  Ingestion worker            │
                │  • parse + clean + dedupe    │
                │  • attach channel metadata   │
                │  • push to message queue     │
                └──────────────┬───────────────┘
                               ▼
                ┌──────────────────────────────┐
                │  Extraction LLM              │
                │  (Gemini structured output)  │
                │  → Product JSON + per-field  │
                │    confidence scores         │
                └──────────────┬───────────────┘
                               ▼
                ┌──────────────────────────────┐
                │  Validation + persistence    │
                │  • Pydantic schemas          │
                │  • field normalization       │
                │  • Postgres + raw doc store  │
                └──────────────┬───────────────┘
                               ▼
                ┌──────────────────────────────┐
                │  Embedding (Gemini)          │
                │  canonical text → 768-dim    │
                │  L2-normalized vectors       │
                └──────────────┬───────────────┘
                               ▼
                ┌──────────────────────────────┐
                │  FAISS multi-index           │
                │  product · asset_manager ·   │
                │  purchase_history ·          │
                │  mandate · market_views      │
                └──────────────┬───────────────┘
                               ▼
                ┌──────────────────────────────┐
                │  Matching & scoring          │
                │  • hard filters (mandate)    │
                │  • semantic / strategy /     │
                │    historical / market /     │
                │    pricing sub-scores        │
                │  • weighted final score      │
                └──────────────┬───────────────┘
                               ▼
                ┌──────────────────────────────┐
                │  Explanation (LLM)           │
                │  rationale · positive        │
                │  factors · risks · action    │
                └──────────────┬───────────────┘
                               ▼
                ┌──────────────────────────────┐
                │  REST / WebSocket API        │
                │  consumed by this frontend   │
                └──────────────────────────────┘
```

### Suggested repo layout once you fork

```text
backend/
  app/
    main.py                  # FastAPI entry: /health /products /asset-managers /recommendations /upload /indices/rebuild
    config.py
    api/                     # one route module per resource
    core/
      embeddings.py          # Gemini wrapper, L2-normalized 768-dim vectors
      extraction.py          # raw text → Product JSON via Gemini structured output
      canonical_text.py      # Product / AM / history / market view → embedding text
      faiss_store.py         # multi-index FAISS wrapper (one index per object type)
      matching.py            # hard filters + soft sub-scores
      scoring.py             # weighted final score, mirror of src/lib/matchingMock.ts
      explanation.py         # rationale, positive factors, risks, suggested action
    db/                      # SQLAlchemy session + models + repositories
    schemas/                 # Pydantic = source of truth, mirrors src/types/*.ts
    services/                # product / asset_manager / recommendation / ingestion / index
    data/                    # seed AM profiles, products, history, market views
    tests/                   # extraction, scoring, matching, api
  agents/                    # channel pollers — push raw payloads onto the ingestion queue
    gmail_agent.py           # IMAP / Gmail API
    outlook_agent.py         # Microsoft Graph
    bloomberg_agent.py       # BBG chat exporter / IB bridge
    pdf_watcher.py           # watchdog drop folder, pdfplumber + OCR fallback
    transcript_agent.py      # whisper.cpp on call recordings
  pyproject.toml
  Dockerfile
frontend/                    # ← this repo
docker-compose.yml           # postgres + backend + frontend
.env.example                 # GOOGLE_API_KEY, DATABASE_URL, FAISS_DIR, …
```

### Mock → production mapping

| Demo file | Production replacement |
|---|---|
| `src/mocks/products.ts` | `GET /api/products` — paginated, mandate-aware |
| `src/mocks/rawSamples.ts` | `GET /api/inbox/raw` + WebSocket stream for live arrivals |
| `src/lib/extractionMock.ts` | `POST /api/upload/offer` — Gemini structured output → Pydantic-validated `Product` |
| `src/lib/matchingMock.ts` | `POST /api/recommendations/product/{id}` — server-side scoring + LLM explanation |
| `src/mocks/purchaseHistory.ts` | FAISS `purchase_history_index`, queried inside the scorer |
| `src/mocks/marketViews.ts` | `GET /api/market-views` + FAISS `market_views_index` |
| `src/mocks/assetManagers.ts` + `src/lib/auth.tsx` | `GET /api/asset-managers` + real auth (OAuth / Lovable Cloud / Auth0) |
| `localStorage` triage / outbox / edits | Postgres tables `decisions`, `outbox_requests`, `field_overrides` |

### Switching the frontend to a real backend

1. Set `VITE_API_BASE_URL` in `.env.local`.
2. Create `src/lib/api.ts` with thin `fetch` wrappers per endpoint.
3. Replace each `useAppStore` selector that reads mocks with a TanStack Query hook:
   ```ts
   export function useProducts() {
     return useQuery({
       queryKey: ["products"],
       queryFn: () => api.get<Product[]>("/products"),
     });
   }
   ```
4. Move triage / edits / compare / outbox state to mutations against persistence endpoints.
5. Stream new inbox items over WebSocket to keep the unread badge live.

---

## Embeddings + FAISS multi-index — quick start

The backend embeds **canonical text** (not raw JSON) with Gemini, normalises to unit length, then stores vectors in **five FAISS indices** — one per object type — so retrieval stays in the right semantic space:

```text
product_index             ← every catalog product
asset_manager_index       ← every AM profile
purchase_history_index    ← every past decision (bought / rejected / requested / watched)
mandate_constraints_index ← every mandate clause
market_views_index        ← every house view
```

Embedding wrapper:

```python
# backend/app/core/embeddings.py
import numpy as np
from google import genai
from google.genai import types

class EmbeddingClient:
    def __init__(self, model="gemini-embedding-2", output_dim=768):
        self.client = genai.Client()
        self.model = model
        self.dim = output_dim

    def embed(self, text: str) -> np.ndarray:
        result = self.client.models.embed_content(
            model=self.model,
            contents=text,
            config=types.EmbedContentConfig(output_dimensionality=self.dim),
        )
        v = np.array(result.embeddings[0].values, dtype="float32")
        n = np.linalg.norm(v)
        return v / n if n > 0 else v
```

Canonical text per object — deterministic and schema-driven so two products with identical fields embed identically:

```python
# backend/app/core/canonical_text.py
def product_to_canonical_text(p) -> str:
    return (
        f"Structured product issued by {p.issuer}. "
        f"Type {p.product_type}, currency {p.currency}, tenor {p.tenor_years}y, "
        f"coupon {p.coupon}, barrier {p.barrier}, "
        f"underlying {', '.join(p.underlying)}, rating {p.issuer_rating}, "
        f"capital protection {p.capital_protection}, risk {p.risk_level}."
    )
```

At recommendation time the scorer embeds the candidate product **once**, then queries the AM, history, and market-view indices in parallel; the resulting cosine scores feed the `semantic`, `historical`, and `market` sub-scores below.

If `GOOGLE_API_KEY` is unset (offline demo, CI), fall back to a deterministic hash-based mock embedding so the pipeline still runs end-to-end.

Surface results on `ProductDetail` as e.g. *"Similar to 3 trades you executed in 2024 — avg coupon 5.7%, avg holding period 11 months"*.

---

## Scoring formula

`src/lib/matchingMock.ts` is the reference implementation; the backend scorer in `backend/app/core/scoring.py` mirrors it line-for-line, validated by 180 golden-fixture assertions in `backend/app/tests/test_scoring_golden.py`. For each (product, AM) pair:

**Hard filters** — any failure flips `hard_fail=true`. Hard-fail products are still ranked and surfaced (with a 65% score penalty, see below) so the manager sees what was screened out:

- currency in mandate
- issuer not in exclusion list
- capital protection present if required
- tenor ≤ cap
- issuer rating ≥ minimum
- no forbidden underlyings

**Sub-scores (0–1)** — all rule-based, no FAISS dependency:

- `semantic` — strategy-affinity table keyed on `am.strategy` (`defensive_income` / `balanced_income` / `yield_enhancement` / `capital_protection` / `opportunistic` / `esg_income` / `custom`), multiplied by `0.5` if the underlying type isn't in `am.allowed_underlying_types`
- `constraints` — starts at `1.0`; `−0.25` if `product.barrier < am.max_barrier_risk`, `+0.15` if `product.issuer ∈ am.preferred_issuers`
- `yield_fit` — coupon vs. `am.target_yield_min`: above target → `0.7 + min(0.3, (coupon − target) × 4)`; below → `(coupon / target) × 0.6`; no target → `0.6`
- `exposure_fit` — `1 − am.current_exposures[product.underlying_type] × 0.8`, rewarding underweight buckets
- `market_fit` — risk-rank delta between product and AM appetite: each step over → `−0.3`, each step under → `−0.05`

**Final score (integer 0–100):**

```ts
const weighted =
    0.25 * semantic
  + 0.25 * constraints
  + 0.20 * yield_fit
  + 0.15 * exposure_fit
  + 0.15 * market_fit;

const final = Math.round((hardFail ? weighted * 0.35 : weighted) * 100);
```

**Rationale bullets** (`RationaleBullet[]`) accompany every recommendation, with four kinds:

- `positive` — preferred issuer, capital-protection match, coupon meets target, exposure underweight
- `warning` — barrier below mandate floor, risk level above appetite
- `blocker` — one bullet per hard-fail reason
- `neutral` — fallback when none of the above fired

The Phase 5 backend optionally adds an LLM `prose_rationale` (one paragraph, Gemini) on the side; the frontend already renders the bullet list and stays unchanged.

---

## Roadmap

Implementation phases for the backend, executed in order. Each phase produces something the frontend can talk to.

**Phase 1 — Backend skeleton.** FastAPI app with `/health`, Postgres + Docker Compose, Pydantic schemas mirroring `src/types/product.ts`.

**Phase 2 — Seed data.** 4 asset-manager profiles, 15 products, 10 purchase-history items, 3 market views — same shapes as the current frontend mocks so the wire-up is mechanical.

**Phase 3 — Embeddings + FAISS.** Gemini wrapper (with hash-based mock fallback when `GOOGLE_API_KEY` is unset), canonical-text helpers, five-way FAISS multi-index, `POST /indices/rebuild`.

**Phase 4 — Matching + scoring.** Hard filters → soft sub-scores → weighted final score, mirroring `src/lib/matchingMock.ts` field-for-field.

**Phase 5 — Explanations.** Rule-based first (deterministic, no API key needed), then Gemini JSON output: `rationale`, `main_positive_factors`, `main_risks`, `suitability_assessment`, `suggested_action`.

**Phase 6 — Frontend wiring.** Replace each `useAppStore` mock selector with a TanStack Query hook hitting the FastAPI endpoints; move triage / outbox / field-overrides to Postgres-backed mutations; stream new inbox items over WebSocket.

**Phase 7 — Channel agents.** Gmail, Outlook, Bloomberg chat exporter, PDF drop folder, Whisper transcripts — each pushes onto the same ingestion queue feeding the extraction LLM.

**Phase 8 — Hardening.** OAuth per asset manager (Google / Microsoft), multi-tenant workspaces, immutable compliance audit trail (every extraction + decision), and backtesting that replays past mandates over historical flows.

---

## License

TBD.
