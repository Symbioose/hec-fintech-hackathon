import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { SubScores } from "@/types/recommendation";
import { humanize } from "@/lib/format";

interface Props {
  subScores: SubScores;
  height?: number;
}

export function SubScoreRadar({ subScores, height = 240 }: Props) {
  const data = Object.entries(subScores).map(([k, v]) => ({
    metric: humanize(k),
    score: Math.round(v * 100),
    ideal: 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} outerRadius="75%">
        <PolarGrid stroke="hsl(var(--border))" />
        <PolarAngleAxis
          dataKey="metric"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
          stroke="hsl(var(--border))"
        />
        <Radar
          name="Mandate ideal"
          dataKey="ideal"
          stroke="hsl(var(--muted-foreground))"
          fill="hsl(var(--muted-foreground))"
          fillOpacity={0.06}
          strokeDasharray="3 3"
        />
        <Radar
          name="This product"
          dataKey="score"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.35}
          strokeWidth={2}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 6,
            fontSize: 12,
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
