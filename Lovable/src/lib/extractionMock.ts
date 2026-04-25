import type { Product } from "@/types/product";
import type { RawSample } from "@/mocks/rawSamples";

// Simulated LLM extraction: returns a Product-shaped object built from a known sample,
// or a heuristic guess for free text. This mirrors what a real Gemini-based extractor would do.

const KNOWN: Record<string, Omit<Product, "id" | "ingested_at">> = {
  "S-1": {
    issuer: "Bank Olympus",
    product_name: "EUR 5Y Autocallable SX5E",
    product_type: "autocallable",
    currency: "EUR",
    tenor_years: 5,
    coupon: 0.065,
    coupon_type: "memory",
    underlying: ["EuroStoxx 50"],
    underlying_type: "equity_index",
    barrier: 0.6,
    capital_protection: false,
    autocall: true,
    autocall_frequency: "quarterly",
    autocall_trigger: 1.0,
    issuer_rating: "A",
    liquidity: "medium",
    estimated_cost: 0.012,
    risk_level: "medium_high",
    source_type: "email",
    source_reference: "olympus.structured@bank.example",
    raw_text: "",
  },
  "S-2": {
    issuer: "Northwall Bank",
    product_name: "USD 3Y Reverse Convertible AAPL",
    product_type: "reverse_convertible",
    currency: "USD",
    tenor_years: 3,
    coupon: 0.085,
    coupon_type: "fixed",
    underlying: ["AAPL US"],
    underlying_type: "single_stock",
    barrier: 0.7,
    capital_protection: false,
    autocall: false,
    issuer_rating: "A+",
    liquidity: "medium",
    estimated_cost: null,
    risk_level: "high",
    source_type: "chat",
    source_reference: "BBG chat NWB-DEALS",
    raw_text: "",
  },
  "S-3": {
    issuer: "Helvetia Securities",
    product_name: "EUR 5Y Capital Protected Note SX5E",
    product_type: "capital_protected_note",
    currency: "EUR",
    tenor_years: 5,
    coupon: 0,
    coupon_type: "zero_coupon",
    underlying: ["EuroStoxx 50"],
    underlying_type: "equity_index",
    capital_protection: true,
    protection_level: 1.0,
    autocall: false,
    issuer_rating: "AA",
    liquidity: "medium",
    estimated_cost: 0.008,
    risk_level: "low",
    source_type: "pdf",
    source_reference: "termsheet_HELVETIA_5Y_CPN.pdf",
    raw_text: "",
  },
  "S-4": {
    issuer: "Banco Iberia",
    product_name: "EUR 4Y Worst-of Memory Autocall",
    product_type: "autocallable",
    currency: "EUR",
    tenor_years: 4,
    coupon: 0.078,
    coupon_type: "memory",
    underlying: ["EuroStoxx 50", "S&P 500", "Nikkei 225"],
    underlying_type: "multi_asset",
    barrier: 0.55,
    capital_protection: false,
    autocall: true,
    autocall_frequency: "semi_annual",
    autocall_trigger: 0.95,
    issuer_rating: "BBB+",
    liquidity: "low",
    estimated_cost: 0.018,
    risk_level: "high",
    source_type: "call",
    source_reference: "Call transcript 2026-04-23",
    raw_text: "",
  },
};

let nextId = 9000;

export function extractFromSample(sample: RawSample): Product {
  const base = KNOWN[sample.id];
  nextId += 1;
  if (base) {
    return {
      id: `P-${nextId}`,
      ...base,
      raw_text: sample.raw_text,
      ingested_at: new Date().toISOString(),
    };
  }
  return extractFromText(sample.raw_text, sample.source_type);
}

export function extractFromText(text: string, source: Product["source_type"] = "manual"): Product {
  nextId += 1;
  // Naive heuristic extraction for free-text demo input.
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
