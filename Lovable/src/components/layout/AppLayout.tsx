import type { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Topbar } from "@/components/layout/Topbar";
import { CompareBar } from "@/components/common/CompareBar";
import { CommandPalette } from "@/components/common/CommandPalette";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 animate-fade-in px-3 py-5 md:px-8 md:py-8">{children}</main>
        </div>
        <CompareBar />
        <CommandPalette />
      </div>
    </SidebarProvider>
  );
}
