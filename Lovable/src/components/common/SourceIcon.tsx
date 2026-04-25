import { Mail, MessageSquare, FileText, Phone, FileSpreadsheet, PenLine } from "lucide-react";
import type { SourceType } from "@/types/product";
import { cn } from "@/lib/utils";

const ICONS = {
  email: Mail,
  chat: MessageSquare,
  pdf: FileText,
  call: Phone,
  csv: FileSpreadsheet,
  manual: PenLine,
} as const;

export function SourceIcon({
  type,
  className,
}: {
  type?: SourceType | null;
  className?: string;
}) {
  const Icon = type ? ICONS[type] : PenLine;
  return <Icon className={cn("h-4 w-4 text-muted-foreground", className)} aria-label={type ?? "manual"} />;
}
