from __future__ import annotations

import json
import math
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

from app.services.data_cleaning import fold_text, normalize_location


@dataclass(frozen=True)
class LabeledIntent:
    sample_id: str
    message: str
    intent_label: str
    expected_intent: dict[str, Any]
    expected_follow_up_question: str | None = None


@dataclass(frozen=True)
class IntentPrediction:
    sample_id: str
    intent_label: str
    predicted_intent: dict[str, Any]
    follow_up_question: str | None = None


@dataclass(frozen=True)
class FieldMetric:
    correct: int
    total: int
    accuracy: float


@dataclass(frozen=True)
class IntentEvaluationReport:
    record_count: int
    prediction_count: int
    missing_prediction_count: int
    extra_prediction_count: int
    intent_label_accuracy: float
    exact_match_accuracy: float
    overall_field_accuracy: float
    field_metrics: dict[str, FieldMetric]


def load_labeled_intents(path: str | Path) -> list[LabeledIntent]:
    records = json.loads(Path(path).read_text(encoding="utf-8"))
    labels: list[LabeledIntent] = []
    for record in records:
        expected_intent = record.get("expected_intent")
        if not isinstance(expected_intent, dict):
            raise ValueError(f"expected_intent must be an object for {record.get('sample_id')}")

        labels.append(
            LabeledIntent(
                sample_id=str(record["sample_id"]),
                message=str(record["message"]),
                intent_label=str(record["intent_label"]),
                expected_intent=expected_intent,
                expected_follow_up_question=record.get("expected_follow_up_question"),
            )
        )
    return labels


def load_intent_predictions(path: str | Path) -> list[IntentPrediction]:
    records = json.loads(Path(path).read_text(encoding="utf-8"))
    predictions: list[IntentPrediction] = []
    for record in records:
        predicted_intent = record.get("predicted_intent")
        if not isinstance(predicted_intent, dict):
            raise ValueError(f"predicted_intent must be an object for {record.get('sample_id')}")

        predictions.append(
            IntentPrediction(
                sample_id=str(record["sample_id"]),
                intent_label=str(record["intent_label"]),
                predicted_intent=predicted_intent,
                follow_up_question=record.get("follow_up_question"),
            )
        )
    return predictions


def evaluate_intents(
    labels: Iterable[LabeledIntent],
    predictions: Iterable[IntentPrediction],
) -> IntentEvaluationReport:
    label_list = list(labels)
    prediction_list = list(predictions)
    predictions_by_id = {prediction.sample_id: prediction for prediction in prediction_list}
    label_ids = {label.sample_id for label in label_list}

    intent_label_correct = 0
    exact_match_correct = 0
    total_field_correct = 0
    total_field_count = 0
    field_counts: dict[str, dict[str, int]] = {}
    missing_prediction_count = 0

    for label in label_list:
        prediction = predictions_by_id.get(label.sample_id)
        if prediction is None:
            missing_prediction_count += 1
            prediction_intent: dict[str, Any] = {}
            label_matches = False
        else:
            prediction_intent = prediction.predicted_intent
            label_matches = values_equal(label.intent_label, prediction.intent_label)

        if label_matches:
            intent_label_correct += 1

        fields_match = True
        for field, expected_value in label.expected_intent.items():
            actual_value = prediction_intent.get(field)
            is_correct = field_values_equal(field, expected_value, actual_value)
            counts = field_counts.setdefault(field, {"correct": 0, "total": 0})
            counts["total"] += 1
            total_field_count += 1
            if is_correct:
                counts["correct"] += 1
                total_field_correct += 1
            else:
                fields_match = False

        if label_matches and fields_match and prediction is not None:
            exact_match_correct += 1

    field_metrics = {
        field: FieldMetric(
            correct=counts["correct"],
            total=counts["total"],
            accuracy=safe_divide(counts["correct"], counts["total"]),
        )
        for field, counts in sorted(field_counts.items())
    }

    record_count = len(label_list)
    extra_prediction_count = sum(
        1 for prediction in prediction_list if prediction.sample_id not in label_ids
    )

    return IntentEvaluationReport(
        record_count=record_count,
        prediction_count=len(prediction_list),
        missing_prediction_count=missing_prediction_count,
        extra_prediction_count=extra_prediction_count,
        intent_label_accuracy=safe_divide(intent_label_correct, record_count),
        exact_match_accuracy=safe_divide(exact_match_correct, record_count),
        overall_field_accuracy=safe_divide(total_field_correct, total_field_count),
        field_metrics=field_metrics,
    )


def values_equal(expected: Any, actual: Any) -> bool:
    return normalize_value(expected) == normalize_value(actual)


def field_values_equal(field: str, expected: Any, actual: Any) -> bool:
    return normalize_field_value(field, expected) == normalize_field_value(field, actual)


def normalize_field_value(field: str, value: Any) -> Any:
    if field == "location" and value is not None:
        return normalize_value(normalize_location(value) or value)
    return normalize_value(value)


def normalize_value(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        numeric_value = float(value)
        if not math.isfinite(numeric_value):
            return value
        return numeric_value
    if isinstance(value, str):
        return fold_text(value)
    if isinstance(value, list):
        return tuple(sorted({normalize_value(item) for item in value}))
    if isinstance(value, dict):
        return tuple(
            sorted((fold_text(str(key)), normalize_value(item)) for key, item in value.items())
        )
    return value


def safe_divide(numerator: int, denominator: int) -> float:
    if denominator == 0:
        return 0.0
    return numerator / denominator
