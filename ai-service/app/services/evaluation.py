from __future__ import annotations

import json
import math
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


LABEL_RELEVANCE: dict[str, int] = {
    "high": 3,
    "medium": 2,
    "low": 0,
}
DEFAULT_RELEVANT_LABELS = frozenset({"high", "medium"})


@dataclass(frozen=True)
class LabeledMatch:
    cv_id: str
    job_id: str
    label: str
    expected_min_score: float
    expected_max_score: float
    reason: str


@dataclass(frozen=True)
class RankedMatch:
    cv_id: str
    job_id: str
    score: float


@dataclass(frozen=True)
class RankingMetrics:
    precision_at_k: float
    recall_at_k: float
    ndcg_at_k: float
    relevant_count: int
    retrieved_count: int
    labeled_count: int


@dataclass(frozen=True)
class EvaluationReport:
    k: int
    metrics_by_cv: dict[str, RankingMetrics]
    macro_precision_at_k: float
    macro_recall_at_k: float
    macro_ndcg_at_k: float


@dataclass(frozen=True)
class ScoreRangeViolation:
    cv_id: str
    job_id: str
    score: float
    expected_min_score: float
    expected_max_score: float
    label: str
    reason: str


def load_labeled_matches(path: str | Path) -> list[LabeledMatch]:
    records = json.loads(Path(path).read_text(encoding="utf-8"))
    labels: list[LabeledMatch] = []
    for record in records:
        label = str(record["label"]).lower().strip()
        if label not in LABEL_RELEVANCE:
            raise ValueError(f"Unsupported relevance label: {record['label']!r}")

        expected_min_score = float(record["expected_min_score"])
        expected_max_score = float(record["expected_max_score"])
        if not 0 <= expected_min_score <= expected_max_score <= 100:
            raise ValueError(
                "Expected score range must satisfy "
                f"0 <= min <= max <= 100 for {record['cv_id']}:{record['job_id']}"
            )

        labels.append(
            LabeledMatch(
                cv_id=str(record["cv_id"]),
                job_id=str(record["job_id"]),
                label=label,
                expected_min_score=expected_min_score,
                expected_max_score=expected_max_score,
                reason=str(record.get("reason", "")),
            )
        )
    return labels


def load_ranked_matches(path: str | Path) -> list[RankedMatch]:
    records = json.loads(Path(path).read_text(encoding="utf-8"))
    ranked: list[RankedMatch] = []
    for record in records:
        score = float(record["score"])
        if not 0 <= score <= 100:
            raise ValueError(f"Prediction score must be in 0..100: {score}")
        ranked.append(
            RankedMatch(
                cv_id=str(record["cv_id"]),
                job_id=str(record["job_id"]),
                score=score,
            )
        )
    return ranked


def evaluate_rankings(
    labels: Iterable[LabeledMatch],
    ranked_matches: Iterable[RankedMatch],
    *,
    k: int = 5,
    relevant_labels: frozenset[str] = DEFAULT_RELEVANT_LABELS,
) -> EvaluationReport:
    if k <= 0:
        raise ValueError("k must be greater than 0")

    labels_by_cv = group_labels_by_cv(labels)
    ranked_by_cv = group_ranked_by_cv(ranked_matches)
    metrics_by_cv: dict[str, RankingMetrics] = {}

    for cv_id, cv_labels in sorted(labels_by_cv.items()):
        unique_ranked = unique_predictions_by_score(ranked_by_cv.get(cv_id, []))
        top_k = unique_ranked[:k]
        label_by_job = {label.job_id: label for label in cv_labels}
        relevant_jobs = {
            label.job_id for label in cv_labels if label.label in relevant_labels
        }

        hit_count = sum(1 for prediction in top_k if prediction.job_id in relevant_jobs)
        precision_at_k = hit_count / k
        recall_at_k = hit_count / len(relevant_jobs) if relevant_jobs else 0.0
        ndcg_at_k = ndcg_for_predictions(top_k, label_by_job, k)

        metrics_by_cv[cv_id] = RankingMetrics(
            precision_at_k=precision_at_k,
            recall_at_k=recall_at_k,
            ndcg_at_k=ndcg_at_k,
            relevant_count=len(relevant_jobs),
            retrieved_count=len(top_k),
            labeled_count=len(cv_labels),
        )

    return EvaluationReport(
        k=k,
        metrics_by_cv=metrics_by_cv,
        macro_precision_at_k=average(metric.precision_at_k for metric in metrics_by_cv.values()),
        macro_recall_at_k=average(metric.recall_at_k for metric in metrics_by_cv.values()),
        macro_ndcg_at_k=average(metric.ndcg_at_k for metric in metrics_by_cv.values()),
    )


def score_range_violations(
    labels: Iterable[LabeledMatch],
    ranked_matches: Iterable[RankedMatch],
) -> list[ScoreRangeViolation]:
    label_by_pair = {(label.cv_id, label.job_id): label for label in labels}
    violations: list[ScoreRangeViolation] = []

    for prediction in ranked_matches:
        label = label_by_pair.get((prediction.cv_id, prediction.job_id))
        if label is None:
            continue
        if label.expected_min_score <= prediction.score <= label.expected_max_score:
            continue
        violations.append(
            ScoreRangeViolation(
                cv_id=prediction.cv_id,
                job_id=prediction.job_id,
                score=prediction.score,
                expected_min_score=label.expected_min_score,
                expected_max_score=label.expected_max_score,
                label=label.label,
                reason=label.reason,
            )
        )

    return violations


def group_labels_by_cv(labels: Iterable[LabeledMatch]) -> dict[str, list[LabeledMatch]]:
    grouped: dict[str, list[LabeledMatch]] = defaultdict(list)
    for label in labels:
        grouped[label.cv_id].append(label)
    return dict(grouped)


def group_ranked_by_cv(ranked_matches: Iterable[RankedMatch]) -> dict[str, list[RankedMatch]]:
    grouped: dict[str, list[RankedMatch]] = defaultdict(list)
    for prediction in ranked_matches:
        grouped[prediction.cv_id].append(prediction)
    return dict(grouped)


def unique_predictions_by_score(predictions: Iterable[RankedMatch]) -> list[RankedMatch]:
    unique: list[RankedMatch] = []
    seen_job_ids: set[str] = set()
    for prediction in sorted(predictions, key=lambda item: item.score, reverse=True):
        if prediction.job_id in seen_job_ids:
            continue
        seen_job_ids.add(prediction.job_id)
        unique.append(prediction)
    return unique


def ndcg_for_predictions(
    predictions: list[RankedMatch],
    label_by_job: dict[str, LabeledMatch],
    k: int,
) -> float:
    predicted_relevances = [
        LABEL_RELEVANCE.get(label_by_job[prediction.job_id].label, 0)
        if prediction.job_id in label_by_job
        else 0
        for prediction in predictions[:k]
    ]
    ideal_relevances = sorted(
        (LABEL_RELEVANCE.get(label.label, 0) for label in label_by_job.values()),
        reverse=True,
    )[:k]

    ideal_dcg = dcg(ideal_relevances)
    if ideal_dcg == 0:
        return 0.0
    return dcg(predicted_relevances) / ideal_dcg


def dcg(relevances: Iterable[int]) -> float:
    return sum(
        ((2**relevance) - 1) / math.log2(rank + 2)
        for rank, relevance in enumerate(relevances)
    )


def average(values: Iterable[float]) -> float:
    values_list = list(values)
    if not values_list:
        return 0.0
    return sum(values_list) / len(values_list)
