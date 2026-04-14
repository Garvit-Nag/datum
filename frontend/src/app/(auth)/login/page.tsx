import { LoginForm } from "@/features/auth/components/LoginForm";

type Props = {
  searchParams: Promise<{ error?: string; tab?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const hasOauthError = params.error === "oauth_failed";
  const defaultTab = params.tab === "signup" ? "signup" : "signin";

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-[400px]">
        <LoginForm hasOauthError={hasOauthError} defaultTab={defaultTab} />
      </div>
    </main>
  );
}
