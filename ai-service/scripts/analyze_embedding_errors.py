from __future__ import annotations

import argparse
import json
import sys
from dataclasses import asdict
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.services.embedding_error_analysis import (  # noqa: E402
    load_and_analyze_embedding_benchmark,
)


DEFAULT_REPORT_PATH = ROOT_DIR / "data" / "samples" / "embedding_benchmark_pretrained_debug.json"


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Analyze embedding benchmark ranking_debug rows for model errors."
    )
    parser.add_argument(
        "--report",
        default=str(DEFAULT_REPORT_PATH),
        help="Path to embedding benchmark JSON containing ranking_debug rows.",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Optional JSON output path for the error analysis report.",
    )
    parser.add_argument(
        "--fail-on-issues",
        action="store_true",
        help="Return exit code 1 when any completed model has ranking/debug issues.",
    )
    return parser


def main() -> int:
    args = build_parser().parse_args()
    report = load_and_analyze_embedding_benchmark(args.report)
    payload = asdict(report)
    rendered = json.dumps(payload, indent=2, ensure_ascii=False)
    print(rendered)

    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(rendered + "\n", encoding="utf-8")

    if args.fail_on_issues and any(
        summary.issue_count > 0 for summary in report.model_summaries
    ):
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
