"use client";

import { useTriggerEvaluation } from "@/features/evaluation/hooks/useEvaluation";
import { Button } from "@/components/ui/button";

type Props = {
  documentId: string;
};

export function EvaluationTriggerButton({ documentId }: Props) {
  const { mutate, isPending, error } = useTriggerEvaluation();

  return (
    <div className="space-y-1">
      <Button
        onClick={() => mutate(documentId)}
        disabled={isPending}
        className="w-full sm:w-auto"
      >
        {isPending ? "Running Evaluation…" : "Run Evaluation"}
      </Button>
      {error && (
        <p className="text-xs text-destructive">
          Evaluation failed. Check the console for details.
        </p>
      )}
    </div>
  );
}
