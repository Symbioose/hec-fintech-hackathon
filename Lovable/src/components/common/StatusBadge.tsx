import { Badge } from "@/components/ui/badge";
import { Bookmark, Heart, X, Circle } from "lucide-react";
import type { ProductStatus } from "@/lib/store";

const STYLES: Record<Exclude<ProductStatus, "none">, { label: string; className: string; icon: typeof Bookmark }> = {
  watch: {
    label: "Watching",
    className: "border-info/40 bg-info/10 text-info",
    icon: Bookmark,
  },
  interested: {
    label: "Interested",
    className: "border-success/40 bg-success/10 text-success",
    icon: Heart,
  },
  passed: {
    label: "Passed",
    className: "border-destructive/30 bg-destructive/10 text-destructive",
    icon: X,
  },
};

export function StatusBadge({ status }: { status: ProductStatus }) {
  if (status === "none")
    return (
      <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground">
        <Circle className="h-2.5 w-2.5" />
        New
      </Badge>
    );
  const s = STYLES[status];
  const Icon = s.icon;
  return (
    <Badge variant="outline" className={`gap-1 text-[10px] ${s.className}`}>
      <Icon className="h-2.5 w-2.5" />
      {s.label}
    </Badge>
  );
}
