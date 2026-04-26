export interface SubScores {
  semantic: number; // 0..1
  constraints: number;
  yield_fit: number;
  exposure_fit: number;
  market_fit: number;
}

export interface RationaleBullet {
  kind: "positive" | "neutral" | "warning" | "blocker";
  text: string;
}

export interface Recommendation {
  id: string;
  product_id: string;
  asset_manager_id: string;
  score: number; // 0..100
  hard_fail: boolean;
  hard_fail_reasons: string[];
  sub_scores: SubScores;
  rationale: RationaleBullet[];
  prose_rationale?: string | null;
}
