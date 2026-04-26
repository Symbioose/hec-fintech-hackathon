import { cn } from "@/lib/utils";
import type { Strategy } from "@/types/assetManager";
import { humanize } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

const COLORS: Record<Strategy, string> = {
  defensive_income: "bg-success/15 text-success border-success/30",
  balanced_income: "bg-info/15 text-info border-info/30",
  yield_enhancement: "bg-primary/15 text-primary border-primary/30",
  capital_protection: "bg-success/15 text-success border-success/30",
  opportunistic: "bg-destructive/10 text-destructive border-destructive/30",
  esg_income: "bg-accent/15 text-accent border-accent/30",
  custom: "bg-muted text-muted-foreground border-border",
};

export function StrategyBadge({ strategy, className }: { strategy: Strategy; className?: string }) {
  return (
    <Badge variant="outline" className={cn("border", COLORS[strategy], className)}>
      {humanize(strategy)}
    </Badge>
  );
}
