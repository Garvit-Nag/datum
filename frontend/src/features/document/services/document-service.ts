import { apiClient } from "@/shared/api/client";
import type { DocumentListResponseType, DocumentType } from "@/features/document/types";

export async function fetchDocuments(): Promise<DocumentType[]> {
  const res = await apiClient.get<DocumentListResponseType>("/api/v1/documents/");
  return res.data.documents;
}

export async function uploadDocument(file: File): Promise<DocumentType> {
  const form = new FormData();
  form.append("file", file);
  const res = await apiClient.post<DocumentType>("/api/v1/documents/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function deleteDocument(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/documents/${id}`);
}
