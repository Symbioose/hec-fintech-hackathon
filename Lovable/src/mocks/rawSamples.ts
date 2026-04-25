// Sample raw inputs used in the Upload screen to simulate ingestion of unstructured data.

export interface RawSample {
  id: string;
  label: string;
  source_type: "email" | "chat" | "pdf" | "call";
  source_reference: string;
  raw_text: string;
}

export const RAW_SAMPLES: RawSample[] = [
  {
    id: "S-1",
    label: "Email — Bank Olympus 5Y EUR Autocall",
    source_type: "email",
    source_reference: "olympus.structured@bank.example",
    raw_text: `From: olympus.structured@bank.example
Subject: NEW IDEA — EUR 5Y Autocall on EuroStoxx 50

Dear all,

Bank Olympus is showing today an indicative EUR Autocallable Note linked to the EuroStoxx 50 index.
- Maturity: 5 years
- Quarterly autocall from year 1 at 100% trigger
- Conditional coupon of 6.50% p.a. (memory)
- 60% European barrier observed at maturity only
- No capital protection
- Issuer rating: A
- Estimated entry cost: 1.20%

Please revert if of interest, indicative size up to EUR 20m.
Best regards,
The Olympus Structuring Desk`,
  },
  {
    id: "S-2",
    label: "Bloomberg chat — NWB AAPL Reverse Convertible",
    source_type: "chat",
    source_reference: "BBG chat NWB-DEALS",
    raw_text: `[NWB-DEALS] 09:14
NWB Trader: indic 3Y USD reverse conv on AAPL US, 8.50% fixed coupon, 70% american barrier, no cap protect, A+ rated. Size 5m+. interested?`,
  },
  {
    id: "S-3",
    label: "Term sheet PDF — Helvetia 5Y CPN",
    source_type: "pdf",
    source_reference: "termsheet_HELVETIA_5Y_CPN.pdf",
    raw_text: `HELVETIA SECURITIES — INDICATIVE TERM SHEET
Product: 5Y EUR Capital Protected Note linked to EuroStoxx 50
Issuer: Helvetia Securities (rating AA)
Notional: EUR 1,000,000
Issue Price: 100%
Capital Protection at Maturity: 100%
Participation: 100% in index upside, capped at 35%
Coupon: zero coupon
Estimated cost: 0.80%
Indicative liquidity: medium`,
  },
  {
    id: "S-4",
    label: "Call transcript — Iberia worst-of",
    source_type: "call",
    source_reference: "Call transcript 2026-04-23",
    raw_text: `Salesperson (Banco Iberia): "We're showing today a 4Y EUR worst-of memory autocallable on EuroStoxx 50, S&P 500 and Nikkei 225. The coupon is 7.80% memory, semi-annual autocall at 95%, 55% European barrier at maturity. Issuer rating BBB+, indicative cost 1.80%."`,
  },
];
