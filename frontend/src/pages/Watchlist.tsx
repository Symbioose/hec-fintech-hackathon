import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAppStore } from "@/lib/store";
import { score } from "@/lib/mandateScoring";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Bookmark, Heart } from "lucide-react";
import { ProductTypeBadge } from "@/components/common/ProductTypeBadge";
import { ScoreBar } from "@/components/common/ScoreBar";
import { TriageActions } from "@/components/common/TriageActions";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { fmtPct, humanize } from "@/lib/format";

export default function Watchlist() {
  const { products, meta, me } = useAppStore();

  const items = useMemo(() => {
    return products
      .filter((p) => meta[p.id]?.status === "watch" || meta[p.id]?.status === "interested")
      .map((p) => ({ p, s: score(p, me), m: meta[p.id]! }))
      .sort((a, b) => b.s.score - a.s.score);
  }, [products, meta, me]);

  const watching = items.filter((i) => i.m.status === "watch").length;
  const interested = items.filter((i) => i.m.status === "interested").length;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Triage"
        title="Watchlist"
        description="Products you flagged for follow-up — sorted by mandate fit."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-md border bg-surface px-2.5 py-1 text-xs">
              <Heart className="h-3.5 w-3.5 text-success" />
              <span className="tabular font-medium text-foreground">{interested}</span>
              <span className="text-muted-foreground">interested</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-md border bg-surface px-2.5 py-1 text-xs">
              <Bookmark className="h-3.5 w-3.5 text-info" />
              <span className="tabular font-medium text-foreground">{watching}</span>
              <span className="text-muted-foreground">watching</span>
            </div>
          </div>
        }
      />

      <div className="space-y-3">
        {items.map(({ p, s, m }) => (
          <Card key={p.id} className="shadow-card transition-shadow hover:shadow-elevated">
            <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Link to={`/products/${p.id}`} className="text-sm font-semibold hover:underline">
                    {p.product_name ?? `${p.issuer} ${humanize(p.product_type)}`}
                  </Link>
                  <ProductTypeBadge type={p.product_type} />
                  <StatusBadge status={m.status} />
                </div>
                <div className="text-xs text-muted-foreground">
                  {p.issuer} · {p.currency} · coupon {fmtPct(p.coupon)} · {p.tenor_years}y
                </div>
              </div>

              <div className="flex w-full shrink-0 flex-col gap-2 lg:w-56">
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Match
                  </span>
                  <span className="tabular text-xl font-semibold">{s.score}</span>
                </div>
                <ScoreBar value={s.score} showNumber={false} />
              </div>

              <TriageActions productId={p.id} variant="compact" />
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && (
          <EmptyState
            icon={Bookmark}
            title="Your watchlist is empty"
            description="Flag products as Watch or Interested from the catalog to track them here."
            action={
              <div className="flex items-center gap-2">
                <Link
                  to="/recommendations"
                  className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
                >
                  Browse recommendations <ArrowRight className="h-3 w-3" />
                </Link>
                <Link
                  to="/products"
                  className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-surface-muted"
                >
                  Open catalog
                </Link>
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}
