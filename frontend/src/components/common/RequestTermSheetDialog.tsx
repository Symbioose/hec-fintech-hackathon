import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { Product } from "@/types/product";
import { fmtPct, humanize } from "@/lib/format";
import { toast } from "sonner";

interface Props {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function draftMessage(product: Product, amName: string, amFirm: string): string {
  return `Hi ${product.issuer} team,

We're reviewing the indication below at ${amFirm} and would like a full term sheet.

Reference: ${product.product_name ?? product.id}
Type: ${humanize(product.product_type)}
Currency / tenor: ${product.currency} / ${product.tenor_years ?? "—"}y
Coupon: ${fmtPct(product.coupon)}
${product.barrier != null ? `Barrier: ${fmtPct(product.barrier, 0)}` : ""}
${product.capital_protection ? "Capital protection: 100%" : ""}

Could you confirm:
- Pricing date and indicative levels
- Final issuer rating and ISIN
- Estimated entry cost
- Indicative liquidity in secondary

Thanks,
${amName}`;
}

export function RequestTermSheetDialog({ product, open, onOpenChange }: Props) {
  const { me, sendTermSheetRequest } = useAppStore();
  const initialDraft = useMemo(() => draftMessage(product, me.name, me.firm), [product, me]);
  const [message, setMessage] = useState(initialDraft);

  function handleSend() {
    const req = sendTermSheetRequest(product, message);
    toast.success(`Term-sheet request sent to ${product.issuer}`, {
      description: `Tracked as ${req.id} in your Outbox.`,
    });
    onOpenChange(false);
    setMessage(initialDraft);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setMessage(initialDraft);
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Request term sheet</DialogTitle>
          <DialogDescription>
            Edit the draft below before sending. The request will appear in your Outbox.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <div className="rounded-md border bg-surface-muted p-2 text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground">To:</span> {product.issuer}{" "}
            <span className="ml-3 font-medium text-foreground">Re:</span>{" "}
            {product.product_name ?? product.id}
          </div>
          <Textarea
            rows={14}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="font-mono text-xs leading-relaxed"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={!message.trim()} className="gap-1.5">
            <Send className="h-3.5 w-3.5" /> Send request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
