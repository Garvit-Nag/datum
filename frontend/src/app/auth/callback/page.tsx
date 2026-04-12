"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/shared/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (accessToken && refreshToken) {
      // Explicitly set the session so it's persisted to localStorage
      // before we navigate away — more reliable than relying on auto-processing.
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ data, error }) => {
          if (error || !data.session) {
            router.replace("/login?error=oauth_failed");
          } else {
            router.replace("/dashboard");
          }
        });
    } else {
      // No hash tokens — check for an existing session (e.g. page refresh)
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          router.replace("/dashboard");
        } else {
          router.replace("/login?error=oauth_failed");
        }
      });
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(222,47%,3%)]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
    </div>
  );
}
