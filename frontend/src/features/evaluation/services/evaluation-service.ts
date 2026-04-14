import { apiClient } from "@/shared/api/client";
import type { EvaluationRunType } from "@/features/evaluation/types";

export async function triggerEvaluation(document_id: string): Promise<EvaluationRunType> {
  const res = await apiClient.post<EvaluationRunType>("/api/v1/evaluation/run", { document_id });
  return res.data;
}

export async function fetchEvaluationResults(): Promise<EvaluationRunType[]> {
  const res = await apiClient.get<EvaluationRunType[]>("/api/v1/evaluation/results");
  return res.data;
}
