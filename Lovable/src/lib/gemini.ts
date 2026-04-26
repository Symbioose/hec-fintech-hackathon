/**
 * Thin Gemini 2.0 Flash client for frontend AI features.
 * Falls back to null if the API key is not configured.
 */

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export const geminiAvailable = !!API_KEY;

async function callGemini(prompt: string): Promise<string> {
  if (!API_KEY) throw new Error("VITE_GEMINI_API_KEY not set");
  const res = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 800 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

/* ─── Counter-offer email ─────────────────────────────────────────────────── */

export interface CounterOfferContext {
  productName: string;
  issuer: string;
  couponPct: string;
  tenorY: string;
  rating: string;
  amFirm: string;
  amName: string;
  amAum: string;
  negoAsks: Array<{ param: string; from: string; to: string; rationale: string }>;
  netBps: number;
}

export async function generateAICounterOffer(ctx: CounterOfferContext): Promise<string> {
  const asks = ctx.negoAsks
    .map((a, i) => `${i + 1}. ${a.param}: ${a.from} → ${a.to}\n   Rationale: ${a.rationale}`)
    .join("\n\n");

  const prompt = `You are ${ctx.amName}, Portfolio Manager at ${ctx.amFirm} (${ctx.amAum} AUM, UCITS Article 8 SFDR).

Write a concise, professional counter-proposal email to the ${ctx.issuer} sales desk regarding their proposal for "${ctx.productName}" (${ctx.couponPct} coupon, ${ctx.tenorY}Y tenor, rated ${ctx.rating}).

The following mandate adjustments are REQUIRED before we can proceed:

${asks}

Net cost impact: ${ctx.netBps > 0 ? "+" : ""}${ctx.netBps} bps.

Rules:
- Formal financial English, direct and precise
- 250–350 words maximum
- Structure: greeting → mandate context (1 sentence) → numbered asks → net impact → closing with deadline
- Sign off as ${ctx.amName}, ${ctx.amFirm}
- Do NOT invent figures not provided above`;

  return callGemini(prompt);
}

/* ─── IC Note executive summary ──────────────────────────────────────────── */

export interface ICNoteContext {
  productName: string;
  issuer: string;
  couponPct: string;
  tenorY: string;
  rating: string;
  score: number;
  amFirm: string;
  recommendation: "APPROVE" | "CONDITIONAL" | "REJECT";
  fitReasons: string[];
  risks: string[];
  failChecks: string[];
}

export async function generateAIExecSummary(ctx: ICNoteContext): Promise<string> {
  const status =
    ctx.recommendation === "APPROVE"
      ? "recommended for approval"
      : ctx.recommendation === "CONDITIONAL"
      ? "recommended for conditional approval subject to negotiation"
      : "rejected due to mandate constraints";

  const prompt = `Write a 3-sentence investment committee executive summary for inclusion in a formal IC memorandum.

Product: ${ctx.productName}
Issuer: ${ctx.issuer} | Rating: ${ctx.rating} | Coupon: ${ctx.couponPct} | Tenor: ${ctx.tenorY}Y
Fund: ${ctx.amFirm} | Match score: ${ctx.score}/100 | Decision: ${status}
Key strengths: ${ctx.fitReasons.slice(0, 3).join("; ") || "N/A"}
Risks / flags: ${[...ctx.risks, ...ctx.failChecks].slice(0, 2).join("; ") || "None material"}

Rules:
- 3 sentences, exactly. Formal financial register.
- Sentence 1: describe the product and its mandate fit context
- Sentence 2: key investment rationale or why it fails
- Sentence 3: committee recommendation and next step
- No bullet points, no markdown, plain prose`;

  return callGemini(prompt);
}

/* ─── Structured product extraction from raw text ────────────────────────── */

export interface ExtractedProduct {
  issuer: string | null;
  product_name: string | null;
  product_type: string | null;
  currency: string | null;
  tenor_years: number | null;
  coupon: number | null;
  coupon_type: string | null;
  underlying: string[];
  underlying_type: string | null;
  barrier: number | null;
  capital_protection: boolean;
  autocall: boolean;
  issuer_rating: string | null;
  risk_level: string | null;
  notional: number | null;
  maturity_date: string | null;
  confidence: Record<string, number>;
}

const EXTRACTION_SCHEMA = `{
  "issuer": "string — bank or issuer name (e.g. BNP Paribas SA)",
  "product_name": "string — full product name or null",
  "product_type": "one of: fixed_rate_note, floating_rate_note, autocallable, reverse_convertible, capital_protected_note, credit_linked_note, range_accrual, other",
  "currency": "ISO code: EUR, USD, GBP, CHF or null",
  "tenor_years": "number — duration in years (e.g. 1.9) or null",
  "coupon": "decimal — e.g. 0.03125 for 3.125% or null",
  "coupon_type": "one of: fixed, floating, memory, conditional, zero_coupon or null",
  "underlying": "array of strings — names of underlying assets/issuers",
  "underlying_type": "one of: credit, rates, equity_index, single_stock, multi_asset or null",
  "barrier": "decimal — e.g. 0.6 for 60% or null",
  "capital_protection": "boolean",
  "autocall": "boolean",
  "issuer_rating": "S&P rating: AAA, AA+, AA, AA-, A+, A, A-, BBB+, BBB, BBB-, BB+ or null",
  "risk_level": "one of: low, medium, medium_high, high or null",
  "notional": "number in EUR/USD (e.g. 1250000) or null",
  "maturity_date": "ISO date string YYYY-MM-DD or null",
  "confidence": "object mapping each field name to a 0-1 confidence score"
}`;

export async function extractProductWithGemini(
  rawText: string,
): Promise<ExtractedProduct | null> {
  if (!API_KEY) return null;

  const prompt = `You are a structured products analyst. Extract financial product terms from the following bank communication.

Return ONLY a valid JSON object matching this schema exactly:
${EXTRACTION_SCHEMA}

Rules:
- coupon must be a decimal fraction (3.125% → 0.03125)
- barrier must be a decimal fraction (60% → 0.6)
- If a field cannot be determined from the text, use null (or [] for arrays, false for booleans)
- confidence: assign 0.9+ if explicitly stated, 0.5-0.8 if inferred, 0.2-0.4 if uncertain
- Do NOT invent values not present in the text

Bank communication:
---
${rawText.slice(0, 3000)}
---`;

  const res = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  try {
    return JSON.parse(raw) as ExtractedProduct;
  } catch {
    return null;
  }
}

/* ─── Backend health ──────────────────────────────────────────────────────── */

export interface BackendStatus {
  online: boolean;
  geminiActive: boolean;
  indicesBuilt: boolean;
}

export async function checkBackend(): Promise<BackendStatus> {
  try {
    const res = await fetch("http://localhost:8000/health", { signal: AbortSignal.timeout(1500) });
    if (!res.ok) return { online: false, geminiActive: false, indicesBuilt: false };
    const data = await res.json();
    return {
      online: true,
      geminiActive: data.prose_available === true,
      indicesBuilt: data.indices_built === true,
    };
  } catch {
    return { online: false, geminiActive: false, indicesBuilt: false };
  }
}
