import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/lib/store";
import { RAW_SAMPLES } from "@/mocks/rawSamples";
import { extractFromSample, extractFromText } from "@/lib/extractionMock";
import { extractProductWithGemini, geminiAvailable } from "@/lib/gemini";
import { extractViaBackend } from "@/lib/api";
import type { Product } from "@/types/product";
import { humanize } from "@/lib/format";
import { toast } from "sonner";

interface InboxItem {
  id: string;
  source_type: Product["source_type"];
  source_reference: string;
  raw_text: string;
  ingested_at: string;
  product_id: string;
  status: "processed" | "processing" | "queued";
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

/* ─── Page ────────────────────────────────────────────────────────────── */
export default function Inbox() {
  const navigate = useNavigate();
  const { products, addProduct, meta, markRead } = useAppStore();
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [extracting, setExtracting] = useState(false);
  const [extractingLabel, setExtractingLabel] = useState("Processing...");
  const [text, setText] = useState("");
  const [justExtracted, setJustExtracted] = useState<Product | null>(null);
  const [aiFieldCount, setAiFieldCount] = useState<number | null>(null);

  const items: InboxItem[] = useMemo(
    () =>
      products
        .filter((p) => !!p.raw_text)
        .map(
          (p): InboxItem => ({
            id: `IN-${p.id}`,
            source_type: p.source_type,
            source_reference: p.source_reference ?? humanize(p.source_type) ?? "manual",
            raw_text: p.raw_text!,
            ingested_at: p.ingested_at,
            product_id: p.id,
            status: "processed",
          }),
        )
        .sort(
          (a, b) =>
            new Date(b.ingested_at).getTime() - new Date(a.ingested_at).getTime(),
        ),
    [products],
  );

  const visible = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((it) => {
      const isRead = meta[it.product_id]?.read ?? false;
      return filter === "unread" ? !isRead : isRead;
    });
  }, [items, filter, meta]);

  const unreadCount = items.filter((it) => !meta[it.product_id]?.read).length;
  const processed = items.length;

  async function runExtraction(rawText: string, fallback: () => Product) {
    setExtracting(true);
    setJustExtracted(null);
    setAiFieldCount(null);

    const mergeAiResult = (
      aiResult: NonNullable<Awaited<ReturnType<typeof extractProductWithGemini>>>,
      base: Product,
      source: "backend" | "client",
    ): Product => {
      const confidence = aiResult.confidence ?? {};
      const highConfFields = Object.values(confidence).filter((v) => v >= 0.5).length;
      setAiFieldCount(highConfFields);
      const label = source === "backend" ? "Gemini (server)" : "Gemini";
      toast.success(`${base.id} ingested · ${label} extracted ${highConfFields} fields · scoring...`);
      return {
        ...base,
        issuer: aiResult.issuer ?? base.issuer,
        product_name: aiResult.product_name ?? base.product_name,
        product_type: (aiResult.product_type as Product["product_type"]) ?? base.product_type,
        currency: (aiResult.currency as Product["currency"]) ?? base.currency,
        tenor_years: aiResult.tenor_years ?? base.tenor_years,
        coupon: aiResult.coupon ?? base.coupon,
        coupon_type: (aiResult.coupon_type as Product["coupon_type"]) ?? base.coupon_type,
        underlying: aiResult.underlying?.length ? aiResult.underlying : base.underlying,
        underlying_type: (aiResult.underlying_type as Product["underlying_type"]) ?? base.underlying_type,
        barrier: aiResult.barrier ?? base.barrier,
        capital_protection: aiResult.capital_protection ?? base.capital_protection,
        autocall: aiResult.autocall ?? base.autocall,
        issuer_rating: aiResult.issuer_rating ?? base.issuer_rating,
        risk_level: (aiResult.risk_level as Product["risk_level"]) ?? base.risk_level,
        notional: aiResult.notional ?? base.notional,
        maturity_date: aiResult.maturity_date ?? base.maturity_date,
        raw_text: rawText,
        confidence: confidence as Record<string, number>,
      };
    };

    if (rawText.trim().length > 40) {
      // ── 1st priority: backend Gemini extraction ──────────────────────────
      setExtractingLabel("✦ Gemini (server) extracting financial terms...");
      const backendResult = await extractViaBackend(rawText);
      if (backendResult) {
        const base = fallback();
        const p = mergeAiResult(backendResult, base, "backend");
        setJustExtracted(p);
        addProduct(p);
        setExtracting(false);
        setText("");
        return;
      }

      // ── 2nd priority: client-side Gemini (API key in browser) ────────────
      if (geminiAvailable) {
        setExtractingLabel("✦ Gemini extracting financial terms...");
        try {
          const aiResult = await extractProductWithGemini(rawText);
          if (aiResult) {
            const base = fallback();
            const p = mergeAiResult(aiResult, base, "client");
            setJustExtracted(p);
            addProduct(p);
            setExtracting(false);
            setText("");
            return;
          }
        } catch {
          // fall through to regex
        }
      }
    }

    // ── 3rd priority: regex heuristics (always works offline) ──────────────
    setExtractingLabel("Processing...");
    setTimeout(() => {
      const p = fallback();
      setJustExtracted(p);
      addProduct(p);
      setExtracting(false);
      setText("");
      toast.success(`${p.id} ingested · scoring against mandate...`);
    }, 1100);
  }

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "var(--c-bg)",
        color: "var(--c-text)",
        fontFamily: "JetBrains Mono, monospace",
      }}
    >
      {/* ── Stat strip ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr) auto",
          gap: 1,
          background: "var(--c-border)",
          borderBottom: "1px solid var(--c-border)",
          flexShrink: 0,
        }}
      >
        {[
          [String(items.length), "MESSAGES TODAY"],
          [String(processed),    "PROCESSED"],
          [String(unreadCount),  "UNREAD"],
          ["5",                  "ELIGIBLE"],
        ].map(([n, l]) => (
          <div
            key={l}
            style={{
              background: "var(--c-bg1)",
              padding: "12px 18px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "var(--c-amber)",
                fontFamily: "JetBrains Mono, monospace",
              }}
            >
              {n}
            </div>
            <div
              style={{
                fontSize: 9,
                color: "var(--c-text3)",
                letterSpacing: "0.12em",
                fontWeight: 700,
                marginTop: 2,
              }}
            >
              {l}
            </div>
          </div>
        ))}
        <div
          style={{
            background: "var(--c-bg1)",
            padding: "12px 18px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <button
            onClick={() => navigate("/processing")}
            style={{
              padding: "8px 14px",
              background: "var(--c-amber)",
              border: "none",
              borderRadius: 2,
              color: "#000",
              fontSize: 10,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "JetBrains Mono, monospace",
              letterSpacing: "0.08em",
            }}
          >
            ⚡ ANALYSE INBOX →
          </button>
        </div>
      </div>

      {/* ── Simulate-arrival panel ── */}
      <div
        style={{
          padding: "12px 18px",
          background: "var(--c-bg1)",
          borderBottom: "1px solid var(--c-border)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: "var(--c-text3)",
            marginBottom: 8,
          }}
        >
          SIMULATE NEW ARRIVAL
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          {RAW_SAMPLES.map((s) => (
            <button
              key={s.id}
              onClick={() => runExtraction(s.raw_text, () => extractFromSample(s))}
              disabled={extracting}
              style={{
                padding: "5px 10px",
                background: "transparent",
                border: "1px solid var(--c-border2)",
                borderRadius: 2,
                color: "var(--c-text2)",
                fontSize: 10,
                cursor: extracting ? "not-allowed" : "pointer",
                fontFamily: "JetBrains Mono, monospace",
                letterSpacing: "0.04em",
                opacity: extracting ? 0.5 : 1,
                transition: "all 0.1s",
              }}
              onMouseEnter={(e) => {
                if (!extracting) {
                  e.currentTarget.style.borderColor = "var(--c-amber-dim)";
                  e.currentTarget.style.color = "var(--c-amber)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--c-border2)";
                e.currentTarget.style.color = "var(--c-text2)";
              }}
            >
              + {s.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="…or paste a bank message, chat snippet, term sheet text…"
            rows={2}
            style={{
              flex: 1,
              padding: "8px 10px",
              background: "var(--c-bg2)",
              border: "1px solid var(--c-border2)",
              borderRadius: 2,
              color: "var(--c-text)",
              fontSize: 10,
              fontFamily: "JetBrains Mono, monospace",
              outline: "none",
              resize: "none",
            }}
          />
          <button
            onClick={() => runExtraction(text, () => extractFromText(text, "manual"))}
            disabled={!text.trim() || extracting}
            style={{
              padding: "0 14px",
              background: geminiAvailable ? "var(--c-match)" : "var(--c-amber)",
              border: "none",
              borderRadius: 2,
              color: "#000",
              fontSize: 10,
              fontWeight: 700,
              cursor: !text.trim() || extracting ? "not-allowed" : "pointer",
              fontFamily: "JetBrains Mono, monospace",
              letterSpacing: "0.04em",
              opacity: !text.trim() || extracting ? 0.4 : 1,
            }}
          >
            {geminiAvailable ? "✦ AI EXTRACT" : "EXTRACT"}
          </button>
        </div>
        {extracting && (
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: 10,
                color: geminiAvailable ? "var(--c-match)" : "var(--c-amber)",
                fontFamily: "JetBrains Mono, monospace",
                letterSpacing: "0.04em",
              }}
              className="animate-blink"
            >
              ● {extractingLabel}
            </span>
          </div>
        )}
        {justExtracted && !extracting && (
          <div
            style={{
              marginTop: 8,
              padding: "8px 10px",
              background: "var(--c-match-bg)",
              border: "1px solid var(--c-match-border)",
              borderRadius: 2,
              fontSize: 10,
              color: "var(--c-match)",
              fontFamily: "JetBrains Mono, monospace",
            }}
          >
            ✓ {aiFieldCount != null ? `Gemini extracted ${aiFieldCount} fields` : "EXTRACTED"} · {justExtracted.id} · {justExtracted.product_name ?? humanize(justExtracted.product_type)}
          </div>
        )}
      </div>

      {/* ── Filter bar ── */}
      <div
        style={{
          padding: "8px 18px",
          background: "var(--c-bg1)",
          borderBottom: "1px solid var(--c-border)",
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 9,
            color: "var(--c-text3)",
            letterSpacing: "0.12em",
            fontWeight: 700,
            marginRight: 4,
          }}
        >
          FILTER:
        </span>
        {(["all", "unread", "read"] as const).map((f) => {
          const active = filter === f;
          const count =
            f === "all" ? items.length : f === "unread" ? unreadCount : items.length - unreadCount;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "3px 10px",
                background: active ? "var(--c-amber-bg)" : "transparent",
                border: `1px solid ${active ? "var(--c-amber-dim)" : "var(--c-border)"}`,
                borderRadius: 2,
                color: active ? "var(--c-amber)" : "var(--c-text3)",
                fontSize: 9,
                cursor: "pointer",
                fontFamily: "JetBrains Mono, monospace",
                fontWeight: active ? 700 : 400,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              {f} ({count})
            </button>
          );
        })}
      </div>

      {/* ── Inbox feed ── */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {visible.map((it) => {
          const product = products.find((p) => p.id === it.product_id);
          const isRead = meta[it.product_id]?.read ?? false;
          const snippet = it.raw_text.replace(/\s+/g, " ").slice(0, 110);

          return (
            <div
              key={it.id}
              onClick={() => {
                if (!isRead) markRead(it.product_id, true);
                navigate(`/products/${it.product_id}`);
              }}
              style={{
                display: "grid",
                gridTemplateColumns: "24px 1fr auto",
                gap: "0 14px",
                alignItems: "center",
                padding: "12px 18px",
                borderBottom: "1px solid var(--c-border)",
                cursor: "pointer",
                background: !isRead ? "rgba(245,166,35,0.02)" : "transparent",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--c-bg2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = !isRead
                  ? "rgba(245,166,35,0.02)"
                  : "transparent";
              }}
            >
              {/* Status dot */}
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  justifySelf: "center",
                  background: isRead ? "var(--c-border2)" : "var(--c-teal)",
                  boxShadow: !isRead ? "0 0 8px rgba(0,201,167,0.5)" : "none",
                }}
              />
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--c-text)",
                    marginBottom: 3,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {it.source_reference}
                  {product && (
                    <span style={{ fontSize: 9, color: "var(--c-teal)", fontWeight: 400 }}>
                      → {product.id}
                    </span>
                  )}
                  {!isRead && (
                    <span
                      style={{
                        background: "var(--c-amber)",
                        color: "#000",
                        fontSize: 8,
                        fontWeight: 700,
                        padding: "1px 5px",
                        borderRadius: 1,
                        letterSpacing: "0.08em",
                      }}
                    >
                      NEW
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--c-text2)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {snippet}…
                </div>
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--c-text3)",
                  fontFamily: "JetBrains Mono, monospace",
                }}
              >
                {fmtTime(it.ingested_at)}
              </div>
            </div>
          );
        })}
        {visible.length === 0 && (
          <div
            style={{
              padding: "60px 20px",
              textAlign: "center",
              color: "var(--c-text3)",
              fontSize: 11,
              fontFamily: "JetBrains Mono, monospace",
              letterSpacing: "0.04em",
            }}
          >
            NO MESSAGES MATCHING THIS FILTER
          </div>
        )}
      </div>
    </div>
  );
}
