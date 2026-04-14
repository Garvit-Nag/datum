"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { documentKeys } from "./document-keys";
import {
  deleteDocument,
  fetchDocuments,
  uploadDocument,
} from "@/features/document/services/document-service";

export function useDocuments() {
  return useQuery({
    queryKey: documentKeys.list(),
    queryFn: fetchDocuments,
    refetchInterval: (query) => {
      const docs = query.state.data;
      if (!docs) return false;
      return docs.some((d) => d.status === "processing") ? 3000 : false;
    },
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentKeys.all }),
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentKeys.all }),
  });
}
