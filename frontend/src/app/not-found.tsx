import Link from "next/link";
import { ArrowRight, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <main className="bg-grid-fade relative flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 animate-fade-up">
        <FileQuestion className="h-10 w-10 text-cyan-400" />
      </div>

      <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl animate-fade-up delay-75">
        Page not found
      </h1>
      <p className="mt-4 max-w-sm text-base text-muted-foreground animate-fade-up delay-150">
        The page you are looking for doesn't exist or has been moved.
      </p>

      <div className="mt-8 animate-fade-up delay-225">
        <Link
          href="/"
          className="group flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:shadow-[0_0_32px_-4px_hsl(var(--primary)/0.55)] active:scale-[0.97]"
        >
          Return to home
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </main>
  );
}
