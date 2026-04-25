import { Checkbox } from "@/components/ui/checkbox";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface Props {
  productId: string;
  className?: string;
}

export function RowSelectCheckbox({ productId, className }: Props) {
  const { isCompareSelected, toggleCompare, compareIds, compareMax } = useAppStore();
  const checked = isCompareSelected(productId);
  const disabled = !checked && compareIds.length >= compareMax;

  return (
    <div
      className={cn("flex items-center justify-center", className)}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      <Checkbox
        checked={checked}
        disabled={disabled}
        onCheckedChange={() => toggleCompare(productId)}
        aria-label={checked ? "Remove from compare" : "Add to compare"}
      />
    </div>
  );
}
