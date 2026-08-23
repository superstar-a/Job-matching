from __future__ import annotations

import argparse
import json
import platform
import sys
from dataclasses import asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.schemas.cv import CVProfile  # noqa: E402
from app.schemas.job import JobDescription  # noqa: E402
from app.services.embedding_benchmark import (  # noqa: E402
    EmbeddingBenchmarkDataset,
    EmbeddingBenchmarkReport,
    run_sentence_transformer_embedding_benchmark,
    run_tfidf_embedding_benchmark,
    skipped_embedding_result,
)
from app.services.evaluation import load_labeled_matches  # noqa: E402
from app.services.matching import build_cv_text, build_job_text  # noqa: E402


SAMPLES_DIR = ROOT_DIR / "data" / "samples"
DEFAULT_REGISTRY_PATH = ROOT_DIR / "data" / "model_registry" / "embedding_models.json"


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Benchmark embedding models on labeled CV-JD matching evaluation pairs."
    )
    parser.add_argument(
        "--labels",
        default=str(SAMPLES_DIR / "matching_evaluation.json"),
        help="Path to labeled CV-JD match evaluation JSON.",
    )
    parser.add_argument(
        "--cv",
        default=str(SAMPLES_DIR / "cv_sample.json"),
        help="Path to the sample CVProfile JSON.",
    )
    parser.add_argument(
        "--cv-id",
        default="cv-backend-sample",
        help="CV id used by the labeled evaluation records.",
    )
    parser.add_argument(
        "--jobs",
        default=str(SAMPLES_DIR / "jd_samples_20.json"),
        help="Path to normalized JobDescription sample JSON list.",
    )
    parser.add_argument(
        "--registry",
        default=str(DEFAULT_REGISTRY_PATH),
        help="Path to embedding model registry JSON.",
    )
    parser.add_argument(
        "--models",
        default=None,
        help="Comma-separated model names to benchmark. Defaults to enabled registry models.",
    )
    parser.add_argument(
        "--include-pretrained",
        action="store_true",
        help="Also include disabled pretrained candidates from the registry.",
    )
    parser.add_argument("--top-k", type=int, default=3, help="Ranking metric cutoff.")
    parser.add_argument("--device", default=None, help="Optional sentence-transformers device.")
    parser.add_argument("--batch-size", type=int, default=16, help="Embedding encode batch size.")
    parser.add_argument(
        "--output",
        default=None,
        help="Optional JSON output path for storing the embedding benchmark report.",
    )
    return parser


def main() -> int:
    args = build_parser().parse_args()
    registry = load_model_registry(args.registry)
    selected_models = select_models(
        registry,
        models_arg=args.models,
        include_pretrained=args.include_pretrained,
    )
    dataset = build_dataset(
        labels_path=args.labels,
        cv_path=args.cv,
        cv_id=args.cv_id,
        jobs_path=args.jobs,
    )

    results = []
    for model_config in selected_models:
        provider = model_config.get("provider")
        model_name = model_config["model_name"]
        if provider == "sklearn" and model_name == "tfidf-baseline":
            results.append(run_tfidf_embedding_benchmark(dataset, k=args.top_k))
        elif provider == "sentence-transformers":
            results.append(
                run_sentence_transformer_embedding_benchmark(
                    dataset,
                    model_name=model_name,
                    revision=model_config.get("revision"),
                    k=args.top_k,
                    device=args.device,
                    batch_size=args.batch_size,
                )
            )
        else:
            results.append(
                skipped_embedding_result(
                    model_name=model_name,
                    reason=f"Unsupported embedding benchmark provider: {provider}",
                    metadata={"provider": provider},
                )
            )

    report = EmbeddingBenchmarkReport(
        benchmark_name="ai-service-embedding-benchmark",
        dataset_size=len(dataset.labels),
        k=args.top_k,
        results=results,
        metadata={
            "created_at_utc": datetime.now(timezone.utc).isoformat(),
            "python_version": sys.version.split()[0],
            "platform": platform.platform(),
            "registry_path": args.registry,
            "labels_path": args.labels,
            "cv_id": args.cv_id,
            "jobs_path": args.jobs,
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


def load_model_registry(path: str | Path) -> list[dict[str, Any]]:
    records = json.loads(Path(path).read_text(encoding="utf-8"))
    return [dict(record) for record in records]


def select_models(
    registry: list[dict[str, Any]],
    *,
    models_arg: str | None,
    include_pretrained: bool,
) -> list[dict[str, Any]]:
    if models_arg:
        requested = [model.strip() for model in models_arg.split(",") if model.strip()]
        registry_by_name = {record["model_name"]: record for record in registry}
        return [
            registry_by_name.get(model_name, {"model_name": model_name, "provider": "sentence-transformers"})
            for model_name in requested
        ]

    if include_pretrained:
        return registry
    return [record for record in registry if record.get("enabled_by_default")]


def build_dataset(
    *,
    labels_path: str | Path,
    cv_path: str | Path,
    cv_id: str,
    jobs_path: str | Path,
) -> EmbeddingBenchmarkDataset:
    labels = load_labeled_matches(labels_path)
    cv = CVProfile.model_validate_json(Path(cv_path).read_text(encoding="utf-8"))
    jobs = [
        JobDescription.model_validate(record)
        for record in json.loads(Path(jobs_path).read_text(encoding="utf-8"))
    ]
    jobs_by_id = {job.external_id: job for job in jobs if job.external_id}
    labeled_job_ids = {label.job_id for label in labels}
    missing_job_ids = sorted(job_id for job_id in labeled_job_ids if job_id not in jobs_by_id)
    if missing_job_ids:
        raise ValueError(f"Missing labeled jobs in sample file: {', '.join(missing_job_ids)}")

    return EmbeddingBenchmarkDataset(
        labels=labels,
        cv_texts={cv_id: build_cv_text(cv)},
        job_texts={
            job_id: build_job_text(jobs_by_id[job_id])
            for job_id in sorted(labeled_job_ids)
        },
    )


if __name__ == "__main__":
    raise SystemExit(main())
