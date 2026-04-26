import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types/product";

const STYLES: Record<RiskLevel, string> = {
  low: "bg-success/15 text-success border-success/30",
  medium: "bg-info/15 text-info border-info/30",
  medium_high: "bg-warning/15 text-warning-foreground border-warning/40",
  high: "bg-destructive/15 text-destructive border-destructive/30",
};

const LABELS: Record<RiskLevel, string> = {
  low: "Low",
  medium: "Medium",
  medium_high: "Med-High",
  high: "High",
};

export function RiskBadge({ level, className }: { level?: RiskLevel | null; className?: string }) {
  if (!level)
    return (
      <Badge variant="outline" className={cn("whitespace-nowrap", className)}>
        n/a
      </Badge>
    );
  return (
    <Badge
      variant="outline"
      title={`${LABELS[level]} risk`}
      className={cn("border whitespace-nowrap", STYLES[level], className)}
    >
      {LABELS[level]}
    </Badge>
  );
}
