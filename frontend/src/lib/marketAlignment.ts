import type { Product } from "@/types/product";
import type { MarketView } from "@/types/marketView";

export type Alignment = "aligned" | "counter" | "neutral";

export interface ProductAlignment {
  view: MarketView;
  alignment: Alignment;
  reason: string;
}

/**
 * Heuristically rate how a product aligns with each market view.
 * - Equity-linked product + bullish equity = aligned, bearish = counter, volatile = caution.
 * - Fixed-coupon / capital-protected + rates "down" = aligned (locks higher coupon).
 * - Credit-linked product + tightening spreads = aligned, widening = counter.
 */
export function alignmentForView(product: Product, view: MarketView): ProductAlignment {
  const ut = product.underlying_type;
  const isEquity = ut === "equity_index" || ut === "single_stock" || ut === "multi_asset";
  const isRates = ut === "rates" || product.product_type === "fixed_rate_note" || product.product_type === "floating_rate_note";
  const isCredit = ut === "credit" || product.product_type === "credit_linked_note";

  // Equity vs equity_view
  if (isEquity && view.equity_view) {
    if (view.equity_view === "bullish")
      return {
        view,
        alignment: "aligned",
        reason: `${view.author} is bullish equity — supports this ${view.region ?? ""} equity-linked structure.`,
      };
    if (view.equity_view === "bearish")
      return {
        view,
        alignment: "counter",
        reason: `${view.author} is bearish equity — this product runs counter to the house view.`,
      };
    if (view.equity_view === "volatile")
      return {
        view,
        alignment: "counter",
        reason: `${view.author} flags equity dispersion / vol — adds barrier risk to this product.`,
      };
  }

  // Rates products vs rates_view
  if (isRates && view.rates_view) {
    if (view.rates_view === "down" && product.product_type === "fixed_rate_note")
      return {
        view,
        alignment: "aligned",
        reason: `${view.author} sees rates lower — fixed-coupon locks current yield.`,
      };
    if (view.rates_view === "up" && product.product_type === "fixed_rate_note")
      return {
        view,
        alignment: "counter",
        reason: `${view.author} expects rates higher — fixed-coupon will underperform.`,
      };
    if (view.rates_view === "up" && product.product_type === "floating_rate_note")
      return {
        view,
        alignment: "aligned",
        reason: `${view.author} sees rates higher — floating coupon will reset upward.`,
      };
  }

  // Credit
  if (isCredit && view.credit_spread_view) {
    if (view.credit_spread_view === "tightening")
      return {
        view,
        alignment: "aligned",
        reason: `${view.author} sees credit spreads tightening — supportive for CLN carry.`,
      };
    if (view.credit_spread_view === "widening")
      return {
        view,
        alignment: "counter",
        reason: `${view.author} warns spreads widening — raises principal-loss risk.`,
      };
  }

  return { view, alignment: "neutral", reason: "" };
}

export function alignmentsForProduct(
  product: Product,
  views: MarketView[],
): ProductAlignment[] {
  return views
    .map((v) => alignmentForView(product, v))
    .filter((a) => a.alignment !== "neutral")
    .sort((a, b) => +new Date(b.view.date) - +new Date(a.view.date));
}

/** True if any market view is aligned with this product. */
export function isAlignedWithViews(product: Product, views: MarketView[]): boolean {
  return alignmentsForProduct(product, views).some((a) => a.alignment === "aligned");
}

/** True if any market view runs counter to this product. */
export function isCounterToViews(product: Product, views: MarketView[]): boolean {
  return alignmentsForProduct(product, views).some((a) => a.alignment === "counter");
}

/** Count of products in a list that any market view affects (aligned or counter). */
export function affectedCount(view: MarketView, products: Product[]): number {
  return products.filter((p) => alignmentForView(p, view).alignment !== "neutral").length;
}
