import type { SimilarityChunkType } from "@/features/query/types";

export type ChatType = {
  id: string;
  document_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type ChatDetailType = ChatType & {
  document_filename: string;
  document_status: string;
};

export type MessageType = {
  id: string;
  question: string;
  answer: string;
  chunks: SimilarityChunkType[];
  created_at: string;
};

export type UserStatsType = {
  total_documents: number;
  total_chats: number;
  total_queries: number;
};
