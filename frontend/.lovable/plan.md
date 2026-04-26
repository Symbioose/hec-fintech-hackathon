# Phase 3 — Visual polish + local-mode architecture doc

Two parallel deliverables: (1) tightening visual issues spotted in the preview, (2) writing a substantial `README.md` that describes how the demo maps onto a real local backend (agentic ingestion → FAISS history → matching/scoring), including a reference repo layout the user can scaffold when they clone.

---

## 1. Visual fixes

### Issue 1 — Inbox rows show source twice
On rows where a product has no `source_reference` (e.g. P-1005 / P-1010), the row title falls back to `humanize(source_type)` ("Chat"), which then sits right next to the same `Chat` badge. Result: "Chat · Chat · UNREAD".

**Fix** (`src/pages/Inbox.tsx`):
- Drop the badge when `source_reference` is missing or equals the humanized source type.
- Add real `source_reference` values for P-1005 (`helvetia-rates@bank.example`), P-1007 (`weekly-issuance.csv`), P-1010 (`BBG chat PT-EQUITY`), P-1011 (`termsheet_HSEC_5Y_CPN.pdf`) in `src/mocks/products.ts`.

### Issue 2 — Inbox header chip is redundant
Currently shows `📨 12 messages [12]` — both the number and the unread pill repeat the count.
**Fix**: render a single chip: `12 messages · 12 unread` with the unread part hidden when zero. Keep the "Mark all read" button.

### Issue 3 — Products table: badges wrap to 2–3 lines
"Reverse / Convertible", "Capital / Protected / Note", "Med- / High", "High / risk" all break ugly.

**Fix** (`src/pages/Products.tsx` + badge components):
- Add `whitespace-nowrap` to `ProductTypeBadge` and `RiskBadge`.
- Drop the trailing " risk" word from `RiskBadge` (the column header already says Risk) — labels become `Low`, `Medium`, `Med-High`, `High`.
- Shorten long type labels via a label override map: `reverse_convertible → "Reverse Conv."`, `capital_protected_note → "CP Note"`, `credit_linked_note → "CLN"`, `floating_rate_note → "FRN"`, `fixed_rate_note → "Fixed Rate"`, `range_accrual → "Range Acc."`. Full label remains in tooltips.
- Set explicit min widths on the Type (140 px) and Risk (110 px) columns so the table stops squeezing them.

### Issue 4 — Empty Outbox / Watchlist look hollow
The single-card empty state floats in a huge empty page.
**Fix**: use the existing `EmptyState` component consistently, and add a secondary CTA button ("Browse recommendations" → `/recommendations`).

### Issue 5 — Welcome page polish
- Reorder dashboard cards so "Pass reasons" sits next to "Mandate failures" (both are diagnostic) and "Risk/Return map" gets full width.
- Add a tabular-nums class to the KPI numbers so they align across cards.

---

## 2. README — local-mode architecture

Replace the placeholder `README.md` with a full document covering:

### Section A — What this repo is
- A **frontend demo** of an Asset Manager copilot: inbox → extraction → matching → triage → outbox.
- All data is mocked in `src/mocks/*` and scoring runs in `src/lib/matchingMock.ts`. No backend calls.

### Section B — Production architecture (what to build when you clone)

```text
                ┌────────────────────────┐
                │  Channel agents        │
                │  (Gmail / Outlook /    │
                │   Bloomberg chat /     │
                │   PDF drop folder /    │
                │   call transcripts)    │
                └─────────┬──────────────┘
                          │ raw payloads
                          ▼
                ┌────────────────────────┐
                │  Ingestion worker      │
                │  • dedupe              │
                │  • attach metadata     │
                │  • push to queue       │
                └─────────┬──────────────┘
                          ▼
                ┌────────────────────────┐
                │  Extraction LLM        │
                │  (structured output)   │
                │  → Product JSON +      │
                │    per-field          │
                │    confidence         │
                └─────────┬──────────────┘
                          ▼
                ┌────────────────────────┐
                │  FAISS history index   │
                │  • embed each product  │
                │  • k-NN against past   │
                │    purchases & passes  │
                │  • similarity features │
                └─────────┬──────────────┘
                          ▼
                ┌────────────────────────┐
                │  Matching & scoring    │
                │  • hard filters        │
                │  • sub-scores          │
                │  • mandate alignment   │
                │  • house-view overlay  │
                └─────────┬──────────────┘
                          ▼
                ┌────────────────────────┐
                │  This frontend (you    │
                │  are here) — calls a   │
                │  thin REST/WS API      │
                └────────────────────────┘
```

### Section C — Suggested local repo layout
```text
backend/
  agents/
    gmail_agent.py        # IMAP / Gmail API poller
    outlook_agent.py
    bloomberg_agent.py    # bbg chat exporter
    pdf_watcher.py        # watches a drop folder
    transcript_agent.py   # whisper → text
  pipeline/
    ingest.py             # queue producer
    extract.py            # LLM call, schema-validated
    embed.py              # sentence-transformers / OpenAI
    score.py              # mirrors src/lib/matchingMock.ts
  index/
    faiss_store.py        # build + query
    history.parquet
  api/
    main.py               # FastAPI: /products /recommendations /inbox /outbox
frontend/                 # this repo
```

### Section D — Mapping demo files → real services
A table showing which mocked module the user replaces with a real backend call:

| Demo file | Replace with |
|---|---|
| `src/mocks/products.ts` | `GET /api/products` |
| `src/mocks/rawSamples.ts` | `GET /api/inbox/raw` |
| `src/lib/extractionMock.ts` | `POST /api/extract` (LLM) |
| `src/lib/matchingMock.ts` | `POST /api/score` (server-side) |
| `src/mocks/purchaseHistory.ts` | FAISS history index |
| `src/mocks/marketViews.ts` | `GET /api/market-views` |

### Section E — How to run the demo
- `bun install && bun dev`
- Login: any email + password (demo build).
- Localstorage persists triage decisions, edits, compare set, outbox.

### Section F — Switching the frontend to a real backend
- Add a `VITE_API_BASE_URL` env var.
- Create `src/lib/api.ts` with thin `fetch` wrappers per endpoint.
- Replace each `useAppStore` selector that reads mocks with a TanStack Query hook (`useProducts`, `useInbox`, …) — `@tanstack/react-query` is already installed.
- Keep triage / edits / compare / outbox state local until the real persistence endpoints exist.

### Section G — FAISS history quick-start (snippet)
~30 lines showing: build an index from past purchases, embed an incoming product, retrieve k-NN, surface "similar to 3 products you bought in 2024" badge in the UI.

---

## Files touched

**Visual**
- `src/pages/Inbox.tsx` — header chip + source label dedupe
- `src/mocks/products.ts` — fill missing `source_reference`
- `src/components/common/ProductTypeBadge.tsx` — short labels + nowrap
- `src/components/common/RiskBadge.tsx` — drop "risk" suffix + nowrap
- `src/pages/Products.tsx` — column min-widths
- `src/pages/Outbox.tsx`, `src/pages/Watchlist.tsx` — consistent EmptyState + CTA
- `src/pages/Dashboard.tsx` — minor reorder + tabular nums

**Docs**
- `README.md` — full rewrite with architecture, repo layout, integration map, FAISS snippet
