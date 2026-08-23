# Embedding Benchmark Report

Date: 2026-08-23

Scope: AI/Data benchmark only. This report compares the current explainable
rule-based matching baseline with TF-IDF and pretrained embedding candidates on
the project sample evaluation set.

## Dataset

- Labels: `data/samples/matching_evaluation.json`
- CV sample: `data/samples/cv_sample.json`
- JD sample set: `data/samples/jd_samples_20.json`
- Labeled CV-JD pairs: 5
- Metric cutoff: `k = 3`
- Environment from saved benchmark JSON: Windows, Python 3.10.11, CPU/local

The dataset is intentionally small. Treat this as an integration benchmark and
debugging gate, not as a final model-selection benchmark.

## Results

| Model | Source | Precision@3 | Recall@3 | NDCG@3 | Score-range violations | Encode latency | Load time | Decision |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Rule-based baseline | `matching_predictions_baseline.json` | 1.000 | 1.000 | 1.000 | 0 | n/a | 0 ms | Keep as default |
| `tfidf-baseline` | `embedding_benchmark_pretrained_debug.json` | 0.667 | 0.667 | 0.856 | 3 | 1284.509 ms | 0 ms | Baseline only |
| `BAAI/bge-m3` | `embedding_benchmark_pretrained_debug.json` | 0.667 | 0.667 | 0.818 | 4 | 1955.738 ms | 9791.406 ms | Not default yet |
| `intfloat/multilingual-e5-base` | `embedding_benchmark_pretrained_debug.json` | 0.667 | 0.667 | 0.818 | 4 | 488.672 ms | 9826.711 ms | Not default yet |
| `bkai-foundation-models/vietnamese-bi-encoder` | `embedding_benchmark_pretrained_debug.json` | 0.667 | 0.667 | 0.818 | 2 | 641.071 ms | 6668.601 ms | Best pretrained candidate so far |

Load time reflects the cached/local run captured in
`embedding_benchmark_pretrained_debug.json`. First download can be much slower,
but quality still needs to beat the rule-based baseline before a pretrained
embedding becomes default.

## Error Analysis

Run:

```powershell
python scripts\analyze_embedding_errors.py --report data\samples\embedding_benchmark_pretrained_debug.json --output data\samples\embedding_error_analysis_pretrained.json
```

The analyzer groups issues into:

- `low_label_in_top_k`: a low-relevance job appears inside top K.
- `relevant_missed_top_k`: a high/medium job is ranked below top K.
- `score_range_violation`: the predicted score is outside the labeled expected
  score range.

Current manual read from `ranking_debug`:

- `tfidf-baseline`: pushes Product Designer into top 3 and misses DevOps from
  top 3.
- `BAAI/bge-m3`: pushes Frontend React into rank 2 and misses DevOps from top 3.
- `intfloat/multilingual-e5-base`: pushes Frontend React into rank 2 and misses
  DevOps from top 3.
- `bkai-foundation-models/vietnamese-bi-encoder`: pushes Frontend React into
  rank 2 and misses Data Engineer from top 3.

## Decision

Do not integrate pretrained embedding into default matching yet.

Current reason:

- The rule-based baseline is still strongest on the labeled sample.
- All pretrained candidates miss at least one relevant top-3 ordering case.
- Pretrained score calibration is weak: score-range violations are still high.
- The sample set is too small to justify changing the scoring contract.

Among pretrained models, `bkai-foundation-models/vietnamese-bi-encoder` is the
most interesting next candidate because it has fewer score-range violations and
reasonable local latency. `BAAI/bge-m3` remains important for a larger
Vietnamese-English benchmark because it supports strong multilingual retrieval,
but it did not win on the current sample.

## Next Checks

- Regenerate embedding benchmark reports with the new `ranking_debug` field.
- Run `scripts/analyze_embedding_errors.py` after each benchmark.
- Inspect which low-label jobs are being ranked too high and whether the cause is
  title similarity, generic skill overlap, or missing ESCO/entity signals.
- Expand `matching_evaluation.json` with more CVs, more occupations, and
  ESCO-backed evidence before choosing a production embedding model.
- Test hybrid scoring only after debug rows show a clear role for embedding
  similarity, for example improving semantically related JD matches that
  rule-based skill overlap misses.
- Keep rule-based matching as fallback even after embedding is introduced.

## Regenerate

Run from `ai-service`:

```powershell
python scripts\benchmark_embeddings.py --include-pretrained --output data\samples\embedding_benchmark_pretrained_debug.json
python scripts\analyze_embedding_errors.py --report data\samples\embedding_benchmark_pretrained_debug.json --output data\samples\embedding_error_analysis_pretrained.json
```

The benchmark output should include `ranking_debug` rows under each completed
model result. The error analysis output summarizes repeated model failure modes.
