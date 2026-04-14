"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import type { UseFormRegisterReturn } from "react-hook-form";
import { supabase } from "@/shared/lib/supabase";
import { LoginSchema, SignUpSchema } from "../schemas/auth-schemas";
import { resolveAuthError } from "../utils/auth-errors";
import { GoogleButton } from "./GoogleButton";
import { DatumLogo } from "@/shared/components/DatumLogo";
import type { LoginSchemaType, SignUpSchemaType } from "../schemas/auth-schemas";

type TabType = "signin" | "signup";

type LoginFormProps = {
  hasOauthError?: boolean;
  defaultTab?: TabType;
};

export function LoginForm({ hasOauthError = false, defaultTab = "signin" }: LoginFormProps) {
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0c0d12] shadow-[0_24px_80px_-12px_rgba(0,0,0,0.85)] animate-scale-in">
      <div className="px-8 pt-8 pb-7">
        {/* Logo */}
        <div className="flex justify-center">
          <DatumLogo size={26} className="text-white" />
        </div>

        {/* Heading */}
        <h2 className="mt-5 text-center text-xl font-semibold tracking-tight text-white">
          {activeTab === "signin" ? "Welcome back" : "Create an account"}
        </h2>
        <p className="mt-1.5 text-center text-[13px] text-white/45">
          {activeTab === "signin"
            ? "Sign in to continue to Datum."
            : "Join Datum to query your contracts intelligently."}
        </p>

        {/* Google */}
        <div className="mt-7">
          <GoogleButton />
        </div>

        {/* OR divider */}
        <div className="my-5 flex items-center gap-4">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/35">
            or
          </span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {activeTab === "signin" ? (
          <SignInForm hasOauthError={hasOauthError} />
        ) : (
          <SignUpForm />
        )}

        {/* Switch tab link */}
        <p className="mt-6 text-center text-[12px] text-white/45">
          {activeTab === "signin" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => setActiveTab("signup")}
                className="font-medium text-primary transition-colors hover:text-primary/80"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setActiveTab("signin")}
                className="font-medium text-primary transition-colors hover:text-primary/80"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function SignInForm({ hasOauthError }: { hasOauthError: boolean }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(
    hasOauthError ? "Google sign-in failed. Please try again." : null,
  );
  const [isShaking, setIsShaking] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchemaType>({ resolver: zodResolver(LoginSchema) });

  async function onSubmit(data: LoginSchemaType) {
    setServerError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) {
      setServerError(resolveAuthError(error, "signin"));
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
      <DarkInput
        id="signin-email"
        type="email"
        placeholder="Email address"
        registration={register("email")}
        error={errors.email?.message}
      />
      <DarkInput
        id="signin-password"
        type="password"
        placeholder="Password"
        autoComplete="current-password"
        registration={register("password")}
        error={errors.password?.message}
      />

      {serverError && (
        <p className={`text-[11px] text-red-400 ${isShaking ? "animate-shake" : ""}`}>
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-1 flex h-11 w-full items-center justify-center rounded-xl bg-primary text-[13px] font-semibold text-primary-foreground transition-all duration-200 hover:shadow-[0_0_28px_-4px_hsl(var(--primary)/0.55)] active:scale-[0.98] disabled:opacity-60"
      >
        {isSubmitting ? "Signing in…" : "Sign in with Email"}
      </button>
    </form>
  );
}

function SignUpForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpSchemaType>({ resolver: zodResolver(SignUpSchema), mode: "onChange" });

  async function onSubmit(data: SignUpSchemaType) {
    setServerError(null);
    setSuccessMsg(null);
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { username: data.username } },
    });
    if (error) {
      setServerError(resolveAuthError(error, "signup"));
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
      return;
    }
    setSuccessMsg("Check your inbox — we sent you a verification email.");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
      <DarkInput
        id="signup-username"
        type="text"
        placeholder="Username (min 3 chars)"
        autoComplete="username"
        registration={register("username")}
        error={errors.username?.message}
      />
      <DarkInput
        id="signup-email"
        type="email"
        placeholder="Email address"
        registration={register("email")}
        error={errors.email?.message}
      />
      <DarkInput
        id="signup-password"
        type="password"
        placeholder="Password"
        autoComplete="new-password"
        registration={register("password")}
        error={errors.password?.message}
      />
      <DarkInput
        id="signup-confirm"
        type="password"
        placeholder="Confirm password"
        autoComplete="new-password"
        registration={register("confirmPassword")}
        error={errors.confirmPassword?.message}
      />

      {serverError && (
        <p className={`text-[11px] text-red-400 ${isShaking ? "animate-shake" : ""}`}>
          {serverError}
        </p>
      )}
      {successMsg && <p className="text-[11px] text-emerald-400">{successMsg}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-1 flex h-11 w-full items-center justify-center rounded-xl bg-primary text-[13px] font-semibold text-primary-foreground transition-all duration-200 hover:shadow-[0_0_28px_-4px_hsl(var(--primary)/0.55)] active:scale-[0.98] disabled:opacity-60"
      >
        {isSubmitting ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}

type DarkInputProps = {
  id: string;
  type: "email" | "password" | "text";
  placeholder: string;
  autoComplete?: string;
  registration: UseFormRegisterReturn;
  error: string | undefined;
};

function DarkInput({ id, type, placeholder, autoComplete, registration, error }: DarkInputProps) {
  return (
    <div>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="block h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-[13px] text-white placeholder:text-white/30 transition-all duration-200 focus:border-primary/50 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-primary/20"
        {...registration}
      />
      {error && <p className="mt-1 px-1 text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
