"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, BarChart3 } from "lucide-react";
import type { MessageType } from "@/features/chat/types";
import type { ScoreSignalType } from "@/features/query/types";
import { cn } from "@/shared/lib/utils";

const signalBadge: Record<ScoreSignalType, string> = {
  Strong: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  Good:   "bg-cyan-500/15 text-cyan-400 border-cyan-500/25",
  Weak:   "bg-amber-500/15 text-amber-400 border-amber-500/25",
  Poor:   "bg-red-500/15 text-red-400 border-red-500/25",
};

const signalBar: Record<ScoreSignalType, string> = {
  Strong: "bg-emerald-500",
  Good:   "bg-cyan-500",
  Weak:   "bg-amber-500",
  Poor:   "bg-red-500",
};

type Props = {
  message: MessageType;
  isLatest?: boolean;
};

export function ChatMessage({ message, isLatest = false }: Props) {
  const hasChunks = message.chunks && message.chunks.length > 0;
  const [showChunks, setShowChunks] = useState(isLatest);

  return (
    <div className="space-y-3 animate-fade-up">
      {/* User question */}
      <div className="flex justify-end">
        <div className="max-w-[78%] rounded-2xl rounded-br-md border border-primary/20 bg-primary/[0.08] px-4 py-2.5 text-[13.5px] leading-relaxed text-foreground">
          {message.question}
        </div>
      </div>

      {/* Assistant answer */}
      <div className="flex justify-start">
        <div className="w-full max-w-[94%] space-y-2.5">
          {/* Answer bubble */}
          <div className="rounded-2xl rounded-bl-md border border-border/50 bg-card/60 px-4 py-3.5 text-[13.5px] leading-relaxed text-foreground backdrop-blur-sm">
            <p className="whitespace-pre-wrap">{message.answer}</p>
          </div>

          {/* Similarity report toggle */}
          {hasChunks && (
            <div>
              <button
                onClick={() => setShowChunks((v) => !v)}
                className="group flex items-center gap-1.5 rounded-lg border border-border/50 bg-card/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-all hover:border-border hover:bg-card/70 hover:text-foreground"
              >
                <BarChart3 className="h-3 w-3" />
                {showChunks ? "Hide" : "Show"} Similarity Report
                <span className="ml-1 rounded-full bg-muted/70 px-1.5 py-0.5 font-mono text-[9.5px]">
                  {message.chunks.length}
                </span>
                {showChunks ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>

              {showChunks && (
                <div className="mt-2 overflow-hidden rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm animate-fade-in">
                  {/* Report title */}
                  <div className="flex items-center justify-between border-b border-border/40 px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-3 w-3 text-primary/70" />
                      <p className="text-[11.5px] font-semibold text-foreground">
                        Similarity Report
                      </p>
                    </div>
                    <p className="text-[10px] text-muted-foreground/70">
                      Top {message.chunks.length} matching chunks · cosine similarity
                    </p>
                  </div>

                  {/* Column headers */}
                  <div className="grid grid-cols-[40px_70px_72px_60px_1fr] gap-3 border-b border-border/30 bg-background/30 px-4 py-2 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
                    <span>Rank</span>
                    <span className="text-right">Score</span>
                    <span>Signal</span>
                    <span>Page</span>
                    <span>Preview</span>
                  </div>

                  {/* Rows */}
                  <div className="divide-y divide-border/25">
                    {message.chunks.map((chunk) => (
                      <div
                        key={chunk.rank}
                        className="group grid grid-cols-[40px_70px_72px_60px_1fr] items-center gap-3 px-4 py-2.5 transition-colors hover:bg-background/40"
                      >
                        {/* Rank */}
                        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-border/50 bg-background/50 font-mono text-[10px] font-semibold text-muted-foreground">
                          {chunk.rank}
                        </span>

                        {/* Score + bar */}
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-mono text-[11px] font-semibold tabular-nums text-foreground">
                            {chunk.score.toFixed(3)}
                          </span>
                          <div className="h-1 w-14 overflow-hidden rounded-full bg-muted/60">
                            <div
                              className={cn("h-full rounded-full", signalBar[chunk.signal])}
                              style={{ width: `${Math.min(chunk.score * 100, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Signal badge */}
                        <span
                          className={cn(
                            "inline-flex justify-center rounded-full border px-2 py-0.5 font-mono text-[9.5px] font-semibold",
                            signalBadge[chunk.signal],
                          )}
                        >
                          {chunk.signal}
                        </span>

                        {/* Page */}
                        <span className="font-mono text-[10.5px] text-muted-foreground/80">
                          p.{chunk.page}
                        </span>

                        {/* Preview */}
                        <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground/85">
                          {chunk.preview}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
