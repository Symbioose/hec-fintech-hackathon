import { cn } from "@/lib/utils";
import { scoreToken } from "@/lib/format";

interface ScoreBarProps {
  value: number; // 0..100
  className?: string;
  showNumber?: boolean;
  size?: "sm" | "md";
}

export function ScoreBar({ value, className, showNumber = true, size = "md" }: ScoreBarProps) {
  const tok = scoreToken(value);
  const colorClass =
    tok === "high" ? "bg-score-high" : tok === "med" ? "bg-score-med" : "bg-score-low";
  const textClass =
    tok === "high" ? "text-score-high" : tok === "med" ? "text-score-med" : "text-score-low";
  const h = size === "sm" ? "h-1.5" : "h-2";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("flex-1 rounded-full bg-muted overflow-hidden", h)}>
        <div
          className={cn("h-full rounded-full transition-all", colorClass)}
          style={{ width: `${Math.max(2, Math.min(100, value))}%` }}
        />
      </div>
      {showNumber && (
        <span className={cn("tabular text-xs font-semibold w-8 text-right", textClass)}>
          {value}
        </span>
      )}
    </div>
  );
}
