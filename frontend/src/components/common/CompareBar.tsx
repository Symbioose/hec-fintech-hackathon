import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { GitCompareArrows, X } from "lucide-react";
import { CompareDrawer } from "@/components/common/CompareDrawer";

export function CompareBar() {
  const { compareIds, clearCompare, compareMax } = useAppStore();
  const [open, setOpen] = useState(false);

  if (compareIds.length === 0) return null;

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-5">
        <div className="pointer-events-auto flex items-center gap-3 rounded-full border bg-popover/95 px-4 py-2 shadow-elevated backdrop-blur">
          <GitCompareArrows className="h-4 w-4 text-primary" />
          <span className="text-sm">
            <span className="tabular font-semibold">{compareIds.length}</span>
            <span className="text-muted-foreground"> / {compareMax} selected</span>
          </span>
          <Button
            size="sm"
            className="h-7"
            disabled={compareIds.length < 2}
            onClick={() => setOpen(true)}
          >
            Compare
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 text-xs text-muted-foreground"
            onClick={clearCompare}
          >
            <X className="h-3.5 w-3.5" /> Clear
          </Button>
        </div>
      </div>
      <CompareDrawer open={open} onOpenChange={setOpen} />
    </>
  );
}
