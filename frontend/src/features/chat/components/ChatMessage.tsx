"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { MessageType } from "@/features/chat/types";
import type { ScoreSignalType } from "@/features/query/types";
import { cn } from "@/shared/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const signalRowClass: Record<ScoreSignalType, string> = {
  Strong: "bg-green-500/10",
  Good: "bg-blue-500/10",
  Weak: "bg-yellow-500/10",
  Poor: "bg-red-500/10",
};

const signalTextClass: Record<ScoreSignalType, string> = {
  Strong: "text-green-700 font-semibold",
  Good: "text-blue-700 font-semibold",
  Weak: "text-yellow-700 font-semibold",
  Poor: "text-red-700 font-semibold",
};

type Props = {
  message: MessageType;
  isLatest?: boolean;
};

export function ChatMessage({ message, isLatest = false }: Props) {
  const hasChunks = message.chunks && message.chunks.length > 0;

  // Latest message starts expanded so the Similarity Report is always visible;
  // older messages start collapsed to keep conversation history readable.
  const [showChunks, setShowChunks] = useState(isLatest);

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
        <div className="w-full max-w-[95%] space-y-2">
          <div className="rounded-2xl rounded-bl-md bg-muted/60 px-4 py-3 text-sm leading-relaxed text-foreground">
            <p className="whitespace-pre-wrap">{message.answer}</p>
          </div>

          {/* Similarity Report */}
          {hasChunks && (
            <>
              <button
                onClick={() => setShowChunks((v) => !v)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              >
                {showChunks ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
                {showChunks ? "Hide" : "Show"} Similarity Report
              </button>

              {showChunks && (
                <div className="rounded-lg border bg-card">
                  <div className="border-b px-4 py-2">
                    <p className="text-xs font-semibold text-foreground">Similarity Report</p>
                    <p className="text-[11px] text-muted-foreground">Top {message.chunks.length} matching chunks</p>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Rank</TableHead>
                        <TableHead className="w-32">Location</TableHead>
                        <TableHead className="w-16">Score</TableHead>
                        <TableHead className="w-20">Signal</TableHead>
                        <TableHead>Chunk Preview</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {message.chunks.map((chunk) => (
                        <TableRow
                          key={chunk.rank}
                          className={cn(
                            signalRowClass[chunk.signal],
                            "border-l-2 border-l-transparent transition-all duration-200 hover:border-l-cyan-400",
                          )}
                        >
                          <TableCell className="font-medium">{chunk.rank}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            Page {chunk.page}, Para {chunk.paragraph}
                          </TableCell>
                          <TableCell className="text-xs">{chunk.score.toFixed(2)}</TableCell>
                          <TableCell className={cn("text-xs", signalTextClass[chunk.signal])}>
                            {chunk.signal}
                          </TableCell>
                          <TableCell className="max-w-xs text-xs text-muted-foreground">
                            <span className="line-clamp-2">{chunk.preview}</span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
