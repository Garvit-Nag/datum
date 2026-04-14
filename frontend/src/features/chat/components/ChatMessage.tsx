"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { MessageType } from "@/features/chat/types";
import type { ScoreSignalType } from "@/features/query/types";
import { cn } from "@/shared/lib/utils";

const signalBadgeClass: Record<ScoreSignalType, string> = {
  Strong: "bg-green-500/10 text-green-500",
  Good: "bg-blue-500/10 text-blue-500",
  Weak: "bg-yellow-500/10 text-yellow-500",
  Poor: "bg-red-500/10 text-red-500",
};

export function ChatMessage({ message }: { message: MessageType }) {
  const [showChunks, setShowChunks] = useState(false);

  return (
    <div className="space-y-3">
      {/* User question */}
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary/15 px-4 py-3 text-sm text-foreground">
          {message.question}
        </div>
      </div>

      {/* Assistant answer */}
      <div className="flex justify-start">
        <div className="max-w-[80%] space-y-2">
          <div className="rounded-2xl rounded-bl-md bg-muted/60 px-4 py-3 text-sm leading-relaxed text-foreground">
            <p className="whitespace-pre-wrap">{message.answer}</p>
          </div>

          {/* Expandable similarity chunks */}
          {message.chunks && message.chunks.length > 0 && (
            <button
              onClick={() => setShowChunks(!showChunks)}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              {showChunks ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              {showChunks ? "Hide" : "Show"} sources ({message.chunks.length})
            </button>
          )}

          {showChunks && message.chunks && (
            <div className="space-y-1 rounded-lg border bg-card p-2">
              {message.chunks.map((chunk) => (
                <div
                  key={chunk.rank}
                  className="flex items-start gap-2 rounded-md px-2 py-1.5 text-xs"
                >
                  <span className={cn("shrink-0 rounded px-1.5 py-0.5 font-medium", signalBadgeClass[chunk.signal])}>
                    {chunk.score.toFixed(2)}
                  </span>
                  <span className="shrink-0 text-muted-foreground">
                    p{chunk.page}¶{chunk.paragraph}
                  </span>
                  <span className="min-w-0 text-muted-foreground line-clamp-2">
                    {chunk.preview}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
