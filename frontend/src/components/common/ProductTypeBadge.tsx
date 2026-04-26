import { Badge } from "@/components/ui/badge";
import type { ProductType } from "@/types/product";
import { humanize } from "@/lib/format";
import { cn } from "@/lib/utils";

const STYLES: Record<ProductType, string> = {
  autocallable: "bg-primary/10 text-primary border-primary/20",
  reverse_convertible: "bg-accent/15 text-accent border-accent/30",
  capital_protected_note: "bg-success/15 text-success border-success/30",
  credit_linked_note: "bg-info/15 text-info border-info/30",
  fixed_rate_note: "bg-secondary text-secondary-foreground border-border",
  floating_rate_note: "bg-warning/15 text-warning-foreground border-warning/40",
  range_accrual: "bg-muted text-foreground border-border",
  other: "bg-muted text-muted-foreground border-border",
};

/** Compact labels that fit in narrow table columns. Hover gives the full name. */
const SHORT_LABEL: Partial<Record<ProductType, string>> = {
  reverse_convertible: "Reverse Conv.",
  capital_protected_note: "CP Note",
  credit_linked_note: "CLN",
  fixed_rate_note: "Fixed Rate",
  floating_rate_note: "FRN",
  range_accrual: "Range Acc.",
};

export function ProductTypeBadge({
  type,
  className,
  short,
}: {
  type: ProductType;
  className?: string;
  /** Use the compact label (defaults to true). Set false to show the full humanized name. */
  short?: boolean;
}) {
  const useShort = short ?? true;
  const full = humanize(type);
  const label = useShort ? SHORT_LABEL[type] ?? full : full;
  return (
    <Badge
      variant="outline"
      title={full}
      className={cn("border whitespace-nowrap font-medium", STYLES[type], className)}
    >
      {label}
    </Badge>
  );
}
