import { createBrowserClient } from "@supabase/ssr";
import { clientEnv } from "@/shared/utils/client-env";

/** Singleton Supabase browser client. Uses cookie-based storage to share session
 *  with the server-side @supabase/ssr client (auth/callback route). */
export const supabase = createBrowserClient(
  clientEnv.NEXT_PUBLIC_SUPABASE_URL,
  clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

const REFRESH_BUFFER_SECONDS = 60;

/** Returns a valid access token, refreshing it if it has expired or is about
 *  to. `getSession()` in @supabase/ssr reads from storage without triggering a
 *  refresh, so long-lived pages end up handing an expired JWT to the backend
 *  and getting 401s. This wrapper closes that gap. */
export async function getFreshAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const nowSeconds = Math.floor(Date.now() / 1000);
  const expiresAt = session.expires_at ?? 0;
  const isStale = expiresAt - nowSeconds < REFRESH_BUFFER_SECONDS;

  if (!isStale) {
    return session.access_token;
  }

  const { data, error } = await supabase.auth.refreshSession();
  if (error || !data.session) return null;
  return data.session.access_token;
}
