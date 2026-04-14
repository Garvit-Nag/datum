"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, FileText, MessageSquare } from "lucide-react";

import { useChats } from "@/features/chat/hooks/useChats";
import { cn } from "@/shared/lib/utils";

type Props = {
  activeChatId?: string;
  onNewChat: () => void;
};

export function ChatSidebar({ activeChatId, onNewChat }: Props) {
  const { data: chats, isLoading } = useChats();
  const pathname = usePathname();
  const list = chats ?? [];

  return (
    <aside className="flex h-[calc(100vh-3.5rem)] w-[260px] shrink-0 flex-col border-r border-border/40 bg-card/30 backdrop-blur-sm">
      {/* New chat button */}
      <div className="px-3 py-3">
        <button
          onClick={onNewChat}
          className="group flex w-full items-center gap-2.5 rounded-xl border border-border/60 bg-background/40 px-3.5 py-2.5 text-[12.5px] font-medium text-foreground/85 transition-all duration-200 hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary border border-primary/20">
            <Plus className="h-3 w-3" />
          </span>
          New chat
        </button>
      </div>

      {/* Section label */}
      <div className="px-5 pb-1.5 pt-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/60">
          Chats
        </p>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto px-2 pb-3 custom-scrollbar">
        {isLoading ? (
          <div className="space-y-1 px-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-9 animate-pulse rounded-lg bg-muted/40" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-3 py-12 text-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/40">
              <MessageSquare className="h-3.5 w-3.5 text-muted-foreground/50" />
            </div>
            <p className="mt-2.5 text-[11px] text-muted-foreground/70">No chats yet</p>
          </div>
        ) : (
          <div className="space-y-0.5 relative">
            {list.map((chat) => {
              const isActive =
                chat.id === activeChatId || pathname === `/chat/${chat.id}`;
              return (
                <Link
                  key={chat.id}
                  href={`/chat/${chat.id}`}
                  className={cn(
                    "group flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] transition-all duration-150 relative overflow-hidden",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground border border-transparent",
                  )}
                  title={chat.title}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[2px] rounded-r-full bg-primary" />
                  )}
                  <FileText
                    className={cn(
                      "h-3 w-3 shrink-0",
                      isActive ? "text-primary" : "opacity-50",
                    )}
                  />
                  <span className="flex-1 min-w-0 truncate block text-left">{chat.title}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
