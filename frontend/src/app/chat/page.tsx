"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthGuard } from "@/shared/components/AuthGuard";
import { Navbar } from "@/shared/components/Navbar";
import { ChatSidebar } from "@/features/chat/components/ChatSidebar";
import { NewChatDialog } from "@/features/chat/components/NewChatDialog";
import { useChats } from "@/features/chat/hooks/useChats";
import { MessageSquare, Plus, FileText, ArrowRight } from "lucide-react";

function ChatRootContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const wantsNew = searchParams.get("new") === "1";
  const [newChatOpen, setNewChatOpen] = useState(false);
  const { data: chats } = useChats();

  // Only auto-open if explicitly requested via ?new=1
  useEffect(() => {
    if (wantsNew) setNewChatOpen(true);
  }, [wantsNew]);

  function handleClose() {
    setNewChatOpen(false);
    if (wantsNew) {
      // Strip the query param so it doesn't reopen
      router.replace("/chat");
    }
  }

  const recent = (chats ?? []).slice(0, 4);

  return (
    <>
      <Navbar />
      <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
        <ChatSidebar onNewChat={() => setNewChatOpen(true)} />

        <main className="flex flex-1 flex-col items-center justify-center px-6">
          <div className="w-full max-w-md text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm">
              <MessageSquare className="h-6 w-6 text-primary/80" />
            </div>
            <h1 className="mt-5 text-xl font-semibold tracking-tight text-foreground">
              Pick up where you left off
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Choose a recent chat or start a new conversation.
            </p>

            <button
              onClick={() => setNewChatOpen(true)}
              className="group mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:shadow-[0_0_28px_-4px_hsl(var(--primary)/0.55)] active:scale-[0.97]"
            >
              <Plus className="h-3.5 w-3.5" />
              New chat
            </button>

            {recent.length > 0 && (
              <div className="mt-10 text-left">
                <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/60">
                  Recent
                </p>
                <div className="space-y-1">
                  {recent.map((chat) => (
                    <Link
                      key={chat.id}
                      href={`/chat/${chat.id}`}
                      className="group flex items-center justify-between rounded-xl border border-border/40 bg-card/40 px-4 py-2.5 transition-all duration-150 hover:-translate-y-px hover:border-border hover:bg-card/70"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground/60" />
                        <span className="min-w-0 truncate text-[12.5px] font-medium text-foreground/85 group-hover:text-foreground">
                          {chat.title}
                        </span>
                      </div>
                      <ArrowRight className="h-3 w-3 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-foreground" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <NewChatDialog open={newChatOpen} onClose={handleClose} />
    </>
  );
}

export default function ChatRootPage() {
  return (
    <AuthGuard>
      <Suspense fallback={null}>
        <ChatRootContent />
      </Suspense>
    </AuthGuard>
  );
}
