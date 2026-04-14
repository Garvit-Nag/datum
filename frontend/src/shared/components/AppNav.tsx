"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSupabaseSession } from "@/shared/providers/supabase-provider";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";

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
  const isAdmin = user?.user_metadata?.role === "admin";

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-8">
          <Link
            href="/"
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
          <ThemeToggle />
          <UserMenu compact />
        </div>
      </div>
    </header>
  );
}
