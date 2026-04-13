export type VerdictType = "Match" | "Partial Match" | "No Match";

export type EvaluationResultRowType = {
  id: number;
  category: string;
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

// Phase 1 — answer generation progress
export type EvaluationAnswerProgressType = {
  phase: "answers";
  completed: number;
  remaining: number;
  total: number;
  lastQuestion: string;
};

// Phase 2 — batch judge in progress
export type EvaluationJudgingProgressType = {
  phase: "judging";
  total: number;
};

// Phase 3 — verdicts appearing one by one
export type EvaluationVerdictProgressType = {
  phase: "verdicts";
  completed: number;
  remaining: number;
  total: number;
  lastRow: EvaluationResultRowType;
};

export type EvaluationProgressType =
  | EvaluationAnswerProgressType
  | EvaluationJudgingProgressType
  | EvaluationVerdictProgressType;

export type EvaluationEventType =
  | { type: "start"; total: number }
  | { type: "answer_ready"; completed: number; remaining: number; question: string }
  | { type: "judging" }
  | { type: "verdict"; completed: number; remaining: number; row: EvaluationResultRowType }
  | { type: "done"; run: EvaluationRunType };
