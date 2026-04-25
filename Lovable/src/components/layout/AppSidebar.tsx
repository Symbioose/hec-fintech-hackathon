import {
  LayoutDashboard,
  Sparkles,
  Boxes,
  Inbox,
  UserCircle,
  TrendingUp,
  Bookmark,
  Send,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

interface Item {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
  badgeKey?: "unread" | "watchlist" | "outbox_pending";
}

const items: Item[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, end: true },
  { title: "Recommendations", url: "/recommendations", icon: Sparkles },
  { title: "Products", url: "/products", icon: Boxes },
  { title: "Inbox", url: "/inbox", icon: Inbox, badgeKey: "unread" },
  { title: "Outbox", url: "/outbox", icon: Send, badgeKey: "outbox_pending" },
  { title: "Watchlist", url: "/watchlist", icon: Bookmark, badgeKey: "watchlist" },
  { title: "My mandate", url: "/mandate", icon: UserCircle },
  { title: "Market views", url: "/market", icon: TrendingUp },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { unreadCount, watchlist, outbox } = useAppStore();
  const outboxPending = outbox.filter((r) => r.status !== "received").length;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex h-12 items-center gap-2.5 px-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md gradient-accent text-primary-foreground shadow-elevated">
            <Sparkles className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-sidebar-foreground">
                StructuredMatch
              </span>
              <span className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">
                Matching copilot
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Workspace</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = item.end
                  ? location.pathname === item.url
                  : location.pathname.startsWith(item.url);
                const badgeValue =
                  item.badgeKey === "unread"
                    ? unreadCount
                    : item.badgeKey === "watchlist"
                      ? watchlist.length
                      : item.badgeKey === "outbox_pending"
                        ? outboxPending
                        : 0;
                const showBadge = badgeValue > 0;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active}>
                      <NavLink
                        to={item.url}
                        end={item.end}
                        className={cn(
                          "flex items-center gap-2.5 rounded-md text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        )}
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="truncate">{item.title}</span>}
                        {!collapsed && showBadge && (
                          <span
                            className={cn(
                              "tabular ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold",
                              item.badgeKey === "unread"
                                ? "bg-primary text-primary-foreground"
                                : "bg-sidebar-accent text-sidebar-accent-foreground",
                            )}
                          >
                            {badgeValue > 99 ? "99+" : badgeValue}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        {!collapsed ? (
          <div className="px-2 py-2 text-[10px] leading-relaxed text-sidebar-foreground/50">
            Demo build — extraction, matching and scoring run on mocked data.
          </div>
        ) : (
          <div className="h-2" />
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
