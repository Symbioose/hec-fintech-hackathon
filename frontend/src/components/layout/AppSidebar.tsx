import {
  Zap,
  Inbox as InboxIcon,
  LayoutGrid,
  Sparkles,
  Boxes,
  Bookmark,
  Send,
  TrendingUp,
  Cpu,
  CircleUser,
} from "lucide-react";
import { useLocation, NavLink, useNavigate } from "react-router-dom";
import { useAppStore } from "@/lib/store";
import { SpiderLogo } from "@/components/common/SpiderLogo";

interface Item {
  to: string;
  label: string;
  icon: typeof Zap;
  end?: boolean;
  badgeKey?: "unread" | "watchlist" | "outbox_pending";
}

const ITEMS: Item[] = [
  { to: "/",                label: "FEED",     icon: Zap, end: true },
  { to: "/recommendations", label: "MATCH",    icon: Sparkles },
  { to: "/inbox",           label: "INBOX",    icon: InboxIcon, badgeKey: "unread" },
  { to: "/processing",      label: "AI",       icon: Cpu },
  { to: "/products",        label: "DEALS",    icon: Boxes },
  { to: "/mandate",         label: "RULES",    icon: LayoutGrid },
  { to: "/market",          label: "VIEWS",    icon: TrendingUp },
  { to: "/watchlist",       label: "WATCH",    icon: Bookmark, badgeKey: "watchlist" },
  { to: "/outbox",          label: "OUT",      icon: Send, badgeKey: "outbox_pending" },
];

function NavIconItem({ item }: { item: Item }) {
  const location = useLocation();
  const { unreadCount, watchlist, outbox } = useAppStore();
  const outboxPending = outbox.filter((r) => r.status !== "received").length;
  const active = item.end
    ? location.pathname === item.to
    : location.pathname.startsWith(item.to);

  const badge =
    item.badgeKey === "unread" ? unreadCount
    : item.badgeKey === "watchlist" ? watchlist.length
    : item.badgeKey === "outbox_pending" ? outboxPending
    : 0;

  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.end}
      title={item.label}
      style={{
        width: 48,
        height: 44,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        position: "relative",
        textDecoration: "none",
        borderLeft: active ? `2px solid var(--c-amber)` : "2px solid transparent",
        background: active ? "var(--c-bg2)" : "transparent",
        transition: "background 0.1s",
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = "var(--c-bg2)";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = "transparent";
      }}
    >
      <Icon
        size={15}
        strokeWidth={1.75}
        style={{ color: active ? "var(--c-amber)" : "var(--c-text3)" }}
      />
      <span
        style={{
          fontSize: 7,
          letterSpacing: "0.05em",
          color: active ? "var(--c-amber)" : "var(--c-text3)",
          fontFamily: "JetBrains Mono, monospace",
          fontWeight: active ? 700 : 400,
        }}
      >
        {item.label}
      </span>
      {badge > 0 && (
        <span
          style={{
            position: "absolute",
            top: 4,
            right: 6,
            minWidth: 14,
            height: 12,
            padding: "0 3px",
            background: "var(--c-amber)",
            color: "#000",
            fontSize: 8,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "JetBrains Mono, monospace",
            borderRadius: 1,
          }}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </NavLink>
  );
}

export function AppSidebar() {
  const navigate = useNavigate();
  return (
    <div
      style={{
        width: 48,
        height: "100vh",
        background: "var(--c-bg1)",
        borderRight: "1px solid var(--c-border)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 12,
        flexShrink: 0,
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      {/* Logo — Spider */}
      <NavLink
        to="/"
        style={{
          width: 36,
          height: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 18,
          flexShrink: 0,
          textDecoration: "none",
          color: "var(--c-text)",
        }}
        title="Webi · We Buy"
      >
        <SpiderLogo size={28} strokeWidth={1.5} />
      </NavLink>

      {ITEMS.map((item) => (
        <NavIconItem key={item.to} item={item} />
      ))}

      <div style={{ flex: 1 }} />

      {/* Profile */}
      <button
        title="PROFILE"
        onClick={() => navigate("/mandate")}
        style={{
          width: 48,
          height: 44,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 3,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          marginBottom: 12,
        }}
      >
        <CircleUser size={15} strokeWidth={1.75} style={{ color: "var(--c-text3)" }} />
        <span
          style={{
            fontSize: 7,
            letterSpacing: "0.05em",
            color: "var(--c-text3)",
            fontFamily: "JetBrains Mono, monospace",
          }}
        >
          PROFILE
        </span>
      </button>
    </div>
  );
}
