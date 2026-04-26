import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav className={cn("flex flex-wrap items-center gap-1 text-xs text-muted-foreground", className)}>
      {items.map((c, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={`${c.label}-${i}`} className="flex items-center gap-1">
            {c.to && !isLast ? (
              <Link to={c.to} className="hover:text-foreground hover:underline">
                {c.label}
              </Link>
            ) : (
              <span className={isLast ? "text-foreground" : ""}>{c.label}</span>
            )}
            {!isLast && <ChevronRight className="h-3 w-3" />}
          </span>
        );
      })}
    </nav>
  );
}
