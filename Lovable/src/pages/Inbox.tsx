import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppStore } from "@/lib/store";
import { RAW_SAMPLES } from "@/mocks/rawSamples";
import { extractFromSample, extractFromText } from "@/lib/extractionMock";
import { score as scoreProduct } from "@/lib/matchingMock";
import { ASSET_MANAGERS } from "@/mocks/assetManagers";
import type { Product } from "@/types/product";
import { PageHeader } from "@/components/common/PageHeader";
import { SourceIcon } from "@/components/common/SourceIcon";
import { ProductTypeBadge } from "@/components/common/ProductTypeBadge";
import { ScoreBar } from "@/components/common/ScoreBar";
import { HighlightedRawText } from "@/components/common/HighlightedRawText";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Inbox as InboxIcon,
  CheckCheck,
  Filter,
} from "lucide-react";
import { fmtRelative, humanize } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface InboxItem {
  id: string;
  source_type: Product["source_type"];
  source_reference: string;
  raw_text: string;
  ingested_at: string;
  product_id: string;
}

type Filter = "all" | "unread" | "read";

export default function Inbox() {
  const { products, addProduct, me, meta, markRead } = useAppStore();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("all");

  const items = useMemo<InboxItem[]>(
    () =>
      products
        .filter((p) => !!p.raw_text)
        .map((p) => ({
          id: `IN-${p.id}`,
          source_type: p.source_type,
          source_reference: p.source_reference ?? humanize(p.source_type) ?? "manual",
          raw_text: p.raw_text!,
          ingested_at: p.ingested_at,
          product_id: p.id,
        }))
        .sort(
          (a, b) =>
            new Date(b.ingested_at).getTime() - new Date(a.ingested_at).getTime(),
        ),
    [products],
  );

  const unreadCount = items.filter((it) => !meta[it.product_id]?.read).length;

  const visibleItems = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((it) => {
      const isRead = meta[it.product_id]?.read ?? false;
      return filter === "unread" ? !isRead : isRead;
    });
  }, [items, filter, meta]);

  function markAllRead() {
    let count = 0;
    for (const it of items) {
      if (!meta[it.product_id]?.read) {
        markRead(it.product_id, true);
        count++;
      }
    }
    if (count > 0) toast.success(`Marked ${count} message${count > 1 ? "s" : ""} as read`);
  }

  // Simulate-arrival panel
  const [text, setText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [justExtracted, setJustExtracted] = useState<Product | null>(null);

  function runExtraction(input: string, fn: () => Product) {
    setExtracting(true);
    setJustExtracted(null);
    setTimeout(() => {
      const p = fn();
      setJustExtracted(p);
      setExtracting(false);
      setText("");
    }, 1100);
  }

  function acceptIntoCatalog(p: Product) {
    addProduct(p);
    toast.success(`${p.id} added to your catalog`);
    setJustExtracted(null);
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Channels"
        title="Inbox"
        description="Raw incoming messages from your channels (email, Bloomberg chat, term sheets, calls). Each one is parsed into a product and scored against your mandate."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-md border bg-surface px-2.5 py-1 text-xs text-muted-foreground">
              <InboxIcon className="h-3.5 w-3.5" />
              <span className="tabular font-medium text-foreground">{items.length}</span>
              <span>messages</span>
              {unreadCount > 0 && (
                <>
                  <span className="text-border">·</span>
                  <span className="tabular font-medium text-primary">{unreadCount}</span>
                  <span>unread</span>
                </>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              disabled={unreadCount === 0}
              onClick={markAllRead}
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </Button>
          </div>
        }
      />

      {/* Simulate arrival */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-primary" /> Simulate a new arrival
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {RAW_SAMPLES.map((s) => (
              <Button
                key={s.id}
                size="sm"
                variant="outline"
                className="gap-1.5"
                disabled={extracting}
                onClick={() => runExtraction(s.raw_text, () => extractFromSample(s))}
              >
                <SourceIcon type={s.source_type} className="h-3.5 w-3.5" />
                {s.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-col gap-2 md:flex-row">
            <Textarea
              rows={3}
              placeholder="…or paste your own bank message, chat snippet, term sheet text…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="font-mono text-xs"
            />
            <Button
              className="gap-1.5 md:self-start"
              disabled={!text.trim() || extracting}
              onClick={() => runExtraction(text, () => extractFromText(text, "manual"))}
            >
              <Sparkles className="h-4 w-4" /> Extract
            </Button>
          </div>

          {extracting && (
            <div className="rounded-md border bg-surface-muted p-3">
              <p className="mb-2 text-xs text-muted-foreground">
                Calling LLM extractor and scoring against your mandate…
              </p>
              <Skeleton className="mb-1.5 h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          )}

          {justExtracted && !extracting && (
            <ExtractedPreview
              product={justExtracted}
              onAccept={() => acceptIntoCatalog(justExtracted)}
              onView={() => {
                acceptIntoCatalog(justExtracted);
                navigate(`/products/${justExtracted.id}`);
              }}
              onDiscard={() => setJustExtracted(null)}
            />
          )}
        </CardContent>
      </Card>

      {/* Filter bar */}
      <div className="flex items-center gap-2 text-xs">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        {(["all", "unread", "read"] as const).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "outline"}
            className="h-7 px-3 text-xs"
            onClick={() => setFilter(f)}
          >
            {f === "all" ? `All (${items.length})` : f === "unread" ? `Unread (${unreadCount})` : `Read (${items.length - unreadCount})`}
          </Button>
        ))}
      </div>

      {/* Inbox feed */}
      <div className="space-y-2">
        {visibleItems.map((it) => {
          const product = products.find((p) => p.id === it.product_id);
          return <InboxRow key={it.id} item={it} product={product} amId={me.id} />;
        })}
        {visibleItems.length === 0 && (
          <Card className="shadow-card">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              {filter === "all"
                ? 'No messages yet. Use "Simulate a new arrival" above.'
                : `No ${filter} messages.`}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function InboxRow({
  item,
  product,
  amId,
}: {
  item: InboxItem;
  product?: Product;
  amId: string;
}) {
  const { meta, markRead } = useAppStore();
  const [open, setOpen] = useState(false);
  const isRead = product ? meta[product.id]?.read ?? false : true;

  const recScore = useMemo(() => {
    if (!product) return null;
    const am = ASSET_MANAGERS.find((a) => a.id === amId);
    if (!am) return null;
    return scoreProduct(product, am);
  }, [product, amId]);

  const snippet = item.raw_text.replace(/\s+/g, " ").slice(0, 160);
  const sourceLabel = humanize(item.source_type);
  // Suppress the secondary source badge when the row title is just the humanized source name
  // (i.e. when no real source_reference was provided).
  const showSourceBadge =
    item.source_reference.trim().toLowerCase() !== sourceLabel.toLowerCase();

  function handleToggle(o: boolean) {
    setOpen(o);
    if (o && product && !isRead) markRead(product.id, true);
  }

  return (
    <Card
      className={cn(
        "shadow-card transition-shadow hover:shadow-elevated",
        !isRead && "border-l-[3px] border-l-primary",
      )}
    >
      <Collapsible open={open} onOpenChange={handleToggle}>
        <div className="flex items-center gap-3 p-4">
          <SourceIcon type={item.source_type} className="h-5 w-5 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className={cn("text-sm", !isRead ? "font-semibold" : "font-medium")}>
                {item.source_reference}
              </span>
              {showSourceBadge && (
                <Badge variant="outline" className="text-[10px]">
                  {sourceLabel}
                </Badge>
              )}
              {!isRead && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary">
                  Unread
                </span>
              )}
              <span className="text-[11px] text-muted-foreground">
                {fmtRelative(item.ingested_at)}
              </span>
            </div>
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{snippet}</p>
          </div>

          {product && (
            <div className="hidden items-center gap-2 md:flex">
              <ProductTypeBadge type={product.product_type} />
              {recScore && (
                <div className="w-24">
                  <ScoreBar value={recScore.score} size="sm" />
                </div>
              )}
            </div>
          )}

          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 shrink-0 p-0">
              {open ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <div className="space-y-3 border-t bg-surface-muted/40 p-4">
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                Raw message — extracted fields highlighted
              </p>
              {product ? (
                <HighlightedRawText text={item.raw_text} product={product} />
              ) : (
                <pre className="whitespace-pre-wrap rounded-md border bg-surface p-3 text-xs leading-relaxed">
                  {item.raw_text}
                </pre>
              )}
            </div>
            {product && (
              <div className="flex items-center justify-between rounded-md border bg-surface p-3">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Parsed product
                  </p>
                  <p className="truncate text-sm font-medium">
                    {product.product_name ?? `${product.issuer} ${humanize(product.product_type)}`}
                  </p>
                </div>
                <Button asChild size="sm" variant="outline" className="gap-1.5">
                  <Link to={`/products/${product.id}`}>
                    Open <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function ExtractedPreview({
  product,
  onAccept,
  onView,
  onDiscard,
}: {
  product: Product;
  onAccept: () => void;
  onView: () => void;
  onDiscard: () => void;
}) {
  return (
    <div className="space-y-3 rounded-md border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Just extracted · {product.id}
          </p>
          <p className="text-sm font-semibold">
            {product.product_name ?? `${product.issuer} ${humanize(product.product_type)}`}
          </p>
        </div>
        <ProductTypeBadge type={product.product_type} />
      </div>
      {product.raw_text && (
        <HighlightedRawText text={product.raw_text} product={product} />
      )}
      <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
        <KV k="Currency" v={product.currency} />
        <KV k="Tenor" v={product.tenor_years ? `${product.tenor_years}y` : "—"} />
        <KV k="Coupon" v={product.coupon ? `${(product.coupon * 100).toFixed(2)}%` : "—"} />
        <KV k="Rating" v={product.issuer_rating ?? "—"} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={onView} className="gap-1.5">
          Open in catalog <ArrowRight className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="outline" onClick={onAccept}>
          Add silently
        </Button>
        <Button size="sm" variant="ghost" onClick={onDiscard}>
          Discard
        </Button>
      </div>
    </div>
  );
}

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="rounded-md bg-surface-muted px-2.5 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{k}</div>
      <div className="font-medium tabular">{v}</div>
    </div>
  );
}
