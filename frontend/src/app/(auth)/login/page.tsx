import { AuroraBackground } from "@/components/ui/aurora-background";
import { LoginForm } from "@/features/auth/components/LoginForm";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const hasOauthError = params.error === "oauth_failed";

  return (
    <AuroraBackground>
      <main className="flex min-h-screen items-center justify-center px-4 py-16">
        <LoginForm hasOauthError={hasOauthError} />
      </main>
    </AuroraBackground>
  );
}
