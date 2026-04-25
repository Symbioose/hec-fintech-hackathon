import { useEffect, useRef, useState } from "react";
import { Pencil, Check, X, ShieldQuestion } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAppStore } from "@/lib/store";
import type { Product } from "@/types/product";
import { cn } from "@/lib/utils";

interface Props {
  productId: string;
  field: keyof Product;
  label: string;
  value: React.ReactNode;
  /** What to put into the input when editing — defaults to a stringified value. */
  inputValue?: string;
  /** How to parse the input back into the field type. Default: string passthrough. */
  parse?: (raw: string) => unknown;
  /** Disable editing. */
  readOnly?: boolean;
}

export function EditableField({
  productId,
  field,
  label,
  value,
  inputValue,
  parse,
  readOnly,
}: Props) {
  const { editField, isEdited, confidenceFor, products } = useAppStore();
  const product = products.find((p) => p.id === productId);
  const confidence = product ? confidenceFor(product, field) : 1;
  const edited = isEdited(productId, field);
  const lowConfidence = !edited && confidence < 0.7;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(inputValue ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(inputValue ?? "");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [editing, inputValue]);

  function commit() {
    const next = parse ? parse(draft) : draft;
    editField(productId, field, next);
    setEditing(false);
  }

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-0.5 rounded-md border bg-surface px-3 py-2.5",
        lowConfidence && "border-warning/40 bg-warning/5",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <div className="flex items-center gap-1">
          {edited && (
            <span className="rounded-full bg-info/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-info">
              edited
            </span>
          )}
          {lowConfidence && (
            <Tooltip>
              <TooltipTrigger asChild>
                <ShieldQuestion className="h-3 w-3 text-warning" />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-[11px]">
                Extracted with {(confidence * 100).toFixed(0)}% confidence — verify.
              </TooltipContent>
            </Tooltip>
          )}
          {!readOnly && !editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="opacity-0 transition-opacity group-hover:opacity-100"
              aria-label={`Edit ${label}`}
            >
              <Pencil className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="flex items-center gap-1">
          <Input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setEditing(false);
            }}
            className="h-7 px-2 py-0 text-sm"
          />
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={commit}>
            <Check className="h-3.5 w-3.5 text-success" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setEditing(false)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <span className="text-sm font-medium tabular text-foreground">{value}</span>
      )}
    </div>
  );
}
