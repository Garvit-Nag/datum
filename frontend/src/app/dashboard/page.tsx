"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthGuard } from "@/shared/components/AuthGuard";
import { AppNav } from "@/shared/components/AppNav";
import { NewChatDialog } from "@/features/chat/components/NewChatDialog";
import { useUserStats, useChats } from "@/features/chat/hooks/useChats";
import { FileText, MessageSquare, HelpCircle, Plus, FlaskConical } from "lucide-react";
import { useSupabaseSession } from "@/shared/providers/supabase-provider";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number | undefined;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card p-5 transition-all duration-200 hover:shadow-md">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">
          {value !== undefined ? value : (
            <span className="inline-block h-6 w-10 animate-pulse rounded bg-muted" />
          )}
        </p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function RecentChats() {
  const { data: chats, isLoading } = useChats();
  const recent = (chats ?? []).slice(0, 5);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    );
  }

  if (recent.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No chats yet. Start your first conversation!
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {recent.map((chat) => (
        <Link
          key={chat.id}
          href={`/chat/${chat.id}`}
          className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-all duration-200 hover:bg-muted/60"
        >
          <div className="flex items-center gap-3 min-w-0">
            <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 truncate font-medium text-foreground">{chat.title}</span>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">
            {new Date(chat.updated_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </Link>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats } = useUserStats();
  const { user } = useSupabaseSession();
  const router = useRouter();
  const [newChatOpen, setNewChatOpen] = useState(false);

  const isAdmin = user?.user_metadata?.role === "admin";

  return (
    <AuthGuard>
      <AppNav />
      <main className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={FileText} label="Documents" value={stats?.total_documents} />
          <StatCard icon={MessageSquare} label="Chats" value={stats?.total_chats} />
          <StatCard icon={HelpCircle} label="Questions Asked" value={stats?.total_queries} />
        </div>

        {/* Actions row */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Recent Chats</h2>
            <p className="text-sm text-muted-foreground">
              Pick up where you left off, or start a new conversation.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button
                variant="outline"
                onClick={() => router.push("/evaluation")}
                className="gap-2"
              >
                <FlaskConical className="h-4 w-4" />
                Evaluate
              </Button>
            )}
            <Button onClick={() => setNewChatOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
          </div>
        </div>

        {/* Recent chats */}
        <div className="rounded-xl border bg-card p-4">
          <RecentChats />
        </div>

        <NewChatDialog open={newChatOpen} onClose={() => setNewChatOpen(false)} />
      </main>
    </AuthGuard>
  );
}
