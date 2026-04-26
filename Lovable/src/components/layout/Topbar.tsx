import { useLocation } from "react-router-dom";
import { useAppStore } from "@/lib/store";

const PAGE_TITLES: Record<string, string> = {
  "/":                "OPPORTUNITY FEED",
  "/recommendations": "MATCH ENGINE",
  "/inbox":           "RESEARCH INBOX",
  "/processing":      "AI PROCESSING",
  "/products":        "DEAL FLOW",
  "/mandate":         "FUND MANDATE",
  "/market":          "MARKET VIEWS",
  "/watchlist":       "WATCHLIST",
  "/outbox":          "OUTBOX",
};

function pageTitle(pathname: string): string {
  if (pathname.startsWith("/products/")) return "PRODUCT DETAIL";
  return PAGE_TITLES[pathname] ?? "WORKSPACE";
}

export function Topbar() {
  const location = useLocation();
  const { me } = useAppStore();
  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const title = pageTitle(location.pathname);

  return (
    <header
      style={{
        height: 44,
        background: "var(--c-bg1)",
        borderBottom: "1px solid var(--c-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
        padding: "0 18px",
      }}
    >
      {/* ── Left: page title + breadcrumb ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--c-text)",
            letterSpacing: "0.12em",
            fontFamily: "JetBrains Mono, monospace",
          }}
        >
          {title}
        </span>
        <span style={{ color: "var(--c-border3)", fontSize: 10 }}>/</span>
        <span
          style={{
            fontSize: 10,
            color: "var(--c-text3)",
            letterSpacing: "0.06em",
            fontFamily: "JetBrains Mono, monospace",
          }}
        >
          WEBI · WE BUY
        </span>
      </div>

      {/* ── Right: live status ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          fontFamily: "JetBrains Mono, monospace",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 10,
            color: "var(--c-text3)",
            letterSpacing: "0.08em",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--c-teal)",
              display: "inline-block",
              boxShadow: "0 0 6px rgba(74,222,128,0.5)",
            }}
            className="animate-pulse-slow"
          />
          LIVE
        </div>
        <div style={{ fontSize: 10, color: "var(--c-text2)", letterSpacing: "0.06em" }}>
          <span style={{ color: "var(--c-text3)" }}>FUND </span>
          <span style={{ color: "var(--c-amber)", fontWeight: 600 }}>
            {me.firm.toUpperCase()}
          </span>
        </div>
        <div
          style={{
            fontSize: 10,
            color: "var(--c-text3)",
            letterSpacing: "0.06em",
          }}
        >
          {today.toUpperCase()}
        </div>
      </div>
    </header>
  );
}
