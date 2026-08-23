from __future__ import annotations

import argparse
import json
import sys
from dataclasses import asdict
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.services.evaluation import (  # noqa: E402
    evaluate_rankings,
    load_labeled_matches,
    load_ranked_matches,
    score_range_violations,
)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Evaluate CV-job ranking predictions against labeled match pairs."
    )
    parser.add_argument(
        "--labels",
        default="data/samples/matching_evaluation.json",
        help="Path to labeled CV-job match evaluation JSON.",
    )
    parser.add_argument(
        "--predictions",
        default="data/samples/matching_predictions_baseline.json",
        help="Path to ranked prediction JSON with cv_id, job_id, and score.",
    )
    parser.add_argument(
        "--k",
        type=int,
        default=3,
        help="Top-K cutoff for Precision@K, Recall@K, and NDCG@K.",
    )
    parser.add_argument(
        "--fail-on-score-range-violation",
        action="store_true",
        help="Return exit code 1 when predictions fall outside labeled score ranges.",
    )
    return parser


def main() -> int:
    args = build_parser().parse_args()
    labels = load_labeled_matches(args.labels)
    predictions = load_ranked_matches(args.predictions)
    ranking_report = evaluate_rankings(labels, predictions, k=args.k)
    violations = score_range_violations(labels, predictions)

    payload = {
        "labels_path": args.labels,
        "predictions_path": args.predictions,
        "ranking": asdict(ranking_report),
        "score_range": {
            "violation_count": len(violations),
            "violations": [asdict(violation) for violation in violations],
        },
    }
    print(json.dumps(payload, indent=2, ensure_ascii=False))
    if args.fail_on_score_range_violation and violations:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
