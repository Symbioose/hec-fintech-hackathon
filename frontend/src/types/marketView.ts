export interface MarketView {
  id: string;
  date: string;
  region?: string | null;
  asset_class?: string | null;
  rates_view?: "up" | "down" | "stable" | "uncertain" | null;
  equity_view?: "bullish" | "bearish" | "neutral" | "volatile" | null;
  volatility_view?: "low" | "medium" | "high" | null;
  credit_spread_view?: "tightening" | "widening" | "stable" | null;
  text: string;
  author: string;
}
