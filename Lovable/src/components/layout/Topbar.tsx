import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { ProfileMenu } from "@/components/layout/ProfileMenu";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-surface/80 px-3 backdrop-blur supports-[backdrop-filter]:bg-surface/60 md:px-6">
      <SidebarTrigger className="-ml-1" />
      <div className="hidden flex-1 items-center md:flex">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products, issuers, messages…"
            className="h-9 w-full border-border/60 bg-surface-muted pl-8 text-sm"
          />
        </div>
      </div>
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <ProfileMenu />
      </div>
    </header>
  );
}
