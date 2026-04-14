"use client";

import { useMutation } from "@tanstack/react-query";
import { askQuestion } from "@/features/query/services/query-service";

export function useAskQuestion(documentId: string, chatId: string) {
  return useMutation({
    mutationFn: (question: string) => askQuestion(documentId, question, chatId),
  });
}
