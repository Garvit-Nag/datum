import { apiClient } from "@/shared/api/client";
import { clientEnv } from "@/shared/utils/client-env";
import { getFreshAccessToken } from "@/shared/lib/supabase";
import type {
  EvaluationEventType,
  EvaluationResultRowType,
  EvaluationRunType,
} from "@/features/evaluation/types";

type TriggerEvaluationParamsType = {
  document_id: string;
  ground_truth_text: string;
};

type OnEvaluationEventType = (event: EvaluationEventType) => void;

export async function fetchEvaluationResults(): Promise<EvaluationRunType[]> {
  const res = await apiClient.get<EvaluationRunType[]>("/api/v1/evaluation/results");
  return res.data;
}

export async function streamEvaluation(
  params: TriggerEvaluationParamsType,
  onEvent: OnEvaluationEventType,
): Promise<EvaluationRunType> {
  const token = await getFreshAccessToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(
    `${clientEnv.NEXT_PUBLIC_API_BASE_URL}/api/v1/evaluation/run`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    },
  );

  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => "");
    throw new Error(`Evaluation request failed (${response.status}): ${text.slice(0, 200)}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalRun: EvaluationRunType | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      const event = JSON.parse(line) as EvaluationEventType;
      onEvent(event);
      if (event.type === "done") {
        finalRun = event.run;
      }
    }
  }

  const trailing = buffer.trim();
  if (trailing) {
    const event = JSON.parse(trailing) as EvaluationEventType;
    onEvent(event);
    if (event.type === "done") {
      finalRun = event.run;
    }
  }

  if (!finalRun) {
    throw new Error("Evaluation stream ended without a final result event");
  }
  return finalRun;
}

export type { TriggerEvaluationParamsType, OnEvaluationEventType, EvaluationResultRowType };
