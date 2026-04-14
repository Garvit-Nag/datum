import { apiClient } from "@/shared/api/client";
import type { QueryResponseType } from "@/features/query/types";

export async function askQuestion(
  document_id: string,
  question: string,
): Promise<QueryResponseType> {
  const res = await apiClient.post<QueryResponseType>("/api/v1/query/", {
    document_id,
    question,
  });
  return res.data;
}
