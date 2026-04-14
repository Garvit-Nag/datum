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
import { AuthDivider } from "./AuthDivider";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LoginSchemaType, SignUpSchemaType } from "../schemas/auth-schemas";

type LoginFormProps = {
  hasOauthError?: boolean;
};

export function LoginForm({ hasOauthError = false }: LoginFormProps) {
  return (
    <SpotlightCard className="w-full max-w-md animate-card-enter rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Datum</h1>
        <p className="mt-1 text-sm text-muted-foreground">MSA contract intelligence</p>
      </div>

      <GoogleButton />

      <div className="my-5">
        <AuthDivider />
      </div>

      <Tabs defaultValue="signin">
        <TabsList>
          <TabsTrigger value="signin">Sign In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="signin">
          <SignInForm hasOauthError={hasOauthError} />
        </TabsContent>
        <TabsContent value="signup">
          <SignUpForm />
        </TabsContent>
      </Tabs>
    </SpotlightCard>
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
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField
        id="signin-email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        registration={register("email")}
        error={errors.email?.message}
      />
      <FormField
        id="signin-password"
        label="Password"
        type="password"
        autoComplete="current-password"
        registration={register("password")}
        error={errors.password?.message}
      />

      {serverError && (
        <p className={`text-xs text-destructive ${isShaking ? "animate-shake" : ""}`}>
          {serverError}
        </p>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(34,211,238,0.25)] active:scale-[0.98]"
      >
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>
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
  } = useForm<SignUpSchemaType>({ resolver: zodResolver(SignUpSchema) });

  async function onSubmit(data: SignUpSchemaType) {
    setServerError(null);
    setSuccessMsg(null);
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField
        id="signup-email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        registration={register("email")}
        error={errors.email?.message}
      />
      <FormField
        id="signup-password"
        label="Password"
        type="password"
        autoComplete="new-password"
        registration={register("password")}
        error={errors.password?.message}
      />
      <FormField
        id="signup-confirm"
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        registration={register("confirmPassword")}
        error={errors.confirmPassword?.message}
      />

      {serverError && (
        <p className={`text-xs text-destructive ${isShaking ? "animate-shake" : ""}`}>
          {serverError}
        </p>
      )}
      {successMsg && <p className="text-xs text-green-500">{successMsg}</p>}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(34,211,238,0.25)] active:scale-[0.98]"
      >
        {isSubmitting ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}

type FormFieldProps = {
  id: string;
  label: string;
  type: "email" | "password";
  placeholder?: string;
  autoComplete?: string;
  registration: UseFormRegisterReturn;
  error: string | undefined;
};

function FormField({ id, label, type, placeholder, autoComplete, registration, error }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="transition-all duration-200 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/50"
        {...registration}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
