"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseSession } from "@/shared/providers/supabase-provider";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useSupabaseSession();
  const router = useRouter();

  const isAdmin = session?.user?.user_metadata?.role === "admin";

  useEffect(() => {
    if (!isLoading) {
      if (!session) router.replace("/login");
      else if (!isAdmin) router.replace("/dashboard");
    }
  }, [session, isLoading, isAdmin, router]);

  if (isLoading || !session || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
