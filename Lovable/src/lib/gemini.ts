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
