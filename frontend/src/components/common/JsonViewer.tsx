import { cn } from "@/lib/utils";

export function JsonViewer({ data, className }: { data: unknown; className?: string }) {
  const json = JSON.stringify(data, null, 2);
  return (
    <pre
      className={cn(
        "max-h-[60vh] overflow-auto rounded-md border bg-surface-muted p-4 text-xs leading-relaxed font-mono",
        className,
      )}
    >
      <code>{json}</code>
    </pre>
  );
}
