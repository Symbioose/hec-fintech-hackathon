import { useNavigate } from "react-router-dom";
import { LogOut, User, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ProfileMenu() {
  const { signOut, session } = useAuth();
  const { me } = useAppStore();
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-9 gap-2 px-2 hover:bg-surface-muted"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full gradient-primary text-[11px] font-semibold text-primary-foreground">
            {initials(me.name)}
          </span>
          <div className="hidden flex-col items-start leading-tight md:flex">
            <span className="text-xs font-medium">{me.name}</span>
            <span className="text-[10px] text-muted-foreground">{me.firm}</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col">
            <span className="text-sm font-medium">{me.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {session?.email ?? me.firm}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/mandate")}>
          <User className="mr-2 h-4 w-4" /> My mandate
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => { navigate("/market"); toast("Market Views — configure PM signals and sector biases"); }}>
          <Settings className="mr-2 h-4 w-4" /> Settings & views
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            signOut();
            navigate("/login");
          }}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
