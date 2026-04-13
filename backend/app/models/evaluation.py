from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class EvaluationRequest(BaseModel):
    document_id: str
    ground_truth_text: str


class GroundTruthItem(BaseModel):
    id: int
    category: str
    question: str
    expected_answer: str


class EvaluationResultRow(BaseModel):
    id: int
    category: str = ""
    question: str
    expected_answer: str
    system_answer: str
    verdict: Literal["Match", "Partial Match", "No Match"]
    reason: str


class EvaluationRunResponse(BaseModel):
    id: str
    run_at: datetime
    results: list[EvaluationResultRow]
    match_count: int
    partial_count: int
    no_match_count: int
    accuracy_pct: float
