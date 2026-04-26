import { Link } from "react-router-dom";
import { useAppStore } from "@/lib/store";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/EmptyState";
import { Send, ArrowRight, CheckCheck, Mail, Eye } from "lucide-react";
import { fmtRelative } from "@/lib/format";
import type { OutboxStatus } from "@/types/outbox";
import { cn } from "@/lib/utils";

const STATUS: Record<OutboxStatus, { label: string; icon: typeof Send; className: string }> = {
  sent: {
    label: "Sent",
    icon: Send,
    className: "border-info/40 bg-info/10 text-info",
  },
  acknowledged: {
    label: "Acknowledged",
    icon: Eye,
    className: "border-warning/40 bg-warning/10 text-warning",
  },
  received: {
    label: "Term sheet received",
    icon: CheckCheck,
    className: "border-success/40 bg-success/10 text-success",
  },
};

export default function Outbox() {
  const { outbox } = useAppStore();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <PageHeader
        eyebrow="Channels"
        title="Outbox"
        description="Term-sheet requests you've sent to issuers. Status updates as they reply."
        actions={
          <div className="flex items-center gap-2 rounded-md border bg-surface px-2.5 py-1 text-xs text-muted-foreground">
            <Mail className="h-3.5 w-3.5" />
            <span className="tabular font-medium text-foreground">{outbox.length}</span>
            sent
          </div>
        }
      />

      {outbox.length === 0 ? (
        <EmptyState
          icon={Send}
          title="No requests sent yet"
          description={
            <>
              From any product or recommendation, click <span className="font-medium">"Request term sheet"</span>{" "}
              to start a request. Sent requests show up here with live status.
            </>
          }
          action={
            <Link
              to="/recommendations"
              className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
            >
              Browse recommendations <ArrowRight className="h-3 w-3" />
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {outbox.map((req) => {
            const s = STATUS[req.status];
            const Icon = s.icon;
            return (
              <Card key={req.id} className="shadow-card transition-shadow hover:shadow-elevated">
                <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/products/${req.product_id}`}
                        className="text-sm font-semibold hover:underline"
                      >
                        {req.product_name}
                      </Link>
                      <Badge
                        variant="outline"
                        className={cn("gap-1 text-[10px]", s.className)}
                      >
                        <Icon className="h-3 w-3" />
                        {s.label}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        to {req.issuer} · sent {fmtRelative(req.sent_at)}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {req.message.split("\n").slice(2, 4).join(" ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <StatusTrack status={req.status} />
                    <Link
                      to={`/products/${req.product_id}`}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      Open <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusTrack({ status }: { status: OutboxStatus }) {
  const steps: OutboxStatus[] = ["sent", "acknowledged", "received"];
  const currentIdx = steps.indexOf(status);
  return (
    <div className="hidden items-center gap-1 md:flex">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-1">
          <div
            className={cn(
              "h-2 w-2 rounded-full",
              i <= currentIdx ? "bg-primary" : "bg-muted-foreground/30",
            )}
          />
          {i < steps.length - 1 && (
            <div
              className={cn(
                "h-px w-8",
                i < currentIdx ? "bg-primary" : "bg-muted-foreground/30",
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
