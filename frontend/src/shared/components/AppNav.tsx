"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { supabase } from "@/shared/lib/supabase";
import { useSupabaseSession } from "@/shared/providers/supabase-provider";
import { ThemeToggle } from "./ThemeToggle";

type NavLinkProps = {
  href: string;
  label: string;
  isActive: boolean;
};

function NavLink({ href, label, isActive }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={`relative text-sm font-medium transition-colors duration-200 after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-primary after:transition-transform after:duration-200 hover:text-foreground hover:after:scale-x-100 ${
        isActive ? "text-foreground after:scale-x-100" : "text-muted-foreground"
      }`}
    >
      {label}
    </Link>
  );
}

export function AppNav() {
  const { user } = useSupabaseSession();
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = user?.user_metadata?.role === "admin";

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-8">
          <Link
            href="/dashboard"
            className="text-base font-semibold tracking-tight text-foreground transition-opacity hover:opacity-80"
          >
            Datum
          </Link>
          <nav className="flex items-center gap-6">
            <NavLink
              href="/dashboard"
              label="Dashboard"
              isActive={pathname === "/dashboard"}
            />
            {isAdmin && (
              <NavLink
                href="/evaluation"
                label="Evaluation"
                isActive={pathname === "/evaluation"}
              />
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {user?.email && (
            <span className="hidden text-xs text-muted-foreground sm:block">
              {user.email.length > 28 ? `${user.email.slice(0, 28)}…` : user.email}
            </span>
          )}
          <ThemeToggle />
          <button
            onClick={handleSignOut}
            aria-label="Sign out"
            className="rounded-md p-2 text-muted-foreground transition-colors duration-200 hover:text-destructive hover:bg-muted/50"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
