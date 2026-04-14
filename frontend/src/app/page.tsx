"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/shared/components/Navbar";
import { Footer } from "@/shared/components/Footer";
import { AuthModal } from "@/shared/components/AuthModal";
import { useSupabaseSession } from "@/shared/providers/supabase-provider";
import {
  FileText,
  Sparkles,
  BarChart3,
  FlaskConical,
  ArrowRight,
  Zap,
} from "lucide-react";

const FEATURES = [
  {
    icon: FileText,
    title: "Upload & Process",
    body: "Drop any MSA PDF. BGE-large embeddings and Pinecone indexing happen automatically in the background.",
    iconBg: "bg-cyan-500/10 border border-cyan-500/20",
    iconColor: "text-cyan-400",
  },
  {
    icon: Sparkles,
    title: "Ask in Plain English",
    body: "Type any contract question. Groq llama-3.3-70b retrieves grounded answers in under two seconds.",
    iconBg: "bg-violet-500/10 border border-violet-500/20",
    iconColor: "text-violet-400",
  },
  {
    icon: BarChart3,
    title: "Similarity Report",
    body: "Every answer ships with the top-5 matching chunks ranked by cosine score strong, good, weak, or poor signal.",
    iconBg: "bg-emerald-500/10 border border-emerald-500/20",
    iconColor: "text-emerald-400",
  },
  {
    icon: FlaskConical,
    title: "LLM-as-Judge",
    body: "Run 10 ground-truth Q&A pairs through Gemini 2.5 Flash. Get a live streaming verdict table in seconds.",
    iconBg: "bg-amber-500/10 border border-amber-500/20",
    iconColor: "text-amber-400",
  },
];

export default function LandingPage() {
  const { user } = useSupabaseSession();
  const router = useRouter();
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signup");

  function handlePrimaryCta() {
    if (user) {
      router.push("/dashboard");
    } else {
      setAuthTab("signup");
      setAuthOpen(true);
    }
  }

  function handleSecondaryCta() {
    if (user) {
      router.push("/chat");
    } else {
      setAuthTab("signin");
      setAuthOpen(true);
    }
  }

  return (
    <>
      <Navbar />

      <main className="bg-grid-fade relative">
        {/* ─── Hero ─────────────────────────────── */}
        <section className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 pt-28 pb-20 text-center">
          {/* Badge pill */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3.5 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur-sm animate-fade-up">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-primary/60" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            RAG-powered contract intelligence
          </div>

          {/* H1 */}
          <h1 className="max-w-3xl text-balance text-5xl font-bold tracking-tight text-foreground sm:text-6xl md:text-7xl animate-fade-up delay-75">
            Ask anything about
            <br />
            <span className="gradient-text-cyan">your contracts.</span>
          </h1>

          {/* Subhead */}
          <p className="mt-6 max-w-xl text-balance text-base leading-relaxed text-muted-foreground animate-fade-up delay-150">
            Upload any MSA, ask questions in plain English, and get evidence-backed answers
            grounded in the document with a similarity report on every response.
          </p>

          {/* CTAs */}
          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row animate-fade-up delay-225">
            <button
              onClick={handlePrimaryCta}
              className="group flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:shadow-[0_0_32px_-4px_hsl(var(--primary)/0.55)] active:scale-[0.97]"
            >
              {user ? "Go to dashboard" : "Get started — it's free"}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              onClick={handleSecondaryCta}
              className="flex h-11 items-center gap-2 rounded-full border border-border/60 bg-card/40 px-6 text-sm font-medium text-foreground/80 backdrop-blur-sm transition-all duration-200 hover:border-border hover:bg-card/70 hover:text-foreground"
            >
              {user ? "New chat" : "Sign in"}
            </button>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-muted-foreground/60 animate-fade-up delay-300">
            <span className="flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-primary/70" />
              Powered by Groq
            </span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
            <span>BGE-large embeddings</span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
            <span>Pinecone vector store</span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
            <span>Gemini judge</span>
          </div>
        </section>

        {/* ─── Features Grid ────────────────────── */}
        <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="group relative flex flex-col rounded-2xl border border-border/50 bg-card/60 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-border hover:bg-card/90 hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)] animate-fade-up"
                  style={{ animationDelay: `${300 + idx * 75}ms` }}
                >
                  <div
                    className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${feat.iconBg}`}
                  >
                    <Icon className={`h-4.5 w-4.5 ${feat.iconColor}`} />
                  </div>
                  <h3 className="text-[15px] font-semibold text-foreground">{feat.title}</h3>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
                    {feat.body}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── CTA Strip ────────────────────────── */}
        <section className="relative z-10 mx-auto max-w-4xl px-6 pb-20">
          <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-card/60 px-8 py-12 text-center backdrop-blur-sm">
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-violet-500/5" />
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Stop hunting through MSAs.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Upload your first document.
            </p>
            <div className="mt-6 flex justify-center">
              <button
                onClick={handlePrimaryCta}
                className="group flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:shadow-[0_0_32px_-4px_hsl(var(--primary)/0.55)] active:scale-[0.97]"
              >
                {user ? "Open dashboard" : "Try Datum free"}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </section>

        <Footer />
      </main>

      <AuthModal open={authOpen} defaultTab={authTab} onClose={() => setAuthOpen(false)} />
    </>
  );
}
