/**
 * Webi negotiation engine — generates SPECIFIC counter-proposal recommendations
 * by comparing product fields against mandate constraints.
 *
 * Output is a list of structured "asks" the analyst can send back to the bank,
 * each with: parameter, current value, target value, cost in bps, rationale.
 */

import type { Product } from "@/types/product";
import type { AssetManagerProfile } from "@/types/assetManager";
import type { Recommendation } from "@/types/recommendation";

export type NegoAction = "REQUEST" | "ASK" | "COUNTER" | "FLAG" | "OPTIONAL";
export type NegoPriority = "CRITICAL" | "IMPORTANT" | "NICE-TO-HAVE";

export interface NegoRec {
  action: NegoAction;
  priority: NegoPriority;
  param: string;       // "Coupon", "Barrier", "Tenor", etc.
  from: string;        // displayed current value (formatted)
  to: string;          // displayed target value (formatted)
  costBps: number;     // signed: positive = bank gives up coupon, negative = bank gains
  costLabel: string;   // "+35 bps", "-25 bps", "neutral"
  rationale: string;   // why this works + market context
}

const RATING_RANK: Record<string, number> = {
  AAA: 10, "AA+": 9, AA: 8, "AA-": 7, "A+": 6, A: 5, "A-": 4,
  "BBB+": 3, BBB: 2, "BBB-": 1, BB: 0,
};

function fmtPct(x: number, dp = 2): string {
  return `${(x * 100).toFixed(dp)}%`;
}

function fmtCostBps(bps: number): string {
  if (bps === 0) return "neutral";
  if (bps > 0) return `+${bps} bps`;
  return `${bps} bps`;
}

/* ─────────────────────────────────────────────────────────────────────────
   Main generator
   ───────────────────────────────────────────────────────────────────────── */
export function generateNegotiation(
  product: Product,
  am: AssetManagerProfile,
  rec: Recommendation,
): NegoRec[] {
  const out: NegoRec[] = [];

  // ── 1. Coupon below target yield ──────────────────────────────────────
  if (
    am.target_yield_min != null &&
    product.coupon != null &&
    product.coupon < am.target_yield_min
  ) {
    const gap = am.target_yield_min - product.coupon; // e.g. 0.0030 = 30bps
    const targetBps = Math.round(gap * 10000);
    out.push({
      action: "REQUEST",
      priority: "CRITICAL",
      param: "Coupon",
      from: fmtPct(product.coupon),
      to: fmtPct(am.target_yield_min),
      costBps: targetBps,
      costLabel: `+${targetBps} bps`,
      rationale:
        `Mandate requires minimum yield of ${fmtPct(am.target_yield_min)}. ` +
        `Bank can fund this gap by tightening barrier 5pt (+25–40bps headroom) ` +
        `or shortening tenor by 3 months. Within typical 2026 pricing flexibility.`,
    });
  }

  // ── 2. Barrier too aggressive (below mandate risk floor) ──────────────
  if (
    am.max_barrier_risk != null &&
    product.barrier != null &&
    product.barrier < am.max_barrier_risk
  ) {
    const liftBps = Math.round((am.max_barrier_risk - product.barrier) * 100 * 8);
    out.push({
      action: "ASK",
      priority: "CRITICAL",
      param: "Barrier",
      from: fmtPct(product.barrier, 0),
      to: fmtPct(am.max_barrier_risk, 0),
      costBps: -liftBps,
      costLabel: `-${liftBps} bps`,
      rationale:
        `Mandate floor sits at ${fmtPct(am.max_barrier_risk, 0)}. ` +
        `Lifting the barrier reduces downside exposure and clears the hard constraint. ` +
        `Cost: ~${liftBps}bps off coupon, well within negotiation envelope for this issuer.`,
    });
  }

  // ── 3. Tenor exceeds mandate ──────────────────────────────────────────
  if (
    am.max_tenor_years != null &&
    product.tenor_years != null &&
    product.tenor_years > am.max_tenor_years
  ) {
    out.push({
      action: "REQUEST",
      priority: "CRITICAL",
      param: "Tenor",
      from: `${product.tenor_years}Y`,
      to: `${am.max_tenor_years}Y`,
      costBps: 50,
      costLabel: "+50 bps",
      rationale:
        `Mandate caps tenor at ${am.max_tenor_years}y. ` +
        `Shorter duration typically lifts coupon by 40–80bps on autocalls ` +
        `(issuer carries less duration risk). Net win for both sides.`,
    });
  }

  // ── 4. Currency mismatch ──────────────────────────────────────────────
  if (!am.allowed_currencies.includes(product.currency)) {
    const mandateCcy = am.allowed_currencies[0] ?? "EUR";
    out.push({
      action: "COUNTER",
      priority: "CRITICAL",
      param: "Currency",
      from: product.currency,
      to: mandateCcy,
      costBps: 25,
      costLabel: "+15-30 bps",
      rationale:
        `Mandate restricts to ${am.allowed_currencies.join("/")}. ` +
        `Cross-currency hedge (quanto) adds 15–30bps to coupon vs ${product.currency} version. ` +
        `Standard ask — most banks have ${mandateCcy} sleeve ready.`,
    });
  }

  // ── 5. Missing capital protection ─────────────────────────────────────
  if (am.requires_capital_protection && !product.capital_protection) {
    out.push({
      action: "REQUEST",
      priority: "CRITICAL",
      param: "Protection",
      from: "None",
      to: "90% capital",
      costBps: -125,
      costLabel: "-100-150 bps",
      rationale:
        `Mandate requires capital protection. Ask for 90% or 95% protection variant — ` +
        `unlocks mandate eligibility. Bank funds this by capping participation or ` +
        `extending tenor 6–12M. Worth the trade for compliance clearance.`,
    });
  }

  // ── 6. Issuer rating at or below floor ────────────────────────────────
  if (am.min_issuer_rating && product.issuer_rating) {
    const productRank = RATING_RANK[product.issuer_rating] ?? -1;
    const minRank = RATING_RANK[am.min_issuer_rating] ?? -1;
    if (productRank < minRank) {
      out.push({
        action: "FLAG",
        priority: "CRITICAL",
        param: "Issuer Rating",
        from: product.issuer_rating,
        to: am.min_issuer_rating,
        costBps: 0,
        costLabel: "structural",
        rationale:
          `Issuer rated ${product.issuer_rating} sits below mandate floor ${am.min_issuer_rating}. ` +
          `Cannot be negotiated — request alternative issuer or confirm rating split (Fitch vs S&P). ` +
          `If split, mandate may accept worst-of read.`,
      });
    } else if (productRank === minRank) {
      out.push({
        action: "ASK",
        priority: "IMPORTANT",
        param: "Rating Trigger",
        from: "None",
        to: "Auto-unwind",
        costBps: -10,
        costLabel: "-5-15 bps",
        rationale:
          `Issuer at exact mandate floor (${product.issuer_rating}). ` +
          `Request rating-trigger clause: structure unwinds at par if issuer downgraded ` +
          `below ${am.min_issuer_rating} mid-term. Standard ask in 2026 — most desks accept.`,
      });
    }
  }

  // ── 7. Forbidden underlying in basket ─────────────────────────────────
  const forbiddenUnderlying = product.underlying.find((u) =>
    am.forbidden_underlyings.includes(u),
  );
  if (forbiddenUnderlying) {
    const alt =
      am.preferred_issuers.length > 0
        ? "an eligible mandate underlying"
        : "Schneider Electric or SAP";
    out.push({
      action: "COUNTER",
      priority: "CRITICAL",
      param: "Underlying",
      from: forbiddenUnderlying,
      to: alt,
      costBps: 100,
      costLabel: "+80-150 bps",
      rationale:
        `${forbiddenUnderlying} is excluded by mandate. Substitute with ${alt} — ` +
        `tighter sector correlation in worst-of structure typically lifts coupon by 80–150bps. ` +
        `Bank can re-price overnight given vol surface stability.`,
    });
  }

  // ── 8. Underlying type not allowed by mandate ─────────────────────────
  if (
    am.allowed_underlying_types.length > 0 &&
    product.underlying_type &&
    !am.allowed_underlying_types.includes(product.underlying_type)
  ) {
    const allowed = am.allowed_underlying_types[0];
    out.push({
      action: "COUNTER",
      priority: "CRITICAL",
      param: "Underlying Type",
      from: product.underlying_type.replace("_", " "),
      to: allowed.replace("_", " "),
      costBps: -120,
      costLabel: "-80-120 bps",
      rationale:
        `Mandate restricts underlying types to ${am.allowed_underlying_types.join(", ")}. ` +
        `${product.underlying_type.replace("_", " ")} exposure is not permitted. ` +
        `Counter-propose equivalent ${allowed}-linked structure — bank can re-price as a fixed-rate note ` +
        `on same issuer, typically at coupon minus 80-120bps. Structural swap clears mandate in one ask.`,
    });
  }

  // ── 9. Memory coupon missing on autocall/phoenix ──────────────────────
  if (
    product.autocall &&
    product.coupon != null &&
    product.coupon_type !== "memory"
  ) {
    out.push({
      action: "ASK",
      priority: "IMPORTANT",
      param: "Coupon Type",
      from: product.coupon_type ?? "Standard",
      to: "Memory",
      costBps: 0,
      costLabel: "neutral",
      rationale:
        `Add memory coupon feature — missed coupons recovered if barrier breached then recovers. ` +
        `Critical for sideways-market scenarios. Pricing impact: typically neutral on autocalls, ` +
        `bank rarely refuses.`,
    });
  }

  // ── 9. American barrier observation (path-dependent) ──────────────────
  if (
    product.barrier != null &&
    product.product_type === "reverse_convertible"
  ) {
    out.push({
      action: "ASK",
      priority: "IMPORTANT",
      param: "Barrier Type",
      from: "American (daily)",
      to: "European (maturity)",
      costBps: -30,
      costLabel: "-20-40 bps",
      rationale:
        `Switch to European barrier (observed at maturity only) — eliminates path-dependency ` +
        `and intraday breach risk. Critical given current vol regime. ` +
        `Cost: 20-40bps off coupon, well worth the risk reduction.`,
    });
  }

  // ── 10. Yield gap on near-target products (incremental polish) ────────
  if (
    out.length === 0 &&
    am.target_yield_min != null &&
    product.coupon != null &&
    product.coupon >= am.target_yield_min &&
    product.coupon < am.target_yield_min + 0.005
  ) {
    out.push({
      action: "OPTIONAL",
      priority: "NICE-TO-HAVE",
      param: "Coupon",
      from: fmtPct(product.coupon),
      to: fmtPct(product.coupon + 0.0025),
      costBps: 25,
      costLabel: "+25 bps",
      rationale:
        `Coupon meets mandate floor — ask for 25bps additional to widen margin of safety. ` +
        `Bank typically has room on ATH-vol regimes. Worth a 5-min phone call.`,
    });
  }

  // ── 11. Generic polish if nothing actionable ──────────────────────────
  if (out.length === 0) {
    out.push({
      action: "OPTIONAL",
      priority: "NICE-TO-HAVE",
      param: "Observation",
      from: "Quarterly",
      to: "Semi-annual",
      costBps: -10,
      costLabel: "-5-15 bps",
      rationale:
        `Product clears mandate. Optional: switch to semi-annual observation to reduce path ` +
        `dependency. Minor pricing impact, improves expected value in volatile regimes.`,
    });
  }

  // Order: CRITICAL > IMPORTANT > NICE-TO-HAVE
  const priOrder: Record<NegoPriority, number> = {
    "CRITICAL": 0,
    "IMPORTANT": 1,
    "NICE-TO-HAVE": 2,
  };
  out.sort((a, b) => priOrder[a.priority] - priOrder[b.priority]);

  return out;
}

/* ─────────────────────────────────────────────────────────────────────────
   Net cost summary (for the "what does the analyst gain" header)
   ───────────────────────────────────────────────────────────────────────── */
export function summarizeNegotiation(recs: NegoRec[]): {
  netBps: number;
  criticalCount: number;
  totalCount: number;
} {
  const netBps = recs.reduce((s, r) => s + r.costBps, 0);
  const criticalCount = recs.filter((r) => r.priority === "CRITICAL").length;
  return { netBps, criticalCount, totalCount: recs.length };
}
