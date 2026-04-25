import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAppStore } from "@/lib/store";
import { recommendationsFor } from "@/lib/matchingMock";
import { MARKET_VIEWS } from "@/mocks/marketViews";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Boxes, Sparkles, Activity, ArrowRight, AlertTriangle } from "lucide-react";
import { ScoreBar } from "@/components/common/ScoreBar";
import { ProductTypeBadge } from "@/components/common/ProductTypeBadge";
import { fmtPct, fmtRelative, humanize } from "@/lib/format";
import { PassReasonsCard } from "@/components/common/PassReasonsCard";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

const TYPE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--info))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
  "hsl(var(--muted-foreground))",
];

export default function Dashboard() {
  const { products, me } = useAppStore();

  const allRecs = useMemo(() => recommendationsFor(me, products), [me, products]);
  const matched = allRecs.filter((r) => !r.hard_fail);
  const topRecs = matched.slice(0, 5);

  const avgScore = useMemo(() => {
    if (allRecs.length === 0) return 0;
    return Math.round(allRecs.reduce((s, r) => s + r.score, 0) / allRecs.length);
  }, [allRecs]);

  // ---------- Score distribution histogram ----------
  const scoreBuckets = useMemo(() => {
    const ranges = [
      { label: "0–20", min: 0, max: 20 },
      { label: "20–40", min: 20, max: 40 },
      { label: "40–60", min: 40, max: 60 },
      { label: "60–80", min: 60, max: 80 },
      { label: "80–100", min: 80, max: 101 },
    ];
    return ranges.map((r) => ({
      label: r.label,
      count: matched.filter((rec) => rec.score >= r.min && rec.score < r.max).length,
      isHigh: r.min >= 60,
    }));
  }, [matched]);

  // ---------- Coupon vs barrier scatter ----------
  const types = useMemo(
    () => Array.from(new Set(products.map((p) => p.product_type))),
    [products],
  );
  const scatterData = useMemo(() => {
    const byType: Record<string, { coupon: number; barrier: number; score: number; name: string; id: string }[]> = {};
    for (const p of products) {
      if (p.coupon == null || p.barrier == null) continue;
      const r = allRecs.find((x) => x.product_id === p.id);
      const score = r?.score ?? 50;
      const list = byType[p.product_type] ?? (byType[p.product_type] = []);
      list.push({
        coupon: +(p.coupon * 100).toFixed(2),
        barrier: +(p.barrier * 100).toFixed(0),
        score,
        name: p.product_name ?? p.id,
        id: p.id,
      });
    }
    return byType;
  }, [products, allRecs]);

  // ---------- Mandate-fit failure breakdown ----------
  const failureBreakdown = useMemo(() => {
    const buckets: Record<string, number> = {
      Currency: 0,
      Tenor: 0,
      Rating: 0,
      "Capital protection": 0,
      "Excluded issuer": 0,
      Underlying: 0,
    };
    for (const r of allRecs) {
      if (!r.hard_fail) continue;
      for (const reason of r.hard_fail_reasons) {
        if (/currency/i.test(reason)) buckets.Currency++;
        else if (/tenor/i.test(reason)) buckets.Tenor++;
        else if (/rating/i.test(reason)) buckets.Rating++;
        else if (/capital protection/i.test(reason)) buckets["Capital protection"]++;
        else if (/excluded/i.test(reason)) buckets["Excluded issuer"]++;
        else if (/underlying|forbidden/i.test(reason)) buckets.Underlying++;
      }
    }
    return Object.entries(buckets)
      .map(([label, count]) => ({ label, count }))
      .filter((b) => b.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [allRecs]);

  const recent = useMemo(
    () =>
      [...products]
        .sort(
          (a, b) =>
            new Date(b.ingested_at).getTime() - new Date(a.ingested_at).getTime(),
        )
        .slice(0, 4),
    [products],
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Overview"
        title={`Welcome, ${me.name.split(" ")[0]}`}
        description="Today's view across your catalog, mandate fit and incoming bank flows."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Products" value={String(products.length)} icon={Boxes} hint="In your catalog" />
        <StatCard
          label="Match your mandate"
          value={String(matched.length)}
          icon={Sparkles}
          hint="Pass all hard filters"
        />
        <StatCard
          label="New offers (7d)"
          value={String(
            products.filter(
              (p) => Date.now() - new Date(p.ingested_at).getTime() < 7 * 86_400_000,
            ).length,
          )}
          icon={Activity}
          hint="Ingested this week"
        />
        <StatCard
          label="Avg match score"
          value={String(avgScore)}
          icon={Sparkles}
          hint="Across your catalog"
        />
      </div>

      {/* Charts row 1: score distribution + failure breakdown */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Score distribution</CardTitle>
            <p className="text-xs text-muted-foreground">
              How matched products are spread across the 0–100 scale.
            </p>
          </CardHeader>
          <CardContent className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreBuckets} margin={{ left: -20, right: 8, top: 4, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted))" }}
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {scoreBuckets.map((b, i) => (
                    <Cell
                      key={i}
                      fill={b.isHigh ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.4)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="h-4 w-4 text-warning" />
              What's blocking flow
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Reasons products fail your mandate's hard filters.
            </p>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {failureBreakdown.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nothing is blocked — every product passes your mandate.
              </p>
            )}
            {failureBreakdown.map((f) => {
              const max = failureBreakdown[0]?.count ?? 1;
              const pct = (f.count / max) * 100;
              return (
                <div key={f.label} className="space-y-1">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-foreground/90">{f.label}</span>
                    <span className="tabular font-medium text-muted-foreground">
                      {f.count} product{f.count > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full rounded-full bg-warning/70"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Pass-reasons analytics */}
      <PassReasonsCard />


      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Coupon vs barrier — risk/return map</CardTitle>
          <p className="text-xs text-muted-foreground">
            Each dot is a product. Size = match score. Color = product type. Top-left is rich coupon, low-risk territory.
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ left: 4, right: 16, top: 8, bottom: 8 }}>
                <XAxis
                  type="number"
                  dataKey="barrier"
                  name="Barrier"
                  unit="%"
                  domain={[40, 100]}
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  stroke="hsl(var(--muted-foreground))"
                  label={{
                    value: "Barrier (%)",
                    position: "insideBottom",
                    offset: -2,
                    fontSize: 10,
                    fill: "hsl(var(--muted-foreground))",
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="coupon"
                  name="Coupon"
                  unit="%"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  stroke="hsl(var(--muted-foreground))"
                  label={{
                    value: "Coupon (%)",
                    angle: -90,
                    position: "insideLeft",
                    fontSize: 10,
                    fill: "hsl(var(--muted-foreground))",
                  }}
                />
                <ZAxis type="number" dataKey="score" range={[40, 360]} name="Score" />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                  formatter={(v: unknown, name: string) => [v as string | number, name]}
                />
                {types.map((t, i) => (
                  <Scatter
                    key={t}
                    name={humanize(t)}
                    data={scatterData[t] ?? []}
                    fill={TYPE_COLORS[i % TYPE_COLORS.length]}
                    fillOpacity={0.75}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {types.map((t, i) => (
              <Badge key={t} variant="outline" className="gap-1.5 text-[10px]">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: TYPE_COLORS[i % TYPE_COLORS.length] }}
                />
                {humanize(t)}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top recs + recent ingestions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="shadow-card lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-primary" /> Top recommendations
            </CardTitle>
            <Link
              to="/recommendations"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
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
                No matches for this mandate.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Latest market views</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {MARKET_VIEWS.slice(0, 3).map((mv) => (
              <div key={mv.id} className="rounded-md border bg-surface p-3">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>
                    {mv.region} · {mv.asset_class}
                  </span>
                  <span>{fmtRelative(mv.date)}</span>
                </div>
                <p className="mt-1.5 text-xs">{mv.text}</p>
                <p className="mt-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  — {mv.author}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Recent ingestions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {recent.map((p) => (
            <Link
              key={p.id}
              to={`/products/${p.id}`}
              className="flex items-center gap-3 rounded-md border bg-surface p-3 hover:bg-surface-muted"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {p.product_name ?? `${p.issuer} ${humanize(p.product_type)}`}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {p.issuer} · {p.currency} · {fmtRelative(p.ingested_at)}
                </div>
              </div>
              <ProductTypeBadge type={p.product_type} className="hidden md:inline-flex" />
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
