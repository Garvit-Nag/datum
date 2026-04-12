"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseSession } from "@/shared/providers/supabase-provider";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useSupabaseSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace("/login");
    }
  }, [session, isLoading, router]);

  if (isLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
