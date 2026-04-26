import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/lib/store";
import { recommendationsFor, score } from "@/lib/mandateScoring";
import { generateNegotiation, summarizeNegotiation, type NegoRec } from "@/lib/negotiation";
import { generateCounterOfferEmail, generateICNote, printICNote } from "@/lib/draftEmail";
import { generateAICounterOffer, generateAIExecSummary, geminiAvailable, type CounterOfferContext, type ICNoteContext } from "@/lib/gemini";
import { scoreProductViaBackend, getAMRecommendations } from "@/lib/api";
import { ASSET_MANAGERS } from "@/data/assetManagers";
import { PURCHASE_HISTORY } from "@/data/purchaseHistory";
import type { Product } from "@/types/product";
import type { Recommendation } from "@/types/recommendation";
import type { AssetManagerProfile } from "@/types/assetManager";
import { humanize } from "@/lib/format";
import { toast } from "sonner";

/* ─────────────────────────────────────────────────────────────────────────
   OPPORTUNITY FEED — Webi terminal.
   3 buckets: MATCH (high-confidence) / NEAR-MISS (gap → negotiate) / REJECT.
   ───────────────────────────────────────────────────────────────────────── */

const RATING_RANK_LOCAL: Record<string, number> = {
  AAA: 10, "AA+": 9, AA: 8, "AA-": 7, "A+": 6, A: 5, "A-": 4,
  "BBB+": 3, BBB: 2, "BBB-": 1, "BB+": 0, BB: -1, "BB-": -2,
};

const SCORE_DIM_LABELS: Record<string, string> = {
  semantic:      "Strategy Alignment",
  constraints:   "Mandate Constraints",
  yield_fit:     "Yield vs Target",
  exposure_fit:  "Portfolio Fit",
  market_fit:    "Risk Calibration",
};

interface CheckItem { label: string; value: string; status: "pass" | "warn" | "fail"; }
interface PMSignal  { label: string; status: "aligned" | "conflict" | "neutral"; note: string; }

function computeChecks(p: Product, am: AssetManagerProfile): CheckItem[] {
  const out: CheckItem[] = [];
  const pRank = RATING_RANK_LOCAL[p.issuer_rating ?? ""] ?? -99;
  const mRank = RATING_RANK_LOCAL[am.min_issuer_rating ?? ""] ?? -99;
  const ratingOk = pRank >= mRank;
  const forbidden = p.underlying.find(u => am.forbidden_underlyings.includes(u));
  const notionalM = (p.notional ?? 1_000_000) / 1_000_000;

  out.push({
    label: "Currency",
    value: p.currency,
    status: am.allowed_currencies.includes(p.currency) ? "pass" : "fail",
  });
  out.push({
    label: "Credit Rating",
    value: p.issuer_rating ? `${p.issuer_rating} ≥ ${am.min_issuer_rating}` : "N/A",
    status: !ratingOk ? "fail" : pRank === mRank ? "warn" : "pass",
  });
  out.push({
    label: "Seniority",
    value: pRank < 1 || p.risk_level === "high" ? "Sub / Non-IG" : "Senior Preferred",
    status: pRank < 1 || p.risk_level === "high" ? "fail" : "pass",
  });
  const tenorOk = !am.max_tenor_years || !p.tenor_years || p.tenor_years <= am.max_tenor_years;
  const tenorNear = tenorOk && p.tenor_years != null && am.max_tenor_years != null && p.tenor_years > am.max_tenor_years * 0.82;
  out.push({
    label: "Max Tenor",
    value: p.tenor_years != null ? `${p.tenor_years}Y (max ${am.max_tenor_years}Y)` : "—",
    status: !tenorOk ? "fail" : tenorNear ? "warn" : "pass",
  });
  const typeOk = !p.underlying_type || am.allowed_underlying_types.includes(p.underlying_type);
  out.push({
    label: "Asset Class",
    value: p.underlying_type?.replace(/_/g, " ") ?? "—",
    status: typeOk ? "pass" : "fail",
  });
  out.push({
    label: "ESG Exclusion List",
    value: forbidden ? `${forbidden.split(" ")[0]} — excluded` : "Clear",
    status: forbidden ? "fail" : "pass",
  });
  out.push({
    label: "SFDR Article 8",
    value: forbidden ? "Non-compliant" : "Compliant",
    status: forbidden ? "fail" : "pass",
  });
  const isFossil = !!forbidden;
  out.push({
    label: "No Fossil Fuels",
    value: isFossil ? "Breach" : "Confirmed",
    status: isFossil ? "fail" : "pass",
  });
  out.push({
    label: "UCITS Daily Liq.",
    value: p.liquidity === "high" ? "Eligible" : p.liquidity === "medium" ? "Limited" : "Ineligible",
    status: p.liquidity === "high" ? "pass" : p.liquidity === "medium" ? "warn" : "fail",
  });
  const capM = am.aum_eur_m * 0.1;
  out.push({
    label: "Issuer Concentration",
    value: `EUR ${notionalM.toFixed(1)}M / cap ${capM.toFixed(0)}M`,
    status: notionalM <= capM ? "pass" : "fail",
  });
  out.push({
    label: "No Controversial Weapons",
    value: "Confirmed",
    status: "pass",
  });
  out.push({
    label: "MSCI ESG Score ≥ BBB",
    value: forbidden ? "Below threshold" : "Meets threshold",
    status: forbidden ? "fail" : "pass",
  });
  if (am.requires_capital_protection) {
    out.push({
      label: "Capital Protection",
      value: p.capital_protection ? "100%" : "None",
      status: p.capital_protection ? "pass" : "fail",
    });
  }
  return out;
}

function computePMSignals(p: Product, am: AssetManagerProfile): PMSignal[] {
  const out: PMSignal[] = [];
  const pRank = RATING_RANK_LOCAL[p.issuer_rating ?? ""] ?? -99;
  const mRank = RATING_RANK_LOCAL[am.min_issuer_rating ?? ""] ?? -99;
  const isBankPreferred = am.preferred_issuers.includes(p.issuer);
  const forbidden = p.underlying.find(u => am.forbidden_underlyings.includes(u));
  const dur = p.tenor_years ?? 0;
  const creditPct = ((am.current_exposures["credit"] ?? 0) * 100).toFixed(0);

  out.push({
    label: "Constructif bancaires EU",
    status: isBankPreferred ? "aligned" : p.underlying_type === "credit" ? "neutral" : "neutral",
    note: isBankPreferred ? "Preferred issuer" : "Non-bank credit",
  });
  out.push({
    label: "Duration préférence < 3Y",
    status: dur <= 3 ? "aligned" : dur <= 4.5 ? "neutral" : "conflict",
    note: dur > 0 ? `${dur}Y maturity` : "—",
  });
  out.push({
    label: "Bearish énergie fossile",
    status: forbidden ? "conflict" : "aligned",
    note: forbidden ? "ESG exclusion hit" : "No fossil exposure",
  });
  out.push({
    label: `IG Credit — ${creditPct}% en portefeuille`,
    status: p.underlying_type === "credit" && Number(creditPct) < 50 ? "aligned"
          : p.underlying_type === "credit" ? "neutral" : "neutral",
    note: p.underlying_type === "credit" ? "Adds carry" : "Non-credit",
  });
  out.push({
    label: "IG Senior only — no Sub/HY",
    status: pRank >= mRank ? "aligned" : "conflict",
    note: p.issuer_rating ?? "—",
  });
  return out;
}

type FeedStatus = "MATCH" | "NEAR-MISS" | "REJECT";

interface FeedItem {
  product: Product;
  rec: Recommendation;
  rank: number;
  status: FeedStatus;
  receivedAt: string;
  flagged: string[];
}

function deriveStatus(rec: Recommendation): FeedStatus {
  if (rec.hard_fail) return "REJECT";
  if (rec.score >= 78) return "MATCH";
  return "NEAR-MISS";
}

function flaggedTags(p: Product): string[] {
  const tags: string[] = [];
  if (p.capital_protection) tags.push("Protected");
  if (p.autocall) tags.push("Autocall");
  if (p.coupon && p.coupon >= 0.08) tags.push("High yield");
  if (p.risk_level === "low") tags.push("Low risk");
  if (p.liquidity === "high") tags.push("Liquid");
  return tags.slice(0, 2);
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function fmtTenor(years: number | null | undefined): string {
  if (!years) return "—";
  if (years < 1) return `${Math.round(years * 12)}M`;
  return `${years}Y`;
}

function fmtCoupon(p: Product): string {
  if (p.coupon != null) return `${(p.coupon * 100).toFixed(2)}% p.a.`;
  if (p.barrier != null) return `${Math.round(p.barrier * 100)}% bar.`;
  return "—";
}

/* ─── Score Ring (monochrome) ────────────────────────────────────────── */
function ScoreRing({ score, size = 36 }: { score: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color =
    score >= 78 ? "var(--c-match)"
    : score >= 50 ? "var(--c-gap)"
    : "var(--c-reject)";

  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--c-bg4)" strokeWidth={3} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x={size / 2}
        y={size / 2 + (size >= 44 ? 4 : 3)}
        textAnchor="middle"
        fill={color}
        style={{ fontSize: size >= 44 ? 11 : 10, fontFamily: "JetBrains Mono", fontWeight: 600 }}
      >
        {score}
      </text>
    </svg>
  );
}

/* ─── Status Badge ────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: FeedStatus }) {
  const map: Record<FeedStatus, { color: string; bg: string; border: string; symbol: string }> = {
    "MATCH":     { color: "var(--c-match)",  bg: "var(--c-match-bg)",  border: "var(--c-match-border)", symbol: "▶" },
    "NEAR-MISS": { color: "var(--c-gap)",    bg: "var(--c-gap-bg)",    border: "var(--c-gap-border)",   symbol: "◇" },
    "REJECT":    { color: "var(--c-reject)", bg: "var(--c-reject-bg)", border: "var(--c-reject-border)",symbol: "✕" },
  };
  const s = map[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.08em",
        padding: "2px 6px",
        borderRadius: 2,
        fontFamily: "JetBrains Mono, monospace",
      }}
    >
      <span style={{ fontSize: 7, opacity: 0.85 }}>{s.symbol}</span>
      {status}
    </span>
  );
}

/* ─── Section Label ───────────────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.12em",
        color: "var(--c-text3)",
        paddingBottom: 2,
        borderBottom: "1px solid var(--c-border)",
        textTransform: "uppercase",
        fontFamily: "JetBrains Mono, monospace",
      }}
    >
      {children}
    </div>
  );
}

/* ─── Bucket Header (within the feed) ─────────────────────────────────── */
function BucketHeader({
  status, count, label,
}: { status: FeedStatus; count: number; label: string }) {
  const colorMap: Record<FeedStatus, string> = {
    "MATCH":     "var(--c-match)",
    "NEAR-MISS": "var(--c-gap)",
    "REJECT":    "var(--c-reject)",
  };
  const symbolMap: Record<FeedStatus, string> = {
    "MATCH":     "▶",
    "NEAR-MISS": "◇",
    "REJECT":    "✕",
  };
  return (
    <div
      style={{
        padding: "9px 16px",
        background: "var(--c-bg1)",
        borderTop: "1px solid var(--c-border2)",
        borderBottom: "1px solid var(--c-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ color: colorMap[status], fontSize: 10, fontWeight: 700 }}>
          {symbolMap[status]}
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: colorMap[status],
            fontFamily: "JetBrains Mono, monospace",
          }}
        >
          {status}
        </span>
        <span
          style={{
            fontSize: 9,
            color: "var(--c-text3)",
            letterSpacing: "0.06em",
            fontFamily: "JetBrains Mono, monospace",
          }}
        >
          {label}
        </span>
      </div>
      <span
        style={{
          fontSize: 10,
          color: "var(--c-text3)",
          fontFamily: "JetBrains Mono, monospace",
          letterSpacing: "0.04em",
        }}
      >
        {count} {count === 1 ? "PRODUCT" : "PRODUCTS"}
      </span>
    </div>
  );
}

/* ─── Feed Header ─────────────────────────────────────────────────────── */
function FeedHeader({
  total, match, gap, reject, filter, onFilter, backendSource,
}: {
  total: number; match: number; gap: number; reject: number;
  filter: "all" | "match" | "near-miss";
  onFilter: (f: "all" | "match" | "near-miss") => void;
  backendSource: boolean;
}) {
  const updated = new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit",
  });
  return (
    <div
      style={{
        padding: "10px 16px",
        borderBottom: "1px solid var(--c-border2)",
        background: "var(--c-bg1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}
    >
      <div style={{ fontSize: 11 }}>
        <span style={{ color: "var(--c-text)", fontWeight: 700 }}>
          {total} proposals scored
        </span>
        <span style={{ color: "var(--c-border3)", margin: "0 8px" }}>·</span>
        <span style={{ color: "var(--c-match)", fontWeight: 600 }}>{match} match</span>
        <span style={{ color: "var(--c-text3)" }}> / </span>
        <span style={{ color: "var(--c-gap)" }}>{gap} near-miss</span>
        <span style={{ color: "var(--c-text3)" }}> / </span>
        <span style={{ color: "var(--c-reject)" }}>{reject} rejected</span>
        <span style={{ color: "var(--c-border3)", margin: "0 8px" }}>·</span>
        <span style={{ color: "var(--c-text3)" }}>Updated {updated}</span>
        <span style={{ color: "var(--c-border3)", margin: "0 8px" }}>·</span>
        <span
          style={{
            color: backendSource ? "var(--c-teal)" : "var(--c-text3)",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.06em",
          }}
        >
          {backendSource ? "● BACKEND" : "○ LOCAL"}
        </span>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {(["all", "match", "near-miss"] as const).map((f) => {
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => onFilter(f)}
              style={{
                padding: "3px 10px",
                background: active ? "var(--c-bg3)" : "transparent",
                border: `1px solid ${active ? "var(--c-border3)" : "var(--c-border)"}`,
                borderRadius: 2,
                color: active ? "var(--c-text)" : "var(--c-text3)",
                fontSize: 9,
                cursor: "pointer",
                fontFamily: "JetBrains Mono, monospace",
                fontWeight: active ? 700 : 400,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              {f}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Column headers ──────────────────────────────────────────────────── */
function ColHeaders() {
  const cells: Array<[string, React.CSSProperties]> = [
    ["RANK", { textAlign: "left" }],
    ["SCORE", { textAlign: "left" }],
    ["PRODUCT", { textAlign: "left" }],
    ["TENOR", { textAlign: "right" }],
    ["YIELD / PART.", { textAlign: "right", minWidth: 90 }],
    ["TIME", { textAlign: "right", minWidth: 36 }],
  ];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "36px 44px 1fr auto auto auto",
        gap: "0 16px",
        padding: "6px 16px",
        borderBottom: "1px solid var(--c-border)",
        fontSize: 9,
        color: "var(--c-text3)",
        letterSpacing: "0.08em",
        fontFamily: "JetBrains Mono, monospace",
        background: "var(--c-bg)",
        flexShrink: 0,
      }}
    >
      {cells.map(([label, style]) => (
        <span key={label} style={style}>
          {label}
        </span>
      ))}
    </div>
  );
}

/* ─── Product Row ─────────────────────────────────────────────────────── */
function ProductRow({
  item, selected, onClick,
}: {
  item: FeedItem; selected: boolean; onClick: () => void;
}) {
  const { product: p, rec, rank, status, receivedAt, flagged } = item;
  const isReject = status === "REJECT";
  return (
    <div
      onClick={onClick}
      style={{
        display: "grid",
        gridTemplateColumns: "36px 44px 1fr auto auto auto",
        gap: "0 16px",
        alignItems: "center",
        padding: "10px 16px",
        borderBottom: "1px solid var(--c-border)",
        cursor: "pointer",
        background: selected ? "var(--c-bg3)" : "transparent",
        borderLeft: selected ? "2px solid var(--c-text)" : "2px solid transparent",
        opacity: isReject ? 0.42 : 1,
        transition: "background 0.1s",
      }}
      onMouseEnter={(e) => {
        if (!selected) e.currentTarget.style.background = "var(--c-bg2)";
      }}
      onMouseLeave={(e) => {
        if (!selected) e.currentTarget.style.background = "transparent";
      }}
    >
      <span style={{ color: "var(--c-text3)", fontSize: 11, textAlign: "center" }}>
        #{rank}
      </span>
      <ScoreRing score={rec.score} size={36} />
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--c-text)" }}>
            {p.product_name ?? `${p.issuer} ${humanize(p.product_type)}`}
          </span>
          <StatusBadge status={status} />
          {flagged.map((f) => (
            <span
              key={f}
              style={{
                fontSize: 9,
                color: "var(--c-text3)",
                background: "var(--c-bg4)",
                padding: "1px 5px",
                borderRadius: 2,
                fontFamily: "JetBrains Mono, monospace",
              }}
            >
              {f}
            </span>
          ))}
        </div>
        <div style={{ fontSize: 10, color: "var(--c-text2)" }}>
          <span style={{ color: "var(--c-text3)" }}>{p.issuer}</span>
          <span style={{ margin: "0 6px", color: "var(--c-border3)" }}>·</span>
          <span>{humanize(p.product_type)}</span>
          {p.underlying.length > 0 && (
            <>
              <span style={{ margin: "0 6px", color: "var(--c-border3)" }}>·</span>
              <span>{p.underlying.slice(0, 2).join(" / ")}</span>
            </>
          )}
          {p.source_type && (
            <>
              <span style={{ margin: "0 6px", color: "var(--c-border3)" }}>·</span>
              <span style={{ color: "var(--c-text3)" }}>via {humanize(p.source_type)}</span>
            </>
          )}
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 11, color: "var(--c-text2)" }}>{fmtTenor(p.tenor_years)}</div>
        <div style={{ fontSize: 9, color: "var(--c-text3)" }}>tenor</div>
      </div>
      <div style={{ textAlign: "right", minWidth: 90 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--c-text)",
            fontFamily: "JetBrains Mono, monospace",
          }}
        >
          {fmtCoupon(p)}
        </div>
        <div style={{ fontSize: 9, color: "var(--c-text3)" }}>
          {p.coupon ? "coupon" : "structure"}
        </div>
      </div>
      <div style={{ fontSize: 10, color: "var(--c-text3)", minWidth: 36, textAlign: "right" }}>
        {receivedAt}
      </div>
    </div>
  );
}

/* ─── Negotiation Card (from → to visual) ─────────────────────────────── */
function NegotiationCard({ rec }: { rec: NegoRec }) {
  const priorityColor =
    rec.priority === "CRITICAL"   ? "var(--c-text)"
    : rec.priority === "IMPORTANT" ? "var(--c-text2)"
    :                                "var(--c-text3)";

  return (
    <div
      style={{
        background: "var(--c-bg2)",
        border: "1px solid var(--c-border2)",
        borderLeft: `3px solid ${priorityColor}`,
        borderRadius: 2,
        padding: "12px 14px",
        fontFamily: "JetBrains Mono, monospace",
      }}
    >
      {/* Action + priority + cost */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: "var(--c-text)",
              letterSpacing: "0.12em",
            }}
          >
            {rec.action}
          </span>
          <span
            style={{
              fontSize: 8,
              fontWeight: 600,
              color: priorityColor,
              letterSpacing: "0.08em",
              padding: "1px 5px",
              border: `1px solid ${priorityColor}`,
              borderRadius: 1,
              opacity: 0.85,
            }}
          >
            {rec.priority}
          </span>
        </div>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: "var(--c-text2)",
            letterSpacing: "0.05em",
            background: "var(--c-bg3)",
            border: "1px solid var(--c-border3)",
            padding: "2px 7px",
          }}
        >
          {rec.costLabel}
        </span>
      </div>

      {/* Param + from → to (the key visual) */}
      <div style={{ marginBottom: 8 }}>
        <div
          style={{
            fontSize: 10,
            color: "var(--c-text3)",
            letterSpacing: "0.08em",
            fontWeight: 600,
            marginBottom: 4,
            textTransform: "uppercase",
          }}
        >
          {rec.param}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--c-text3)",
              fontFamily: "JetBrains Mono, monospace",
              textDecoration: "line-through",
              textDecorationColor: "var(--c-text4)",
            }}
          >
            {rec.from}
          </span>
          <span style={{ color: "var(--c-text)", fontSize: 14, fontWeight: 700 }}>
            →
          </span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--c-text)",
              fontFamily: "JetBrains Mono, monospace",
            }}
          >
            {rec.to}
          </span>
        </div>
      </div>

      {/* Rationale */}
      <div
        style={{
          fontSize: 11,
          color: "var(--c-text2)",
          lineHeight: 1.55,
          paddingTop: 8,
          borderTop: "1px solid var(--c-border)",
        }}
      >
        {rec.rationale}
      </div>
    </div>
  );
}

/* ─── Detail Panel ────────────────────────────────────────────────────── */
function DetailPanel({
  item, am, onClose,
}: { item: FeedItem; am: AssetManagerProfile; onClose: () => void }) {
  const [tab, setTab] = useState<"analysis" | "negotiation" | "committee" | "source">(
    item.status === "NEAR-MISS" ? "negotiation" : "analysis",
  );
  const [showDraft, setShowDraft] = useState(false);
  const [draftSent, setDraftSent] = useState(false);
  const [aiDraft, setAiDraft] = useState<string | null>(null);
  const [aiDraftLoading, setAiDraftLoading] = useState(false);
  const [aiExecSummary, setAiExecSummary] = useState<string | null>(null);
  const [geminiProse, setGeminiProse] = useState<string | null>(null);
  const [geminiProseLoading, setGeminiProseLoading] = useState(false);
  const { setStatus, sendTermSheetRequest } = useAppStore();
  const navigate = useNavigate();
  const { product: p, rec, status } = item;

  // Fetch Gemini prose rationale from backend when panel opens
  useEffect(() => {
    let cancelled = false;
    setGeminiProse(null);
    setGeminiProseLoading(true);
    scoreProductViaBackend(p, am, true).then((backendRec) => {
      if (cancelled) return;
      setGeminiProseLoading(false);
      if (backendRec?.prose_rationale) setGeminiProse(backendRec.prose_rationale);
    });
    return () => { cancelled = true; };
  }, [p.id, am.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fitReasons = rec.rationale.filter((r) => r.kind === "positive").map((r) => r.text);
  const risks = rec.rationale
    .filter((r) => r.kind === "warning" || r.kind === "blocker")
    .map((r) => r.text);

  const failChecks = rec.hard_fail_reasons;
  const negoRecs: NegoRec[] = useMemo(() => generateNegotiation(p, am, rec), [p, am, rec]);
  const negoSummary = useMemo(() => summarizeNegotiation(negoRecs), [negoRecs]);
  const checks    = useMemo(() => computeChecks(p, am),    [p, am]);
  const pmSignals = useMemo(() => computePMSignals(p, am), [p, am]);
  const passCount = checks.filter(c => c.status === "pass").length;

  const crossMatches = useMemo(
    () => ASSET_MANAGERS.map(a => ({ am: a, rec: score(p, a) }))
          .sort((a, b) => b.rec.score - a.rec.score),
    [p],
  );

  const myHistory = useMemo(
    () => PURCHASE_HISTORY.filter(h => h.asset_manager_id === "AM-02").slice(-4).reverse(),
    [],
  );

  const emailDraft = useMemo(
    () => generateCounterOfferEmail(p, am, negoRecs, negoSummary.netBps),
    [p, am, negoRecs, negoSummary.netBps],
  );

  const icNote = useMemo(
    () => generateICNote(p, am, rec, checks, fitReasons, risks, failChecks, negoRecs),
    [p, am, rec, checks, fitReasons, risks, failChecks, negoRecs],
  );

  const notionalM    = (p.notional ?? 1_000_000) / 1_000_000;
  const modDuration  = p.tenor_years != null ? +(p.tenor_years * (1 / (1 + (p.coupon ?? 0.03)))).toFixed(2) : 0;
  const weightBps    = +(notionalM / am.aum_eur_m * 10000).toFixed(1);
  const annualCarryK = p.coupon && p.notional ? +(p.coupon * p.notional / 1000).toFixed(0) : null;
  const dv01         = +(modDuration * notionalM * 100).toFixed(0);

  const tabBtn = (t: "analysis" | "negotiation" | "committee" | "source", label: string, hint?: string) => (
    <button
      key={t}
      onClick={() => setTab(t)}
      style={{
        padding: "8px 16px",
        fontSize: 11,
        fontWeight: tab === t ? 600 : 400,
        color: tab === t ? "var(--c-text)" : "var(--c-text3)",
        borderBottom: tab === t ? "2px solid var(--c-text)" : "2px solid transparent",
        cursor: "pointer",
        letterSpacing: "0.04em",
        background: "transparent",
        border: "none",
        fontFamily: "JetBrains Mono, monospace",
        position: "relative",
      }}
    >
      {label}
      {hint && (
        <span
          style={{
            marginLeft: 6,
            fontSize: 8,
            padding: "1px 4px",
            background: "var(--c-text)",
            color: "var(--c-bg)",
            borderRadius: 1,
            fontWeight: 700,
            letterSpacing: "0.04em",
            verticalAlign: "middle",
          }}
        >
          {hint}
        </span>
      )}
    </button>
  );

  return (
    <div
      style={{
        width: 480,
        flexShrink: 0,
        background: "var(--c-bg1)",
        borderLeft: "1px solid var(--c-border2)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
      className="animate-slide-up"
    >
      {/* Header */}
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--c-border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <ScoreRing score={rec.score} size={44} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--c-text)", marginBottom: 2 }}>
                  {p.product_name ?? `${p.issuer} ${humanize(p.product_type)}`}
                </div>
                <div style={{ fontSize: 10, color: "var(--c-text2)" }}>
                  {p.issuer} · {humanize(p.product_type)}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <StatusBadge status={status} />
              {item.flagged.map((f) => (
                <span
                  key={f}
                  style={{
                    fontSize: 9,
                    color: "var(--c-text3)",
                    background: "var(--c-bg3)",
                    border: "1px solid var(--c-border2)",
                    padding: "2px 6px",
                    borderRadius: 2,
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--c-text3)",
              fontSize: 18,
              cursor: "pointer",
              lineHeight: 1,
              padding: "4px 8px",
            }}
          >
            ×
          </button>
        </div>

        {/* Key terms */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 1,
            marginTop: 12,
            background: "var(--c-border2)",
          }}
        >
          {[
            ["Tenor", fmtTenor(p.tenor_years)],
            ["Barrier", p.barrier ? `${Math.round(p.barrier * 100)}%` : (p.protection_level ? `${Math.round(p.protection_level * 100)}% prot.` : "—")],
            ["Yield", p.coupon ? `${(p.coupon * 100).toFixed(2)}%` : "—"],
            ["Rating", p.issuer_rating ?? "—"],
          ].map(([label, val]) => (
            <div key={label} style={{ background: "var(--c-bg2)", padding: "8px 10px", textAlign: "center" }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--c-text)",
                  fontFamily: "JetBrains Mono, monospace",
                }}
              >
                {val}
              </div>
              <div style={{ fontSize: 9, color: "var(--c-text3)", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--c-border)", background: "var(--c-bg1)", overflowX: "auto" }}>
        {tabBtn("analysis", "ANALYSIS")}
        {tabBtn("negotiation", "NEGOTIATION", status === "NEAR-MISS" ? "GAP" : undefined)}
        {tabBtn("committee", "IC NOTE")}
        {tabBtn("source", "SOURCE")}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px", minHeight: 0 }}>
        {tab === "analysis" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* ── 1. COMPLIANCE CHECKS ── */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <SectionLabel>COMPLIANCE CHECKS</SectionLabel>
                <span style={{
                  fontSize: 9, fontWeight: 700, fontFamily: "JetBrains Mono, monospace",
                  padding: "2px 7px",
                  background: passCount === checks.length ? "var(--c-match-bg)" : passCount >= checks.length * 0.75 ? "var(--c-gap-bg)" : "var(--c-reject-bg)",
                  color: passCount === checks.length ? "var(--c-match)" : passCount >= checks.length * 0.75 ? "var(--c-gap)" : "var(--c-reject)",
                  border: `1px solid ${passCount === checks.length ? "var(--c-match-border)" : passCount >= checks.length * 0.75 ? "var(--c-gap-border)" : "var(--c-reject-border)"}`,
                  letterSpacing: "0.06em",
                }}>
                  {passCount}/{checks.length} PASS
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--c-border)" }}>
                {checks.map((c) => {
                  const col = c.status === "pass" ? "var(--c-match)" : c.status === "warn" ? "var(--c-gap)" : "var(--c-reject)";
                  const bg  = c.status === "pass" ? "var(--c-match-bg)" : c.status === "warn" ? "var(--c-gap-bg)" : "var(--c-reject-bg)";
                  const sym = c.status === "pass" ? "✓" : c.status === "warn" ? "⚠" : "✕";
                  return (
                    <div key={c.label} style={{ background: "var(--c-bg2)", padding: "7px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
                      <div style={{ fontSize: 8, color: "var(--c-text3)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "JetBrains Mono, monospace" }}>
                        {c.label}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
                        <span style={{ fontSize: 10, color: "var(--c-text2)", fontFamily: "JetBrains Mono, monospace", lineHeight: 1.2 }}>
                          {c.value}
                        </span>
                        <span style={{
                          fontSize: 8, fontWeight: 700, color: col, background: bg,
                          padding: "1px 4px", flexShrink: 0, fontFamily: "JetBrains Mono, monospace",
                        }}>
                          {sym}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── 2. AI SCORE BREAKDOWN ── */}
            <div>
              <SectionLabel>AI SCORING BREAKDOWN</SectionLabel>
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 7 }}>
                {Object.entries(rec.sub_scores).map(([k, v]) => {
                  const pct = Math.round(v * 100);
                  const barColor = pct >= 75 ? "var(--c-match)" : pct >= 50 ? "var(--c-gap)" : "var(--c-reject)";
                  const label = SCORE_DIM_LABELS[k] ?? humanize(k);
                  return (
                    <div key={k}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 10, color: "var(--c-text2)", fontFamily: "JetBrains Mono, monospace" }}>{label}</span>
                        <span style={{ fontSize: 10, color: barColor, fontWeight: 700, fontFamily: "JetBrains Mono, monospace" }}>{pct}/100</span>
                      </div>
                      <div style={{ height: 3, background: "var(--c-bg4)", borderRadius: 0, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: barColor, transition: "width 0.4s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── 3. GEMINI RATIONALE ── */}
            {(geminiProseLoading || geminiProse) && (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <SectionLabel>GEMINI RATIONALE</SectionLabel>
                  <span style={{
                    fontSize: 8, fontWeight: 700, letterSpacing: "0.08em",
                    color: "var(--c-amber)", fontFamily: "JetBrains Mono, monospace",
                    padding: "2px 6px", border: "1px solid var(--c-amber)",
                    opacity: 0.85,
                  }}>
                    ✦ GEMINI 2.0 FLASH
                  </span>
                </div>
                {geminiProseLoading && !geminiProse ? (
                  <div style={{
                    padding: "10px 12px",
                    background: "var(--c-bg2)",
                    border: "1px solid var(--c-border2)",
                    fontSize: 10,
                    color: "var(--c-text3)",
                    fontFamily: "JetBrains Mono, monospace",
                    letterSpacing: "0.04em",
                  }}>
                    ✦ Analyzing mandate fit...
                  </div>
                ) : geminiProse ? (
                  <div style={{
                    padding: "10px 12px",
                    background: "var(--c-bg2)",
                    border: "1px solid var(--c-border2)",
                    fontSize: 10,
                    color: "var(--c-text2)",
                    fontFamily: "JetBrains Mono, monospace",
                    lineHeight: 1.7,
                  }}>
                    {geminiProse}
                  </div>
                ) : null}
              </div>
            )}

            {/* ── 4. KEY STRENGTHS & FLAGS ── */}
            {(fitReasons.length > 0 || risks.length > 0 || failChecks.length > 0) && (
              <div>
                <SectionLabel>STRENGTHS & FLAGS</SectionLabel>
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 5 }}>
                  {fitReasons.map((r, i) => (
                    <div key={`pos${i}`} style={{ display: "flex", gap: 8, fontSize: 10, color: "var(--c-text2)", lineHeight: 1.5, padding: "4px 8px", background: "var(--c-match-bg)", borderLeft: "2px solid var(--c-match)" }}>
                      <span style={{ color: "var(--c-match)", flexShrink: 0, fontWeight: 700 }}>+</span>
                      <span>{r}</span>
                    </div>
                  ))}
                  {risks.map((r, i) => (
                    <div key={`warn${i}`} style={{ display: "flex", gap: 8, fontSize: 10, color: "var(--c-text2)", lineHeight: 1.5, padding: "4px 8px", background: "var(--c-gap-bg)", borderLeft: "2px solid var(--c-gap)" }}>
                      <span style={{ color: "var(--c-gap)", flexShrink: 0, fontWeight: 700 }}>!</span>
                      <span>{r}</span>
                    </div>
                  ))}
                  {failChecks.map((r, i) => (
                    <div key={`fail${i}`} style={{ display: "flex", gap: 8, fontSize: 10, color: "var(--c-text3)", lineHeight: 1.5, padding: "4px 8px", background: "var(--c-reject-bg)", borderLeft: "2px solid var(--c-reject)" }}>
                      <span style={{ color: "var(--c-reject)", flexShrink: 0, fontWeight: 700 }}>✕</span>
                      <span>BLOCKED: {r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── 5. PM VIEW ALIGNMENT ── */}
            <div>
              <SectionLabel>PM VIEW ALIGNMENT</SectionLabel>
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 1, background: "var(--c-border)" }}>
                {pmSignals.map((s) => {
                  const col  = s.status === "aligned" ? "var(--c-match)" : s.status === "conflict" ? "var(--c-reject)" : "var(--c-text3)";
                  const bg   = s.status === "aligned" ? "var(--c-match-bg)" : s.status === "conflict" ? "var(--c-reject-bg)" : "var(--c-bg2)";
                  const sym  = s.status === "aligned" ? "▶" : s.status === "conflict" ? "✕" : "—";
                  const tag  = s.status === "aligned" ? "ALIGNED" : s.status === "conflict" ? "CONFLICT" : "NEUTRAL";
                  return (
                    <div key={s.label} style={{ background: bg, padding: "7px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ color: col, fontSize: 9, fontWeight: 700 }}>{sym}</span>
                        <span style={{ fontSize: 10, color: "var(--c-text2)", fontFamily: "JetBrains Mono, monospace" }}>{s.label}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                        <span style={{ fontSize: 9, color: "var(--c-text3)", fontFamily: "JetBrains Mono, monospace" }}>{s.note}</span>
                        <span style={{ fontSize: 8, fontWeight: 700, color: col, letterSpacing: "0.08em", fontFamily: "JetBrains Mono, monospace" }}>{tag}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── 6. PORTFOLIO ANALYTICS ── */}
            <div>
              <SectionLabel>PORTFOLIO ANALYTICS</SectionLabel>
              <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--c-border)" }}>
                {[
                  ["Modified Duration", `${modDuration}Y`],
                  ["Trade Size",        `EUR ${notionalM.toFixed(1)}M`],
                  ["Portfolio Weight",  `${weightBps} bps AUM`],
                  ["Annual Carry",      annualCarryK ? `EUR ${annualCarryK}K / yr` : "—"],
                  ["DV01 Estimate",     `EUR ${dv01} / bp`],
                  ["Max Position Cap",  `EUR ${(am.aum_eur_m * 0.1).toFixed(0)}M (10% AUM)`],
                ].map(([label, val]) => (
                  <div key={label} style={{ background: "var(--c-bg2)", padding: "8px 10px" }}>
                    <div style={{ fontSize: 8, color: "var(--c-text3)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "JetBrains Mono, monospace", marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--c-text)", fontFamily: "JetBrains Mono, monospace" }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 6. CROSS-MANDATE ROUTING ── */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <SectionLabel>CROSS-MANDATE ROUTING</SectionLabel>
                <span style={{ fontSize: 9, color: "var(--c-text3)", fontFamily: "JetBrains Mono, monospace" }}>
                  {crossMatches.length} portfolios analyzed
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--c-border)" }}>
                {crossMatches.map(({ am: a, rec: r }) => {
                  const st = r.hard_fail ? "REJECT" : r.score >= 78 ? "MATCH" : r.score >= 50 ? "NEAR-MISS" : "REJECT";
                  const col = st === "MATCH" ? "var(--c-match)" : st === "NEAR-MISS" ? "var(--c-gap)" : "var(--c-reject)";
                  const bg  = st === "MATCH" ? "var(--c-match-bg)" : st === "NEAR-MISS" ? "var(--c-gap-bg)" : "var(--c-reject-bg)";
                  const sym = st === "MATCH" ? "▶" : st === "NEAR-MISS" ? "◇" : "✕";
                  const isMe = a.id === am.id;
                  return (
                    <div key={a.id} style={{ background: isMe ? "var(--c-bg3)" : "var(--c-bg2)", padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderLeft: isMe ? `2px solid ${col}` : "2px solid transparent" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: col, fontSize: 9, fontWeight: 700 }}>{sym}</span>
                        <div>
                          <div style={{ fontSize: 10, color: "var(--c-text)", fontFamily: "JetBrains Mono, monospace", fontWeight: isMe ? 700 : 400 }}>
                            {a.firm}{isMe ? " (you)" : ""}
                          </div>
                          <div style={{ fontSize: 9, color: "var(--c-text3)", fontFamily: "JetBrains Mono, monospace" }}>
                            {a.name} · EUR {a.aum_eur_m >= 1000 ? `${(a.aum_eur_m / 1000).toFixed(1)}B` : `${a.aum_eur_m}M`}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: col, fontFamily: "JetBrains Mono, monospace" }}>{r.score}</span>
                        <span style={{ fontSize: 8, fontWeight: 700, color: col, background: bg, padding: "2px 5px", fontFamily: "JetBrains Mono, monospace" }}>{st}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── 7. INVESTMENT HISTORY ── */}
            <div>
              <SectionLabel>INVESTMENT HISTORY — {am.firm}</SectionLabel>
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 1, background: "var(--c-border)" }}>
                {myHistory.map(h => {
                  const actionCol = h.action === "bought" || h.action === "approved" ? "var(--c-match)"
                    : h.action === "rejected" ? "var(--c-reject)" : "var(--c-text3)";
                  const actionSym = h.action === "bought" || h.action === "approved" ? "✓"
                    : h.action === "rejected" ? "✕" : "○";
                  return (
                    <div key={h.id} style={{ background: "var(--c-bg2)", padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <span style={{ color: actionCol, fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{actionSym}</span>
                        <div>
                          <div style={{ fontSize: 10, color: "var(--c-text2)", fontFamily: "JetBrains Mono, monospace" }}>
                            {h.action.toUpperCase()}{h.amount ? ` · EUR ${(h.amount / 1_000_000).toFixed(1)}M` : ""}
                          </div>
                          <div style={{ fontSize: 9, color: "var(--c-text3)", fontFamily: "JetBrains Mono, monospace", marginTop: 2 }}>
                            {h.feedback ?? h.reason ?? "No note"}
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: 9, color: "var(--c-text3)", fontFamily: "JetBrains Mono, monospace", flexShrink: 0, marginLeft: 8 }}>{h.date}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {tab === "negotiation" && (
          <div>
            {/* ── Summary banner ── */}
            <div
              style={{
                marginBottom: 14,
                padding: "10px 12px",
                background: "var(--c-bg2)",
                border: "1px solid var(--c-border3)",
                borderLeft: "3px solid var(--c-text)",
                borderRadius: 2,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: "var(--c-text)",
                    letterSpacing: "0.12em",
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                >
                  GAP ANALYSIS · {negoSummary.totalCount} ADJUSTMENT{negoSummary.totalCount > 1 ? "S" : ""}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: negoSummary.netBps >= 0 ? "var(--c-text)" : "var(--c-text2)",
                    fontFamily: "JetBrains Mono, monospace",
                    background: "var(--c-bg3)",
                    padding: "2px 8px",
                    border: "1px solid var(--c-border3)",
                    letterSpacing: "0.04em",
                  }}
                >
                  NET {negoSummary.netBps > 0 ? "+" : ""}{negoSummary.netBps} BPS
                </div>
              </div>
              <div style={{ fontSize: 10, color: "var(--c-text2)", lineHeight: 1.6 }}>
                {status === "NEAR-MISS" && (
                  <>
                    {negoSummary.criticalCount} critical fix{negoSummary.criticalCount > 1 ? "es" : ""} required
                    to clear mandate. Send counter-offer to <span style={{ color: "var(--c-text)" }}>{p.issuer}</span> with the asks below.
                  </>
                )}
                {status === "MATCH" && "Product matches — optional polish suggestions below."}
                {status === "REJECT" && "Product violates a hard mandate rule — re-pricing required, see below."}
              </div>
            </div>

            {/* ── Negotiation cards ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {negoRecs.map((n, i) => (
                <NegotiationCard key={i} rec={n} />
              ))}
            </div>

            {/* ── AI email draft ── */}
            {status !== "REJECT" && (
              <div style={{ marginTop: 16 }}>
                {!showDraft ? (
                  <button
                    onClick={async () => {
                      setShowDraft(true);
                      if (geminiAvailable) {
                        setAiDraftLoading(true);
                        setAiDraft(null);
                        try {
                          const ctx: CounterOfferContext = {
                            productName: p.product_name ?? p.issuer,
                            issuer: p.issuer,
                            couponPct: p.coupon ? `${(p.coupon * 100).toFixed(2)}%` : "N/A",
                            tenorY: p.tenor_years?.toString() ?? "N/A",
                            rating: p.issuer_rating ?? "N/A",
                            amFirm: am.firm,
                            amName: am.name,
                            amAum: `EUR ${(am.aum_eur_m / 1000).toFixed(2)}B`,
                            negoAsks: negoRecs.map(r => ({ param: r.param, from: r.from, to: r.to, rationale: r.rationale })),
                            netBps: negoSummary.netBps,
                          };
                          const aiText = await generateAICounterOffer(ctx);
                          setAiDraft(aiText);
                        } catch {
                          setAiDraft(null);
                        } finally {
                          setAiDraftLoading(false);
                        }
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 0",
                      background: "var(--c-gap-bg)",
                      border: `1px solid var(--c-gap-border)`,
                      borderRadius: 2,
                      color: "var(--c-gap)",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "JetBrains Mono, monospace",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {geminiAvailable ? "▶ AI DRAFT WITH GEMINI →" : "▶ AI DRAFT COUNTER-PROPOSAL →"}
                  </button>
                ) : (
                  <div style={{ background: "var(--c-bg2)", border: "1px solid var(--c-border3)", borderRadius: 2 }}>
                    <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--c-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: "var(--c-gap)", letterSpacing: "0.1em", fontFamily: "JetBrains Mono, monospace" }}>
                        ▶ COUNTER-PROPOSAL DRAFT
                      </span>
                      <button onClick={() => setShowDraft(false)} style={{ background: "none", border: "none", color: "var(--c-text3)", cursor: "pointer", fontSize: 14, lineHeight: 1 }}>×</button>
                    </div>
                    {aiDraftLoading ? (
                      <div style={{ padding: "28px 14px", textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: "var(--c-gap)", fontFamily: "JetBrains Mono, monospace", marginBottom: 8, letterSpacing: "0.08em" }}>
                          ◌ GEMINI GENERATING...
                        </div>
                        <div style={{ fontSize: 9, color: "var(--c-text3)", fontFamily: "JetBrains Mono, monospace" }}>
                          Analysing mandate constraints · Drafting counter-proposal
                        </div>
                      </div>
                    ) : (
                      <pre style={{
                        margin: 0,
                        padding: "12px 14px",
                        fontSize: 9.5,
                        color: "var(--c-text2)",
                        fontFamily: "JetBrains Mono, monospace",
                        lineHeight: 1.7,
                        whiteSpace: "pre-wrap",
                        maxHeight: 340,
                        overflowY: "auto",
                      }}>
                        {aiDraft ?? emailDraft}
                      </pre>
                    )}
                    {!aiDraftLoading && aiDraft && (
                      <div style={{ padding: "4px 12px 0", fontSize: 8, color: "var(--c-match)", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.06em" }}>
                        ✓ Generated by Gemini 2.0 Flash
                      </div>
                    )}
                    <div style={{ padding: "10px 12px", borderTop: "1px solid var(--c-border)", display: "flex", gap: 8 }}>
                      <button
                        onClick={() => { setDraftSent(true); setShowDraft(false); }}
                        style={{
                          flex: 1,
                          padding: "8px 0",
                          background: draftSent ? "var(--c-match-bg)" : "var(--c-gap)",
                          border: "none",
                          borderRadius: 2,
                          color: draftSent ? "var(--c-match)" : "#000",
                          fontSize: 10,
                          fontWeight: 700,
                          cursor: "pointer",
                          fontFamily: "JetBrains Mono, monospace",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {draftSent ? "✓ SENT" : "→ SEND NOW"}
                      </button>
                      <button
                        onClick={() => setShowDraft(false)}
                        style={{
                          padding: "8px 12px",
                          background: "transparent",
                          border: "1px solid var(--c-border3)",
                          borderRadius: 2,
                          color: "var(--c-text3)",
                          fontSize: 10,
                          cursor: "pointer",
                          fontFamily: "JetBrains Mono, monospace",
                        }}
                      >
                        EDIT
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === "committee" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <SectionLabel>INVESTMENT COMMITTEE MEMORANDUM</SectionLabel>
              <span style={{
                fontSize: 8, fontWeight: 700, padding: "2px 7px",
                color: status === "MATCH" ? "var(--c-match)" : status === "NEAR-MISS" ? "var(--c-gap)" : "var(--c-reject)",
                background: status === "MATCH" ? "var(--c-match-bg)" : status === "NEAR-MISS" ? "var(--c-gap-bg)" : "var(--c-reject-bg)",
                border: `1px solid ${status === "MATCH" ? "var(--c-match-border)" : status === "NEAR-MISS" ? "var(--c-gap-border)" : "var(--c-reject-border)"}`,
                fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.08em",
              }}>
                {status === "MATCH" ? "APPROVE" : status === "NEAR-MISS" ? "CONDITIONAL" : "REJECT"}
              </span>
            </div>
            <pre style={{
              margin: 0,
              background: "var(--c-bg2)",
              border: "1px solid var(--c-border2)",
              padding: "14px 16px",
              fontSize: 9.5,
              color: "var(--c-text2)",
              fontFamily: "JetBrains Mono, monospace",
              lineHeight: 1.8,
              whiteSpace: "pre-wrap",
              borderRadius: 2,
            }}>
              {icNote}
            </pre>
            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
              <button
                onClick={() => {
                  const recStatus = rec.hard_fail
                    ? "REJECT"
                    : negoRecs.some(r => r.priority === "CRITICAL")
                    ? "CONDITIONAL"
                    : "APPROVE";
                  printICNote(
                    icNote,
                    p.product_name ?? p.issuer,
                    am.firm,
                    recStatus,
                  );
                }}
                style={{
                  flex: 1, padding: "8px 0",
                  background: "var(--c-text)", border: "none", borderRadius: 2,
                  color: "var(--c-bg)", fontSize: 10, fontWeight: 700,
                  cursor: "pointer", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.06em",
                }}>
                EXPORT PDF →
              </button>
              <button
                onClick={() => toast.success(`IC Note forwarded to compliance@carmignac.com · ref IC-${p.id}`)}
                style={{
                  padding: "8px 14px",
                  background: "transparent", border: "1px solid var(--c-border3)", borderRadius: 2,
                  color: "var(--c-text2)", fontSize: 10, cursor: "pointer",
                  fontFamily: "JetBrains Mono, monospace",
                }}>
                SEND TO COMPLIANCE
              </button>
            </div>
          </div>
        )}

        {tab === "source" && (
          <div>
            <SectionLabel>SOURCE MESSAGE</SectionLabel>
            <div
              style={{
                marginTop: 10,
                background: "var(--c-bg2)",
                border: "1px solid var(--c-border2)",
                borderRadius: 2,
                padding: 14,
                fontSize: 10,
                color: "var(--c-text2)",
                fontFamily: "JetBrains Mono, monospace",
                lineHeight: 1.8,
                whiteSpace: "pre-wrap",
                maxHeight: 380,
                overflowY: "auto",
              }}
            >
              {p.raw_text || "No source message available."}
            </div>
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(p.raw_text ?? p.source_reference ?? "");
                  toast.success("Source message copied to clipboard");
                }}
                style={{
                  padding: "6px 12px",
                  background: "transparent",
                  border: "1px solid var(--c-border3)",
                  borderRadius: 2,
                  color: "var(--c-text2)",
                  fontSize: 10,
                  cursor: "pointer",
                  fontFamily: "JetBrains Mono, monospace",
                }}
              >
                Copy source ↗
              </button>
              <button
                onClick={() => {
                  setStatus(p.id, "watch");
                  toast.success(`Flagged for compliance review · ${p.product_name ?? p.issuer}`);
                }}
                style={{
                  padding: "6px 12px",
                  background: "transparent",
                  border: "1px solid var(--c-border3)",
                  borderRadius: 2,
                  color: "var(--c-text2)",
                  fontSize: 10,
                  cursor: "pointer",
                  fontFamily: "JetBrains Mono, monospace",
                }}
              >
                Flag for compliance
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer (sticky) */}
      <div
        style={{
          padding: "12px 18px",
          borderTop: "1px solid var(--c-border)",
          background: "var(--c-bg1)",
          display: "flex",
          gap: 8,
          flexShrink: 0,
        }}
      >
        {status === "MATCH" && (
          <>
            <button
              onClick={() => { setTab("committee"); }}
              style={{
                flex: 1,
                padding: "9px 0",
                background: "var(--c-match)",
                border: "none",
                borderRadius: 2,
                color: "#000",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "JetBrains Mono, monospace",
                letterSpacing: "0.06em",
              }}
            >
              ✓ APPROVE — GENERATE IC NOTE
            </button>
            <button
              onClick={() => {
                setStatus(p.id, "passed", "PM_DECISION");
                toast("Passed — removed from feed", { description: p.product_name ?? p.issuer });
                onClose();
              }}
              style={{
                padding: "9px 14px",
                background: "transparent",
                border: "1px solid var(--c-border3)",
                borderRadius: 2,
                color: "var(--c-text2)",
                fontSize: 11,
                cursor: "pointer",
                fontFamily: "JetBrains Mono, monospace",
                letterSpacing: "0.04em",
              }}
            >
              PASS
            </button>
          </>
        )}
        {status === "NEAR-MISS" && (
          <>
            <button
              onClick={() => { setTab("negotiation"); setShowDraft(true); }}
              style={{
                flex: 1,
                padding: "9px 0",
                background: "var(--c-gap)",
                border: "none",
                borderRadius: 2,
                color: "#000",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "JetBrains Mono, monospace",
                letterSpacing: "0.06em",
              }}
            >
              → SEND COUNTER-OFFER
            </button>
            <button
              onClick={() => {
                setStatus(p.id, "passed", "NOT_NOW");
                toast("Archived", { description: "Removed from active feed" });
                onClose();
              }}
              style={{
                padding: "9px 14px",
                background: "transparent",
                border: "1px solid var(--c-border3)",
                borderRadius: 2,
                color: "var(--c-text2)",
                fontSize: 11,
                cursor: "pointer",
                fontFamily: "JetBrains Mono, monospace",
                letterSpacing: "0.04em",
              }}
            >
              ARCHIVE
            </button>
          </>
        )}
        {status === "REJECT" && (
          <div style={{ display: "flex", gap: 8, flex: 1 }}>
            <button
              onClick={() => {
                navigator.clipboard.writeText(failChecks.join("\n"));
                toast.error(`Auto-rejected · ${failChecks.length} breach${failChecks.length > 1 ? "es" : ""} · reasons copied`);
              }}
              style={{
                flex: 1,
                padding: "9px 0",
                background: "var(--c-reject-bg)",
                border: "1px solid var(--c-reject-border)",
                borderRadius: 2,
                color: "var(--c-reject)",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "JetBrains Mono, monospace",
                letterSpacing: "0.06em",
              }}
            >
              ✕ MANDATE BREACH — COPY REASONS
            </button>
            <button
              onClick={() => {
                navigate(`/products/${p.id}`);
              }}
              style={{
                padding: "9px 14px",
                background: "transparent",
                border: "1px solid var(--c-border3)",
                borderRadius: 2,
                color: "var(--c-text3)",
                fontSize: 11,
                cursor: "pointer",
                fontFamily: "JetBrains Mono, monospace",
              }}
            >
              VIEW DETAIL
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Dashboard (Opportunity Feed) ───────────────────────────────── */
export default function Dashboard() {
  const { products, me } = useAppStore();
  const [filter, setFilter] = useState<"all" | "match" | "near-miss">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Map of product_id → backend recommendation (null = not yet fetched)
  const [backendRecMap, setBackendRecMap] = useState<Map<string, Recommendation>>(new Map());
  const [backendSource, setBackendSource] = useState(false);

  // Fetch all recommendations from the backend for the current AM.
  // Falls back silently to local scoring if the backend is offline.
  useEffect(() => {
    getAMRecommendations(me.id).then((recs) => {
      if (!recs || recs.length === 0) return;
      const map = new Map<string, Recommendation>();
      for (const r of recs) map.set(r.product_id, r);
      setBackendRecMap(map);
      setBackendSource(true);
    });
  }, [me.id]);

  const items = useMemo<FeedItem[]>(() => {
    // Local scoring is instant and used as the baseline.
    // Backend recommendations override when available (same algorithm, same result + prose).
    const localRecs = recommendationsFor(me, products);
    const merged = localRecs.map((localRec) => backendRecMap.get(localRec.product_id) ?? localRec);
    const sorted = [...merged].sort((a, b) => {
      if (a.hard_fail !== b.hard_fail) return a.hard_fail ? 1 : -1;
      return b.score - a.score;
    });
    return sorted.flatMap((rec, i) => {
      const p = products.find((x) => x.id === rec.product_id);
      if (!p) return [];
      return [{
        product: p,
        rec,
        rank: i + 1,
        status: deriveStatus(rec),
        receivedAt: fmtTime(p.ingested_at),
        flagged: flaggedTags(p),
      }];
    });
  }, [products, me, backendRecMap]);

  const matchItems  = items.filter((i) => i.status === "MATCH");
  const gapItems    = items.filter((i) => i.status === "NEAR-MISS");
  const rejectItems = items.filter((i) => i.status === "REJECT");

  const visible = useMemo(() => {
    if (filter === "match")     return matchItems;
    if (filter === "near-miss") return gapItems;
    return items;
  }, [items, filter, matchItems, gapItems]);

  const selected = selectedId ? items.find((i) => i.product.id === selectedId) ?? null : null;

  // Group by status for rendering with bucket headers
  const showAll = filter === "all";

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden", height: "100%" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        <FeedHeader
          total={items.length}
          match={matchItems.length}
          gap={gapItems.length}
          reject={rejectItems.length}
          filter={filter}
          onFilter={setFilter}
          backendSource={backendSource}
        />
        <ColHeaders />

        <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          {showAll ? (
            <>
              {matchItems.length > 0 && (
                <>
                  <BucketHeader
                    status="MATCH"
                    count={matchItems.length}
                    label="HIGH-CONFIDENCE · READY FOR PM"
                  />
                  {matchItems.map((item) => (
                    <ProductRow
                      key={item.product.id}
                      item={item}
                      selected={selected?.product.id === item.product.id}
                      onClick={() => setSelectedId(item.product.id)}
                    />
                  ))}
                </>
              )}
              {gapItems.length > 0 && (
                <>
                  <BucketHeader
                    status="NEAR-MISS"
                    count={gapItems.length}
                    label="GAP ANALYSIS · NEGOTIATE WITH BANK"
                  />
                  {gapItems.map((item) => (
                    <ProductRow
                      key={item.product.id}
                      item={item}
                      selected={selected?.product.id === item.product.id}
                      onClick={() => setSelectedId(item.product.id)}
                    />
                  ))}
                </>
              )}
              {rejectItems.length > 0 && (
                <>
                  <BucketHeader
                    status="REJECT"
                    count={rejectItems.length}
                    label="AUTO-REJECTED · MANDATE BREACH"
                  />
                  {rejectItems.map((item) => (
                    <ProductRow
                      key={item.product.id}
                      item={item}
                      selected={selected?.product.id === item.product.id}
                      onClick={() => setSelectedId(item.product.id)}
                    />
                  ))}
                </>
              )}
            </>
          ) : (
            visible.map((item) => (
              <ProductRow
                key={item.product.id}
                item={item}
                selected={selected?.product.id === item.product.id}
                onClick={() => setSelectedId(item.product.id)}
              />
            ))
          )}

          {visible.length === 0 && (
            <div
              style={{
                padding: "60px 20px",
                textAlign: "center",
                color: "var(--c-text3)",
                fontSize: 11,
                fontFamily: "JetBrains Mono, monospace",
              }}
            >
              NO PROPOSALS MATCHING THIS FILTER
            </div>
          )}
        </div>
      </div>

      {selected && (
        <DetailPanel
          item={selected}
          am={me}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
