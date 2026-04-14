"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthGuard } from "@/shared/components/AuthGuard";
import { Navbar } from "@/shared/components/Navbar";
import { useUserStats, useChats } from "@/features/chat/hooks/useChats";
import { useSupabaseSession } from "@/shared/providers/supabase-provider";
import {
  FileText,
  MessageSquare,
  HelpCircle,
  Plus,
  FlaskConical,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { ChatType } from "@/features/chat/types";

function getFirstName(
  user: { email?: string; user_metadata?: Record<string, string> } | null,
): string {
  if (!user) return "";
  const meta = user.user_metadata ?? {};
  const full =
    meta.full_name ?? meta.name ?? meta.username ?? user.email?.split("@")[0] ?? "";
  return full.split(" ")[0];
}

function StatCell({
  icon: Icon,
  label,
  value,
  iconBg,
  iconColor,
}: {
  icon: React.ElementType;
  label: string;
  value: number | undefined;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="group flex items-center gap-3 rounded-xl border border-border/40 bg-background/40 p-3 transition-all duration-200 hover:border-border/80 hover:bg-background/70">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
      >
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums leading-none">
          {value !== undefined ? value : (
            <span className="inline-block h-6 w-8 animate-pulse rounded bg-muted" />
          )}
        </p>
        <p className="mt-1 truncate text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground/70">
          {label}
        </p>
      </div>
    </div>
  );
}

function WelcomeBento({
  name,
  stats,
}: {
  name: string;
  stats: { total_documents?: number; total_chats?: number; total_queries?: number } | undefined;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/60 p-6 backdrop-blur-sm">
      {/* ambient gradient */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_70%_at_0%_0%,hsl(var(--primary)/0.08),transparent)]" />
      <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-primary/5 blur-3xl" />

      <div className="flex items-center gap-2 text-[10.5px] font-medium uppercase tracking-[0.18em] text-primary/70">
        <Sparkles className="h-3 w-3" />
        Welcome back
      </div>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
        Hey {name || "there"}
      </h1>
      <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
        Your contract intelligence workspace. Upload an MSA, ask questions, get evidence-backed
        answers.
      </p>

      {/* Inline stats row */}
      <div className="mt-6 grid grid-cols-3 gap-2.5">
        <StatCell
          icon={FileText}
          label="Documents"
          value={stats?.total_documents}
          iconBg="bg-cyan-500/10 border border-cyan-500/15"
          iconColor="text-cyan-400"
        />
        <StatCell
          icon={MessageSquare}
          label="Chats"
          value={stats?.total_chats}
          iconBg="bg-violet-500/10 border border-violet-500/15"
          iconColor="text-violet-400"
        />
        <StatCell
          icon={HelpCircle}
          label="Questions"
          value={stats?.total_queries}
          iconBg="bg-emerald-500/10 border border-emerald-500/15"
          iconColor="text-emerald-400"
        />
      </div>
    </div>
  );
}

function QuickActionsBento() {
  const router = useRouter();

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border/50 bg-card/60 p-6 backdrop-blur-sm">
      <h3 className="text-[13px] font-semibold text-foreground">Quick Actions</h3>
      <p className="mt-0.5 text-[11px] text-muted-foreground">Jump into your workflow</p>

      <div className="mt-5 flex flex-col gap-2.5">
        <button
          onClick={() => router.push("/chat?new=1")}
          className="group flex items-center gap-3 rounded-xl border border-border/50 bg-background/30 p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:shadow-[0_8px_24px_-12px_hsl(var(--primary)/0.4)]"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
            <Plus className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-foreground">New Chat</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Upload a PDF and start asking
            </p>
          </div>
          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
        </button>

        <button
          onClick={() => router.push("/evaluation")}
          className="group flex items-center gap-3 rounded-xl border border-border/50 bg-background/30 p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-500/40 hover:bg-violet-500/5 hover:shadow-[0_8px_24px_-12px_rgba(168,85,247,0.4)]"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <FlaskConical className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-foreground">Run Evaluation</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              LLM-as-judge over ground truth
            </p>
          </div>
          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-violet-400" />
        </button>
      </div>
    </div>
  );
}

function ActivityBento({ chats }: { chats: ChatType[] }) {
  // Build a 14-day activity heatmap from chat updated_at
  const now = new Date();
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (13 - i));
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const count = chats.filter((c) => {
      const t = new Date(c.updated_at).getTime();
      return t >= d.getTime() && t < next.getTime();
    }).length;
    return { date: d, count };
  });
  const max = Math.max(1, ...days.map((d) => d.count));
  const total = days.reduce((s, d) => s + d.count, 0);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border/50 bg-card/60 p-6 backdrop-blur-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-[13px] font-semibold text-foreground">Activity</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Last 14 days</p>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/15">
          <TrendingUp className="h-2.5 w-2.5" />
          {total} chats
        </div>
      </div>

      <div className="mt-auto flex h-32 items-end gap-1.5 pt-4">
        {days.map((d, i) => {
          const height = d.count === 0 ? 4 : Math.max(8, (d.count / max) * 100);
          return (
            <div
              key={i}
              className="group relative flex-1"
              style={{ height: "100%" }}
            >
              <div
                className={`absolute bottom-0 w-full rounded-t-sm transition-all duration-200 ${
                  d.count === 0
                    ? "bg-muted/50"
                    : "bg-gradient-to-t from-primary/40 to-primary group-hover:from-primary/60 group-hover:to-primary"
                }`}
                style={{ height: `${height}%` }}
              />
              <div className="absolute -top-7 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-background/90 px-1.5 py-0.5 text-[9px] text-foreground opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 border border-border/50">
                {d.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {d.count}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RecentChatsBento({ chats, isLoading }: { chats: ChatType[]; isLoading: boolean }) {
  const recent = chats.slice(0, 30);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border/50 bg-card/60 p-6 backdrop-blur-sm overflow-hidden">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-[13px] font-semibold text-foreground">Recent Chats</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Pick up where you left off
          </p>
        </div>
        <Link
          href="/chat?new=1"
          className="flex items-center gap-1 rounded-full border border-border/60 bg-background/40 px-2.5 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          <Plus className="h-2.5 w-2.5" />
          New
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-1.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-11 animate-pulse rounded-lg bg-muted/50" />
          ))}
        </div>
      ) : recent.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/40">
            <MessageSquare className="h-4 w-4 text-muted-foreground/40" />
          </div>
          <p className="mt-3 text-[12px] text-muted-foreground">No chats yet</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground/60">
            Click <span className="text-foreground/70">New</span> to get started
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-1 custom-scrollbar">
          {recent.map((chat) => (
            <Link
              key={chat.id}
              href={`/chat/${chat.id}`}
              className="group flex items-center justify-between rounded-lg border border-transparent px-3 py-2.5 transition-all duration-150 hover:border-border/50 hover:bg-background/40"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                  <FileText className="h-3 w-3 text-muted-foreground/70" />
                </div>
                <span className="min-w-0 truncate text-[12.5px] font-medium text-foreground/85 group-hover:text-foreground">
                  {chat.title}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2.5">
                <span className="text-[10.5px] text-muted-foreground/60">
                  {new Date(chat.updated_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <ArrowRight className="h-3 w-3 text-muted-foreground/30 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats } = useUserStats();
  const { data: chats, isLoading } = useChats();
  const { user } = useSupabaseSession();
  const firstName = getFirstName(user);
  const chatList = chats ?? [];

  return (
    <AuthGuard>
      <Navbar />
      <main className="bg-grid-fade relative min-h-[calc(100vh-3.5rem)]">
        <div className="relative z-10 mx-auto max-w-[1200px] px-6 py-10">
          {/* Bento grid */}
          <div className="grid auto-rows-min grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 animate-fade-up">
              <WelcomeBento name={firstName} stats={stats} />
            </div>

            <div className="animate-fade-up delay-75">
              <QuickActionsBento />
            </div>

            <div className="lg:col-span-2 animate-fade-up delay-150 h-[340px]">
              <RecentChatsBento chats={chatList} isLoading={isLoading} />
            </div>

            <div className="animate-fade-up delay-225 h-[340px]">
              <ActivityBento chats={chatList} />
            </div>
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
