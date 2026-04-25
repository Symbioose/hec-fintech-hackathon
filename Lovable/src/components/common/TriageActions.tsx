import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bookmark, Heart, X, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore, type ProductStatus } from "@/lib/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PASS_REASONS = [
  "Tenor too long",
  "Coupon too low",
  "Issuer concern",
  "Wrong underlying",
  "Risk too high",
  "Other",
];

interface Props {
  productId: string;
  size?: "sm" | "default";
  variant?: "compact" | "full";
  onChange?: (status: ProductStatus) => void;
}

export function TriageActions({ productId, size = "sm", variant = "full", onChange }: Props) {
  const { meta, setStatus } = useAppStore();
  const current = meta[productId]?.status ?? "none";
  const [open, setOpen] = useState(false);

  function apply(status: ProductStatus, reason?: string) {
    setStatus(productId, status, reason);
    onChange?.(status);
    if (status === "watch") toast.success("Added to watchlist");
    if (status === "interested") toast.success("Marked as interested");
    if (status === "passed") toast(`Passed${reason ? ` — ${reason}` : ""}`);
    if (status === "none") toast("Cleared");
  }

  // Stop event bubbling so clicks inside table rows / cards don't trigger row navigation.
  const stop = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  if (variant === "compact") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={stop}>
          <Button size={size} variant="outline" className="h-7 gap-1 text-xs">
            {current === "watch" && <Bookmark className="h-3.5 w-3.5 text-info" />}
            {current === "interested" && <Heart className="h-3.5 w-3.5 text-success" />}
            {current === "passed" && <X className="h-3.5 w-3.5 text-destructive" />}
            {current === "none" && <Bookmark className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">
              {current === "none" ? "Triage" : "Update"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={stop} className="w-56">
          <DropdownMenuLabel className="text-xs">Triage</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => apply("watch")}>
            <Bookmark className="mr-2 h-3.5 w-3.5 text-info" /> Add to watchlist
            {current === "watch" && <Check className="ml-auto h-3.5 w-3.5" />}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => apply("interested")}>
            <Heart className="mr-2 h-3.5 w-3.5 text-success" /> Mark interested
            {current === "interested" && <Check className="ml-auto h-3.5 w-3.5" />}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs">Pass with reason</DropdownMenuLabel>
          {PASS_REASONS.map((r) => (
            <DropdownMenuItem key={r} onClick={() => apply("passed", r)}>
              <X className="mr-2 h-3.5 w-3.5 text-destructive" /> {r}
            </DropdownMenuItem>
          ))}
          {current !== "none" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => apply("none")}>
                Clear status
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex flex-wrap gap-2" onClick={stop}>
      <Button
        size={size}
        variant={current === "watch" ? "default" : "outline"}
        className={cn("gap-1.5", current === "watch" && "bg-info text-info-foreground hover:bg-info/90")}
        onClick={() => apply(current === "watch" ? "none" : "watch")}
      >
        <Bookmark className="h-3.5 w-3.5" />
        Watch
      </Button>
      <Button
        size={size}
        variant={current === "interested" ? "default" : "outline"}
        className={cn(
          "gap-1.5",
          current === "interested" && "bg-success text-success-foreground hover:bg-success/90",
        )}
        onClick={() => apply(current === "interested" ? "none" : "interested")}
      >
        <Heart className="h-3.5 w-3.5" />
        Interested
      </Button>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            size={size}
            variant={current === "passed" ? "default" : "outline"}
            className={cn(
              "gap-1.5",
              current === "passed" && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
            )}
          >
            <X className="h-3.5 w-3.5" />
            Pass
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="text-xs">Reason</DropdownMenuLabel>
          {PASS_REASONS.map((r) => (
            <DropdownMenuItem key={r} onClick={() => apply("passed", r)}>
              {r}
            </DropdownMenuItem>
          ))}
          {current === "passed" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => apply("none")}>Clear</DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
