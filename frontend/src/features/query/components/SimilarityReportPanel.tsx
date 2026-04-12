"use client";

import type { ScoreSignalType, SimilarityChunkType } from "@/features/query/types";
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
  Strong: "bg-green-50",
  Good: "bg-blue-50",
  Weak: "bg-yellow-50",
  Poor: "bg-red-50",
};

const signalBadgeClass: Record<ScoreSignalType, string> = {
  Strong: "text-green-700 font-semibold",
  Good: "text-blue-700 font-semibold",
  Weak: "text-yellow-700 font-semibold",
  Poor: "text-red-700 font-semibold",
};

type Props = {
  chunks: SimilarityChunkType[] | undefined;
  isPending: boolean;
};

export function SimilarityReportPanel({ chunks, isPending }: Props) {
  return (
    <div className="rounded-lg border bg-card">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Similarity Report</h2>
        <p className="text-xs text-muted-foreground">Top 5 matching chunks from the document</p>
      </div>

      {isPending && (
        <div className="space-y-2 p-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      )}

      {!isPending && !chunks && (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Ask a question to see similarity results.
        </div>
      )}

      {!isPending && chunks && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Rank</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="w-20">Score</TableHead>
              <TableHead className="w-24">Signal</TableHead>
              <TableHead>Chunk Preview</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {chunks.map((chunk) => (
              <TableRow
                key={chunk.rank}
                className={cn(signalRowClass[chunk.signal])}
              >
                <TableCell className="font-medium">{chunk.rank}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  Page {chunk.page}, Para {chunk.paragraph}
                </TableCell>
                <TableCell>{chunk.score.toFixed(2)}</TableCell>
                <TableCell className={cn("text-xs", signalBadgeClass[chunk.signal])}>
                  {chunk.signal}
                </TableCell>
                <TableCell className="max-w-xs text-xs text-muted-foreground">
                  <span className="line-clamp-2">{chunk.preview}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
