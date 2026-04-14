"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, LogOut, FlaskConical, MessageSquare, Home } from "lucide-react";
import { useSupabaseSession } from "@/shared/providers/supabase-provider";
import { supabase } from "@/shared/lib/supabase";
import { ThemeToggle } from "./ThemeToggle";
import { DatumLogo } from "./DatumLogo";
import { AuthModal } from "./AuthModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/shared/lib/utils";

type NavLinkType = {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  auth?: "required" | "any";
};

const NAV_LINKS: NavLinkType[] = [
  { href: "/",           label: "Home",       icon: Home,            auth: "any" },
  { href: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard, auth: "required" },
  { href: "/chat",       label: "Chat",       icon: MessageSquare,   auth: "required" },
  { href: "/evaluation", label: "Evaluation", icon: FlaskConical,    auth: "required" },
];

function getDisplayName(
  user: { email?: string; user_metadata?: Record<string, string> } | null,
): string {
  if (!user) return "?";
  const meta = user.user_metadata ?? {};
  return meta.full_name ?? meta.name ?? meta.username ?? (user.email?.split("@")[0] ?? "?");
}

export function Navbar() {
  const { user, isLoading } = useSupabaseSession();
  const router = useRouter();
  const pathname = usePathname();
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");

  const displayName = getDisplayName(user);
  const initial = displayName.charAt(0).toUpperCase();

  function openSignIn() {
    setAuthTab("signin");
    setAuthOpen(true);
  }
  function openSignUp() {
    setAuthTab("signup");
    setAuthOpen(true);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const links = NAV_LINKS.filter((link) => {
    if (link.auth === "any") return true;
    if (link.auth === "required") return !!user;
    return false;
  }).filter((link) => {
    // Hide current-page link
    if (link.href === "/") return pathname !== "/";
    return !pathname.startsWith(link.href);
  });

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-6">
          {/* Logo — left */}
          <Link
            href={user ? "/dashboard" : "/"}
            className="group flex items-center gap-0.5 transition-opacity hover:opacity-90"
          >
            <DatumLogo size={22} className="text-foreground" />
          </Link>

          {/* Nav links — right, stuck to divider */}
          <div className="flex items-center gap-5">
            <nav className="hidden items-center gap-1 md:flex">
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "group flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium text-muted-foreground",
                      "transition-all duration-200 hover:bg-muted/60 hover:text-foreground",
                    )}
                  >
                    {Icon && <Icon className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />}
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Divider */}
            <div className="h-6 w-px bg-border/70" />

            {/* Actions */}
            <div className="flex items-center gap-2">
              <ThemeToggle />

              {!isLoading && (
                <>
                  {user ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="group flex items-center gap-2 rounded-full border border-border/60 bg-card/50 py-1 pl-1 pr-3 text-sm text-foreground/80 transition-all duration-200 hover:border-primary/40 hover:bg-card focus:outline-none">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">
                            {initial}
                          </span>
                          <span className="max-w-[110px] truncate text-xs font-medium">
                            {displayName}
                          </span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        sideOffset={8}
                        className="w-56 border-border/70 bg-card/95 backdrop-blur-xl"
                      >
                        <DropdownMenuLabel className="font-normal">
                          <p className="text-sm font-medium">{displayName}</p>
                          {user.email && (
                            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                          )}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => router.push("/dashboard")}
                          className="cursor-pointer"
                        >
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Dashboard
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={handleSignOut}
                          className="cursor-pointer text-destructive focus:text-destructive"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Sign out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <>
                      <button
                        onClick={openSignIn}
                        className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Sign in
                      </button>
                      <button
                        onClick={openSignUp}
                        className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:shadow-[0_0_24px_-4px_hsl(var(--primary)/0.55)] active:scale-[0.97]"
                      >
                        Try it free
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <AuthModal open={authOpen} defaultTab={authTab} onClose={() => setAuthOpen(false)} />
    </>
  );
}
