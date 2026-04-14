"use client";

import { useState } from "react";
import { useDocuments } from "@/features/document/hooks/useDocuments";
import { useEvaluationResults } from "@/features/evaluation/hooks/useEvaluation";
import { EvaluationTriggerButton } from "./EvaluationTriggerButton";
import { EvaluationSummaryTable } from "./EvaluationSummaryTable";
import { Label } from "@/components/ui/label";

export function EvaluationPageClient() {
  const { data: documents } = useDocuments();
  const { data: runs, isLoading } = useEvaluationResults();
  const [selectedDocId, setSelectedDocId] = useState<string>("");

  const readyDocs = documents?.filter((d) => d.status === "ready") ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Evaluation</h1>
        <p className="text-sm text-muted-foreground">
          Run the 10-question ground truth evaluation on a document.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="space-y-1 flex-1">
          <Label htmlFor="doc-select">Select document</Label>
          <select
            id="doc-select"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
          >
            <option value="">— choose a ready document —</option>
            {readyDocs.map((d) => (
              <option key={d.id} value={d.id}>
                {d.filename}
              </option>
            ))}
          </select>
        </div>
        {selectedDocId && <EvaluationTriggerButton documentId={selectedDocId} />}
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      )}

      {!isLoading && !runs?.length && (
        <div className="rounded-md border border-dashed py-12 text-center text-sm text-muted-foreground">
          No evaluation runs yet. Select a document and click Run Evaluation.
        </div>
      )}

      {runs?.map((run) => (
        <EvaluationSummaryTable key={run.id} run={run} />
      ))}
    </div>
  );
}
