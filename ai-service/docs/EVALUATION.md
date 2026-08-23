# AI Evaluation Guide

Phase 7 starts with a small, repeatable evaluation loop for the AI/Data matching
pipeline. The goal is to compare rule-based, embedding, and reranker versions with
the same labels instead of judging quality by manual UI testing.

## Matching Evaluation Files

- `data/samples/matching_evaluation.json`
  - Human-labeled CV-job pairs.
  - Labels: `high`, `medium`, `low`.
  - Each row also stores an expected score range and evidence reason.
- `data/samples/matching_predictions_baseline.json`
  - Baseline predictions for the current matching logic.
  - Each row stores `cv_id`, `job_id`, and `score` on the 0-100 scale.

## Metrics

- `Precision@K`: how many jobs in top K are relevant (`high` or `medium`).
- `Recall@K`: how many relevant jobs were recovered in top K.
- `NDCG@K`: whether stronger matches are ranked above weaker matches.
- Score-range violations: predictions outside the labeled expected score range.

## Intent Evaluation Files

- `data/samples/intent_evaluation.json`
  - Human-labeled chat utterances and expected intent slots.
  - Covers source routing, role, skills, salary, location, work mode, level,
    company type, uploaded JD analysis, and required filters.
- `data/samples/intent_predictions_baseline.json`
  - Baseline predictions with `sample_id`, `intent_label`, and
    `predicted_intent`.

Intent metrics:

- `intent_label_accuracy`: whether the top-level intent is correct.
- `exact_match_accuracy`: whether all labeled slots for an utterance are correct.
- `overall_field_accuracy`: slot-level accuracy across all labeled fields.
- `field_metrics`: per-field correct/total/accuracy for debugging weak slots.

## Explanation Evaluation Files

- `data/samples/explanation_evaluation.json`
  - Sample job-fit analysis and CV suggestion payloads.
  - Used to check whether explanations are grounded and safe enough for users.

Explanation quality checks:

- Analysis includes both matching evidence and gaps/partials.
- Every non-unknown fit gap has CV or JD evidence with text.
- Missing skill gaps include guardrails against unverified claims.
- Every actionable suggestion cites evidence.
- `add_if_true` suggestions include safe wording and guardrail metadata.
- Blocker guardrails produce `blocked_claims`.

## Runtime Benchmark

- `scripts/benchmark_runtime.py`
  - Measures P50/P95 latency and peak Python allocation for core AI/Data flows.
  - Current baseline is `rule-based-baseline`, so `model_load_ms` is `0.0`.
  - When pretrained embeddings or rerankers are added, keep this report as the
    baseline for latency and memory comparison.

Benchmarked flows:

- CV text parsing.
- CV-JD scoring.
- Top-5 job recommendation.
- Job-fit analysis.
- CV suggestions.
- Matching, intent, and explanation evaluation runners.

## Embedding Benchmark

- `data/model_registry/embedding_models.json`
  - Central registry for the local TF-IDF baseline and pretrained embedding
    candidates.
  - Keeps model names and roles out of service code.
- `scripts/benchmark_embeddings.py`
  - Runs CV-JD semantic similarity models on `matching_evaluation.json`.
  - Reuses the same Precision@K, Recall@K, NDCG@K, and score-range checks as
    the matching evaluation.
  - Adds `ranking_debug` rows per prediction so weak models can be inspected by
    `cv_id`, `job_id`, rank, score, expected score range, label, and evidence
    reason.
- `scripts/analyze_embedding_errors.py`
  - Reads an embedding benchmark report with `ranking_debug`.
  - Groups model issues into low-label jobs ranked inside top K, relevant jobs
    missed from top K, and score calibration/range violations.
- `docs/EMBEDDING_BENCHMARK_REPORT.md`
  - Tracks the current model comparison and the decision about whether an
    embedding model is ready to become part of default matching.

Default command benchmarks only the offline TF-IDF baseline. Pretrained models
are optional because they require `sentence-transformers`, `torch`, model cache,
and usually an internet download on first run.

Pretrained candidates in the registry:

- `BAAI/bge-m3`: primary multilingual CV-JD semantic embedding candidate.
- `intfloat/multilingual-e5-base`: lighter multilingual comparison candidate.
- `bkai-foundation-models/vietnamese-bi-encoder`: Vietnamese-heavy comparison
  candidate.

## Local Command

Run from `ai-service`:

```powershell
python -m pytest tests\test_evaluation_metrics.py tests\test_matching.py -q
python scripts\evaluate_matching.py --labels data\samples\matching_evaluation.json --predictions data\samples\matching_predictions_baseline.json --k 3
python -m pytest tests\test_intent_evaluation.py -q
python scripts\evaluate_intent.py --labels data\samples\intent_evaluation.json --predictions data\samples\intent_predictions_baseline.json
python -m pytest tests\test_explanation_evaluation.py -q
python scripts\evaluate_explanations.py --records data\samples\explanation_evaluation.json
python -m pytest tests\test_runtime_benchmark.py -q
python scripts\benchmark_runtime.py --iterations 20 --warmup 3 --output data\samples\runtime_benchmark_baseline.json
python -m pytest tests\test_embedding_benchmark.py -q
python scripts\benchmark_embeddings.py --output data\samples\embedding_benchmark_tfidf.json
python -m pytest tests\test_embedding_error_analysis.py -q
```

When a new embedding model or reranker is added, generate a new predictions JSON
with the same contract and run the same command to compare metrics.

To include pretrained embedding candidates:

```powershell
python scripts\benchmark_embeddings.py --include-pretrained --output data\samples\embedding_benchmark_pretrained_debug.json
python scripts\analyze_embedding_errors.py --report data\samples\embedding_benchmark_pretrained_debug.json --output data\samples\embedding_error_analysis_pretrained.json
```

For CI, add `--fail-on-score-range-violation` if score-range violations should
fail the job instead of appearing only in the JSON report.
