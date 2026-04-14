import Link from "next/link";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { LandingNav } from "@/shared/components/LandingNav";

export default function LandingPage() {
  return (
    <AuroraBackground>
      <LandingNav />

      <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-cyan-400 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
          RAG-powered contract intelligence
        </div>

        {/* Headline */}
        <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
          Ask anything about{" "}
          <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
            your contracts
          </span>
        </h1>

        {/* Subline */}
        <p className="mt-6 max-w-xl text-base text-white/60 sm:text-lg">
          Upload an MSA. Ask plain-English questions. Get accurate answers
          backed by source-ranked similarity evidence — in seconds.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/login"
            className="group inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-6 py-3 text-sm font-semibold text-black transition-all duration-200 hover:scale-[1.03] hover:bg-cyan-400 hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] active:scale-[0.98]"
          >
            Get started
            <ArrowRight />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white/80 backdrop-blur-sm transition-all duration-200 hover:border-white/20 hover:bg-white/10 hover:text-white active:scale-[0.98]"
          >
            Sign in
          </Link>
        </div>

        {/* Feature pills */}
        <div className="mt-16 flex flex-wrap justify-center gap-3">
          {[
            "Semantic search",
            "Similarity scoring",
            "LLM-as-judge evaluation",
            "Per-chunk evidence",
            "Admin evaluation layer",
          ].map((feature) => (
            <span
              key={feature}
              className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-xs text-white/50"
            >
              {feature}
            </span>
          ))}
        </div>
      </main>
    </AuroraBackground>
  );
}

function ArrowRight() {
  return (
    <svg
      className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}
