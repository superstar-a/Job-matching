from __future__ import annotations

import math
import time
from dataclasses import dataclass, field
from typing import Any, Callable, Iterable

from app.services.evaluation import (
    EvaluationReport,
    LabeledMatch,
    RankedMatch,
    evaluate_rankings,
    score_range_violations,
    unique_predictions_by_score,
)


EmbeddingVector = list[float]


@dataclass(frozen=True)
class EmbeddingBenchmarkDataset:
    labels: list[LabeledMatch]
    cv_texts: dict[str, str]
    job_texts: dict[str, str]


@dataclass(frozen=True)
class EmbeddingPredictionDebugRow:
    cv_id: str
    job_id: str
    rank: int
    score: float
    label: str | None
    expected_min_score: float | None
    expected_max_score: float | None
    in_expected_range: bool | None
    reason: str


@dataclass(frozen=True)
class EmbeddingBenchmarkModelResult:
    model_name: str
    status: str
    ranking: EvaluationReport | None
    score_range_violation_count: int
    latency_ms: float | None
    model_load_ms: float | None
    prediction_count: int
    ranking_debug: list[EmbeddingPredictionDebugRow] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)
    error: str | None = None


@dataclass(frozen=True)
class EmbeddingBenchmarkReport:
    benchmark_name: str
    dataset_size: int
    k: int
    results: list[EmbeddingBenchmarkModelResult]
    metadata: dict[str, Any] = field(default_factory=dict)


def score_pairs_with_embeddings(
    dataset: EmbeddingBenchmarkDataset,
    embeddings: dict[str, EmbeddingVector],
) -> list[RankedMatch]:
    predictions: list[RankedMatch] = []
    for label in dataset.labels:
        cv_embedding = embeddings[f"cv:{label.cv_id}"]
        job_embedding = embeddings[f"job:{label.job_id}"]
        similarity = cosine_similarity(cv_embedding, job_embedding)
        predictions.append(
            RankedMatch(
                cv_id=label.cv_id,
                job_id=label.job_id,
                score=similarity_to_score(similarity),
            )
        )
    return sorted(predictions, key=lambda item: item.score, reverse=True)


def evaluate_embedding_predictions(
    *,
    model_name: str,
    dataset: EmbeddingBenchmarkDataset,
    predictions: list[RankedMatch],
    k: int,
    latency_ms: float | None = None,
    model_load_ms: float | None = None,
    metadata: dict[str, Any] | None = None,
) -> EmbeddingBenchmarkModelResult:
    ranking = evaluate_rankings(dataset.labels, predictions, k=k)
    violations = score_range_violations(dataset.labels, predictions)
    ranking_debug = build_prediction_debug_rows(dataset.labels, predictions)
    return EmbeddingBenchmarkModelResult(
        model_name=model_name,
        status="completed",
        ranking=ranking,
        score_range_violation_count=len(violations),
        latency_ms=latency_ms,
        model_load_ms=model_load_ms,
        prediction_count=len(predictions),
        ranking_debug=ranking_debug,
        metadata=metadata or {},
    )


def skipped_embedding_result(
    *,
    model_name: str,
    reason: str,
    metadata: dict[str, Any] | None = None,
) -> EmbeddingBenchmarkModelResult:
    return EmbeddingBenchmarkModelResult(
        model_name=model_name,
        status="skipped",
        ranking=None,
        score_range_violation_count=0,
        latency_ms=None,
        model_load_ms=None,
        prediction_count=0,
        metadata=metadata or {},
        error=reason,
    )


def build_prediction_debug_rows(
    labels: Iterable[LabeledMatch],
    predictions: Iterable[RankedMatch],
) -> list[EmbeddingPredictionDebugRow]:
    label_by_pair = {(label.cv_id, label.job_id): label for label in labels}
    predictions_by_cv: dict[str, list[RankedMatch]] = {}
    for prediction in predictions:
        predictions_by_cv.setdefault(prediction.cv_id, []).append(prediction)

    rows: list[EmbeddingPredictionDebugRow] = []
    for cv_id, cv_predictions in sorted(predictions_by_cv.items()):
        ranked_predictions = unique_predictions_by_score(cv_predictions)
        for rank, prediction in enumerate(ranked_predictions, start=1):
            label = label_by_pair.get((prediction.cv_id, prediction.job_id))
            if label is None:
                rows.append(
                    EmbeddingPredictionDebugRow(
                        cv_id=prediction.cv_id,
                        job_id=prediction.job_id,
                        rank=rank,
                        score=prediction.score,
                        label=None,
                        expected_min_score=None,
                        expected_max_score=None,
                        in_expected_range=None,
                        reason="",
                    )
                )
                continue

            rows.append(
                EmbeddingPredictionDebugRow(
                    cv_id=prediction.cv_id,
                    job_id=prediction.job_id,
                    rank=rank,
                    score=prediction.score,
                    label=label.label,
                    expected_min_score=label.expected_min_score,
                    expected_max_score=label.expected_max_score,
                    in_expected_range=(
                        label.expected_min_score <= prediction.score <= label.expected_max_score
                    ),
                    reason=label.reason,
                )
            )
    return rows


def tfidf_embedding_predictions(dataset: EmbeddingBenchmarkDataset) -> list[RankedMatch]:
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
    except ImportError as exc:  # pragma: no cover - sklearn is pinned in requirements
        raise RuntimeError("scikit-learn is required for TF-IDF embedding baseline") from exc

    cv_ids = sorted(dataset.cv_texts)
    job_ids = sorted(dataset.job_texts)
    text_ids = [f"cv:{cv_id}" for cv_id in cv_ids] + [f"job:{job_id}" for job_id in job_ids]
    texts = [dataset.cv_texts[cv_id] for cv_id in cv_ids] + [
        dataset.job_texts[job_id] for job_id in job_ids
    ]

    matrix = TfidfVectorizer(ngram_range=(1, 2), lowercase=True).fit_transform(texts)
    embeddings = {
        text_id: matrix[index].toarray()[0].astype(float).tolist()
        for index, text_id in enumerate(text_ids)
    }
    return score_pairs_with_embeddings(dataset, embeddings)


def run_tfidf_embedding_benchmark(
    dataset: EmbeddingBenchmarkDataset,
    *,
    k: int,
) -> EmbeddingBenchmarkModelResult:
    start = time.perf_counter()
    predictions = tfidf_embedding_predictions(dataset)
    latency_ms = (time.perf_counter() - start) * 1000
    return evaluate_embedding_predictions(
        model_name="tfidf-baseline",
        dataset=dataset,
        predictions=predictions,
        k=k,
        latency_ms=round(latency_ms, 4),
        model_load_ms=0.0,
        metadata={"provider": "sklearn", "model_type": "tfidf"},
    )


def run_sentence_transformer_embedding_benchmark(
    dataset: EmbeddingBenchmarkDataset,
    *,
    model_name: str,
    k: int,
    device: str | None = None,
    revision: str | None = None,
    batch_size: int = 16,
    encode_text: Callable[[list[str]], list[EmbeddingVector]] | None = None,
) -> EmbeddingBenchmarkModelResult:
    if encode_text is None:
        try:
            from sentence_transformers import SentenceTransformer
        except ImportError:
            return skipped_embedding_result(
                model_name=model_name,
                reason=(
                    "sentence-transformers is not installed. Install optional embedding "
                    "dependencies before benchmarking pretrained models."
                ),
                metadata={"provider": "sentence-transformers", "revision": revision},
            )

        try:
            load_start = time.perf_counter()
            model = SentenceTransformer(model_name, device=device, revision=revision)
            model_load_ms = (time.perf_counter() - load_start) * 1000
        except Exception as exc:  # noqa: BLE001 - model download/cache can fail broadly
            return skipped_embedding_result(
                model_name=model_name,
                reason=f"Could not load model: {exc}",
                metadata={"provider": "sentence-transformers", "revision": revision},
            )

        def encode_text(texts: list[str]) -> list[EmbeddingVector]:  # type: ignore[no-redef]
            vectors = model.encode(
                texts,
                batch_size=batch_size,
                normalize_embeddings=True,
                show_progress_bar=False,
            )
            return [vector.astype(float).tolist() for vector in vectors]

    else:
        model_load_ms = 0.0

    cv_ids = sorted(dataset.cv_texts)
    job_ids = sorted(dataset.job_texts)
    text_ids = [f"cv:{cv_id}" for cv_id in cv_ids] + [f"job:{job_id}" for job_id in job_ids]
    texts = [dataset.cv_texts[cv_id] for cv_id in cv_ids] + [
        dataset.job_texts[job_id] for job_id in job_ids
    ]

    encode_start = time.perf_counter()
    vectors = encode_text(texts)
    latency_ms = (time.perf_counter() - encode_start) * 1000
    embeddings = dict(zip(text_ids, vectors, strict=True))
    predictions = score_pairs_with_embeddings(dataset, embeddings)

    return evaluate_embedding_predictions(
        model_name=model_name,
        dataset=dataset,
        predictions=predictions,
        k=k,
        latency_ms=round(latency_ms, 4),
        model_load_ms=round(model_load_ms, 4),
        metadata={
            "provider": "sentence-transformers",
            "revision": revision,
            "batch_size": batch_size,
            "device": device or "auto",
        },
    )


def cosine_similarity(left: Iterable[float], right: Iterable[float]) -> float:
    left_values = [float(value) for value in left]
    right_values = [float(value) for value in right]
    if len(left_values) != len(right_values):
        raise ValueError("Embedding vectors must have the same dimension")

    dot = sum(a * b for a, b in zip(left_values, right_values, strict=True))
    left_norm = math.sqrt(sum(value * value for value in left_values))
    right_norm = math.sqrt(sum(value * value for value in right_values))
    if not left_norm or not right_norm:
        return 0.0
    return dot / (left_norm * right_norm)


def similarity_to_score(similarity: float) -> float:
    score = ((similarity + 1.0) / 2.0) * 100.0
    return round(max(0.0, min(100.0, score)), 4)
