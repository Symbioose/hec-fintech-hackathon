import { humanize } from "@/lib/format";

const COLORS = ["bg-primary", "bg-accent", "bg-info", "bg-warning", "bg-success"];

export function ExposureBar({ exposures }: { exposures: Record<string, number> }) {
  const entries = Object.entries(exposures).filter(([, v]) => v > 0);
  return (
    <div className="space-y-2">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
        {entries.map(([k, v], i) => (
          <div
            key={k}
            className={COLORS[i % COLORS.length]}
            style={{ width: `${v * 100}%` }}
            title={`${humanize(k)}: ${(v * 100).toFixed(0)}%`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        {entries.map(([k, v], i) => (
          <span key={k} className="inline-flex items-center gap-1">
            <span
              className={`inline-block h-2 w-2 rounded-sm ${COLORS[i % COLORS.length]}`}
            />
            {humanize(k)}{" "}
            <span className="tabular text-foreground">{(v * 100).toFixed(0)}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}
