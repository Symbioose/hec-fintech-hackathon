import type { Product } from "@/types/product";
import type { RawSample } from "@/data/rawSamples";

let nextId = 9000;

export function extractFromSample(sample: RawSample): Product {
  return extractFromText(sample.raw_text, sample.source_type);
}

export function extractFromText(text: string, source: Product["source_type"] = "manual"): Product {
  nextId += 1;
  const lower = text.toLowerCase();
  const currencyMatch = text.match(/\b(EUR|USD|GBP|CHF|JPY)\b/);
  const tenorMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:y|year)s?/i);
  const couponMatch = text.match(/(\d+(?:\.\d+)?)\s*%/);
  const barrierMatch = text.match(/(\d+(?:\.\d+)?)\s*%\s*(?:barrier|european|american)/i);
  const issuerMatch = text.match(/(?:bank|banco|crédit|credit|securities|trust)[^\n.,;]{2,40}/i);

  let product_type: Product["product_type"] = "other";
  if (/autocall/i.test(lower)) product_type = "autocallable";
  else if (/reverse convertible/i.test(lower)) product_type = "reverse_convertible";
  else if (/capital protect|cpn/i.test(lower)) product_type = "capital_protected_note";
  else if (/floating/i.test(lower)) product_type = "floating_rate_note";
  else if (/credit linked/i.test(lower)) product_type = "credit_linked_note";
  else if (/range accrual/i.test(lower)) product_type = "range_accrual";
  else if (/fixed/i.test(lower)) product_type = "fixed_rate_note";

  return {
    id: `P-${nextId}`,
    issuer: (issuerMatch?.[0] ?? "Unknown Issuer").trim(),
    product_name: null,
    product_type,
    currency: currencyMatch?.[1] ?? "EUR",
    tenor_years: tenorMatch ? parseFloat(tenorMatch[1]) : null,
    coupon: couponMatch ? parseFloat(couponMatch[1]) / 100 : null,
    coupon_type: /memory/i.test(lower)
      ? "memory"
      : /conditional/i.test(lower)
      ? "conditional"
      : /floating/i.test(lower)
      ? "floating"
      : "fixed",
    underlying: [],
    underlying_type: null,
    barrier: barrierMatch ? parseFloat(barrierMatch[1]) / 100 : null,
    capital_protection: /capital protect|capital guarantee/i.test(lower),
    autocall: /autocall/i.test(lower),
    autocall_frequency: /quarterly/i.test(lower) ? "quarterly" : /semi/i.test(lower) ? "semi_annual" : null,
    autocall_trigger: null,
    issuer_rating: text.match(/\b(AAA|AA[+-]?|A[+-]?|BBB[+-]?|BB[+-]?)\b/)?.[1] ?? null,
    liquidity: null,
    estimated_cost: null,
    risk_level: null,
    source_type: source,
    source_reference: null,
    raw_text: text,
    ingested_at: new Date().toISOString(),
  };
}
