"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/shared/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Supabase SDK automatically parses the #access_token hash on init.
    // Check if session is already available, otherwise wait for SIGNED_IN.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/dashboard");
        return;
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" && session) {
          router.replace("/dashboard");
        } else if (event === "SIGNED_OUT") {
          router.replace("/login?error=oauth_failed");
        }
      });

      return () => subscription.unsubscribe();
    });
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(222,47%,3%)]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
    </div>
  );
}
