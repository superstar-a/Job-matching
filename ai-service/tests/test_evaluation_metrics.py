import pytest

from app.services.evaluation import (
    LabeledMatch,
    RankedMatch,
    evaluate_rankings,
    load_labeled_matches,
    load_ranked_matches,
    score_range_violations,
)


def test_ranking_metrics_use_relevance_threshold_and_graded_ndcg():
    labels = [
        LabeledMatch("cv-backend-sample", "job-python", "high", 75, 100, "Strong backend fit."),
        LabeledMatch("cv-backend-sample", "job-react", "low", 0, 40, "Frontend role."),
        LabeledMatch("cv-backend-sample", "job-data", "medium", 45, 80, "Some data overlap."),
        LabeledMatch("cv-backend-sample", "job-devops", "medium", 35, 70, "Some infra overlap."),
    ]
    ranked = [
        RankedMatch("cv-backend-sample", "job-python", 91.0),
        RankedMatch("cv-backend-sample", "job-react", 72.0),
        RankedMatch("cv-backend-sample", "job-data", 61.0),
        RankedMatch("cv-backend-sample", "job-devops", 55.0),
    ]

    report = evaluate_rankings(labels, ranked, k=3)
    metrics = report.metrics_by_cv["cv-backend-sample"]

    assert metrics.relevant_count == 3
    assert metrics.retrieved_count == 3
    assert metrics.precision_at_k == pytest.approx(2 / 3)
    assert metrics.recall_at_k == pytest.approx(2 / 3)
    assert metrics.ndcg_at_k == pytest.approx(0.8179, abs=0.0001)
    assert report.macro_precision_at_k == pytest.approx(2 / 3)
    assert report.macro_recall_at_k == pytest.approx(2 / 3)


def test_score_range_violations_report_predictions_outside_expected_bounds():
    labels = [
        LabeledMatch("cv-backend-sample", "job-python", "high", 75, 100, "Strong backend fit."),
        LabeledMatch("cv-backend-sample", "job-react", "low", 0, 40, "Frontend role."),
    ]
    ranked = [
        RankedMatch("cv-backend-sample", "job-python", 82.5),
        RankedMatch("cv-backend-sample", "job-react", 60.0),
    ]

    violations = score_range_violations(labels, ranked)

    assert len(violations) == 1
    assert violations[0].cv_id == "cv-backend-sample"
    assert violations[0].job_id == "job-react"
    assert violations[0].score == 60.0
    assert violations[0].expected_min_score == 0
    assert violations[0].expected_max_score == 40


def test_sample_evaluation_files_load_into_metric_contract():
    labels = load_labeled_matches("data/samples/matching_evaluation.json")
    ranked = load_ranked_matches("data/samples/matching_predictions_baseline.json")

    report = evaluate_rankings(labels, ranked, k=3)

    assert len(labels) >= 5
    assert all(label.reason for label in labels)
    assert report.k == 3
    assert "cv-backend-sample" in report.metrics_by_cv
    assert report.macro_precision_at_k >= 0.0
    assert not score_range_violations(labels, ranked)
