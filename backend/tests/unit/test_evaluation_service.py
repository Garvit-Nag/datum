import pytest

from app.services.evaluation_service import _parse_verdict


def test_match_verdict_parsed():
    verdict, reason = _parse_verdict("Match\nThe system correctly identified the clause.")
    assert verdict == "Match"
    assert reason == "The system correctly identified the clause."


def test_partial_match_verdict_parsed():
    verdict, reason = _parse_verdict("Partial Match\nRate was correct but compounding clause was missed.")
    assert verdict == "Partial Match"
    assert "compounding" in reason


def test_no_match_verdict_parsed():
    verdict, reason = _parse_verdict("No Match\nSystem returned an entirely unrelated clause.")
    assert verdict == "No Match"


def test_case_insensitive_match_in_first_line():
    verdict, reason = _parse_verdict("MATCH\nCorrect.")
    assert verdict == "Match"


def test_partial_match_before_match_wins():
    # "Partial Match" contains "Match" — ensure Partial Match wins
    verdict, _ = _parse_verdict("Partial Match\nSome details missing.")
    assert verdict == "Partial Match"


def test_empty_string_defaults_to_no_match():
    verdict, reason = _parse_verdict("")
    assert verdict == "No Match"


def test_unrecognised_format_defaults_to_no_match():
    verdict, reason = _parse_verdict("Unclear response from model")
    assert verdict == "No Match"
    assert len(reason) > 0


def test_single_line_response_uses_it_as_both():
    verdict, reason = _parse_verdict("Match")
    assert verdict == "Match"
