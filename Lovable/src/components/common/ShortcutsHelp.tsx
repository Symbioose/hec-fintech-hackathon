import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Shortcut {
  keys: string[];
  description: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortcuts?: Shortcut[];
}

const DEFAULTS: Shortcut[] = [
  { keys: ["⌘", "K"], description: "Open global search" },
  { keys: ["?"], description: "Show this help" },
];

export function ShortcutsHelp({ open, onOpenChange, shortcuts = [] }: Props) {
  const all = [...shortcuts, ...DEFAULTS];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
        </DialogHeader>
        <div className="divide-y">
          {all.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-2 text-sm">
              <span className="text-foreground/90">{s.description}</span>
              <span className="flex items-center gap-1">
                {s.keys.map((k, j) => (
                  <kbd
                    key={j}
                    className="rounded-md border bg-surface-muted px-1.5 py-0.5 text-[11px] font-medium tabular text-foreground shadow-sm"
                  >
                    {k}
                  </kbd>
                ))}
              </span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
