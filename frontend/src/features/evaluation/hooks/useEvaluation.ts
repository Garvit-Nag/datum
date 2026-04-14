"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { evaluationKeys } from "./evaluation-keys";
import {
  fetchEvaluationResults,
  triggerEvaluation,
} from "@/features/evaluation/services/evaluation-service";

export function useEvaluationResults() {
  return useQuery({
    queryKey: evaluationKeys.results(),
    queryFn: fetchEvaluationResults,
  });
}

export function useTriggerEvaluation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: triggerEvaluation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: evaluationKeys.all }),
  });
}
