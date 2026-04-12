"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/shared/lib/supabase";

type SupabaseContextType = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
};

const SupabaseContext = createContext<SupabaseContextType>({
  session: null,
  user: null,
  isLoading: true,
});

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChange fires INITIAL_SESSION immediately on subscribe —
    // no separate getSession() call needed, which avoids a race condition
    // where a SIGNED_OUT event could land between getSession() and subscribe.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === "INITIAL_SESSION") {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <SupabaseContext.Provider value={{ session, user: session?.user ?? null, isLoading }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabaseSession() {
  return useContext(SupabaseContext);
}
