// Formatting helpers for finance display.

export function fmtPct(v?: number | null, digits = 2): string {
  if (v === null || v === undefined) return "—";
  return `${(v * 100).toFixed(digits)}%`;
}

export function fmtCurrency(v?: number | null, currency = "EUR"): string {
  if (v === null || v === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(v);
}

export function fmtAum(v: number): string {
  if (v >= 1000) return `€${(v / 1000).toFixed(1)}B AUM`;
  return `€${v.toFixed(0)}M AUM`;
}

export function fmtNumber(v?: number | null, digits = 2): string {
  if (v === null || v === undefined) return "—";
  return v.toFixed(digits);
}

export function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function fmtRelative(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days < 1) {
    const hours = Math.floor(diff / 3_600_000);
    if (hours < 1) return "just now";
    return `${hours}h ago`;
  }
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return fmtDate(iso);
}

export function humanize(s?: string | null): string {
  if (!s) return "—";
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function scoreToken(score: number): "high" | "med" | "low" {
  if (score >= 70) return "high";
  if (score >= 45) return "med";
  return "low";
}
