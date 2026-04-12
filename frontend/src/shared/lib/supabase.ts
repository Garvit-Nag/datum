import { createClient } from "@supabase/supabase-js";
import { clientEnv } from "@/shared/utils/client-env";

/** Singleton Supabase browser client. Import this wherever you need auth state. */
export const supabase = createClient(
  clientEnv.NEXT_PUBLIC_SUPABASE_URL,
  clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
