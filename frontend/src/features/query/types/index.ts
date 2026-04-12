export type ScoreSignalType = "Strong" | "Good" | "Weak" | "Poor";

export type SimilarityChunkType = {
  rank: number;
  page: number;
  paragraph: number;
  score: number;
  signal: ScoreSignalType;
  preview: string;
};

export type QueryResponseType = {
  answer: string;
  chunks: SimilarityChunkType[];
  query_id: string;
};
