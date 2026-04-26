import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore, canonicalPassReason, PASS_REASON_LABEL, type PassReasonCode } from "@/lib/store";
import { XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

const ORDER: PassReasonCode[] = [
  "tenor_too_long",
  "coupon_too_low",
  "wrong_issuer",
  "too_risky",
  "wrong_underlying",
  "wrong_currency",
  "other",
];

export function PassReasonsCard({ className }: Props) {
  const { meta } = useAppStore();

  const stats = useMemo(() => {
    const counts: Record<PassReasonCode, number> = {
      tenor_too_long: 0,
      coupon_too_low: 0,
      wrong_issuer: 0,
      wrong_underlying: 0,
      too_risky: 0,
      wrong_currency: 0,
      other: 0,
    };
    let total = 0;
    for (const m of Object.values(meta)) {
      if (m.status !== "passed") continue;
      const code = canonicalPassReason(m.pass_reason);
      counts[code]++;
      total++;
    }
    const items = ORDER.map((code) => ({
      code,
      label: PASS_REASON_LABEL[code],
      count: counts[code],
    }))
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count);
    return { items, total };
  }, [meta]);

  const top = stats.items[0];
  const insight =
    top && stats.total >= 3
      ? top.code === "tenor_too_long"
        ? `${Math.round((top.count / stats.total) * 100)}% of recent passes were tenor-related — consider relaxing max tenor in the What-if panel.`
        : top.code === "coupon_too_low"
          ? `${Math.round((top.count / stats.total) * 100)}% of passes cited yield — relaxing the target yield filter could surface more.`
          : top.code === "wrong_issuer"
            ? `${Math.round((top.count / stats.total) * 100)}% of passes blame issuer fit — review your preferred / excluded list.`
            : top.code === "too_risky"
              ? `${Math.round((top.count / stats.total) * 100)}% of passes flagged risk — your appetite vs barrier may be tight.`
              : null
      : null;

  return (
    <Card className={cn("shadow-card", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <XCircle className="h-4 w-4 text-destructive" />
          Why you passed
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Reasons captured when you marked products as Pass.
        </p>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {stats.items.length === 0 && (
          <p className="py-6 text-center text-xs text-muted-foreground">
            No passed products yet. As you triage, reasons will accumulate here.
          </p>
        )}
        {stats.items.map((it) => {
          const max = stats.items[0].count;
          const pct = (it.count / max) * 100;
          return (
            <div key={it.code} className="space-y-1">
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-foreground/90">{it.label}</span>
                <span className="tabular font-medium text-muted-foreground">
                  {it.count}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                <div
                  className="h-full rounded-full bg-destructive/70"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
        {insight && (
          <p className="border-t pt-3 text-xs italic text-muted-foreground">{insight}</p>
        )}
      </CardContent>
    </Card>
  );
}
