export type Strategy =
  | "defensive_income"
  | "balanced_income"
  | "yield_enhancement"
  | "capital_protection"
  | "opportunistic"
  | "esg_income"
  | "custom";

export type RiskAppetite = "low" | "medium" | "medium_high" | "high";
export type LiquidityNeed = "low" | "medium" | "high";

export interface AssetManagerProfile {
  id: string;
  name: string;
  firm: string;
  avatarColor: string; // semantic class suffix
  strategy: Strategy;
  risk_appetite: RiskAppetite;
  allowed_currencies: string[];
  max_tenor_years?: number | null;
  min_issuer_rating?: string | null;
  preferred_issuers: string[];
  excluded_issuers: string[];
  allowed_underlying_types: string[];
  forbidden_underlyings: string[];
  requires_capital_protection: boolean;
  max_barrier_risk?: number | null;
  target_yield_min?: number | null;
  liquidity_need?: LiquidityNeed | null;
  esg_constraints: string[];
  current_exposures: Record<string, number>; // bucket → weight 0..1
  aum_eur_m: number;
  description: string;
}
