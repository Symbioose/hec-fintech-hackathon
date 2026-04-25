import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Topbar } from "@/components/layout/Topbar";
import { CompareBar } from "@/components/common/CompareBar";
import { CommandPalette } from "@/components/common/CommandPalette";

/** Pages that manage their own full-height layout (no padding, no scroll on main). */
const FULL_HEIGHT_ROUTES = ["/", "/inbox", "/processing"];

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isFullHeight = FULL_HEIGHT_ROUTES.includes(location.pathname);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        background: "var(--c-bg)",
        color: "var(--c-text)",
        overflow: "hidden",
      }}
    >
      <AppSidebar />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minWidth: 0,
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <Topbar />
        <main
          style={{
            flex: 1,
            minHeight: 0,
            // Full-height pages manage their own overflow; others scroll freely
            overflow: isFullHeight ? "hidden" : "auto",
            display: "flex",
            flexDirection: "column",
            padding: isFullHeight ? 0 : "28px 36px",
          }}
          className="animate-fade-in"
        >
          {children}
        </main>
      </div>
      <CompareBar />
      <CommandPalette />
    </div>
  );
}
