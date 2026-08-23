# AI Data Model Contract

This document defines the logical data model for AI/Data ownership. It is not a
database migration. Backend/DB can map these fields to SQL Server tables or a
warehouse schema later.

## Principles

- Store sanitized CV/JD features and evidence, not raw CV text by default.
- Keep every score, gap, and suggestion tied to model/analyzer versions.
- Keep evidence references structured so UI/API can explain every decision.
- Keep training/evaluation data separate from production request logs.
- Physical SQL Server ERD should use typed nullable FK columns for the core
  graph, even when a table also keeps generic `object_type/object_id` or
  `parent_type/parent_id` audit fields.

## Physical Relationship Shape

Migration `002_strengthen_ai_data_relationships.sql` makes the SQL Server ERD
follow this core graph:

```text
raw_cv_documents -> cv_profiles -> entities -> entity_concept_links -> esco_concepts
raw_job_postings -> job_posts_normalized -> entities -> entity_concept_links -> esco_concepts
cv_profiles + job_posts_normalized -> cv_job_features -> match_runs
match_runs -> job_fit_analyses -> job_fit_gap_items
job_fit_analyses -> cv_suggestions -> cv_suggestion_items
job_fit_gap_items / cv_suggestion_items -> evidence_refs
job_fit_gap_items / cv_suggestion_items -> guardrail_flags
cv_profiles / job_posts_normalized -> text_chunks -> embeddings
cv_profiles + job_posts_normalized -> labeled_cv_jd_pairs
entities -> labeled_entities
```

`model_experiments` and `labeled_intents` are intentionally standalone because
they can refer to dataset versions or chat utterances rather than one CV/JD row.

## Fit Analysis

### `job_fit_analyses`

| Field | Type | Notes |
| --- | --- | --- |
| `analysis_id` | string/uuid | Primary logical id. |
| `cv_profile_id` | string/uuid | Sanitized parsed CV profile id. |
| `job_id` | string/uuid | Normalized job id or external job key. |
| `match_run_id` | string/uuid, nullable | Link to ranking/scoring run. |
| `overall_score` | float | 0-100 score returned by AI-service. |
| `matched_skills` | json array | Canonical skill labels. |
| `missing_required_skills` | json array | Required JD skills missing in verified CV evidence. |
| `improvement_focus` | json array | Prioritized topics to improve. |
| `recommendation_reason` | text | Short human-readable reason. |
| `feature_version` | string | Feature extraction version. |
| `analyzer_version` | string | Example: `rule-based-gap-v1`. |
| `created_at` | datetime | Analysis creation time. |

### `job_fit_gap_items`

| Field | Type | Notes |
| --- | --- | --- |
| `gap_id` | string/uuid | Primary logical id. |
| `analysis_id` | string/uuid | Parent analysis. |
| `category` | string | `skill`, `experience`, `location`, `salary`, `work_mode`, `domain_project`, `keyword`. |
| `status` | string | `match`, `gap`, `partial`, `unknown`. |
| `severity` | string | `low`, `medium`, `high`. |
| `requirement` | text | JD requirement being evaluated. |
| `message` | text | Explanation for this gap. |
| `guardrail` | text, nullable | Rule preventing false claims. |
| `sort_order` | int | Stable display order. |

## Suggestions

### `cv_suggestions`

| Field | Type | Notes |
| --- | --- | --- |
| `suggestion_run_id` | string/uuid | Primary logical id. |
| `analysis_id` | string/uuid | Source fit analysis. |
| `cv_profile_id` | string/uuid | Sanitized parsed CV profile id. |
| `job_id` | string/uuid | Target job id. |
| `overall_score` | float | Score copied from source analysis. |
| `blocked_claims` | json array | Skills/claims the user must not add unless true. |
| `source_analysis_version` | string | Analyzer version used by suggestions. |
| `suggestion_version` | string | Example: `rule-based-suggestion-v1`. |
| `created_at` | datetime | Suggestion generation time. |

### `cv_suggestion_items`

| Field | Type | Notes |
| --- | --- | --- |
| `suggestion_item_id` | string/uuid | Primary logical id. |
| `suggestion_run_id` | string/uuid | Parent suggestion run. |
| `section` | string | `summary`, `skills`, `experience`, `projects`, `guardrail`. |
| `action` | string | `add_if_true`, `clarify`, `rewrite`, `do_not_claim`. |
| `title` | text | Short display title. |
| `current_gap` | text | Gap message from analysis. |
| `suggested_wording` | text | Evidence-bound wording guidance. |
| `rationale` | text | Why this suggestion matters. |
| `sort_order` | int | Stable display order. |

## Evidence And Guardrails

### `evidence_refs`

| Field | Type | Notes |
| --- | --- | --- |
| `evidence_id` | string/uuid | Primary logical id. |
| `parent_type` | string | `fit_gap` or `suggestion_item`. |
| `parent_id` | string/uuid | Gap or suggestion item id. |
| `source` | string | `cv` or `jd`. |
| `section` | string, nullable | Example: `skills`, `projects`, `requirements`. |
| `field` | string, nullable | Source JSON field. |
| `text_hash` | string, nullable | Hash of evidence text if raw text cannot be stored. |
| `text_preview` | text, nullable | Short sanitized preview only. |
| `source_span` | text, nullable | Skill/requirement span being referenced. |
| `confidence` | float | 0-1 confidence. |

### `guardrail_flags`

| Field | Type | Notes |
| --- | --- | --- |
| `guardrail_id` | string/uuid | Primary logical id. |
| `parent_type` | string | `fit_gap`, `suggestion_item`, or `suggestion_run`. |
| `parent_id` | string/uuid | Parent id. |
| `code` | string | Example: `requires_verified_experience`, `do_not_inflate_experience`. |
| `severity` | string | `info`, `warning`, `blocker`. |
| `message` | text | Human-readable rule. |

## Evaluation And Training

### `labeled_cv_jd_pairs`

| Field | Type | Notes |
| --- | --- | --- |
| `pair_id` | string/uuid | Primary logical id. |
| `cv_profile_id` | string/uuid | Sanitized CV profile. |
| `job_id` | string/uuid | Normalized job. |
| `label` | string/int | Fit label, for example `strong`, `medium`, `weak` or 0-3. |
| `reason` | text | Reviewer explanation. |
| `reviewer` | string | Human or trusted labeling source. |
| `split` | string | `train`, `validation`, `test`. |
| `dataset_version` | string | Version used for benchmark/fine-tune. |

### `model_experiments`

| Field | Type | Notes |
| --- | --- | --- |
| `experiment_id` | string/uuid | Primary logical id. |
| `model_name` | string | Example: `BAAI/bge-m3`. |
| `model_revision` | string | Pinned revision/hash when available. |
| `dataset_version` | string | Evaluation dataset version. |
| `metrics` | json | NDCG, Precision@K, entity F1, intent accuracy, latency. |
| `baseline_version` | string | Baseline compared against. |
| `notes` | text | Decision notes and known failure cases. |

## Privacy Notes

- Do not store raw CV text unless there is an explicit retention policy.
- Prefer `text_hash` plus short sanitized `text_preview` for evidence.
- Never store `fileBase64`, emails, phones, tokens, or raw upload payloads in AI logs.
- Fine-tuning datasets must be de-identified before export.
