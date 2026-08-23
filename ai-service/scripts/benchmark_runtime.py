from __future__ import annotations

import argparse
import json
import platform
import sys
from dataclasses import asdict
from datetime import datetime, timezone
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.schemas.cv import CVProfile  # noqa: E402
from app.schemas.job import JobDescription  # noqa: E402
from app.services.cv_parser import parse_cv_text  # noqa: E402
from app.services.cv_suggestions import build_cv_suggestions  # noqa: E402
from app.services.evaluation import (  # noqa: E402
    evaluate_rankings,
    load_labeled_matches,
    load_ranked_matches,
)
from app.services.explanation_evaluation import (  # noqa: E402
    evaluate_explanations,
    load_explanation_records,
)
from app.services.intent_evaluation import (  # noqa: E402
    evaluate_intents,
    load_intent_predictions,
    load_labeled_intents,
)
from app.services.job_fit_analysis import analyze_job_fit  # noqa: E402
from app.services.matching import recommend_jobs, score_cv_jd  # noqa: E402
from app.services.runtime_benchmark import BenchmarkCase, run_benchmark_cases  # noqa: E402


SAMPLES_DIR = ROOT_DIR / "data" / "samples"


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Benchmark local AI/Data runtime latency and memory for core flows."
    )
    parser.add_argument("--iterations", type=int, default=20, help="Measured iterations per case.")
    parser.add_argument("--warmup", type=int, default=3, help="Warmup iterations per case.")
    parser.add_argument(
        "--output",
        default=None,
        help="Optional JSON output path for storing the benchmark report.",
    )
    return parser


def main() -> int:
    args = build_parser().parse_args()
    cases = build_cases()
    report = run_benchmark_cases(
        cases,
        iterations=args.iterations,
        warmup_iterations=args.warmup,
        benchmark_name="ai-service-rule-based-runtime",
        metadata={
            "created_at_utc": datetime.now(timezone.utc).isoformat(),
            "python_version": sys.version.split()[0],
            "platform": platform.platform(),
            "model_name": "rule-based-baseline",
            "model_load_ms": 0.0,
            "notes": "No pretrained embedding or reranker model is loaded in this baseline.",
        },
    )
    payload = asdict(report)
    rendered = json.dumps(payload, indent=2, ensure_ascii=False)
    print(rendered)

    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(rendered + "\n", encoding="utf-8")
    return 0


def build_cases() -> list[BenchmarkCase]:
    raw_cv_text = (SAMPLES_DIR / "raw" / "cv_backend_sample.txt").read_text(encoding="utf-8")
    cv = CVProfile.model_validate_json((SAMPLES_DIR / "cv_sample.json").read_text(encoding="utf-8"))
    job = JobDescription.model_validate_json((SAMPLES_DIR / "jd_sample.json").read_text(encoding="utf-8"))
    jobs = [
        JobDescription.model_validate(record)
        for record in json.loads((SAMPLES_DIR / "jd_samples_20.json").read_text(encoding="utf-8"))[:5]
    ]
    matching_labels = load_labeled_matches(SAMPLES_DIR / "matching_evaluation.json")
    matching_predictions = load_ranked_matches(SAMPLES_DIR / "matching_predictions_baseline.json")
    intent_labels = load_labeled_intents(SAMPLES_DIR / "intent_evaluation.json")
    intent_predictions = load_intent_predictions(SAMPLES_DIR / "intent_predictions_baseline.json")
    explanation_records = load_explanation_records(SAMPLES_DIR / "explanation_evaluation.json")

    return [
        BenchmarkCase(
            name="parse_cv_text",
            flow="cv_parser",
            operation=lambda: parse_cv_text(raw_cv_text, include_raw_text=False, mask_pii=True),
            summarize_result=lambda result: {
                "skills": len(result.skills),
                "experiences": len(result.experiences),
            },
        ),
        BenchmarkCase(
            name="score_cv_jd",
            flow="matching",
            operation=lambda: score_cv_jd(cv, job),
            summarize_result=lambda result: {
                "overall_score": result.overall_score,
                "matched_skills": len(result.matched_skills),
                "missing_required_skills": len(result.missing_required_skills),
            },
        ),
        BenchmarkCase(
            name="recommend_jobs_top5",
            flow="matching",
            operation=lambda: recommend_jobs(cv, jobs),
            summarize_result=lambda result: {
                "recommendations": len(result),
                "top_job_id": result[0].job_id if result else None,
            },
        ),
        BenchmarkCase(
            name="analyze_job_fit",
            flow="explanation",
            operation=lambda: analyze_job_fit(cv, job),
            summarize_result=lambda result: {
                "fit_gaps": len(result.fit_gaps),
                "improvement_focus": len(result.improvement_focus),
            },
        ),
        BenchmarkCase(
            name="cv_suggestions",
            flow="explanation",
            operation=lambda: build_cv_suggestions(cv, job),
            summarize_result=lambda result: {
                "suggestions": len(result.suggestions),
                "blocked_claims": len(result.blocked_claims),
            },
        ),
        BenchmarkCase(
            name="evaluate_matching",
            flow="quality_evaluation",
            operation=lambda: evaluate_rankings(matching_labels, matching_predictions, k=3),
            summarize_result=lambda result: {
                "macro_precision_at_k": round(result.macro_precision_at_k, 4),
                "macro_ndcg_at_k": round(result.macro_ndcg_at_k, 4),
            },
        ),
        BenchmarkCase(
            name="evaluate_intent",
            flow="quality_evaluation",
            operation=lambda: evaluate_intents(intent_labels, intent_predictions),
            summarize_result=lambda result: {
                "overall_field_accuracy": round(result.overall_field_accuracy, 4),
                "exact_match_accuracy": round(result.exact_match_accuracy, 4),
            },
        ),
        BenchmarkCase(
            name="evaluate_explanations",
            flow="quality_evaluation",
            operation=lambda: evaluate_explanations(explanation_records),
            summarize_result=lambda result: {
                "overall_pass_rate": round(result.overall_pass_rate, 4),
                "failed_check_count": result.failed_check_count,
            },
        ),
    ]


if __name__ == "__main__":
    raise SystemExit(main())
