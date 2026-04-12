import json
from pathlib import Path
from typing import Literal

from app.adapters.base.llm import LlmAdapterBase
from app.models.evaluation import (
    EvaluationResultRow,
    EvaluationRunResponse,
    GroundTruthItem,
)
from app.repositories.evaluation_repo import EvaluationRepository
from app.services.query_service import QueryService

_GROUND_TRUTH_PATH = Path("/app/data/ground_truth.json")

_JUDGE_SYSTEM_PROMPT = ""

_JUDGE_USER_TEMPLATE = (
    "You are evaluating a RAG system's answer against a ground truth answer "
    "extracted from a contract document. Compare the two answers and classify "
    "the result as exactly one of: Match, Partial Match, or No Match. "
    "Then provide a single sentence explaining your classification. "
    "Do not add any other commentary.\n"
    "Ground Truth Answer: {expected} | System Answer: {actual}"
)

VerdictType = Literal["Match", "Partial Match", "No Match"]


def _parse_verdict(raw: str) -> tuple[VerdictType, str]:
    """Extract verdict and reason from the judge's raw response.

    Expected format (first line = verdict, second line = reason):
        Match
        The system correctly identified the liability cap clause.
    """
    lines = [ln.strip() for ln in raw.strip().splitlines() if ln.strip()]
    if not lines:
        return "No Match", raw[:200]

    first = lines[0]
    reason = lines[1] if len(lines) > 1 else first

    if "Partial Match" in first:
        return "Partial Match", reason
    if "No Match" in first:
        return "No Match", reason
    if "Match" in first:
        return "Match", reason

    return "No Match", raw[:200]


class EvaluationService:
    def __init__(
        self,
        query_service: QueryService,
        judge_llm: LlmAdapterBase,
        evaluation_repo: EvaluationRepository,
    ) -> None:
        self._query_service = query_service
        self._judge_llm = judge_llm
        self._evaluation_repo = evaluation_repo

    def _load_ground_truth(self) -> list[GroundTruthItem]:
        data = json.loads(_GROUND_TRUTH_PATH.read_text(encoding="utf-8"))
        return [GroundTruthItem(**item) for item in data]

    async def run_evaluation(
        self, user_id: str, document_id: str
    ) -> EvaluationRunResponse:
        ground_truth = self._load_ground_truth()
        result_rows: list[EvaluationResultRow] = []

        for item in ground_truth:
            query_response = await self._query_service.answer(
                user_id, document_id, item.question
            )
            system_answer = query_response.answer

            judge_prompt = _JUDGE_USER_TEMPLATE.format(
                expected=item.expected_answer,
                actual=system_answer,
            )
            raw_verdict = await self._judge_llm.generate(
                _JUDGE_SYSTEM_PROMPT, judge_prompt
            )
            verdict, reason = _parse_verdict(raw_verdict)

            result_rows.append(
                EvaluationResultRow(
                    id=item.id,
                    question=item.question,
                    expected_answer=item.expected_answer,
                    system_answer=system_answer,
                    verdict=verdict,
                    reason=reason,
                )
            )

        match_count = sum(1 for r in result_rows if r.verdict == "Match")
        partial_count = sum(1 for r in result_rows if r.verdict == "Partial Match")
        no_match_count = sum(1 for r in result_rows if r.verdict == "No Match")
        total = len(result_rows)
        accuracy_pct = round(match_count / total * 100, 1) if total else 0.0

        results_json = [r.model_dump() for r in result_rows]
        run_row = await self._evaluation_repo.insert_run(document_id, results_json)

        return EvaluationRunResponse(
            id=run_row["id"],
            run_at=run_row["run_at"],
            results=result_rows,
            match_count=match_count,
            partial_count=partial_count,
            no_match_count=no_match_count,
            accuracy_pct=accuracy_pct,
        )
