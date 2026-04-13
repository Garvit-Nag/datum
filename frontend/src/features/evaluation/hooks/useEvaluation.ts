"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { evaluationKeys } from "./evaluation-keys";
import {
  fetchEvaluationResults,
  streamEvaluation,
  type TriggerEvaluationParamsType,
} from "@/features/evaluation/services/evaluation-service";
import type { EvaluationProgressType } from "@/features/evaluation/types";

export function useEvaluationResults() {
  return useQuery({
    queryKey: evaluationKeys.results(),
    queryFn: fetchEvaluationResults,
  });
}

export function useTriggerEvaluation() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<EvaluationProgressType | null>(null);

  const mutation = useMutation({
    mutationFn: async (params: TriggerEvaluationParamsType) => {
      return streamEvaluation(params, (event) => {
        if (event.type === "start") {
          setProgress({ phase: "answers", total: event.total, completed: 0, remaining: event.total, lastQuestion: "" });
          return;
        }
        if (event.type === "answer_ready") {
          setProgress({
            phase: "answers",
            total: event.completed + event.remaining,
            completed: event.completed,
            remaining: event.remaining,
            lastQuestion: event.question,
          });
          return;
        }
        if (event.type === "judging") {
          setProgress((prev) => ({
            phase: "judging",
            total: prev?.total ?? 0,
          }));
          return;
        }
        if (event.type === "verdict") {
          setProgress({
            phase: "verdicts",
            total: event.completed + event.remaining,
            completed: event.completed,
            remaining: event.remaining,
            lastRow: event.row,
          });
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: evaluationKeys.results() });
      setProgress(null);
    },
    onError: () => {
      setProgress(null);
    },
  });

  return {
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
    progress,
  };
}
