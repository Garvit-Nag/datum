"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MessageSquarePlus, FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { UserMenu } from "@/shared/components/UserMenu";
import { useChats } from "@/features/chat/hooks/useChats";
import { cn } from "@/shared/lib/utils";
import type { ChatType } from "@/features/chat/types";

function groupChatsByDate(chats: ChatType[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const groups: { label: string; chats: ChatType[] }[] = [
    { label: "Today", chats: [] },
    { label: "Yesterday", chats: [] },
    { label: "Previous 7 Days", chats: [] },
    { label: "Older", chats: [] },
  ];

  for (const chat of chats) {
    const d = new Date(chat.updated_at);
    if (d >= today) groups[0].chats.push(chat);
    else if (d >= yesterday) groups[1].chats.push(chat);
    else if (d >= weekAgo) groups[2].chats.push(chat);
    else groups[3].chats.push(chat);
  }

  return groups.filter((g) => g.chats.length > 0);
}

type Props = {
  activeChatId?: string;
  onNewChat: () => void;
};

export function ChatSidebar({ activeChatId, onNewChat }: Props) {
  const { data: chats } = useChats();
  const pathname = usePathname();

  const groups = groupChatsByDate(chats ?? []);

  return (
    <aside className="flex h-screen w-72 shrink-0 flex-col border-r border-border/50 bg-card/50">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4">
        <Link
          href="/"
          className="text-base font-semibold tracking-tight text-foreground transition-opacity hover:opacity-80"
        >
          Datum
        </Link>
        <ThemeToggle />
      </div>

      {/* New Chat */}
      <div className="px-3 pb-2">
        <Button
          onClick={onNewChat}
          variant="outline"
          className="w-full justify-start gap-2 border-dashed text-muted-foreground hover:border-primary/50 hover:text-foreground"
        >
          <MessageSquarePlus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      <Separator />

      {/* Chat History */}
      <ScrollArea className="flex-1 px-2 py-2">
        {groups.map((group) => (
          <div key={group.label} className="mb-3">
            <p className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
              {group.label}
            </p>
            {group.chats.map((chat) => (
              <Link
                key={chat.id}
                href={`/chat/${chat.id}`}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all duration-150",
                  chat.id === activeChatId
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <FileText className="h-3.5 w-3.5 shrink-0 opacity-60" />
                <span className="min-w-0 truncate">{chat.title}</span>
              </Link>
            ))}
          </div>
        ))}
        {(!chats || chats.length === 0) && (
          <p className="px-3 py-8 text-center text-xs text-muted-foreground">
            No chats yet. Start a new one!
          </p>
        )}
      </ScrollArea>

      <Separator />

      {/* User Profile (bottom-pinned) */}
      <div className="p-2">
        <UserMenu />
      </div>
    </aside>
  );
}
