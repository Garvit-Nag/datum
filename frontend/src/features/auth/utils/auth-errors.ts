import type { AuthError } from "@supabase/supabase-js";

export function resolveAuthError(error: AuthError, context: "signin" | "signup"): string {
  const msg = error.message.toLowerCase();

  if (msg.includes("invalid login credentials")) {
    return "Incorrect email or password. If you signed up with Google, use Continue with Google instead.";
  }
  if (msg.includes("email not confirmed")) {
    return "Check your inbox — you need to verify your email before signing in.";
  }
  if (msg.includes("user already registered")) {
    return context === "signup"
      ? "An account with this email already exists. Sign in below, or use Google if that's how you registered."
      : "Something went wrong. Please try again.";
  }
  if (msg.includes("rate limit") || msg.includes("over_email_send_rate_limit")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (msg.includes("provider_email_needs_verification")) {
    return "Your Google account email needs to be verified. Check your inbox.";
  }
  return "Something went wrong. Please try again.";
}
