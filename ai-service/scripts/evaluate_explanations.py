from __future__ import annotations

import argparse
import json
import sys
from dataclasses import asdict
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.services.explanation_evaluation import (  # noqa: E402
    evaluate_explanations,
    load_explanation_records,
)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Evaluate job-fit explanations and CV suggestions for evidence and guardrails."
    )
    parser.add_argument(
        "--records",
        default="data/samples/explanation_evaluation.json",
        help="Path to explanation evaluation JSON records.",
    )
    parser.add_argument(
        "--min-pass-rate",
        type=float,
        default=None,
        help="Return exit code 1 when overall pass rate is below this value.",
    )
    return parser


def main() -> int:
    args = build_parser().parse_args()
    records = load_explanation_records(args.records)
    report = evaluate_explanations(records)

    payload = {
        "records_path": args.records,
        "explanation_quality": asdict(report),
    }
    print(json.dumps(payload, indent=2, ensure_ascii=False))

    if args.min_pass_rate is not None and report.overall_pass_rate < args.min_pass_rate:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
