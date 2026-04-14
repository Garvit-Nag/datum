export type VerdictType = "Match" | "Partial Match" | "No Match";

export type EvaluationResultRowType = {
  id: number;
  question: string;
  expected_answer: string;
  system_answer: string;
  verdict: VerdictType;
  reason: string;
};

export type EvaluationRunType = {
  id: string;
  run_at: string;
  results: EvaluationResultRowType[];
  match_count: number;
  partial_count: number;
  no_match_count: number;
  accuracy_pct: number;
};
