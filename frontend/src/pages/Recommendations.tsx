import { useMemo, useState } from "react";
import { RowSelectCheckbox } from "@/components/common/RowSelectCheckbox";
import { Link } from "react-router-dom";
import { useAppStore } from "@/lib/store";
import { recommendationsFor } from "@/lib/mandateScoring";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreBar } from "@/components/common/ScoreBar";
import { ProductTypeBadge } from "@/components/common/ProductTypeBadge";
import { StrategyBadge } from "@/components/common/StrategyBadge";
import { TriageActions } from "@/components/common/TriageActions";
import { StatusBadge } from "@/components/common/StatusBadge";
import { WhatIfPanel, type WhatIfOverrides } from "@/components/common/WhatIfPanel";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Info, AlertTriangle, CheckCircle2, XCircle, Circle, TrendingUp } from "lucide-react";
import { fmtPct, humanize } from "@/lib/format";

const KIND_ICON = {
  positive: CheckCircle2,
  warning: AlertTriangle,
  blocker: XCircle,
  neutral: Circle,
} as const;

const KIND_COLOR = {
  positive: "text-success",
  warning: "text-warning",
  blocker: "text-destructive",
  neutral: "text-muted-foreground",
} as const;

export default function Recommendations() {
  const { products, me, meta } = useAppStore();
  const [hideFails, setHideFails] = useState(true);
  const [hidePassed, setHidePassed] = useState(true);
  const [whatIfActive, setWhatIfActive] = useState(false);
  const [overrides, setOverrides] = useState<WhatIfOverrides>({});

  const baseRecs = useMemo(() => recommendationsFor(me, products), [me, products]);

  const effectiveAm = useMemo(
    () => (whatIfActive ? { ...me, ...overrides } : me),
    [me, whatIfActive, overrides],
  );
  const recs = useMemo(
    () => recommendationsFor(effectiveAm, products),
    [effectiveAm, products],
  );

  const visible = useMemo(() => {
    return recs.filter((r) => {
      if (hideFails && r.hard_fail) return false;
      if (hidePassed && meta[r.product_id]?.status === "passed") return false;
      return true;
    });
  }, [recs, hideFails, hidePassed, meta]);

  // surface near-misses gained when what-if is on
  const nearMissCount = useMemo(() => {
    if (!whatIfActive) return 0;
    const baseHardFail = new Set(baseRecs.filter((r) => r.hard_fail).map((r) => r.product_id));
    return recs.filter((r) => !r.hard_fail && baseHardFail.has(r.product_id)).length;
  }, [whatIfActive, baseRecs, recs]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Matching engine"
        title="Recommendations for you"
        description={`Ranked product matches for your mandate (${me.firm}).`}
        actions={<StrategyBadge strategy={me.strategy} />}
      />

      <Card className="shadow-card">
        <CardContent className="flex flex-wrap items-center gap-2 p-4 text-xs">
          <span className="text-muted-foreground">Mandate:</span>
          {me.allowed_currencies.map((c) => (
            <Badge key={c} variant="secondary" className="font-mono text-[10px]">
              {c}
            </Badge>
          ))}
          {me.max_tenor_years && (
            <Badge variant="outline" className="text-[10px]">
              ≤ {me.max_tenor_years}y tenor
            </Badge>
          )}
          {me.min_issuer_rating && (
            <Badge variant="outline" className="text-[10px]">
              ≥ {me.min_issuer_rating}
            </Badge>
          )}
          {me.requires_capital_protection && (
            <Badge variant="outline" className="border-success/30 text-[10px] text-success">
              Capital protected
            </Badge>
          )}
          {me.target_yield_min && (
            <Badge variant="outline" className="text-[10px]">
              yield ≥ {fmtPct(me.target_yield_min)}
            </Badge>
          )}
          {me.esg_constraints.length > 0 && (
            <Badge variant="outline" className="border-accent/30 text-[10px] text-accent">
              ESG
            </Badge>
          )}
          <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="hide-passed" className="text-xs text-muted-foreground">
                Hide passed
              </Label>
              <Switch id="hide-passed" checked={hidePassed} onCheckedChange={setHidePassed} />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="hide-fails" className="text-xs text-muted-foreground">
                Hide hard-fails
              </Label>
              <Switch id="hide-fails" checked={hideFails} onCheckedChange={setHideFails} />
            </div>
          </div>
        </CardContent>
      </Card>

      <WhatIfPanel
        base={me}
        overrides={overrides}
        onChange={setOverrides}
        active={whatIfActive}
        onToggle={setWhatIfActive}
      />

      {whatIfActive && nearMissCount > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-info/30 bg-info/5 px-3 py-2 text-xs text-info">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>
            <span className="tabular font-semibold">{nearMissCount}</span> additional product
            {nearMissCount > 1 ? "s" : ""} would pass with these relaxed constraints.
          </span>
        </div>
      )}

      <div className="space-y-3">
        {visible.map((rec) => {
          const p = products.find((x) => x.id === rec.product_id)!;
          const status = meta[p.id]?.status ?? "none";
          return (
            <Card
              key={rec.id}
              className={`shadow-card transition-shadow hover:shadow-elevated ${
                rec.hard_fail ? "opacity-70" : ""
              }`}
            >
              <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
                <RowSelectCheckbox productId={p.id} className="self-start lg:self-center" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/products/${p.id}`}
                      className="text-sm font-semibold hover:underline"
                    >
                      {p.product_name ?? `${p.issuer} ${humanize(p.product_type)}`}
                    </Link>
                    <ProductTypeBadge type={p.product_type} />
                    {status !== "none" && <StatusBadge status={status} />}
                    {rec.hard_fail && (
                      <Badge
                        variant="outline"
                        className="border-destructive/30 text-[10px] text-destructive"
                      >
                        Hard fail
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {p.issuer} · {p.currency} · coupon {fmtPct(p.coupon)} · {p.tenor_years}y · barrier{" "}
                    {fmtPct(p.barrier, 0)} · rating {p.issuer_rating ?? "—"}
                  </div>
                  <ul className="space-y-1 pt-1">
                    {rec.rationale.slice(0, 3).map((b, i) => {
                      const Icon = KIND_ICON[b.kind];
                      return (
                        <li
                          key={i}
                          className="flex items-start gap-1.5 text-xs text-foreground/90"
                        >
                          <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${KIND_COLOR[b.kind]}`} />
                          <span>{b.text}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="flex w-full shrink-0 flex-col gap-2 lg:w-64">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Match score
                    </span>
                    <span className="tabular text-2xl font-semibold">{rec.score}</span>
                  </div>
                  <ScoreBar value={rec.score} showNumber={false} />
                  <div className="flex items-center justify-between gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs">
                          <Info className="h-3 w-3" /> Breakdown
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-72 space-y-2 p-3">
                        <p className="text-xs font-semibold">Sub-scores</p>
                        {Object.entries(rec.sub_scores).map(([k, v]) => (
                          <div key={k} className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-muted-foreground">{humanize(k)}</span>
                              <span className="tabular font-medium">
                                {(v * 100).toFixed(0)}
                              </span>
                            </div>
                            <ScoreBar value={Math.round(v * 100)} showNumber={false} size="sm" />
                          </div>
                        ))}
                      </PopoverContent>
                    </Popover>
                    <TriageActions productId={p.id} variant="compact" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {visible.length === 0 && (
          <Card className="shadow-card">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No products match. Try unhiding hard-fails or relaxing the what-if mandate.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
