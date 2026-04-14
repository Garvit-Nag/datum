"use client";

import { useEffect, useRef } from "react";
import type { MessageType } from "@/features/chat/types";
import { ChatMessage } from "./ChatMessage";
import { ScrollArea } from "@/components/ui/scroll-area";

type Props = {
  messages: MessageType[];
  pendingQuestion: string | null;
  errorMessage?: string | null;
};

export function ChatMessageList({ messages, pendingQuestion, errorMessage }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, pendingQuestion]);

  return (
    <ScrollArea className="flex-1 px-4 py-4">
      <div className="mx-auto max-w-3xl space-y-6">
        {messages.map((msg, i) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            isLatest={i === messages.length - 1 && !pendingQuestion}
          />
        ))}

        {/* Optimistic: user's question appears immediately */}
        {pendingQuestion && (
          <div className="space-y-3">
            {/* User bubble */}
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary/15 px-4 py-3 text-sm text-foreground">
                {pendingQuestion}
              </div>
            </div>

            {/* AI thinking indicator */}
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-muted/60 px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error bubble — shown when sendMessage fails */}
        {errorMessage && !pendingQuestion && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl rounded-bl-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
