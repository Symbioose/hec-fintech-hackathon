import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sparkles, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { AssetManagerProfile } from "@/types/assetManager";
import { fmtPct } from "@/lib/format";

export interface WhatIfOverrides {
  max_tenor_years?: number;
  target_yield_min?: number;
  requires_capital_protection?: boolean;
  max_barrier_risk?: number;
}

interface Props {
  base: AssetManagerProfile;
  overrides: WhatIfOverrides;
  onChange: (next: WhatIfOverrides) => void;
  active: boolean;
  onToggle: (active: boolean) => void;
}

export function WhatIfPanel({ base, overrides, onChange, active, onToggle }: Props) {
  const tenor = overrides.max_tenor_years ?? base.max_tenor_years ?? 5;
  const yieldMin = overrides.target_yield_min ?? base.target_yield_min ?? 0.04;
  const capProt = overrides.requires_capital_protection ?? base.requires_capital_protection;
  const barrier = overrides.max_barrier_risk ?? base.max_barrier_risk ?? 0.6;

  function reset() {
    onChange({});
  }

  return (
    <Card className="shadow-card">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">What-if mandate</span>
            <span className="text-xs text-muted-foreground">
              Temporarily relax constraints to surface near-misses
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1 text-xs"
              onClick={reset}
              disabled={Object.keys(overrides).length === 0}
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </Button>
            <Switch checked={active} onCheckedChange={onToggle} id="what-if" />
          </div>
        </div>

        <div className={active ? "" : "pointer-events-none opacity-50"}>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-baseline justify-between text-xs">
                <Label className="text-muted-foreground">Max tenor</Label>
                <span className="tabular font-medium">{tenor} years</span>
              </div>
              <Slider
                value={[tenor]}
                min={1}
                max={10}
                step={1}
                onValueChange={(v) => onChange({ ...overrides, max_tenor_years: v[0] })}
              />
              <div className="text-[10px] text-muted-foreground">
                Mandate baseline: {base.max_tenor_years ?? "—"}y
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between text-xs">
                <Label className="text-muted-foreground">Min target yield</Label>
                <span className="tabular font-medium">{fmtPct(yieldMin)}</span>
              </div>
              <Slider
                value={[Math.round(yieldMin * 1000)]}
                min={0}
                max={120}
                step={5}
                onValueChange={(v) =>
                  onChange({ ...overrides, target_yield_min: v[0] / 1000 })
                }
              />
              <div className="text-[10px] text-muted-foreground">
                Mandate baseline: {fmtPct(base.target_yield_min)}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between text-xs">
                <Label className="text-muted-foreground">Max barrier risk</Label>
                <span className="tabular font-medium">{fmtPct(barrier, 0)}</span>
              </div>
              <Slider
                value={[Math.round(barrier * 100)]}
                min={30}
                max={100}
                step={5}
                onValueChange={(v) =>
                  onChange({ ...overrides, max_barrier_risk: v[0] / 100 })
                }
              />
              <div className="text-[10px] text-muted-foreground">
                Mandate baseline: {fmtPct(base.max_barrier_risk, 0)}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border bg-surface px-3 py-2">
              <div>
                <Label className="text-xs">Require capital protection</Label>
                <div className="text-[10px] text-muted-foreground">
                  Mandate baseline: {base.requires_capital_protection ? "yes" : "no"}
                </div>
              </div>
              <Switch
                checked={capProt}
                onCheckedChange={(v) =>
                  onChange({ ...overrides, requires_capital_protection: v })
                }
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
