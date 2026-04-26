import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useHotkeys } from "@/hooks/useHotkeys";
import { humanize } from "@/lib/format";
import {
  LayoutDashboard,
  Sparkles,
  Boxes,
  Inbox,
  UserCircle,
  TrendingUp,
  Bookmark,
  Send,
  Sun,
  Moon,
  LogOut,
  CheckCheck,
  Building2,
  Mail,
} from "lucide-react";
import { toast } from "sonner";

const PAGES = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Recommendations", path: "/recommendations", icon: Sparkles },
  { label: "Products", path: "/products", icon: Boxes },
  { label: "Watchlist", path: "/watchlist", icon: Bookmark },
  { label: "Inbox", path: "/inbox", icon: Inbox },
  { label: "Outbox", path: "/outbox", icon: Send },
  { label: "My mandate", path: "/mandate", icon: UserCircle },
  { label: "Market views", path: "/market", icon: TrendingUp },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { products, markRead, meta } = useAppStore();
  const { signOut } = useAuth();
  const { resolved, setTheme } = useTheme();

  useHotkeys(
    {
      "Mod+k": (e) => {
        e.preventDefault();
        setOpen((o) => !o);
      },
    },
    { ignoreInInputs: false },
  );

  function run(action: () => void) {
    setOpen(false);
    setTimeout(action, 0);
  }

  const issuers = useMemo(
    () => Array.from(new Set(products.map((p) => p.issuer))).sort(),
    [products],
  );

  const inboxItems = useMemo(
    () => products.filter((p) => !!p.raw_text).slice(0, 25),
    [products],
  );

  function markAllRead() {
    let n = 0;
    for (const p of products) {
      if (!meta[p.id]?.read) {
        markRead(p.id, true);
        n++;
      }
    }
    if (n > 0) toast.success(`Marked ${n} message${n > 1 ? "s" : ""} as read`);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search products, issuers, pages, actions…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>

        <CommandGroup heading="Pages">
          {PAGES.map((p) => (
            <CommandItem
              key={p.path}
              value={`page ${p.label}`}
              onSelect={() => run(() => navigate(p.path))}
            >
              <p.icon className="mr-2 h-4 w-4" />
              {p.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />
        <CommandGroup heading="Products">
          {products.slice(0, 30).map((p) => (
            <CommandItem
              key={p.id}
              value={`product ${p.id} ${p.issuer} ${p.product_name ?? ""} ${p.underlying.join(" ")}`}
              onSelect={() => run(() => navigate(`/products/${p.id}`))}
            >
              <Boxes className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="truncate">
                {p.product_name ?? `${p.issuer} ${humanize(p.product_type)}`}
              </span>
              <span className="ml-auto text-[10px] text-muted-foreground">{p.id}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />
        <CommandGroup heading="Issuers">
          {issuers.map((i) => (
            <CommandItem
              key={i}
              value={`issuer ${i}`}
              onSelect={() => run(() => navigate(`/products?issuer=${encodeURIComponent(i)}`))}
            >
              <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
              {i}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />
        <CommandGroup heading="Inbox messages">
          {inboxItems.map((p) => (
            <CommandItem
              key={`inbox-${p.id}`}
              value={`inbox ${p.issuer} ${p.raw_text ?? ""}`}
              onSelect={() => run(() => navigate(`/inbox`))}
            >
              <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="truncate">
                {p.source_reference ?? p.issuer}: {(p.raw_text ?? "").slice(0, 60)}…
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem value="action mark all read" onSelect={() => run(markAllRead)}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all messages read
          </CommandItem>
          <CommandItem
            value="action toggle theme"
            onSelect={() => run(() => setTheme(resolved === "dark" ? "light" : "dark"))}
          >
            {resolved === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
            Toggle theme
          </CommandItem>
          <CommandItem value="action sign out" onSelect={() => run(signOut)}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
