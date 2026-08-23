import pytest

from app.services.intent_evaluation import (
    IntentPrediction,
    LabeledIntent,
    evaluate_intents,
    load_intent_predictions,
    load_labeled_intents,
)


def test_intent_metrics_are_order_insensitive_and_score_each_field():
    labels = [
        LabeledIntent(
            sample_id="intent-001",
            message="Tim job TopCV luong 20tr o HCM cho Python backend remote",
            intent_label="job_search",
            expected_intent={
                "target_role": "Python Backend",
                "job_sources": ["topcv"],
                "required_skills": ["Python", "FastAPI"],
                "location": "ho chi minh",
                "salary_min": 20_000_000,
            },
        ),
        LabeledIntent(
            sample_id="intent-002",
            message="Loc them ITviec Data Engineer hybrid o Ha Noi",
            intent_label="job_search",
            expected_intent={
                "target_role": "Data Engineer",
                "job_sources": ["itviec"],
                "work_mode": "hybrid",
                "location": "ha noi",
            },
        ),
    ]
    predictions = [
        IntentPrediction(
            sample_id="intent-001",
            intent_label="job_search",
            predicted_intent={
                "target_role": "python backend",
                "job_sources": ["topcv"],
                "required_skills": ["FastAPI", "Python"],
                "location": "HCM",
                "salary_min": 20_000_000,
            },
        ),
        IntentPrediction(
            sample_id="intent-002",
            intent_label="job_search",
            predicted_intent={
                "target_role": "data engineer",
                "job_sources": ["topcv"],
                "work_mode": "hybrid",
                "location": "Ha Noi",
            },
        ),
    ]

    report = evaluate_intents(labels, predictions)

    assert report.record_count == 2
    assert report.exact_match_accuracy == pytest.approx(0.5)
    assert report.intent_label_accuracy == pytest.approx(1.0)
    assert report.overall_field_accuracy == pytest.approx(8 / 9)
    assert report.field_metrics["required_skills"].accuracy == pytest.approx(1.0)
    assert report.field_metrics["job_sources"].accuracy == pytest.approx(0.5)
    assert report.field_metrics["location"].accuracy == pytest.approx(1.0)


def test_intent_metrics_count_missing_prediction_as_incorrect():
    labels = [
        LabeledIntent(
            sample_id="intent-003",
            message="Tim VietnamWorks SQL Server onsite",
            intent_label="job_search",
            expected_intent={
                "target_role": "Database Administrator",
                "job_sources": ["vietnamworks"],
                "required_skills": ["SQL Server"],
                "work_mode": "onsite",
            },
        )
    ]

    report = evaluate_intents(labels, [])

    assert report.record_count == 1
    assert report.missing_prediction_count == 1
    assert report.intent_label_accuracy == 0.0
    assert report.exact_match_accuracy == 0.0
    assert report.overall_field_accuracy == 0.0
    assert report.field_metrics["job_sources"].total == 1
    assert report.field_metrics["job_sources"].correct == 0


def test_sample_intent_files_load_into_metric_contract():
    labels = load_labeled_intents("data/samples/intent_evaluation.json")
    predictions = load_intent_predictions("data/samples/intent_predictions_baseline.json")

    report = evaluate_intents(labels, predictions)

    assert len(labels) >= 5
    assert report.record_count == len(labels)
    assert report.missing_prediction_count == 0
    assert report.intent_label_accuracy >= 0.8
    assert report.overall_field_accuracy >= 0.8
