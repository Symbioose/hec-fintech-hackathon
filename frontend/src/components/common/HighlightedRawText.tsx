import { useMemo } from "react";
import type { Product } from "@/types/product";

interface Span {
  start: number;
  end: number;
  label: string;
  color: string;
}

const COLORS = {
  coupon: "bg-success/15 text-success border-success/30",
  tenor: "bg-info/15 text-info border-info/30",
  barrier: "bg-warning/20 text-warning border-warning/30",
  issuer: "bg-primary/15 text-primary border-primary/30",
  underlying: "bg-accent/15 text-accent border-accent/30",
  rating: "bg-muted-foreground/15 text-foreground border-border",
} as const;

/**
 * Find a substring (case-insensitive) and return [start, end] or null.
 */
function findRange(text: string, needle: string): [number, number] | null {
  if (!needle) return null;
  const idx = text.toLowerCase().indexOf(needle.toLowerCase());
  if (idx < 0) return null;
  return [idx, idx + needle.length];
}

function findRegex(text: string, re: RegExp): [number, number] | null {
  const m = re.exec(text);
  if (!m || m.index < 0) return null;
  return [m.index, m.index + m[0].length];
}

function buildSpans(text: string, p: Product): Span[] {
  const spans: Span[] = [];

  const push = (range: [number, number] | null, label: string, color: string) => {
    if (!range) return;
    spans.push({ start: range[0], end: range[1], label, color });
  };

  // Issuer
  push(findRange(text, p.issuer), "issuer", COLORS.issuer);

  // Coupon — try "X.XX%" or "X%"
  if (p.coupon != null) {
    const pct = (p.coupon * 100).toFixed(2);
    const pctNoDec = (p.coupon * 100).toFixed(0);
    push(
      findRange(text, `${pct}%`) ??
        findRange(text, `${parseFloat(pct)}%`) ??
        findRange(text, `${pctNoDec}%`),
      "coupon",
      COLORS.coupon,
    );
  }

  // Tenor — "Xy", "X year(s)", "X-year"
  if (p.tenor_years) {
    const t = p.tenor_years;
    const found =
      findRegex(text, new RegExp(`\\b${t}\\s*y(?:ear)?s?\\b`, "i")) ??
      findRegex(text, new RegExp(`\\b${t}\\s*-?\\s*y(?:ear)?s?\\b`, "i")) ??
      findRegex(text, new RegExp(`\\b${t}\\s*Y\\b`));
    push(found, "tenor", COLORS.tenor);
  }

  // Barrier — "XX%" of barrier value
  if (p.barrier != null) {
    const pct = (p.barrier * 100).toFixed(0);
    push(
      findRegex(text, new RegExp(`\\b${pct}\\s*%\\b`)),
      "barrier",
      COLORS.barrier,
    );
  }

  // Issuer rating
  if (p.issuer_rating) {
    push(findRange(text, p.issuer_rating), "rating", COLORS.rating);
  }

  // Underlyings
  for (const u of p.underlying.slice(0, 3)) {
    push(findRange(text, u), "underlying", COLORS.underlying);
  }

  // Resolve overlaps: keep earliest, drop overlapping later ones.
  spans.sort((a, b) => a.start - b.start);
  const merged: Span[] = [];
  for (const s of spans) {
    const last = merged[merged.length - 1];
    if (last && s.start < last.end) continue;
    merged.push(s);
  }
  return merged;
}

interface Props {
  text: string;
  product: Product;
}

export function HighlightedRawText({ text, product }: Props) {
  const spans = useMemo(() => buildSpans(text, product), [text, product]);

  if (spans.length === 0) {
    return (
      <pre className="whitespace-pre-wrap rounded-md border bg-surface p-3 text-xs leading-relaxed">
        {text}
      </pre>
    );
  }

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  spans.forEach((s, i) => {
    if (cursor < s.start) parts.push(text.slice(cursor, s.start));
    parts.push(
      <mark
        key={i}
        title={s.label}
        className={`rounded border px-0.5 py-[1px] font-medium ${s.color}`}
      >
        {text.slice(s.start, s.end)}
      </mark>,
    );
    cursor = s.end;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));

  return (
    <div className="space-y-2">
      <pre className="whitespace-pre-wrap rounded-md border bg-surface p-3 text-xs leading-relaxed">
        {parts}
      </pre>
      <div className="flex flex-wrap gap-2 text-[10px]">
        <Legend label="issuer" color={COLORS.issuer} />
        <Legend label="coupon" color={COLORS.coupon} />
        <Legend label="tenor" color={COLORS.tenor} />
        <Legend label="barrier" color={COLORS.barrier} />
        <Legend label="rating" color={COLORS.rating} />
        <Legend label="underlying" color={COLORS.underlying} />
      </div>
    </div>
  );
}

function Legend({ label, color }: { label: string; color: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 ${color}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}
