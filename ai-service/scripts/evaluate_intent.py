from __future__ import annotations

import argparse
import json
import sys
from dataclasses import asdict
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.services.intent_evaluation import (  # noqa: E402
    evaluate_intents,
    load_intent_predictions,
    load_labeled_intents,
)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Evaluate chat intent extraction predictions against labeled samples."
    )
    parser.add_argument(
        "--labels",
        default="data/samples/intent_evaluation.json",
        help="Path to labeled chat intent evaluation JSON.",
    )
    parser.add_argument(
        "--predictions",
        default="data/samples/intent_predictions_baseline.json",
        help="Path to intent prediction JSON.",
    )
    parser.add_argument(
        "--min-field-accuracy",
        type=float,
        default=None,
        help="Return exit code 1 when overall field accuracy is below this value.",
    )
    return parser


def main() -> int:
    args = build_parser().parse_args()
    labels = load_labeled_intents(args.labels)
    predictions = load_intent_predictions(args.predictions)
    report = evaluate_intents(labels, predictions)

    payload = {
        "labels_path": args.labels,
        "predictions_path": args.predictions,
        "intent": asdict(report),
    }
    print(json.dumps(payload, indent=2, ensure_ascii=False))

    if args.min_field_accuracy is not None:
        if report.overall_field_accuracy < args.min_field_accuracy:
            return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
