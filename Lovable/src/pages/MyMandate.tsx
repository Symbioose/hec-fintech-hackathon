import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAppStore, canonicalPassReason, PASS_REASON_LABEL } from "@/lib/store";
import { PURCHASE_HISTORY } from "@/mocks/purchaseHistory";
import { PageHeader } from "@/components/common/PageHeader";
import { StrategyBadge } from "@/components/common/StrategyBadge";
import { ExposureBar } from "@/components/common/ExposureBar";
import { ProductTypeBadge } from "@/components/common/ProductTypeBadge";
import { ScoreBar } from "@/components/common/ScoreBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fmtAum, fmtCurrency, fmtDate, fmtPct, humanize } from "@/lib/format";
import { recommendationsFor } from "@/lib/matchingMock";
import { Sparkles, AlertTriangle } from "lucide-react";

const ACTION_STYLE: Record<string, string> = {
  bought: "bg-success/15 text-success border-success/30",
  approved: "bg-success/15 text-success border-success/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
  watched: "bg-info/15 text-info border-info/30",
  requested_termsheet: "bg-primary/15 text-primary border-primary/30",
};

export default function MyMandate() {
  const { me, products, meta } = useAppStore();
  const purchases = PURCHASE_HISTORY.filter((h) => h.asset_manager_id === me.id);
  const topRecs = recommendationsFor(me, products).filter((r) => !r.hard_fail).slice(0, 4);

  const passInsight = useMemo(() => {
    const counts: Record<string, number> = {};
    let total = 0;
    for (const m of Object.values(meta)) {
      if (m.status !== "passed") continue;
      const code = canonicalPassReason(m.pass_reason);
      counts[code] = (counts[code] ?? 0) + 1;
      total++;
    }
    if (total < 3) return null;
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (!top) return null;
    const pct = Math.round((top[1] / total) * 100);
    return { code: top[0], pct, label: PASS_REASON_LABEL[top[0] as keyof typeof PASS_REASON_LABEL] };
  }, [meta]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Your account"
        title="My mandate"
        description={`${me.firm} · ${fmtAum(me.aum_eur_m)} · ${humanize(me.risk_appetite)} risk appetite`}
        actions={<StrategyBadge strategy={me.strategy} />}
      />

      <p className="max-w-3xl text-sm text-muted-foreground">{me.description}</p>

      {passInsight && (
        <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/5 p-3 text-xs">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
          <span>
            <span className="tabular font-semibold">{passInsight.pct}%</span> of your recent passes were tagged{" "}
            <span className="font-medium">{passInsight.label}</span>. Consider revisiting your mandate or trying the{" "}
            <Link to="/recommendations" className="text-primary hover:underline">
              What-if panel
            </Link>
            .
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Mandate constraints</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Allowed currencies
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {me.allowed_currencies.map((c) => (
                  <Badge key={c} variant="secondary" className="font-mono text-[10px]">
                    {c}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Max tenor
              </div>
              <div className="mt-1 tabular font-medium">{me.max_tenor_years ?? "—"} years</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Min issuer rating
              </div>
              <div className="mt-1 tabular font-medium">{me.min_issuer_rating ?? "—"}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Target yield (min)
              </div>
              <div className="mt-1 tabular font-medium">{fmtPct(me.target_yield_min)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Capital protection
              </div>
              <div className="mt-1 font-medium">
                {me.requires_capital_protection ? "Required" : "Not required"}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Max barrier risk
              </div>
              <div className="mt-1 tabular font-medium">{fmtPct(me.max_barrier_risk, 0)}</div>
            </div>
            <div className="col-span-2 md:col-span-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Allowed underlying types
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {me.allowed_underlying_types.map((t) => (
                  <Badge key={t} variant="outline" className="text-[10px]">
                    {humanize(t)}
                  </Badge>
                ))}
              </div>
            </div>
            {me.preferred_issuers.length > 0 && (
              <div className="col-span-2 md:col-span-3">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Preferred issuers
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {me.preferred_issuers.map((i) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">
                      {i}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {me.excluded_issuers.length > 0 && (
              <div className="col-span-2 md:col-span-3">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Excluded issuers
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {me.excluded_issuers.map((i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="border-destructive/30 text-[10px] text-destructive"
                    >
                      {i}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {me.esg_constraints.length > 0 && (
              <div className="col-span-2 md:col-span-3">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  ESG constraints
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {me.esg_constraints.map((e) => (
                    <Badge
                      key={e}
                      variant="outline"
                      className="border-accent/30 text-[10px] text-accent"
                    >
                      {humanize(e)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Current exposures</CardTitle>
          </CardHeader>
          <CardContent>
            <ExposureBar exposures={me.current_exposures} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-primary" /> Top recommendations for you
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topRecs.map((rec) => {
              const p = products.find((x) => x.id === rec.product_id)!;
              return (
                <Link
                  key={rec.id}
                  to={`/products/${p.id}`}
                  className="flex items-center gap-3 rounded-md border bg-surface p-3 hover:bg-surface-muted"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {p.product_name ?? `${p.issuer} ${humanize(p.product_type)}`}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {p.issuer} · coupon {fmtPct(p.coupon)} · {p.tenor_years}y
                    </div>
                  </div>
                  <ProductTypeBadge type={p.product_type} className="hidden md:inline-flex" />
                  <div className="w-32 shrink-0">
                    <ScoreBar value={rec.score} />
                  </div>
                </Link>
              );
            })}
            {topRecs.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No products currently match your mandate.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">My recent activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-muted">
                  <TableHead>Action</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((h) => {
                  const p = products.find((x) => x.id === h.product_id);
                  return (
                    <TableRow key={h.id}>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`border ${ACTION_STYLE[h.action] ?? ""} text-[10px]`}
                        >
                          {humanize(h.action)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {p ? (
                          <Link to={`/products/${p.id}`} className="hover:underline">
                            {p.product_name ?? p.id}
                          </Link>
                        ) : (
                          h.product_id
                        )}
                      </TableCell>
                      <TableCell className="tabular text-right text-xs">
                        {fmtCurrency(h.amount, p?.currency ?? "EUR")}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {fmtDate(h.date)}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {purchases.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-6 text-center text-sm text-muted-foreground"
                    >
                      No history yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
