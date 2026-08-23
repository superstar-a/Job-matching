from __future__ import annotations

import json
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


RELEVANT_LABELS = frozenset({"high", "medium"})


@dataclass(frozen=True)
class EmbeddingErrorIssue:
    issue_type: str
    model_name: str
    cv_id: str
    job_id: str
    rank: int
    score: float
    label: str | None
    expected_min_score: float | None
    expected_max_score: float | None
    reason: str
    message: str


@dataclass(frozen=True)
class EmbeddingModelErrorSummary:
    model_name: str
    status: str
    checked_prediction_count: int
    low_label_in_top_k_count: int
    relevant_missed_top_k_count: int
    score_range_violation_count: int
    issue_count: int
    recommendation: str
    issues: list[EmbeddingErrorIssue] = field(default_factory=list)


@dataclass(frozen=True)
class EmbeddingErrorAnalysisReport:
    benchmark_name: str
    dataset_size: int
    k: int
    source_path: str | None
    model_summaries: list[EmbeddingModelErrorSummary]
    problem_job_counts: dict[str, int]
    worst_models_by_issue_count: list[str]


def load_and_analyze_embedding_benchmark(path: str | Path) -> EmbeddingErrorAnalysisReport:
    benchmark_path = Path(path)
    payload = json.loads(benchmark_path.read_text(encoding="utf-8"))
    return analyze_embedding_benchmark_report(payload, source_path=str(benchmark_path))


def analyze_embedding_benchmark_report(
    payload: dict[str, Any],
    *,
    source_path: str | None = None,
    top_k: int | None = None,
) -> EmbeddingErrorAnalysisReport:
    k = int(top_k if top_k is not None else payload.get("k", 0))
    if k <= 0:
        raise ValueError("Embedding benchmark report must provide k > 0")

    model_summaries = [
        analyze_model_result(result, k=k)
        for result in payload.get("results", [])
    ]
    problem_job_counts = Counter(
        issue.job_id
        for summary in model_summaries
        for issue in summary.issues
    )
    worst_models = sorted(
        (summary for summary in model_summaries if summary.issue_count > 0),
        key=lambda summary: (-summary.issue_count, summary.model_name),
    )

    return EmbeddingErrorAnalysisReport(
        benchmark_name=str(payload.get("benchmark_name", "")),
        dataset_size=int(payload.get("dataset_size", 0)),
        k=k,
        source_path=source_path,
        model_summaries=model_summaries,
        problem_job_counts=dict(problem_job_counts),
        worst_models_by_issue_count=[
            summary.model_name for summary in worst_models
        ],
    )


def analyze_model_result(
    model_result: dict[str, Any],
    *,
    k: int,
) -> EmbeddingModelErrorSummary:
    model_name = str(model_result.get("model_name", "unknown-model"))
    status = str(model_result.get("status", "unknown"))
    if status != "completed":
        error = str(model_result.get("error") or "model did not complete")
        return EmbeddingModelErrorSummary(
            model_name=model_name,
            status=status,
            checked_prediction_count=0,
            low_label_in_top_k_count=0,
            relevant_missed_top_k_count=0,
            score_range_violation_count=0,
            issue_count=0,
            recommendation=f"Cannot analyze skipped model: {error}",
        )

    issues: list[EmbeddingErrorIssue] = []
    debug_rows = list(model_result.get("ranking_debug") or [])
    for row in debug_rows:
        issues.extend(build_issues_for_row(model_name=model_name, row=row, k=k))

    low_label_count = count_issue_type(issues, "low_label_in_top_k")
    missed_relevant_count = count_issue_type(issues, "relevant_missed_top_k")
    score_range_count = count_issue_type(issues, "score_range_violation")

    return EmbeddingModelErrorSummary(
        model_name=model_name,
        status=status,
        checked_prediction_count=len(debug_rows),
        low_label_in_top_k_count=low_label_count,
        relevant_missed_top_k_count=missed_relevant_count,
        score_range_violation_count=score_range_count,
        issue_count=len(issues),
        recommendation=build_recommendation(
            low_label_count=low_label_count,
            missed_relevant_count=missed_relevant_count,
            score_range_count=score_range_count,
        ),
        issues=issues,
    )


def build_issues_for_row(
    *,
    model_name: str,
    row: dict[str, Any],
    k: int,
) -> list[EmbeddingErrorIssue]:
    rank = int(row["rank"])
    label = normalize_label(row.get("label"))
    issues: list[EmbeddingErrorIssue] = []

    if label == "low" and rank <= k:
        issues.append(
            build_issue(
                issue_type="low_label_in_top_k",
                model_name=model_name,
                row=row,
                message=f"Low relevance job is ranked inside top {k}.",
            )
        )

    if label in RELEVANT_LABELS and rank > k:
        issues.append(
            build_issue(
                issue_type="relevant_missed_top_k",
                model_name=model_name,
                row=row,
                message=f"Relevant job is ranked below top {k}.",
            )
        )

    if row.get("in_expected_range") is False:
        issues.append(
            build_issue(
                issue_type="score_range_violation",
                model_name=model_name,
                row=row,
                message="Predicted score is outside the labeled expected range.",
            )
        )

    return issues


def build_issue(
    *,
    issue_type: str,
    model_name: str,
    row: dict[str, Any],
    message: str,
) -> EmbeddingErrorIssue:
    return EmbeddingErrorIssue(
        issue_type=issue_type,
        model_name=model_name,
        cv_id=str(row["cv_id"]),
        job_id=str(row["job_id"]),
        rank=int(row["rank"]),
        score=float(row["score"]),
        label=normalize_label(row.get("label")),
        expected_min_score=optional_float(row.get("expected_min_score")),
        expected_max_score=optional_float(row.get("expected_max_score")),
        reason=str(row.get("reason", "")),
        message=message,
    )


def normalize_label(label: Any) -> str | None:
    if label is None:
        return None
    return str(label).strip().lower()


def optional_float(value: Any) -> float | None:
    if value is None:
        return None
    return float(value)


def count_issue_type(issues: list[EmbeddingErrorIssue], issue_type: str) -> int:
    return sum(1 for issue in issues if issue.issue_type == issue_type)


def build_recommendation(
    *,
    low_label_count: int,
    missed_relevant_count: int,
    score_range_count: int,
) -> str:
    if low_label_count:
        return "Do not promote: model over-ranks low relevance jobs in top K."
    if missed_relevant_count:
        return "Do not promote: model misses relevant jobs in top K."
    if score_range_count:
        return "Needs score calibration before hybrid scoring."
    return "No ranking-debug issues detected on this benchmark."
