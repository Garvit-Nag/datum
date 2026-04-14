import asyncio
import json
import re
from collections.abc import AsyncIterator
from typing import Literal

from app.adapters.base.llm import LlmAdapterBase
from app.core.exceptions import AppException
from app.models.evaluation import (
    EvaluationResultRow,
    EvaluationRunResponse,
    GroundTruthItem,
)
from app.repositories.evaluation_repo import EvaluationRepository
from app.services.query_service import QueryService

# Verbatim judge prompt from the assignment brief — do not alter the wording.
_JUDGE_PROMPT_TEMPLATE = (
    "You are evaluating a RAG system's answer against a ground truth answer "
    "extracted from a contract document. Compare the two answers and classify "
    "the result as exactly one of: Match, Partial Match, or No Match. "
    "Then provide a single sentence explaining your classification. "
    "Do not add any other commentary. "
    "Ground Truth Answer: {expected}  |  System Answer: {actual}"
)

# Stagger between emitting individual verdict events so the UI table fills in
# progressively even though all verdicts arrive from a single batch judge call.
_VERDICT_STAGGER_SECONDS = 0.15

VerdictType = Literal["Match", "Partial Match", "No Match"]


def _parse_ground_truth_text(text: str) -> list[GroundTruthItem]:
    """Parse Q&A pairs from plain text in the format:

        C: Category Name          ← optional; defaults to empty string
        Q: question text
        A: answer text

    Blocks are separated by blank lines.
    """
    items: list[GroundTruthItem] = []
    blocks = re.split(r"\n\s*\n", text.strip())
    for idx, block in enumerate(blocks, start=1):
        lines = block.strip().splitlines()
        c_line = next((ln for ln in lines if ln.strip().upper().startswith("C:")), None)
        q_line = next((ln for ln in lines if ln.strip().upper().startswith("Q:")), None)
        a_line = next((ln for ln in lines if ln.strip().upper().startswith("A:")), None)
        if q_line and a_line:
            items.append(
                GroundTruthItem(
                    id=idx,
                    category=c_line.split(":", 1)[1].strip() if c_line else "",
                    question=q_line.split(":", 1)[1].strip(),
                    expected_answer=a_line.split(":", 1)[1].strip(),
                )
            )
    return items


def _build_batch_judge_prompt(items: list[GroundTruthItem], answers: list[str]) -> str:
    """Build a single prompt that asks Gemini to judge all Q&A pairs at once.

    Each pair uses the exact judge criteria from the brief. The response format
    is one line per pair: N|Verdict|One-sentence reason
    """
    lines = [
        "You are evaluating a RAG system's answers against ground truth answers "
        "extracted from a contract document.",
        "",
        "Apply the following evaluation criteria to every numbered pair below:",
        "You are evaluating a RAG system's answer against a ground truth answer "
        "extracted from a contract document. Compare the two answers and classify "
        "the result as exactly one of: Match, Partial Match, or No Match. "
        "Then provide a single sentence explaining your classification. "
        "Do not add any other commentary.",
        "",
        "Respond with exactly one line per pair using this format:",
        "N|Verdict|One sentence reason",
        "Where Verdict is exactly one of: Match, Partial Match, No Match",
        "",
        "Do not include any other text before, between, or after the verdict lines.",
        "",
        "Pairs:",
    ]
    for item, answer in zip(items, answers):
        lines.append(
            f"{item.id}. Ground Truth Answer: {item.expected_answer}  |  "
            f"System Answer: {answer}"
        )
    return "\n".join(lines)


def _parse_batch_verdicts(
    raw: str,
    items: list[GroundTruthItem],
) -> dict[int, tuple[VerdictType, str]]:
    """Parse the batch judge response into a mapping of item id → (verdict, reason)."""
    results: dict[int, tuple[VerdictType, str]] = {}
    for line in raw.strip().splitlines():
        line = line.strip()
        if not line:
            continue
        parts = line.split("|", 2)
        if len(parts) < 3:
            continue
        try:
            num = int(parts[0].strip().rstrip("."))
        except ValueError:
            continue
        verdict_str = parts[1].strip().upper()
        reason = parts[2].strip()
        if "PARTIAL MATCH" in verdict_str:
            verdict: VerdictType = "Partial Match"
        elif "NO MATCH" in verdict_str:
            verdict = "No Match"
        elif "MATCH" in verdict_str:
            verdict = "Match"
        else:
            verdict = "No Match"
        results[num] = (verdict, reason)
    return results


def _encode_event(event: dict) -> str:
    """Serialize a progress event as a single NDJSON line."""
    return json.dumps(event, default=str) + "\n"


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

    async def run_evaluation_stream(
        self, user_id: str, document_id: str, ground_truth_text: str,
    ) -> AsyncIterator[str]:
        """Two-phase NDJSON stream.

        Phase 1 — answer generation (one Groq call per question):
            {"type": "start", "total": N}
            {"type": "answer_ready", "completed": C, "remaining": R, "question": "..."}  × N

        Transition:
            {"type": "judging"}

        Phase 2 — batch Gemini judge call, then staggered verdict events:
            {"type": "verdict", "completed": C, "remaining": R, "row": {...}}  × N
            {"type": "done", "run": {...EvaluationRunResponse...}}
        """
        ground_truth = _parse_ground_truth_text(ground_truth_text)
        if not ground_truth:
            raise AppException(
                422,
                "INVALID_GROUND_TRUTH",
                "No valid Q&A pairs found. Use 'C: Category', 'Q: ...', 'A: ...' format.",
            )

        total = len(ground_truth)
        yield _encode_event({"type": "start", "total": total})

        eval_chat = await self._query_service._document_repo.create_chat(
            user_id, document_id, "Evaluation Run"
        )
        chat_id = eval_chat["id"]

        # ── Phase 1: generate all answers ─────────────────────────────────────
        answers: list[str] = []
        answer_errors: list[str] = []

        for idx, item in enumerate(ground_truth):
            system_answer = ""
            error_msg = ""
            try:
                query_response = await self._query_service.answer(
                    user_id, document_id, item.question, chat_id
                )
                system_answer = query_response.answer
            except Exception as exc:
                error_msg = f"Answer generation failed: {exc}"

            answers.append(system_answer)
            answer_errors.append(error_msg)

            yield _encode_event({
                "type": "answer_ready",
                "completed": idx + 1,
                "remaining": total - (idx + 1),
                "question": item.question,
            })

        # ── Transition ────────────────────────────────────────────────────────
        yield _encode_event({"type": "judging"})

        # ── Phase 2: batch judge call ─────────────────────────────────────────
        verdicts: dict[int, tuple[VerdictType, str]] = {}
        try:
            batch_prompt = _build_batch_judge_prompt(ground_truth, answers)
            raw_verdicts = await self._judge_llm.generate("", batch_prompt)
            verdicts = _parse_batch_verdicts(raw_verdicts, ground_truth)
        except Exception as exc:
            # If the judge call itself fails, all items default to No Match
            for item in ground_truth:
                verdicts[item.id] = ("No Match", f"Judge call failed: {exc}")

        # ── Build result rows and stagger-emit verdict events ─────────────────
        result_rows: list[EvaluationResultRow] = []

        for idx, item in enumerate(ground_truth):
            verdict, reason = verdicts.get(
                item.id,
                ("No Match", "Judge did not return a verdict for this item."),
            )
            if answer_errors[idx]:
                verdict = "No Match"
                reason = answer_errors[idx]

            row = EvaluationResultRow(
                id=item.id,
                category=item.category,
                question=item.question,
                expected_answer=item.expected_answer,
                system_answer=answers[idx],
                verdict=verdict,
                reason=reason,
            )
            result_rows.append(row)

            completed = idx + 1
            yield _encode_event({
                "type": "verdict",
                "completed": completed,
                "remaining": total - completed,
                "row": row.model_dump(),
            })
            await asyncio.sleep(_VERDICT_STAGGER_SECONDS)

        # ── Persist and emit done ─────────────────────────────────────────────
        match_count = sum(1 for r in result_rows if r.verdict == "Match")
        partial_count = sum(1 for r in result_rows if r.verdict == "Partial Match")
        no_match_count = sum(1 for r in result_rows if r.verdict == "No Match")
        accuracy_pct = round(match_count / total * 100, 1) if total else 0.0

        results_json = [r.model_dump() for r in result_rows]
        run_row = await self._evaluation_repo.insert_run(document_id, results_json)

        run_response = EvaluationRunResponse(
            id=run_row["id"],
            run_at=run_row["run_at"],
            results=result_rows,
            match_count=match_count,
            partial_count=partial_count,
            no_match_count=no_match_count,
            accuracy_pct=accuracy_pct,
        )

        yield _encode_event({
            "type": "done",
            "run": run_response.model_dump(mode="json"),
        })
