import pytest

from app.services.embedding_benchmark import (
    EmbeddingBenchmarkDataset,
    EmbeddingBenchmarkModelResult,
    evaluate_embedding_predictions,
    score_pairs_with_embeddings,
    tfidf_embedding_predictions,
)
from app.services.evaluation import LabeledMatch, RankedMatch


def build_dataset() -> EmbeddingBenchmarkDataset:
    labels = [
        LabeledMatch("cv-1", "job-python", "high", 75, 100, "Strong Python fit."),
        LabeledMatch("cv-1", "job-data", "medium", 45, 90, "Some data overlap."),
        LabeledMatch("cv-1", "job-design", "low", 0, 35, "Design role is unrelated."),
    ]
    return EmbeddingBenchmarkDataset(
        labels=labels,
        cv_texts={"cv-1": "Python FastAPI SQL backend APIs"},
        job_texts={
            "job-python": "Python FastAPI backend developer",
            "job-data": "Data engineer Python SQL pipelines",
            "job-design": "Product designer Figma user research",
        },
    )


def test_score_pairs_with_embeddings_converts_cosine_similarity_to_ranked_scores():
    dataset = build_dataset()
    embeddings = {
        "cv:cv-1": [1.0, 0.0],
        "job:job-python": [1.0, 0.0],
        "job:job-data": [0.5, 0.5],
        "job:job-design": [-1.0, 0.0],
    }

    predictions = score_pairs_with_embeddings(dataset, embeddings)

    assert [item.job_id for item in predictions] == ["job-python", "job-data", "job-design"]
    assert predictions[0].score == 100.0
    assert predictions[1].score == pytest.approx(85.3553, abs=0.0001)
    assert predictions[2].score == 0.0


def test_evaluate_embedding_predictions_returns_ranking_and_score_range_quality():
    dataset = build_dataset()
    embeddings = {
        "cv:cv-1": [1.0, 0.0],
        "job:job-python": [1.0, 0.0],
        "job:job-data": [0.5, 0.5],
        "job:job-design": [-1.0, 0.0],
    }
    predictions = score_pairs_with_embeddings(dataset, embeddings)

    result = evaluate_embedding_predictions(
        model_name="unit-embedding",
        dataset=dataset,
        predictions=predictions,
        k=2,
        latency_ms=12.5,
        model_load_ms=3.0,
    )

    assert isinstance(result, EmbeddingBenchmarkModelResult)
    assert result.status == "completed"
    assert result.model_name == "unit-embedding"
    assert result.ranking.macro_precision_at_k == 1.0
    assert result.ranking.macro_recall_at_k == 1.0
    assert result.ranking.macro_ndcg_at_k == 1.0
    assert result.score_range_violation_count == 0
    assert result.latency_ms == 12.5
    assert result.model_load_ms == 3.0
    assert [row.job_id for row in result.ranking_debug] == [
        "job-python",
        "job-data",
        "job-design",
    ]
    assert [row.rank for row in result.ranking_debug] == [1, 2, 3]
    assert result.ranking_debug[0].label == "high"
    assert result.ranking_debug[0].expected_min_score == 75
    assert result.ranking_debug[0].expected_max_score == 100
    assert result.ranking_debug[0].in_expected_range is True
    assert result.ranking_debug[0].reason == "Strong Python fit."


def test_evaluate_embedding_predictions_debug_rows_mark_score_range_violations():
    dataset = build_dataset()
    predictions = [
        RankedMatch("cv-1", "job-design", 80.0),
        RankedMatch("cv-1", "job-python", 100.0),
    ]

    result = evaluate_embedding_predictions(
        model_name="unit-embedding",
        dataset=dataset,
        predictions=predictions,
        k=2,
    )

    debug_by_job = {row.job_id: row for row in result.ranking_debug}

    assert result.score_range_violation_count == 1
    assert debug_by_job["job-design"].rank == 2
    assert debug_by_job["job-design"].label == "low"
    assert debug_by_job["job-design"].expected_min_score == 0
    assert debug_by_job["job-design"].expected_max_score == 35
    assert debug_by_job["job-design"].in_expected_range is False


def test_tfidf_embedding_predictions_scores_project_sample_without_model_download():
    dataset = build_dataset()

    predictions = tfidf_embedding_predictions(dataset)

    assert len(predictions) == 3
    assert predictions[0].job_id == "job-python"
    assert all(0 <= item.score <= 100 for item in predictions)
