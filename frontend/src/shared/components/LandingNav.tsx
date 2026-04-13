"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSupabaseSession } from "@/shared/providers/supabase-provider";
import { supabase } from "@/shared/lib/supabase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LayoutDashboard, LogOut } from "lucide-react";

function getDisplayName(user: { email?: string; user_metadata?: Record<string, string> } | null): string {
  if (!user) return "?";
  const meta = user.user_metadata ?? {};
  return meta.full_name ?? meta.name ?? meta.username ?? (user.email?.split("@")[0] ?? "?");
}

export function LandingNav() {
  const { user, isLoading } = useSupabaseSession();
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.refresh();
  }

  const displayName = getDisplayName(user);
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4">
      <Link
        href="/"
        className="text-base font-semibold tracking-tight text-white/90 hover:text-white transition-colors"
      >
        Datum
      </Link>

      {!isLoading && (
        <>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10 hover:text-white focus:outline-none">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-[11px] font-semibold text-cyan-400">
                    {initial}
                  </span>
                  <span className="max-w-[120px] truncate">{displayName}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="font-normal">
                  <p className="font-medium text-sm">{displayName}</p>
                  {user.email && (
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/dashboard")} className="cursor-pointer">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/login"
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-white/80 backdrop-blur-sm transition-all duration-200 hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              Sign in
            </Link>
          )}
        </>
      )}
    </header>
  );
}
