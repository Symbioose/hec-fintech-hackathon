import { useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { score as scoreProduct } from "@/lib/matchingMock";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScoreBar } from "@/components/common/ScoreBar";
import { ProductTypeBadge } from "@/components/common/ProductTypeBadge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { RiskBadge } from "@/components/common/RiskBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { fmtPct, humanize } from "@/lib/format";
import { ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Highlight = "best" | "worst" | "neutral";

function highlightClass(h: Highlight) {
  if (h === "best") return "text-success font-semibold";
  if (h === "worst") return "text-destructive font-semibold";
  return "";
}

export function CompareDrawer({ open, onOpenChange }: Props) {
  const { products, compareIds, me, meta, toggleCompare } = useAppStore();

  const items = useMemo(() => {
    return compareIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => !!p)
      .map((p) => ({ p, rec: scoreProduct(p, me) }));
  }, [compareIds, products, me]);

  // For each numeric attribute compute best/worst across selected products.
  function rank(values: (number | null | undefined)[], higherIsBetter: boolean): Highlight[] {
    const numeric = values
      .map((v, i) => (v == null ? null : { v, i }))
      .filter((x): x is { v: number; i: number } => x !== null);
    if (numeric.length < 2) return values.map(() => "neutral");
    const sorted = [...numeric].sort((a, b) => (higherIsBetter ? b.v - a.v : a.v - b.v));
    const bestIdx = sorted[0].i;
    const worstIdx = sorted[sorted.length - 1].i;
    return values.map((_, i) =>
      i === bestIdx ? "best" : i === worstIdx ? "worst" : "neutral",
    );
  }

  const couponHL = rank(items.map((i) => i.p.coupon), true);
  const tenorHL = rank(items.map((i) => i.p.tenor_years), true);
  // For barrier: higher % barrier means more cushion lost — actually a higher number = closer to spot = more risky.
  // Convention here: lower barrier (e.g. 50%) gives more downside cushion → "best". So lower is better.
  const barrierHL = rank(items.map((i) => i.p.barrier), false);
  const scoreHL = rank(items.map((i) => i.rec.score), true);

  const minWidth = Math.max(items.length, 2) * 240 + 200;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-[min(92vw,1100px)] sm:max-w-[min(92vw,1100px)] overflow-x-auto p-0">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="text-base">
            Compare {items.length} product{items.length > 1 ? "s" : ""}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            No products selected.
          </div>
        ) : (
          <div className="min-w-fit p-6" style={{ minWidth }}>
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: `170px repeat(${items.length}, minmax(220px, 1fr))` }}
            >
              {/* Header row: name + status + remove */}
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Product
              </div>
              {items.map(({ p }) => {
                const status = meta[p.id]?.status ?? "none";
                return (
                  <div key={`h-${p.id}`} className="flex flex-col gap-2 rounded-md border bg-surface p-3">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={`/products/${p.id}`}
                        className="text-sm font-semibold leading-tight hover:underline"
                      >
                        {p.product_name ?? `${p.issuer} ${humanize(p.product_type)}`}
                      </Link>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 shrink-0"
                        onClick={() => toggleCompare(p.id)}
                        aria-label="Remove from compare"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="text-[11px] text-muted-foreground">{p.issuer}</div>
                    <div className="flex flex-wrap gap-1.5">
                      <ProductTypeBadge type={p.product_type} />
                      <RiskBadge level={p.risk_level} />
                      {status !== "none" && <StatusBadge status={status} />}
                    </div>
                  </div>
                );
              })}

              <CompareSectionLabel label="Match" />
              {items.map(({ p, rec }, i) => (
                <CompareCell key={`s-${p.id}`}>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Score
                    </span>
                    <span className={cn("tabular text-2xl font-semibold", highlightClass(scoreHL[i]))}>
                      {rec.score}
                    </span>
                  </div>
                  <ScoreBar value={rec.score} showNumber={false} />
                </CompareCell>
              ))}

              {/* Sub-scores rows */}
              {(["semantic", "constraints", "yield_fit", "exposure_fit", "market_fit"] as const).map(
                (k) => (
                  <SubScoreRow key={k} label={humanize(k)} items={items} accessor={k} />
                ),
              )}

              <CompareSectionLabel label="Economics" />
              <Row label="Coupon" items={items} format={(p) => fmtPct(p.coupon)} highlights={couponHL} />
              <Row label="Tenor" items={items} format={(p) => (p.tenor_years ? `${p.tenor_years}y` : "—")} highlights={tenorHL} />
              <Row label="Barrier" items={items} format={(p) => fmtPct(p.barrier, 0)} highlights={barrierHL} />
              <Row label="Currency" items={items} format={(p) => p.currency} />
              <Row label="Capital protection" items={items} format={(p) => (p.capital_protection ? "Yes" : "No")} />
              <Row label="Autocall" items={items} format={(p) => (p.autocall ? humanize(p.autocall_frequency) : "No")} />

              <CompareSectionLabel label="Risk" />
              <Row label="Issuer rating" items={items} format={(p) => p.issuer_rating ?? "—"} />
              <Row label="Risk level" items={items} format={(p) => humanize(p.risk_level)} />
              <Row label="Liquidity" items={items} format={(p) => humanize(p.liquidity)} />

              <CompareSectionLabel label="Top rationale" />
              {items.map(({ p, rec }) => (
                <CompareCell key={`r-${p.id}`} className="space-y-1.5">
                  {rec.rationale.slice(0, 3).map((b, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[11px] leading-snug">
                      <span
                        className={cn(
                          "mt-1 h-1.5 w-1.5 shrink-0 rounded-full",
                          b.kind === "positive" && "bg-success",
                          b.kind === "warning" && "bg-warning",
                          b.kind === "blocker" && "bg-destructive",
                          b.kind === "neutral" && "bg-muted-foreground",
                        )}
                      />
                      <span>{b.text}</span>
                    </div>
                  ))}
                </CompareCell>
              ))}

              <div />
              {items.map(({ p }) => (
                <Button
                  key={`go-${p.id}`}
                  asChild
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                >
                  <Link to={`/products/${p.id}`}>
                    Open product <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function CompareSectionLabel({ label }: { label: string }) {
  return (
    <div className="col-span-full mt-2 border-t pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      {label}
    </div>
  );
}

function CompareCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-md border bg-surface p-3 text-sm", className)}>
      {children}
    </div>
  );
}

function Row({
  label,
  items,
  format,
  highlights,
}: {
  label: string;
  items: { p: import("@/types/product").Product }[];
  format: (p: import("@/types/product").Product) => React.ReactNode;
  highlights?: Highlight[];
}) {
  return (
    <>
      <div className="self-center text-xs text-muted-foreground">{label}</div>
      {items.map(({ p }, i) => (
        <div
          key={`${label}-${p.id}`}
          className={cn(
            "rounded-md border bg-surface px-3 py-2 text-sm tabular",
            highlights ? highlightClass(highlights[i]) : "",
          )}
        >
          {format(p)}
        </div>
      ))}
    </>
  );
}

function SubScoreRow({
  label,
  items,
  accessor,
}: {
  label: string;
  items: { p: import("@/types/product").Product; rec: ReturnType<typeof scoreProduct> }[];
  accessor: keyof ReturnType<typeof scoreProduct>["sub_scores"];
}) {
  const values = items.map((i) => i.rec.sub_scores[accessor]);
  const sorted = [...values].sort((a, b) => b - a);
  return (
    <>
      <div className="self-center text-xs text-muted-foreground">{label}</div>
      {items.map(({ p }, i) => {
        const v = values[i];
        const isBest = v === sorted[0] && new Set(values).size > 1;
        const isWorst = v === sorted[sorted.length - 1] && new Set(values).size > 1;
        return (
          <div
            key={`${label}-${p.id}`}
            className="flex items-center gap-2 rounded-md border bg-surface px-3 py-2"
          >
            <Badge
              variant="outline"
              className={cn(
                "tabular text-[10px]",
                isBest && "border-success/40 text-success",
                isWorst && "border-destructive/30 text-destructive",
              )}
            >
              {(v * 100).toFixed(0)}
            </Badge>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
              <div className="h-full rounded-full bg-primary/70" style={{ width: `${v * 100}%` }} />
            </div>
          </div>
        );
      })}
    </>
  );
}
