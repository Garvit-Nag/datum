export type DocumentStatusType = "processing" | "ready" | "failed";

export type DocumentType = {
  id: string;
  filename: string;
  status: DocumentStatusType;
  namespace: string;
  created_at: string;
};

export type DocumentListResponseType = {
  documents: DocumentType[];
};
