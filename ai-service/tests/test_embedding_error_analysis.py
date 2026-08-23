import json

from app.services.embedding_error_analysis import (
    analyze_embedding_benchmark_report,
    load_and_analyze_embedding_benchmark,
)


def build_benchmark_payload():
    return {
        "benchmark_name": "unit-embedding-benchmark",
        "dataset_size": 3,
        "k": 2,
        "results": [
            {
                "model_name": "unit-embedding",
                "status": "completed",
                "ranking_debug": [
                    {
                        "cv_id": "cv-1",
                        "job_id": "job-backend",
                        "rank": 1,
                        "score": 92.0,
                        "label": "high",
                        "expected_min_score": 75.0,
                        "expected_max_score": 100.0,
                        "in_expected_range": True,
                        "reason": "Strong backend match.",
                    },
                    {
                        "cv_id": "cv-1",
                        "job_id": "job-frontend",
                        "rank": 2,
                        "score": 88.0,
                        "label": "low",
                        "expected_min_score": 0.0,
                        "expected_max_score": 40.0,
                        "in_expected_range": False,
                        "reason": "Frontend role does not match backend CV.",
                    },
                    {
                        "cv_id": "cv-1",
                        "job_id": "job-data",
                        "rank": 3,
                        "score": 61.0,
                        "label": "medium",
                        "expected_min_score": 45.0,
                        "expected_max_score": 80.0,
                        "in_expected_range": True,
                        "reason": "Some Python and SQL overlap.",
                    },
                ],
            },
            {
                "model_name": "missing-model",
                "status": "skipped",
                "ranking_debug": [],
                "error": "dependency is not installed",
            },
        ],
    }


def test_analyze_embedding_benchmark_report_flags_ranking_and_calibration_issues():
    report = analyze_embedding_benchmark_report(build_benchmark_payload())
    summary = report.model_summaries[0]

    assert report.benchmark_name == "unit-embedding-benchmark"
    assert report.dataset_size == 3
    assert report.k == 2
    assert summary.model_name == "unit-embedding"
    assert summary.status == "completed"
    assert summary.checked_prediction_count == 3
    assert summary.low_label_in_top_k_count == 1
    assert summary.relevant_missed_top_k_count == 1
    assert summary.score_range_violation_count == 1
    assert summary.issue_count == 3
    assert {issue.issue_type for issue in summary.issues} == {
        "low_label_in_top_k",
        "relevant_missed_top_k",
        "score_range_violation",
    }
    assert report.problem_job_counts["job-frontend"] == 2
    assert report.problem_job_counts["job-data"] == 1
    assert report.worst_models_by_issue_count == ["unit-embedding"]
    assert "Do not promote" in summary.recommendation


def test_analyze_embedding_benchmark_report_keeps_skipped_model_context():
    report = analyze_embedding_benchmark_report(build_benchmark_payload())
    summary = report.model_summaries[1]

    assert summary.model_name == "missing-model"
    assert summary.status == "skipped"
    assert summary.checked_prediction_count == 0
    assert summary.issue_count == 0
    assert summary.recommendation == "Cannot analyze skipped model: dependency is not installed"


def test_load_and_analyze_embedding_benchmark_reads_json_file(tmp_path):
    path = tmp_path / "embedding-report.json"
    path.write_text(json.dumps(build_benchmark_payload()), encoding="utf-8")

    report = load_and_analyze_embedding_benchmark(path)

    assert report.source_path == str(path)
    assert report.model_summaries[0].model_name == "unit-embedding"
