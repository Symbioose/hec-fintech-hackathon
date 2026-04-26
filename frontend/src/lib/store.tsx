// App-wide store (single asset manager).
// Manages products, per-product triage/read-state metadata, user edits to extracted fields,
// a compare-selection set, and a fake outbox for sent term-sheet requests.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Product } from "@/types/product";
import { PRODUCTS } from "@/mocks/products";
import { ASSET_MANAGERS } from "@/mocks/assetManagers";
import { ME_AM_ID } from "@/lib/auth";
import type { OutboxRequest, OutboxStatus } from "@/types/outbox";

export type ProductStatus = "none" | "watch" | "interested" | "passed";

/** Canonical pass-reason chips. Anything else becomes `other` with the original text kept. */
export const PASS_REASON_CODES = [
  "tenor_too_long",
  "coupon_too_low",
  "wrong_issuer",
  "wrong_underlying",
  "too_risky",
  "wrong_currency",
  "other",
] as const;
export type PassReasonCode = (typeof PASS_REASON_CODES)[number];

export const PASS_REASON_LABEL: Record<PassReasonCode, string> = {
  tenor_too_long: "Tenor too long",
  coupon_too_low: "Coupon too low",
  wrong_issuer: "Wrong issuer",
  wrong_underlying: "Wrong underlying",
  too_risky: "Too risky",
  wrong_currency: "Wrong currency",
  other: "Other",
};

/** Map a free-text reason (from the legacy TriageActions menu) to a canonical code. */
export function canonicalPassReason(reason?: string | null): PassReasonCode {
  if (!reason) return "other";
  const r = reason.toLowerCase();
  if (r.includes("tenor")) return "tenor_too_long";
  if (r.includes("coupon")) return "coupon_too_low";
  if (r.includes("issuer")) return "wrong_issuer";
  if (r.includes("underlying")) return "wrong_underlying";
  if (r.includes("risk")) return "too_risky";
  if (r.includes("currency")) return "wrong_currency";
  return "other";
}

export interface ProductMeta {
  status: ProductStatus;
  pass_reason?: string | null;
  read: boolean;
  updated_at: string;
}

type FieldEdits = Partial<Record<keyof Product, unknown>>;

interface AppStore {
  products: Product[]; // already merged with edits
  rawProducts: Product[]; // original (for the JSON tab)
  addProduct: (p: Product) => void;
  me: typeof ASSET_MANAGERS[number];

  // triage / inbox state
  meta: Record<string, ProductMeta>;
  setStatus: (productId: string, status: ProductStatus, passReason?: string) => void;
  markRead: (productId: string, read?: boolean) => void;
  unreadCount: number;
  watchlist: Product[];

  // edits
  edits: Record<string, FieldEdits>;
  editField: (productId: string, key: keyof Product, value: unknown) => void;
  isEdited: (productId: string, key: keyof Product) => boolean;
  confidenceFor: (product: Product, key: keyof Product) => number;

  // compare selection (in-memory only)
  compareIds: string[];
  toggleCompare: (productId: string) => void;
  clearCompare: () => void;
  isCompareSelected: (productId: string) => boolean;
  readonly compareMax: number;

  // outbox
  outbox: OutboxRequest[];
  sendTermSheetRequest: (product: Product, message: string) => OutboxRequest;
}

const AppStoreContext = createContext<AppStore | null>(null);

const META_KEY = "sm.product_meta.v1";
const EDITS_KEY = "sm.product_edits.v1";
const OUTBOX_KEY = "sm.outbox.v1";
const COMPARE_MAX = 4;

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Heuristic confidence for a field — high if value appears verbatim in raw_text, else moderate. */
function defaultConfidence(p: Product): Record<string, number> {
  const raw = (p.raw_text ?? "").toLowerCase();
  const present = (s: string) => raw.includes(s.toLowerCase());
  const c: Record<string, number> = {};
  c.issuer = p.issuer && present(p.issuer.split(" ")[0]) ? 0.96 : 0.7;
  c.product_type = 0.92;
  c.currency = p.currency && present(p.currency) ? 0.99 : 0.75;
  c.tenor_years = p.tenor_years != null && present(`${p.tenor_years}y`) ? 0.95 : 0.78;
  c.coupon =
    p.coupon != null && present(`${(p.coupon * 100).toFixed(2)}%`)
      ? 0.95
      : p.coupon != null && present(`${(p.coupon * 100).toFixed(1)}%`)
        ? 0.9
        : 0.65;
  c.coupon_type = 0.82;
  c.barrier =
    p.barrier != null && present(`${(p.barrier * 100).toFixed(0)}%`) ? 0.92 : 0.62;
  c.capital_protection = present("capital protect") || present("capital guarantee") ? 0.97 : 0.78;
  c.autocall = present("autocall") ? 0.98 : 0.72;
  c.autocall_frequency = p.autocall_frequency ? 0.78 : 0.5;
  c.issuer_rating = p.issuer_rating && raw.includes(p.issuer_rating.toLowerCase()) ? 0.96 : 0.6;
  c.liquidity = p.liquidity ? 0.55 : 0.4;
  c.estimated_cost = p.estimated_cost != null ? 0.7 : 0.4;
  c.risk_level = 0.7;
  c.notional = p.notional != null ? 0.85 : 0.5;
  c.maturity_date = p.maturity_date ? 0.8 : 0.4;
  return c;
}

function applyEdits(p: Product, edits?: FieldEdits): Product {
  if (!edits || Object.keys(edits).length === 0) return p;
  return { ...p, ...(edits as Partial<Product>) };
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [rawProducts, setRawProducts] = useState<Product[]>(PRODUCTS);
  const [meta, setMeta] = useState<Record<string, ProductMeta>>(() => loadJSON(META_KEY, {}));
  const [edits, setEdits] = useState<Record<string, FieldEdits>>(() =>
    loadJSON(EDITS_KEY, {} as Record<string, FieldEdits>),
  );
  const [outbox, setOutbox] = useState<OutboxRequest[]>(() => loadJSON(OUTBOX_KEY, [] as OutboxRequest[]));
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const products = useMemo(
    () => rawProducts.map((p) => applyEdits(p, edits[p.id])),
    [rawProducts, edits],
  );

  // seed read=false for fresh products
  useEffect(() => {
    setMeta((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const p of rawProducts) {
        if (!next[p.id]) {
          next[p.id] = { status: "none", read: false, updated_at: new Date().toISOString() };
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [rawProducts]);

  // persist
  useEffect(() => {
    try {
      localStorage.setItem(META_KEY, JSON.stringify(meta));
    } catch {
      /* ignore */
    }
  }, [meta]);
  useEffect(() => {
    try {
      localStorage.setItem(EDITS_KEY, JSON.stringify(edits));
    } catch {
      /* ignore */
    }
  }, [edits]);
  useEffect(() => {
    try {
      localStorage.setItem(OUTBOX_KEY, JSON.stringify(outbox));
    } catch {
      /* ignore */
    }
  }, [outbox]);

  const addProduct = useCallback((p: Product) => {
    setRawProducts((prev) => [p, ...prev]);
  }, []);

  const setStatus = useCallback(
    (productId: string, status: ProductStatus, passReason?: string) => {
      setMeta((prev) => ({
        ...prev,
        [productId]: {
          ...(prev[productId] ?? { read: true }),
          status,
          pass_reason: status === "passed" ? passReason ?? null : null,
          read: true,
          updated_at: new Date().toISOString(),
        },
      }));
    },
    [],
  );

  const markRead = useCallback((productId: string, read = true) => {
    setMeta((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] ?? { status: "none" as ProductStatus }),
        read,
        updated_at: new Date().toISOString(),
      },
    }));
  }, []);

  const editField = useCallback((productId: string, key: keyof Product, value: unknown) => {
    setEdits((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] ?? {}),
        [key]: value,
      },
    }));
  }, []);

  const isEdited = useCallback(
    (productId: string, key: keyof Product) =>
      Object.prototype.hasOwnProperty.call(edits[productId] ?? {}, key as string),
    [edits],
  );

  const confidenceFor = useCallback(
    (product: Product, key: keyof Product): number => {
      if (isEdited(product.id, key)) return 1;
      const explicit = product.confidence?.[key as string];
      if (typeof explicit === "number") return explicit;
      // compute from raw heuristic on the underlying raw product (not the edited one)
      const raw = rawProducts.find((p) => p.id === product.id) ?? product;
      const c = defaultConfidence(raw);
      return c[key as string] ?? 0.85;
    },
    [isEdited, rawProducts],
  );

  // compare
  const toggleCompare = useCallback((productId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(productId)) return prev.filter((x) => x !== productId);
      if (prev.length >= COMPARE_MAX) return prev;
      return [...prev, productId];
    });
  }, []);
  const clearCompare = useCallback(() => setCompareIds([]), []);
  const isCompareSelected = useCallback(
    (id: string) => compareIds.includes(id),
    [compareIds],
  );

  // outbox — simulate status progression with timers
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>[]>>({});

  const advanceOutbox = useCallback((id: string, to: OutboxStatus) => {
    setOutbox((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: to, updated_at: new Date().toISOString() } : r,
      ),
    );
  }, []);

  const scheduleOutbox = useCallback(
    (req: OutboxRequest) => {
      const sentAt = new Date(req.sent_at).getTime();
      const elapsed = Date.now() - sentAt;
      const ackIn = Math.max(0, 6_000 - elapsed);
      const recIn = Math.max(0, 14_000 - elapsed);
      const handles: ReturnType<typeof setTimeout>[] = [];
      if (req.status === "sent") {
        handles.push(setTimeout(() => advanceOutbox(req.id, "acknowledged"), ackIn));
        handles.push(setTimeout(() => advanceOutbox(req.id, "received"), recIn));
      } else if (req.status === "acknowledged") {
        handles.push(setTimeout(() => advanceOutbox(req.id, "received"), recIn));
      }
      timersRef.current[req.id] = handles;
    },
    [advanceOutbox],
  );

  // re-schedule pending requests on mount
  useEffect(() => {
    for (const req of outbox) {
      if (req.status !== "received" && !timersRef.current[req.id]) {
        scheduleOutbox(req);
      }
    }
    return () => {
      for (const arr of Object.values(timersRef.current)) {
        for (const h of arr) clearTimeout(h);
      }
      timersRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendTermSheetRequest = useCallback(
    (product: Product, message: string): OutboxRequest => {
      const now = new Date().toISOString();
      const req: OutboxRequest = {
        id: `OUT-${Date.now().toString(36)}`,
        product_id: product.id,
        product_name: product.product_name ?? `${product.issuer} — ${product.id}`,
        issuer: product.issuer,
        message,
        status: "sent",
        sent_at: now,
        updated_at: now,
      };
      setOutbox((prev) => [req, ...prev]);
      scheduleOutbox(req);
      return req;
    },
    [scheduleOutbox],
  );

  const me = useMemo(
    () => ASSET_MANAGERS.find((a) => a.id === ME_AM_ID) ?? ASSET_MANAGERS[0],
    [],
  );

  const unreadCount = useMemo(
    () => products.filter((p) => !meta[p.id]?.read).length,
    [products, meta],
  );

  const watchlist = useMemo(
    () =>
      products.filter(
        (p) => meta[p.id]?.status === "watch" || meta[p.id]?.status === "interested",
      ),
    [products, meta],
  );

  const value = useMemo<AppStore>(
    () => ({
      products,
      rawProducts,
      addProduct,
      me,
      meta,
      setStatus,
      markRead,
      unreadCount,
      watchlist,
      edits,
      editField,
      isEdited,
      confidenceFor,
      compareIds,
      toggleCompare,
      clearCompare,
      isCompareSelected,
      compareMax: COMPARE_MAX,
      outbox,
      sendTermSheetRequest,
    }),
    [
      products,
      rawProducts,
      addProduct,
      me,
      meta,
      setStatus,
      markRead,
      unreadCount,
      watchlist,
      edits,
      editField,
      isEdited,
      confidenceFor,
      compareIds,
      toggleCompare,
      clearCompare,
      isCompareSelected,
      outbox,
      sendTermSheetRequest,
    ],
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore must be used within AppStoreProvider");
  return ctx;
}
