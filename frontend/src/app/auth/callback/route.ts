import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }

  // Build a redirect response FIRST so we can attach cookies to it.
  const redirectUrl = `${origin}/dashboard`;
  const response = NextResponse.redirect(redirectUrl);

  // Create a Supabase client that reads/writes cookies on the
  // incoming request + outgoing response, so the session tokens
  // survive the redirect.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Parse cookies from the incoming request
          const cookieHeader = request.headers.get("cookie") ?? "";
          return cookieHeader.split(";").map((c) => {
            const [name, ...rest] = c.trim().split("=");
            return { name, value: rest.join("=") };
          });
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          // Write cookies onto the outgoing redirect response
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error("OAuth exchange failed:", exchangeError.message, exchangeError);
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }

  return response;
}
