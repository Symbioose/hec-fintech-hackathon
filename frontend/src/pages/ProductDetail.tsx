import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useAppStore } from "@/lib/store";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductTypeBadge } from "@/components/common/ProductTypeBadge";
import { RiskBadge } from "@/components/common/RiskBadge";
import { JsonViewer } from "@/components/common/JsonViewer";
import { ScoreBar } from "@/components/common/ScoreBar";
import { SourceIcon } from "@/components/common/SourceIcon";
import { SubScoreRadar } from "@/components/common/SubScoreRadar";
import { TriageActions } from "@/components/common/TriageActions";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { RequestTermSheetDialog } from "@/components/common/RequestTermSheetDialog";
import { MarketViewCard } from "@/components/common/MarketViewCard";
import { alignmentsForProduct } from "@/lib/marketAlignment";
import { MARKET_VIEWS } from "@/mocks/marketViews";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ArrowLeft, Sparkles, Send } from "lucide-react";
import { fmtCurrency, fmtDate, fmtPct, humanize } from "@/lib/format";
import { score as scoreProduct } from "@/lib/matchingMock";
import { CheckCircle2, AlertTriangle, XCircle, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-md border bg-surface px-3 py-2.5">
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-medium tabular text-foreground">{value}</span>
    </div>
  );
}

const KIND_ICON = {
  positive: CheckCircle2,
  warning: AlertTriangle,
  blocker: XCircle,
  neutral: Circle,
} as const;
const KIND_COLOR = {
  positive: "text-success",
  warning: "text-warning",
  blocker: "text-destructive",
  neutral: "text-muted-foreground",
} as const;

export default function ProductDetail() {
  const { id } = useParams();
  const { products, me, meta, markRead } = useAppStore();
  const product = products.find((p) => p.id === id);
  const status = product ? meta[product.id]?.status ?? "none" : "none";
  const [requestOpen, setRequestOpen] = useState(false);

  useEffect(() => {
    if (product && !meta[product.id]?.read) markRead(product.id, true);
  }, [product, meta, markRead]);

  if (!product) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4 py-8 text-center">
        <h2 className="text-xl font-semibold">Product not found</h2>
        <Button variant="outline" asChild>
          <Link to="/products">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to catalog
          </Link>
        </Button>
      </div>
    );
  }

  const myMatch = scoreProduct(product, me);
  const alignments = alignmentsForProduct(product, MARKET_VIEWS).slice(0, 3);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <Breadcrumbs
        items={[
          { label: "Products", to: "/products" },
          { label: product.product_name ?? product.id },
        ]}
      />

      <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
        <Link to="/products">
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to catalog
        </Link>
      </Button>

      <PageHeader
        eyebrow={product.id}
        title={product.product_name ?? `${product.issuer} ${humanize(product.product_type)}`}
        description={`Issued by ${product.issuer} · ${product.currency} · source: ${product.source_reference ?? humanize(product.source_type)}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ProductTypeBadge type={product.product_type} />
            <RiskBadge level={product.risk_level} />
            <Badge variant="outline" className="gap-1.5">
              <SourceIcon type={product.source_type} className="h-3 w-3" />
              {humanize(product.source_type)}
            </Badge>
            {status !== "none" && <StatusBadge status={status} />}
          </div>
        }
      />

      <Card className="shadow-card">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="text-xs text-muted-foreground">
            Decision — flag this product, pass with a reason, or request a full term sheet.
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <TriageActions productId={product.id} variant="full" />
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => setRequestOpen(true)}
            >
              <Send className="h-3.5 w-3.5" /> Request term sheet
            </Button>
          </div>
        </CardContent>
      </Card>

      {alignments.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">House view</CardTitle>
            <p className="text-xs text-muted-foreground">
              How this product sits against your strategists' latest market views.
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {alignments.map((a) => (
              <MarketViewCard
                key={a.view.id}
                view={a.view}
                alignment={a.alignment}
                alignmentReason={a.reason}
              />
            ))}
          </CardContent>
        </Card>
      )}

      <RequestTermSheetDialog product={product} open={requestOpen} onOpenChange={setRequestOpen} />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="raw">Raw text</TabsTrigger>
          <TabsTrigger value="json">Raw JSON</TabsTrigger>
          <TabsTrigger value="matches">Match for you</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <KV label="Currency" value={product.currency} />
            <KV label="Tenor" value={product.tenor_years ? `${product.tenor_years} years` : "—"} />
            <KV label="Coupon" value={fmtPct(product.coupon)} />
            <KV label="Coupon type" value={humanize(product.coupon_type)} />
            <KV label="Barrier" value={fmtPct(product.barrier, 0)} />
            <KV label="Capital protection" value={product.capital_protection ? "Yes" : "No"} />
            <KV
              label="Autocall"
              value={
                product.autocall
                  ? `Yes (${humanize(product.autocall_frequency)})`
                  : "No"
              }
            />
            <KV label="Issuer rating" value={product.issuer_rating ?? "—"} />
            <KV label="Notional" value={fmtCurrency(product.notional, product.currency)} />
            <KV label="Maturity" value={fmtDate(product.maturity_date)} />
            <KV label="Liquidity" value={humanize(product.liquidity)} />
            <KV label="Est. cost" value={fmtPct(product.estimated_cost)} />
          </div>

          {product.underlying.length > 0 && (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Underlying</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {product.underlying.map((u) => (
                  <Badge key={u} variant="secondary" className="font-mono text-xs">
                    {u}
                  </Badge>
                ))}
                {product.underlying_type && (
                  <Badge variant="outline" className="text-xs">
                    {humanize(product.underlying_type)}
                  </Badge>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="raw" className="mt-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Source content</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap rounded-md border bg-surface-muted p-4 text-xs leading-relaxed text-foreground">
                {product.raw_text ?? "No raw text captured for this product."}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="json" className="mt-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Extracted JSON (Pydantic-validated)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <JsonViewer data={product} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matches" className="mt-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-primary" />
                How this product fits your mandate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
                <div className="space-y-3">
                  <div className="flex items-center gap-4 rounded-md border bg-surface p-4">
                    <div className="flex-1">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Match score for {me.name}
                      </p>
                      <p className="tabular text-3xl font-semibold">{myMatch.score}</p>
                    </div>
                    <div className="w-40">
                      <ScoreBar value={myMatch.score} showNumber={false} />
                    </div>
                  </div>
                </div>
                <div className="rounded-md border bg-surface p-2 lg:w-[340px]">
                  <SubScoreRadar subScores={myMatch.sub_scores} />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Why
                </p>
                <ul className="space-y-1.5">
                  {myMatch.rationale.map((b, i) => {
                    const Icon = KIND_ICON[b.kind];
                    return (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${KIND_COLOR[b.kind]}`} />
                        <span>{b.text}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                {Object.entries(myMatch.sub_scores).map(([k, v]) => (
                  <div key={k} className="rounded-md border bg-surface px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {humanize(k)}
                    </div>
                    <div className="mt-1 tabular text-sm font-semibold">
                      {(v * 100).toFixed(0)}
                    </div>
                    <ScoreBar
                      value={Math.round(v * 100)}
                      showNumber={false}
                      size="sm"
                      className="mt-1"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
