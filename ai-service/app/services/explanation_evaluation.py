from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable


VALID_EVIDENCE_SOURCES = {"cv", "jd"}
SAFE_ADD_IF_TRUE_MARKERS = ("only if", "if true", "if you have", "neu ban co")
BLOCKING_GUARDRAIL_CODES = {
    "requires_verified_experience",
    "do_not_inflate_experience",
}


@dataclass(frozen=True)
class ExplanationEvaluationRecord:
    sample_id: str
    analysis: dict[str, Any]
    suggestions: dict[str, Any]


@dataclass(frozen=True)
class ExplanationQualityViolation:
    sample_id: str
    check_id: str
    severity: str
    message: str
    item_ref: str | None = None


@dataclass(frozen=True)
class RuleMetric:
    passed: int
    total: int
    pass_rate: float


@dataclass(frozen=True)
class ExplanationQualityReport:
    record_count: int
    passed_check_count: int
    failed_check_count: int
    overall_pass_rate: float
    rule_metrics: dict[str, RuleMetric]
    violations: list[ExplanationQualityViolation]


def load_explanation_records(path: str | Path) -> list[ExplanationEvaluationRecord]:
    records = json.loads(Path(path).read_text(encoding="utf-8"))
    return [
        ExplanationEvaluationRecord(
            sample_id=str(record["sample_id"]),
            analysis=dict(record["analysis"]),
            suggestions=dict(record["suggestions"]),
        )
        for record in records
    ]


def evaluate_explanations(
    records: Iterable[ExplanationEvaluationRecord],
) -> ExplanationQualityReport:
    record_list = list(records)
    checks: dict[str, list[bool]] = {}
    violations: list[ExplanationQualityViolation] = []

    for record in record_list:
        add_check_result(
            checks,
            violations,
            "analysis_mentions_fit_and_gap",
            record,
            analysis_mentions_fit_and_gap(record.analysis),
            "Analysis should include both matching evidence and gaps/partials.",
        )
        add_check_result(
            checks,
            violations,
            "fit_gaps_have_evidence",
            record,
            fit_gaps_have_evidence(record.analysis),
            "Every non-unknown fit gap should have CV or JD evidence with text.",
        )
        add_check_result(
            checks,
            violations,
            "skill_gaps_have_guardrails",
            record,
            skill_gaps_have_guardrails(record.analysis),
            "Missing skill gaps should warn against claiming unverified experience.",
        )
        add_check_result(
            checks,
            violations,
            "suggestions_have_evidence",
            record,
            suggestions_have_evidence(record.suggestions),
            "Every actionable suggestion should cite CV or JD evidence.",
        )
        add_check_result(
            checks,
            violations,
            "add_if_true_suggestions_are_guarded",
            record,
            add_if_true_suggestions_are_guarded(record.suggestions),
            "add_if_true suggestions should include safe wording and a guardrail.",
        )
        add_check_result(
            checks,
            violations,
            "blocking_guardrails_have_blocked_claims",
            record,
            blocking_guardrails_have_blocked_claims(record.suggestions),
            "Blocker guardrails should produce at least one blocked claim.",
        )

    rule_metrics = {
        check_id: RuleMetric(
            passed=sum(1 for result in results if result),
            total=len(results),
            pass_rate=safe_divide(sum(1 for result in results if result), len(results)),
        )
        for check_id, results in sorted(checks.items())
    }
    passed_check_count = sum(metric.passed for metric in rule_metrics.values())
    total_check_count = sum(metric.total for metric in rule_metrics.values())
    failed_check_count = total_check_count - passed_check_count

    return ExplanationQualityReport(
        record_count=len(record_list),
        passed_check_count=passed_check_count,
        failed_check_count=failed_check_count,
        overall_pass_rate=safe_divide(passed_check_count, total_check_count),
        rule_metrics=rule_metrics,
        violations=violations,
    )


def add_check_result(
    checks: dict[str, list[bool]],
    violations: list[ExplanationQualityViolation],
    check_id: str,
    record: ExplanationEvaluationRecord,
    passed: bool,
    message: str,
) -> None:
    checks.setdefault(check_id, []).append(passed)
    if not passed:
        violations.append(
            ExplanationQualityViolation(
                sample_id=record.sample_id,
                check_id=check_id,
                severity="high",
                message=message,
            )
        )


def analysis_mentions_fit_and_gap(analysis: dict[str, Any]) -> bool:
    fit_gaps = list_items(analysis.get("fit_gaps"))
    has_match = any(item.get("status") == "match" for item in fit_gaps)
    has_gap = any(item.get("status") in {"gap", "partial"} for item in fit_gaps)
    return has_match and has_gap


def fit_gaps_have_evidence(analysis: dict[str, Any]) -> bool:
    fit_gaps = list_items(analysis.get("fit_gaps"))
    checked = False
    for gap in fit_gaps:
        if gap.get("status") == "unknown":
            continue
        checked = True
        if not evidence_list_is_valid(gap.get("evidence")):
            return False
    return checked


def skill_gaps_have_guardrails(analysis: dict[str, Any]) -> bool:
    skill_gaps = [
        gap
        for gap in list_items(analysis.get("fit_gaps"))
        if gap.get("category") == "skill" and gap.get("status") == "gap"
    ]
    if not skill_gaps:
        return True
    return all(bool(str(gap.get("guardrail") or "").strip()) for gap in skill_gaps)


def suggestions_have_evidence(suggestions_response: dict[str, Any]) -> bool:
    suggestions = list_items(suggestions_response.get("suggestions"))
    if not suggestions:
        return False
    return all(evidence_list_is_valid(suggestion.get("evidence")) for suggestion in suggestions)


def add_if_true_suggestions_are_guarded(suggestions_response: dict[str, Any]) -> bool:
    add_if_true_items = [
        item
        for item in list_items(suggestions_response.get("suggestions"))
        if item.get("action") == "add_if_true"
    ]
    if not add_if_true_items:
        return True

    for item in add_if_true_items:
        guardrail = item.get("guardrail")
        wording = normalized_text(item.get("suggested_wording"))
        has_safe_marker = any(marker in wording for marker in SAFE_ADD_IF_TRUE_MARKERS)
        if not isinstance(guardrail, dict) or not guardrail.get("code") or not has_safe_marker:
            return False
    return True


def blocking_guardrails_have_blocked_claims(suggestions_response: dict[str, Any]) -> bool:
    suggestions = list_items(suggestions_response.get("suggestions"))
    has_blocking_guardrail = any(
        isinstance(item.get("guardrail"), dict)
        and (
            item["guardrail"].get("severity") == "blocker"
            or item["guardrail"].get("code") in BLOCKING_GUARDRAIL_CODES
        )
        for item in suggestions
    )
    if not has_blocking_guardrail:
        return True
    return bool(list_items(suggestions_response.get("blocked_claims")))


def evidence_list_is_valid(value: Any) -> bool:
    evidence_items = list_items(value)
    if not evidence_items:
        return False
    for item in evidence_items:
        source = item.get("source")
        text = str(item.get("text") or "").strip()
        if source not in VALID_EVIDENCE_SOURCES or not text:
            return False
    return True


def list_items(value: Any) -> list[Any]:
    if isinstance(value, list):
        return value
    return []


def normalized_text(value: Any) -> str:
    return str(value or "").lower().strip()


def safe_divide(numerator: int, denominator: int) -> float:
    if denominator == 0:
        return 0.0
    return numerator / denominator
