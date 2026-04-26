import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MarketView } from "@/types/marketView";
import { fmtDate, humanize } from "@/lib/format";
import type { Alignment } from "@/lib/marketAlignment";
import { CheckCircle2, AlertTriangle, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  view: MarketView;
  alignment?: Alignment;
  alignmentReason?: string;
  footer?: React.ReactNode;
}

const STYLE: Record<Alignment, { label: string; icon: typeof CheckCircle2; className: string }> = {
  aligned: {
    label: "Aligned",
    icon: CheckCircle2,
    className: "border-success/40 bg-success/10 text-success",
  },
  counter: {
    label: "Counter view",
    icon: AlertTriangle,
    className: "border-warning/40 bg-warning/10 text-warning",
  },
  neutral: {
    label: "Neutral",
    icon: Minus,
    className: "border-border bg-surface text-muted-foreground",
  },
};

export function MarketViewCard({ view, alignment, alignmentReason, footer }: Props) {
  const a = alignment ? STYLE[alignment] : null;
  const Icon = a?.icon;

  return (
    <Card
      className={cn(
        "shadow-card",
        alignment === "aligned" && "border-l-[3px] border-l-success",
        alignment === "counter" && "border-l-[3px] border-l-warning",
      )}
    >
      <CardContent className="space-y-2 p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{fmtDate(view.date)}</span>
          {view.region && <span>· {view.region}</span>}
          {view.asset_class && <span>· {view.asset_class}</span>}
          {a && Icon && (
            <Badge variant="outline" className={cn("ml-auto gap-1 text-[10px]", a.className)}>
              <Icon className="h-3 w-3" />
              {a.label}
            </Badge>
          )}
          {!a && <span className="ml-auto">{view.author}</span>}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {view.rates_view && (
            <Badge variant="outline" className="text-[10px]">
              Rates: {humanize(view.rates_view)}
            </Badge>
          )}
          {view.equity_view && (
            <Badge variant="outline" className="text-[10px]">
              Equity: {humanize(view.equity_view)}
            </Badge>
          )}
          {view.volatility_view && (
            <Badge variant="outline" className="text-[10px]">
              Vol: {humanize(view.volatility_view)}
            </Badge>
          )}
          {view.credit_spread_view && (
            <Badge variant="outline" className="text-[10px]">
              Credit: {humanize(view.credit_spread_view)}
            </Badge>
          )}
        </div>
        <p className="text-sm leading-relaxed">{view.text}</p>
        {alignmentReason && (
          <p className="text-xs italic text-muted-foreground">— {alignmentReason}</p>
        )}
        {a && (
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {view.author}
          </p>
        )}
        {footer && <div className="pt-1">{footer}</div>}
      </CardContent>
    </Card>
  );
}
