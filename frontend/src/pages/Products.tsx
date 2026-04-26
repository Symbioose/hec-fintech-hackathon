import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAppStore } from "@/lib/store";
import { PageHeader } from "@/components/common/PageHeader";
import { ProductTypeBadge } from "@/components/common/ProductTypeBadge";
import { RiskBadge } from "@/components/common/RiskBadge";
import { SourceIcon } from "@/components/common/SourceIcon";
import { StatusBadge } from "@/components/common/StatusBadge";
import { TriageActions } from "@/components/common/TriageActions";
import { RowSelectCheckbox } from "@/components/common/RowSelectCheckbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { fmtPct, fmtRelative, humanize } from "@/lib/format";
import { Boxes, Filter } from "lucide-react";
import type { ProductType } from "@/types/product";

const TYPES: (ProductType | "all")[] = [
  "all",
  "autocallable",
  "reverse_convertible",
  "capital_protected_note",
  "credit_linked_note",
  "fixed_rate_note",
  "floating_rate_note",
  "range_accrual",
];

export default function Products() {
  const { products, meta } = useAppStore();
  const [params] = useSearchParams();
  const [q, setQ] = useState("");
  const [type, setType] = useState<ProductType | "all">("all");
  const [currency, setCurrency] = useState<string>("all");
  const [issuer, setIssuer] = useState<string>("all");

  useEffect(() => {
    const i = params.get("issuer");
    if (i) setIssuer(i);
  }, [params]);

  const issuers = useMemo(
    () => Array.from(new Set(products.map((p) => p.issuer))).sort(),
    [products],
  );
  const currencies = useMemo(
    () => Array.from(new Set(products.map((p) => p.currency))).sort(),
    [products],
  );

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (type !== "all" && p.product_type !== type) return false;
      if (currency !== "all" && p.currency !== currency) return false;
      if (issuer !== "all" && p.issuer !== issuer) return false;
      if (q) {
        const t = q.toLowerCase();
        if (
          !`${p.issuer} ${p.product_name ?? ""} ${p.underlying.join(" ")}`
            .toLowerCase()
            .includes(t)
        )
          return false;
      }
      return true;
    });
  }, [products, type, currency, issuer, q]);

  const reset = () => {
    setQ("");
    setType("all");
    setCurrency("all");
    setIssuer("all");
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Catalog"
        title="Products"
        description="All structured products extracted from incoming bank flows."
        actions={
          <div className="flex items-center gap-2 rounded-md border bg-surface px-2.5 py-1 text-xs text-muted-foreground">
            <Boxes className="h-3.5 w-3.5" />
            <span className="tabular font-medium text-foreground">{products.length}</span>
            in catalog
          </div>
        }
      />

      <Card className="p-4 shadow-card">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_auto_auto_auto]">
          <Input
            placeholder="Search issuer, name, underlying…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-9"
          />
          <Select value={type} onValueChange={(v) => setType(v as ProductType | "all")}>
            <SelectTrigger className="h-9 min-w-[170px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t === "all" ? "All types" : humanize(t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="h-9 min-w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ccy</SelectItem>
              {currencies.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={issuer} onValueChange={setIssuer}>
            <SelectTrigger className="h-9 min-w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All issuers</SelectItem>
              {issuers.map((i) => (
                <SelectItem key={i} value={i}>
                  {i}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" onClick={reset} className="h-9 gap-1.5">
            <Filter className="h-3.5 w-3.5" /> Reset
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden shadow-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-muted">
              <TableHead className="w-[36px]" />
              <TableHead className="w-[28%] min-w-[260px]">Product</TableHead>
              <TableHead className="min-w-[120px]">Type</TableHead>
              <TableHead className="text-right">Coupon</TableHead>
              <TableHead className="text-right">Tenor</TableHead>
              <TableHead className="text-right">Barrier</TableHead>
              <TableHead className="min-w-[100px]">Risk</TableHead>
              <TableHead className="min-w-[90px]">Status</TableHead>
              <TableHead className="min-w-[100px] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => {
              const status = meta[p.id]?.status ?? "none";
              return (
                <TableRow key={p.id} className="hover:bg-surface-muted/60">
                  <TableCell className="w-[36px]">
                    <RowSelectCheckbox productId={p.id} />
                  </TableCell>
                  <TableCell>
                    <Link to={`/products/${p.id}`} className="block">
                      <div className="flex items-center gap-2.5">
                        <SourceIcon type={p.source_type} />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-foreground">
                            {p.product_name ?? `${p.issuer} ${humanize(p.product_type)}`}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {p.issuer} · {p.currency} · {fmtRelative(p.ingested_at)}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <ProductTypeBadge type={p.product_type} />
                  </TableCell>
                  <TableCell className="tabular text-right text-sm">{fmtPct(p.coupon)}</TableCell>
                  <TableCell className="tabular text-right text-sm">
                    {p.tenor_years ? `${p.tenor_years}y` : "—"}
                  </TableCell>
                  <TableCell className="tabular text-right text-sm">
                    {fmtPct(p.barrier, 0)}
                  </TableCell>
                  <TableCell>
                    <RiskBadge level={p.risk_level} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <TriageActions productId={p.id} variant="compact" />
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-12 text-center text-sm text-muted-foreground">
                  No products match the current filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
