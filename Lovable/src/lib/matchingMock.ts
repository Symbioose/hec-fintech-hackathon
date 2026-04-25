import type { Product, RiskLevel } from "@/types/product";
import type { AssetManagerProfile } from "@/types/assetManager";
import type {
  Recommendation,
  RationaleBullet,
  SubScores,
} from "@/types/recommendation";

const RATING_RANK: Record<string, number> = {
  AAA: 10,
  "AA+": 9,
  AA: 8,
  "AA-": 7,
  "A+": 6,
  A: 5,
  "A-": 4,
  "BBB+": 3,
  BBB: 2,
  "BBB-": 1,
  BB: 0,
};

const RISK_RANK: Record<RiskLevel, number> = {
  low: 1,
  medium: 2,
  medium_high: 3,
  high: 4,
};

const APPETITE_RANK: Record<AssetManagerProfile["risk_appetite"], number> = {
  low: 1,
  medium: 2,
  medium_high: 3,
  high: 4,
};

function ratingMeets(productRating: string | null | undefined, min: string | null | undefined): boolean {
  if (!min) return true;
  if (!productRating) return false;
  const p = RATING_RANK[productRating] ?? -1;
  const m = RATING_RANK[min] ?? -1;
  return p >= m;
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

export function score(product: Product, am: AssetManagerProfile): Recommendation {
  const reasons: string[] = [];
  const bullets: RationaleBullet[] = [];

  // Hard filters
  if (!am.allowed_currencies.includes(product.currency)) {
    reasons.push(`Currency ${product.currency} not in mandate (${am.allowed_currencies.join(", ")}).`);
  }
  if (am.excluded_issuers.includes(product.issuer)) {
    reasons.push(`Issuer ${product.issuer} is excluded by mandate.`);
  }
  if (am.requires_capital_protection && !product.capital_protection) {
    reasons.push("Mandate requires capital protection — product is not protected.");
  }
  if (am.max_tenor_years && product.tenor_years && product.tenor_years > am.max_tenor_years) {
    reasons.push(`Tenor ${product.tenor_years}y exceeds max ${am.max_tenor_years}y.`);
  }
  if (!ratingMeets(product.issuer_rating, am.min_issuer_rating)) {
    reasons.push(
      `Issuer rating ${product.issuer_rating ?? "n/a"} below minimum ${am.min_issuer_rating}.`,
    );
  }
  const forbiddenHit = product.underlying.find((u) => am.forbidden_underlyings.includes(u));
  if (forbiddenHit) {
    reasons.push(`Underlying ${forbiddenHit} is forbidden by mandate.`);
  }

  // Sub-scores
  // semantic: pretend embedding similarity using overlap of underlying types and product type fit with strategy
  const allowedType = product.underlying_type
    ? am.allowed_underlying_types.includes(product.underlying_type)
    : true;
  const strategyAffinity: Record<AssetManagerProfile["strategy"], (p: Product) => number> = {
    defensive_income: (p) => (p.capital_protection ? 0.95 : 0.35) * (p.coupon ? 0.7 + 0.3 : 0.7),
    balanced_income: (p) =>
      0.55 + (p.product_type === "fixed_rate_note" ? 0.25 : 0) + (p.autocall ? 0.1 : 0),
    yield_enhancement: (p) =>
      0.45 +
      (p.product_type === "autocallable" || p.product_type === "reverse_convertible" ? 0.4 : 0),
    capital_protection: (p) => (p.capital_protection ? 0.92 : 0.2),
    opportunistic: (p) =>
      0.4 +
      (p.product_type === "autocallable" || p.product_type === "reverse_convertible" ? 0.45 : 0),
    esg_income: (p) =>
      0.5 + (p.underlying.some((u) => /esg/i.test(u)) ? 0.45 : 0),
    custom: () => 0.5,
  };
  const semantic = clamp01(strategyAffinity[am.strategy](product) * (allowedType ? 1 : 0.5));

  // constraints fit (soft)
  let constraintsScore = 1;
  if (product.barrier && am.max_barrier_risk) {
    // lower barrier = more risk; if barrier below max_barrier_risk threshold (e.g. 0.55), penalise
    if (product.barrier < am.max_barrier_risk) constraintsScore -= 0.25;
  }
  if (am.preferred_issuers.includes(product.issuer)) constraintsScore = Math.min(1, constraintsScore + 0.15);
  constraintsScore = clamp01(constraintsScore);

  // yield fit
  const target = am.target_yield_min ?? 0;
  const coupon = product.coupon ?? 0;
  const yieldFit = clamp01(
    target === 0 ? 0.6 : coupon >= target ? 0.7 + Math.min(0.3, (coupon - target) * 4) : coupon / target * 0.6,
  );

  // exposure fit — reward buckets currently underweight
  const bucket = product.underlying_type ?? "other";
  const current = am.current_exposures[bucket] ?? 0;
  const exposureFit = clamp01(1 - current * 0.8);

  // market fit — risk vs appetite alignment (product risk ≤ appetite is good, slightly above ok, far above bad)
  const pr = product.risk_level ? RISK_RANK[product.risk_level] : 2;
  const ar = APPETITE_RANK[am.risk_appetite];
  const diff = pr - ar;
  const marketFit = clamp01(1 - Math.max(0, diff) * 0.3 - Math.max(0, -diff) * 0.05);

  const sub: SubScores = {
    semantic,
    constraints: constraintsScore,
    yield_fit: yieldFit,
    exposure_fit: exposureFit,
    market_fit: marketFit,
  };

  // weighted sum
  const weighted =
    sub.semantic * 0.25 +
    sub.constraints * 0.25 +
    sub.yield_fit * 0.2 +
    sub.exposure_fit * 0.15 +
    sub.market_fit * 0.15;

  const hardFail = reasons.length > 0;
  const finalScore = Math.round((hardFail ? weighted * 0.35 : weighted) * 100);

  // Rationale bullets
  if (am.preferred_issuers.includes(product.issuer))
    bullets.push({ kind: "positive", text: `${product.issuer} is a preferred issuer for this mandate.` });
  if (product.capital_protection && am.requires_capital_protection)
    bullets.push({ kind: "positive", text: "100% capital protection matches mandate requirement." });
  if (coupon >= target && target > 0)
    bullets.push({
      kind: "positive",
      text: `Coupon of ${(coupon * 100).toFixed(2)}% meets target yield of ${(target * 100).toFixed(2)}%.`,
    });
  if (current < 0.2 && bucket !== "other")
    bullets.push({
      kind: "positive",
      text: `Underweight in ${bucket.replace("_", " ")} (${(current * 100).toFixed(0)}%) — adds diversification.`,
    });
  if (product.barrier && am.max_barrier_risk && product.barrier < am.max_barrier_risk)
    bullets.push({
      kind: "warning",
      text: `Barrier at ${(product.barrier * 100).toFixed(0)}% is more aggressive than mandate floor (${(am.max_barrier_risk * 100).toFixed(0)}%).`,
    });
  if (pr > ar)
    bullets.push({
      kind: "warning",
      text: `Risk level "${product.risk_level}" sits above mandate appetite "${am.risk_appetite}".`,
    });
  for (const r of reasons) bullets.push({ kind: "blocker", text: r });
  if (bullets.length === 0)
    bullets.push({ kind: "neutral", text: "Product matches the mandate on all checked dimensions." });

  return {
    id: `R-${am.id}-${product.id}`,
    asset_manager_id: am.id,
    product_id: product.id,
    score: finalScore,
    hard_fail: hardFail,
    hard_fail_reasons: reasons,
    sub_scores: sub,
    rationale: bullets,
  };
}

export function recommendationsFor(
  am: AssetManagerProfile,
  products: Product[],
): Recommendation[] {
  return products
    .map((p) => score(p, am))
    .sort((a, b) => b.score - a.score);
}

export function recommendationsForProduct(
  product: Product,
  ams: AssetManagerProfile[],
): Recommendation[] {
  return ams
    .map((am) => score(product, am))
    .sort((a, b) => b.score - a.score);
}
