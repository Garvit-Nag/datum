"use client";

import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, LogOut } from "lucide-react";
import { supabase } from "@/shared/lib/supabase";
import { useSupabaseSession } from "@/shared/providers/supabase-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  compact?: boolean;
};

function getDisplayName(user: { email?: string; user_metadata?: Record<string, string> } | null): string {
  if (!user) return "?";
  const meta = user.user_metadata ?? {};
  return meta.full_name ?? meta.name ?? meta.username ?? (user.email?.split("@")[0] ?? "?");
}

export function UserMenu({ compact }: Props) {
  const { user } = useSupabaseSession();
  const router = useRouter();
  const pathname = usePathname();

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const displayName = getDisplayName(user);
  const initial = displayName.charAt(0).toUpperCase();
  const onDashboard = pathname === "/dashboard";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors duration-200 hover:bg-muted/60 hover:text-foreground focus:outline-none">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
            {initial}
          </span>
          {!compact && (
            <span className="min-w-0 truncate text-left">
              {displayName.length > 24 ? `${displayName.slice(0, 24)}…` : displayName}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="font-medium text-sm">{displayName}</p>
          {user?.email && (
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {!onDashboard && (
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => router.push("/dashboard")} className="cursor-pointer">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </DropdownMenuItem>
          </DropdownMenuGroup>
        )}
        {!onDashboard && <DropdownMenuSeparator />}
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
