export type ProductType =
  | "autocallable"
  | "reverse_convertible"
  | "capital_protected_note"
  | "credit_linked_note"
  | "fixed_rate_note"
  | "floating_rate_note"
  | "range_accrual"
  | "other";

export type CouponType =
  | "fixed"
  | "floating"
  | "conditional"
  | "memory"
  | "zero_coupon";

export type UnderlyingType =
  | "equity_index"
  | "single_stock"
  | "rates"
  | "credit"
  | "fx"
  | "fund"
  | "multi_asset"
  | "other";

export type AutocallFrequency =
  | "monthly"
  | "quarterly"
  | "semi_annual"
  | "annual";

export type Liquidity = "high" | "medium" | "low";
export type RiskLevel = "low" | "medium" | "medium_high" | "high";
export type SourceType = "email" | "pdf" | "chat" | "call" | "manual" | "csv";

export interface Product {
  id: string;
  issuer: string;
  product_name?: string | null;
  product_type: ProductType;
  currency: string;
  notional?: number | null;
  tenor_years?: number | null;
  maturity_date?: string | null;
  issue_date?: string | null;
  coupon?: number | null;
  coupon_type?: CouponType | null;
  underlying: string[];
  underlying_type?: UnderlyingType | null;
  barrier?: number | null;
  protection_level?: number | null;
  capital_protection: boolean;
  autocall: boolean;
  autocall_frequency?: AutocallFrequency | null;
  autocall_trigger?: number | null;
  issuer_rating?: string | null;
  liquidity?: Liquidity | null;
  estimated_cost?: number | null;
  margin?: number | null;
  risk_level?: RiskLevel | null;
  source_type?: SourceType | null;
  source_reference?: string | null;
  raw_text?: string | null;
  ingested_at: string;
  /** Optional extraction-confidence map per field (0..1). 1 = manually edited or verbatim. */
  confidence?: Record<string, number>;
}
