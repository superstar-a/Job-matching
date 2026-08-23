# AI/Data Database Dictionary

This document defines the first SQL Server data dictionary for AI/Data-owned
tables. It turns the logical model into concrete tables, columns, source
contracts, and privacy rules before writing migrations.

This is not a migration file. SQL types are recommended targets for the next
Phase 6.5 step.

## Source Contracts

The columns below are derived from current AI-service schemas and pipeline
outputs:

| Source | File | Produces |
| --- | --- | --- |
| `CVParseRequest`, `CVProfile`, `CVExperience`, `CVEducation`, `CVProject` | `app/schemas/cv.py` | CV document metadata, parsed profile, nested profile JSON. |
| `JDResponse`, `JobDescription` | `app/schemas/jd.py`, `app/schemas/job.py` | Raw job posting metadata and normalized JD fields. |
| `ExtractedEntity` | `app/schemas/entity.py` | Skill, occupation, salary, location, work mode, experience entities and ESCO mapping fields. |
| `MatchResult`, `RecommendedJob` | `app/schemas/match.py` | Match score, matched/missing skills, recommendation reason. |
| `JobFitAnalysis`, `FitGap`, `EvidenceRef` | `app/schemas/job_fit.py` | Fit analysis, gap items, evidence references. |
| `CvSuggestionsResponse`, `CvSuggestion`, `SuggestionGuardrail` | `app/schemas/cv_suggestion.py` | CV suggestion runs, suggestion items, guardrail flags. |
| `data/taxonomy/esco_seed.json` | ESCO seed data | ESCO concepts and aliases. |

## Endpoint To Table Mapping

| Endpoint / Pipeline Step | Primary Tables | Notes |
| --- | --- | --- |
| `POST /api/parse-cv` | `raw_cv_documents`, `cv_profiles` | Stores upload metadata and sanitized parsed CV profile. |
| `POST /api/extract-entities` | `entities`, `entity_concept_links`, `esco_concepts` | Stores entity spans and ESCO/taxonomy links. |
| `POST /api/scrape-jd` | `crawl_runs`, `raw_job_postings`, `job_posts_normalized` | Stores crawl metadata, raw job references, and normalized JD snapshot. |
| `POST /api/match-cv-jd` | `cv_job_features`, `match_runs` | Stores feature snapshot and scoring result for one CV/job pair. |
| `POST /api/recommend-jobs` | `cv_job_features`, `match_runs` | Stores one scoring result per candidate job. |
| `POST /api/analyze-job-fit` | `job_fit_analyses`, `job_fit_gap_items`, `evidence_refs`, `guardrail_flags` | Stores detailed fit analysis and evidence. |
| `POST /api/cv-suggestions` | `cv_suggestions`, `cv_suggestion_items`, `evidence_refs`, `guardrail_flags` | Stores CV improvement suggestions and guardrails. |
| Labeling workflow | `labeled_cv_jd_pairs`, `labeled_entities`, `labeled_intents` | Human-reviewed datasets for evaluation and future fine-tuning. |
| Model benchmark/fine-tune workflow | `model_experiments`, `text_chunks`, `embeddings` | Stores metrics and semantic retrieval cache metadata. |

## Common Columns

Use these columns unless a table explicitly says otherwise.

| Column | SQL Server Type | Required | Notes |
| --- | --- | --- | --- |
| `created_at` | `datetime2(3)` | Yes | Default `sysutcdatetime()`. |
| `updated_at` | `datetime2(3)` | No | Set when row is updated. |
| `created_by` | `nvarchar(100)` | No | Service/user that created the row, for example `ai-service`. |
| `schema_version` | `nvarchar(50)` | No | Data schema version, useful during migration. |

Use `uniqueidentifier` for primary ids in SQL Server. Use `nvarchar(max)` for
JSON payloads unless the team later adopts SQL Server JSON constraints/checks.

## Relationship Columns Added In Migration 002

Migration `002_strengthen_ai_data_relationships.sql` keeps the flexible
`object_type/object_id` and `parent_type/parent_id` audit fields, but adds
typed nullable FK columns so SQL Server ERD tools can show the core AI/Data
flow clearly.

| Table | Added columns | Purpose |
| --- | --- | --- |
| `entities` | `cv_profile_id`, `job_id` | Link extracted entities directly to CV or normalized JD snapshots. |
| `text_chunks` | `cv_profile_id`, `job_id` | Link chunks directly to the CV/JD source they were created from. |
| `evidence_refs` | `job_fit_analysis_id`, `job_fit_gap_id`, `cv_suggestion_run_id`, `cv_suggestion_item_id`, `source_cv_profile_id`, `source_job_id` | Link evidence to the concrete analysis/gap/suggestion parent and the concrete CV/JD source. |
| `guardrail_flags` | `job_fit_analysis_id`, `job_fit_gap_id`, `cv_suggestion_run_id`, `cv_suggestion_item_id` | Link safety flags to the concrete analysis/gap/suggestion parent. |
| `labeled_entities` | `entity_id`, `cv_profile_id`, `job_id` | Link labeled examples back to extracted entities and their CV/JD context. |

`model_experiments` and `labeled_intents` remain intentionally standalone:
model experiments can cover multiple datasets/artifacts, and intent labels can
come from chat utterances without a CV/JD.

## P0 Tables

P0 tables are needed before serious evaluation, benchmark, or fine-tuning.

### `raw_cv_documents`

Stores upload/source metadata for CV files or text submissions. Do not store
`fileBase64`.

| Column | SQL Server Type | Required | Source | Notes |
| --- | --- | --- | --- | --- |
| `cv_document_id` | `uniqueidentifier` | Yes | Generated | Primary key. |
| `user_id` | `uniqueidentifier` | No | Backend contract | Nullable until auth/user ownership is finalized. |
| `conversation_id` | `uniqueidentifier` | No | Backend contract | Optional chat session link. |
| `source_type` | `nvarchar(30)` | Yes | Request context | `upload`, `pasted_text`, `sample`, `import`. |
| `original_filename` | `nvarchar(255)` | No | `CVParseRequest.filename` | Original file name. |
| `mime_type` | `nvarchar(100)` | No | Upload metadata | Example: `application/pdf`. |
| `file_size_bytes` | `bigint` | No | Upload metadata | Use for validation and audit. |
| `storage_key` | `nvarchar(500)` | No | Backend/S3 contract | S3/object key if raw file is stored. |
| `content_hash` | `char(64)` | Yes | SHA-256 of file/text | Dedup and audit. |
| `raw_text_hash` | `char(64)` | No | Parser output | Hash only by default. |
| `raw_text_preview` | `nvarchar(500)` | No | Parser output | Sanitized short preview only. |
| `language` | `nvarchar(20)` | No | Parser/entity detector | `vi`, `en`, `mixed`, `unknown`. |
| `parse_status` | `nvarchar(30)` | Yes | Parser | `pending`, `success`, `failed`, `unsupported`. |
| `parse_error_code` | `nvarchar(100)` | No | Parser | Short machine-readable error. |
| `parser_version` | `nvarchar(100)` | No | Parser | Example: `rule-based-cv-parser-v1`. |
| `pii_masked` | `bit` | Yes | `CVParseRequest.mask_pii` | Default `1`. |
| `created_at` | `datetime2(3)` | Yes | Generated | Default UTC. |

Privacy: no `fileBase64`, email, phone, or full raw CV text by default.

### `cv_profiles`

Stores the sanitized structured CV profile produced by `CVProfile`.

| Column | SQL Server Type | Required | Source | Notes |
| --- | --- | --- | --- | --- |
| `cv_profile_id` | `uniqueidentifier` | Yes | Generated | Primary key. |
| `cv_document_id` | `uniqueidentifier` | No | `raw_cv_documents` | FK when parsed from a stored document. |
| `user_id` | `uniqueidentifier` | No | Backend contract | Optional owner. |
| `candidate_name_hash` | `char(64)` | No | `CVProfile.candidate_name` | Hash instead of raw name by default. |
| `title` | `nvarchar(255)` | No | `CVProfile.title` | Target/current role. |
| `summary` | `nvarchar(2000)` | No | `CVProfile.summary` | Sanitized summary. |
| `location` | `nvarchar(255)` | No | `CVProfile.location` | Normalized where possible. |
| `skills_json` | `nvarchar(max)` | Yes | `CVProfile.skills` | JSON array of canonical labels. |
| `languages_json` | `nvarchar(max)` | No | `CVProfile.languages` | JSON array. |
| `total_years_experience` | `decimal(5,2)` | No | `CVProfile.total_years_experience` | Non-negative. |
| `experiences_json` | `nvarchar(max)` | No | `CVProfile.experiences` | JSON array of title/company/dates/skills. |
| `education_json` | `nvarchar(max)` | No | `CVProfile.education` | JSON array. |
| `projects_json` | `nvarchar(max)` | No | `CVProfile.projects` | JSON array with project evidence. |
| `certificates_json` | `nvarchar(max)` | No | `CVProfile.certificates` | JSON array. |
| `salary_expectation_min` | `decimal(18,2)` | No | Extracted from CV text | Added when detected. |
| `salary_expectation_max` | `decimal(18,2)` | No | Extracted from CV text | Added when detected. |
| `salary_currency` | `char(3)` | No | Extracted from CV text | ISO-like currency code. |
| `preferred_work_mode` | `nvarchar(30)` | No | Extracted from CV text | `remote`, `hybrid`, `onsite`, `unknown`. |
| `profile_json` | `nvarchar(max)` | Yes | `CVProfile.model_dump()` | Full sanitized profile snapshot. |
| `parser_version` | `nvarchar(100)` | No | Parser | Version used for reproducibility. |
| `created_at` | `datetime2(3)` | Yes | Generated | Default UTC. |

Privacy: do not store `email` or `phone` raw. Add separate encrypted fields only
if the product explicitly needs them.

### `raw_job_postings`

Stores source/crawl metadata and a safe reference to raw JD data.

| Column | SQL Server Type | Required | Source | Notes |
| --- | --- | --- | --- | --- |
| `raw_job_id` | `uniqueidentifier` | Yes | Generated | Primary key. |
| `source` | `nvarchar(100)` | Yes | `JDResponse.source`, `JobDescription.source` | Example: `topcv`, `itviec`, `sample`. |
| `source_url` | `nvarchar(1000)` | No | `source_url` | Original URL. |
| `external_id` | `nvarchar(255)` | No | `external_id` | Source posting id. |
| `crawl_run_id` | `uniqueidentifier` | No | `crawl_runs` | FK. |
| `raw_html_ref` | `nvarchar(500)` | No | Scraper | Object/file ref if raw HTML is stored. |
| `raw_text_hash` | `char(64)` | No | Scraper | Hash for dedup. |
| `raw_text_preview` | `nvarchar(1000)` | No | Scraper | Short cleaned preview. |
| `crawl_status` | `nvarchar(30)` | Yes | `crawl_status` | `success`, `failed`, `skipped`, `blocked`. |
| `http_status` | `int` | No | Scraper | HTTP response code. |
| `error_code` | `nvarchar(100)` | No | Scraper | Machine-readable error. |
| `crawled_at` | `datetime2(3)` | No | `crawled_at` | UTC. |
| `created_at` | `datetime2(3)` | Yes | Generated | Default UTC. |

Recommended unique key: `source + external_id` when `external_id` exists;
otherwise use `source_url` or content hash.

### `job_posts_normalized`

Stores normalized JD fields from `JobDescription`.

| Column | SQL Server Type | Required | Source | Notes |
| --- | --- | --- | --- | --- |
| `job_id` | `uniqueidentifier` | Yes | Generated | Primary key. |
| `raw_job_id` | `uniqueidentifier` | No | `raw_job_postings` | FK. |
| `source` | `nvarchar(100)` | Yes | `JobDescription.source` | Source name. |
| `source_url` | `nvarchar(1000)` | No | `JobDescription.source_url` | Original URL. |
| `external_id` | `nvarchar(255)` | No | `JobDescription.external_id` | Source id. |
| `title` | `nvarchar(255)` | Yes | `JobDescription.title` | Normalized title. |
| `company_name` | `nvarchar(255)` | No | `company_name` | Company. |
| `location` | `nvarchar(255)` | No | `location` | Normalized display location. |
| `salary_min` | `decimal(18,2)` | No | `salary_min` | Normalized numeric salary. |
| `salary_max` | `decimal(18,2)` | No | `salary_max` | Normalized numeric salary. |
| `currency` | `char(3)` | No | `currency` | Example: `USD`, `VND`. |
| `job_type` | `nvarchar(30)` | Yes | `job_type` | `full_time`, `part_time`, `contract`, `internship`, `remote`, `unknown`. |
| `work_mode` | `nvarchar(30)` | No | Entity/normalizer | `remote`, `hybrid`, `onsite`, `unknown`. |
| `level` | `nvarchar(30)` | Yes | `level` | `intern`, `fresher`, `junior`, `middle`, `senior`, `lead`, `manager`, `unknown`. |
| `posted_at` | `date` | No | `posted_at` | Posting date. |
| `expired_at` | `date` | No | `expired_at` | Expiry date. |
| `required_skills_json` | `nvarchar(max)` | Yes | `required_skills` | JSON array. |
| `nice_to_have_skills_json` | `nvarchar(max)` | No | `nice_to_have_skills` | JSON array. |
| `min_years_experience` | `decimal(5,2)` | No | `min_years_experience` | Non-negative. |
| `description_text` | `nvarchar(max)` | Yes | `description_text` | Cleaned JD text. |
| `requirements_text` | `nvarchar(max)` | No | `requirements_text` | Cleaned requirements. |
| `benefits_text` | `nvarchar(max)` | No | `benefits_text` | Cleaned benefits. |
| `data_quality_flags_json` | `nvarchar(max)` | No | `DataQualityFlags` | Missing salary/company, parse confidence. |
| `normalized_json` | `nvarchar(max)` | Yes | `JobDescription.model_dump()` | Full normalized snapshot. |
| `normalizer_version` | `nvarchar(100)` | No | Normalizer | Data cleaning version. |
| `created_at` | `datetime2(3)` | Yes | Generated | Default UTC. |

### `job_source_configs`

Stores source metadata for intent-based source routing.

| Column | SQL Server Type | Required | Source | Notes |
| --- | --- | --- | --- | --- |
| `job_source_id` | `uniqueidentifier` | Yes | Generated | Primary key. |
| `source` | `nvarchar(100)` | Yes | Data source config | Unique source name. |
| `display_name` | `nvarchar(255)` | Yes | Data source config | Example: `TopCV`. |
| `supported_regions_json` | `nvarchar(max)` | No | Manual config | JSON array. |
| `strong_roles_json` | `nvarchar(max)` | No | Manual config | Roles/source strengths. |
| `supports_salary` | `bit` | Yes | Manual config | Whether salary is commonly available. |
| `supports_remote_filter` | `bit` | Yes | Manual config | Whether source supports remote filter. |
| `crawl_policy` | `nvarchar(50)` | Yes | Manual config | `allowed`, `manual_only`, `api_only`, `blocked`. |
| `rate_limit_per_minute` | `int` | No | Manual config | Crawl guard. |
| `notes` | `nvarchar(1000)` | No | Manual config | Operational notes. |
| `created_at` | `datetime2(3)` | Yes | Generated | Default UTC. |

### `crawl_runs`

Stores one crawl/search attempt.

| Column | SQL Server Type | Required | Source | Notes |
| --- | --- | --- | --- | --- |
| `crawl_run_id` | `uniqueidentifier` | Yes | Generated | Primary key. |
| `source` | `nvarchar(100)` | Yes | Request/source routing | Source crawled. |
| `query_text` | `nvarchar(1000)` | No | Chat intent/search | Human-readable query. |
| `intent_snapshot_json` | `nvarchar(max)` | No | Parsed intent | Source/role/salary/location/work mode filters. |
| `status` | `nvarchar(30)` | Yes | Crawler | `running`, `success`, `partial`, `failed`, `blocked`. |
| `requested_count` | `int` | No | Crawler request | Requested jobs. |
| `fetched_count` | `int` | No | Crawler output | Raw fetched count. |
| `normalized_count` | `int` | No | Normalizer output | Normalized jobs count. |
| `duration_ms` | `int` | No | Crawler | Runtime. |
| `error_code` | `nvarchar(100)` | No | Crawler | Short error. |
| `started_at` | `datetime2(3)` | Yes | Generated | UTC. |
| `finished_at` | `datetime2(3)` | No | Generated | UTC. |

### `entities`

Stores extracted entities from CV, JD, or chat text.

| Column | SQL Server Type | Required | Source | Notes |
| --- | --- | --- | --- | --- |
| `entity_id` | `uniqueidentifier` | Yes | Generated | Primary key. |
| `object_type` | `nvarchar(30)` | Yes | Request context | `cv_profile`, `job_post`, `chat_message`, `raw_cv`, `raw_job`. |
| `object_id` | `uniqueidentifier` | No | Parent row | Parent id when available. |
| `document_type` | `nvarchar(20)` | Yes | `EntityExtractionRequest.document_type` | `cv`, `jd`, `other`. |
| `language` | `nvarchar(20)` | No | `EntityExtractionRequest.language` | `vi`, `en`, `mixed`, `unknown`. |
| `entity_text` | `nvarchar(500)` | Yes | `ExtractedEntity.text` | Original entity text. |
| `entity_type` | `nvarchar(100)` | Yes | `ExtractedEntity.label` | `skill`, `occupation`, `salary`, etc. |
| `normalized_text` | `nvarchar(500)` | No | `ExtractedEntity.normalized` | Canonical text. |
| `confidence` | `decimal(5,4)` | Yes | `ExtractedEntity.confidence` | 0-1. |
| `start_char` | `int` | No | `ExtractedEntity.start_char` | Offset when available. |
| `end_char` | `int` | No | `ExtractedEntity.end_char` | Offset when available. |
| `source_span` | `nvarchar(500)` | No | `ExtractedEntity.source_span` | Matched span. |
| `section` | `nvarchar(100)` | No | `ExtractedEntity.section` | CV/JD section. |
| `field_name` | `nvarchar(100)` | No | Pipeline context | JSON field if known. |
| `evidence_preview` | `nvarchar(1000)` | No | `ExtractedEntity.evidence` | Sanitized preview only. |
| `aliases_json` | `nvarchar(max)` | No | `ExtractedEntity.aliases` | JSON array. |
| `recency` | `nvarchar(50)` | No | `ExtractedEntity.recency` | Optional recency label. |
| `extractor_version` | `nvarchar(100)` | No | Entity extractor | Version. |
| `created_at` | `datetime2(3)` | Yes | Generated | Default UTC. |

### `esco_concepts`

Stores ESCO skills and occupations from seed/full import.

| Column | SQL Server Type | Required | Source | Notes |
| --- | --- | --- | --- | --- |
| `esco_uri` | `nvarchar(500)` | Yes | ESCO seed/import | Primary key. |
| `preferred_label` | `nvarchar(500)` | Yes | ESCO | Preferred label. |
| `concept_type` | `nvarchar(30)` | Yes | ESCO | `skill`, `occupation`. |
| `skill_type` | `nvarchar(100)` | No | ESCO skill | Example: `knowledge`. |
| `reuse_level` | `nvarchar(100)` | No | ESCO skill | Example: `sector-specific`. |
| `isco_group` | `nvarchar(50)` | No | ESCO occupation | Example: `2512`. |
| `occupation_code` | `nvarchar(50)` | No | ESCO occupation | Example: `2512.4`. |
| `aliases_json` | `nvarchar(max)` | No | ESCO seed/import | JSON array. |
| `language` | `nvarchar(20)` | Yes | ESCO seed/import | `en`, `vi`, etc. |
| `esco_version` | `nvarchar(100)` | Yes | ESCO seed/import | Example: `v1.2.0`. |
| `source` | `nvarchar(255)` | Yes | ESCO seed/import | Source description. |
| `created_at` | `datetime2(3)` | Yes | Generated | Default UTC. |

### `entity_concept_links`

Maps extracted entities to ESCO/taxonomy concepts.

| Column | SQL Server Type | Required | Source | Notes |
| --- | --- | --- | --- | --- |
| `entity_concept_link_id` | `uniqueidentifier` | Yes | Generated | Primary key. |
| `entity_id` | `uniqueidentifier` | Yes | `entities` | FK. |
| `esco_uri` | `nvarchar(500)` | No | `ExtractedEntity.esco_uri` | FK to `esco_concepts` when ESCO-mapped. |
| `taxonomy_id` | `nvarchar(255)` | No | Internal taxonomy | Optional internal concept id. |
| `preferred_label` | `nvarchar(500)` | No | `ExtractedEntity.esco_preferred_label` | Denormalized display label. |
| `concept_type` | `nvarchar(30)` | No | `ExtractedEntity.esco_type` | `skill`, `occupation`. |
| `isco_group` | `nvarchar(50)` | No | `ExtractedEntity.isco_group` | Occupation grouping. |
| `confidence` | `decimal(5,4)` | Yes | Mapper | 0-1. |
| `mapper_version` | `nvarchar(100)` | Yes | ESCO mapper | Version. |
| `created_at` | `datetime2(3)` | Yes | Generated | Default UTC. |

### `cv_job_features`

Stores feature values for one CV/job pair before or during scoring.

| Column | SQL Server Type | Required | Source | Notes |
| --- | --- | --- | --- | --- |
| `feature_id` | `uniqueidentifier` | Yes | Generated | Primary key. |
| `cv_profile_id` | `uniqueidentifier` | Yes | `cv_profiles` | FK. |
| `job_id` | `uniqueidentifier` | Yes | `job_posts_normalized` | FK. |
| `skill_overlap_ratio` | `decimal(6,5)` | No | Matching service | Required skill overlap. |
| `matched_required_count` | `int` | No | `MatchResult.matched_skills` | Count. |
| `missing_required_count` | `int` | No | `MatchResult.missing_required_skills` | Count. |
| `nice_to_have_count` | `int` | No | `MatchResult.nice_to_have_skills` | Count. |
| `experience_gap_years` | `decimal(5,2)` | No | Matching/analysis | Positive means CV is short. |
| `salary_fit` | `nvarchar(30)` | No | Analysis | `match`, `partial`, `gap`, `unknown`. |
| `location_fit` | `nvarchar(30)` | No | Analysis | `match`, `partial`, `gap`, `unknown`. |
| `work_mode_fit` | `nvarchar(30)` | No | Analysis | `match`, `partial`, `gap`, `unknown`. |
| `title_similarity` | `decimal(6,5)` | No | Matching service | 0-1. |
| `text_similarity` | `decimal(6,5)` | No | Matching service | TF-IDF or baseline similarity. |
| `embedding_similarity` | `decimal(6,5)` | No | Phase 4+ | Null until embeddings exist. |
| `features_json` | `nvarchar(max)` | Yes | Matching service | Full feature snapshot. |
| `feature_version` | `nvarchar(100)` | Yes | Matching service | Example: `rule-based-feature-v1`. |
| `created_at` | `datetime2(3)` | Yes | Generated | Default UTC. |

Recommended unique key: `cv_profile_id + job_id + feature_version`.

### `match_runs`

Stores scoring/ranking execution for one CV/job pair.

| Column | SQL Server Type | Required | Source | Notes |
| --- | --- | --- | --- | --- |
| `match_run_id` | `uniqueidentifier` | Yes | Generated | Primary key. |
| `feature_id` | `uniqueidentifier` | No | `cv_job_features` | FK. |
| `cv_profile_id` | `uniqueidentifier` | Yes | Request context | FK. |
| `job_id` | `uniqueidentifier` | Yes | Request context | FK. |
| `overall_score` | `decimal(5,2)` | Yes | `MatchResult.overall_score` | 0-100. |
| `matched_skills_json` | `nvarchar(max)` | Yes | `MatchResult.matched_skills` | JSON array. |
| `missing_required_skills_json` | `nvarchar(max)` | Yes | `MatchResult.missing_required_skills` | JSON array. |
| `nice_to_have_skills_json` | `nvarchar(max)` | No | `MatchResult.nice_to_have_skills` | JSON array. |
| `experience_gap` | `nvarchar(1000)` | No | `MatchResult.experience_gap` | Text explanation. |
| `salary_gap` | `nvarchar(1000)` | No | `MatchResult.salary_gap` | Text explanation. |
| `recommendation_reason` | `nvarchar(2000)` | Yes | `MatchResult.recommendation_reason` | Short display reason. |
| `model_version` | `nvarchar(100)` | Yes | Matching service | Example: `rule-based-match-v1`. |
| `feature_version` | `nvarchar(100)` | Yes | Matching service | Feature version. |
| `latency_ms` | `int` | No | API/service timing | Runtime. |
| `request_id` | `nvarchar(100)` | No | API context | Trace id. |
| `created_at` | `datetime2(3)` | Yes | Generated | Default UTC. |

### `job_fit_analyses`

Stores `JobFitAnalysis` header rows.

| Column | SQL Server Type | Required | Source | Notes |
| --- | --- | --- | --- | --- |
| `analysis_id` | `uniqueidentifier` | Yes | Generated | Primary key. |
| `match_run_id` | `uniqueidentifier` | No | `match_runs` | FK when available. |
| `cv_profile_id` | `uniqueidentifier` | Yes | Request context | FK. |
| `job_id` | `uniqueidentifier` | Yes | Request context | FK. |
| `overall_score` | `decimal(5,2)` | Yes | `JobFitAnalysis.overall_score` | 0-100. |
| `matched_skills_json` | `nvarchar(max)` | Yes | `matched_skills` | JSON array. |
| `missing_required_skills_json` | `nvarchar(max)` | Yes | `missing_required_skills` | JSON array. |
| `nice_to_have_skills_json` | `nvarchar(max)` | No | `nice_to_have_skills` | JSON array. |
| `recommendation_reason` | `nvarchar(2000)` | Yes | `recommendation_reason` | Display text. |
| `improvement_focus_json` | `nvarchar(max)` | No | `improvement_focus` | JSON array. |
| `analyzer_version` | `nvarchar(100)` | Yes | `analyzer_version` | Example: `rule-based-gap-v1`. |
| `feature_version` | `nvarchar(100)` | No | Matching/analysis | Feature version. |
| `analysis_json` | `nvarchar(max)` | Yes | `JobFitAnalysis.model_dump()` | Full snapshot. |
| `created_at` | `datetime2(3)` | Yes | Generated | Default UTC. |

### `job_fit_gap_items`

Stores one `FitGap` item per analysis.

| Column | SQL Server Type | Required | Source | Notes |
| --- | --- | --- | --- | --- |
| `gap_id` | `uniqueidentifier` | Yes | Generated | Primary key. |
| `analysis_id` | `uniqueidentifier` | Yes | `job_fit_analyses` | FK. |
| `category` | `nvarchar(50)` | Yes | `FitGap.category` | `skill`, `experience`, `salary`, etc. |
| `status` | `nvarchar(30)` | Yes | `FitGap.status` | `match`, `gap`, `partial`, `unknown`. |
| `severity` | `nvarchar(30)` | Yes | `FitGap.severity` | `low`, `medium`, `high`. |
| `requirement` | `nvarchar(500)` | Yes | `FitGap.requirement` | JD requirement being evaluated. |
| `message` | `nvarchar(2000)` | Yes | `FitGap.message` | Explanation. |
| `guardrail` | `nvarchar(2000)` | No | `FitGap.guardrail` | Text guardrail. |
| `sort_order` | `int` | Yes | Generated | Stable UI order. |
| `created_at` | `datetime2(3)` | Yes | Generated | Default UTC. |

### `cv_suggestions`

Stores one suggestion run header.

| Column | SQL Server Type | Required | Source | Notes |
| --- | --- | --- | --- | --- |
| `suggestion_run_id` | `uniqueidentifier` | Yes | Generated | Primary key. |
| `analysis_id` | `uniqueidentifier` | No | `job_fit_analyses` | FK when suggestions use a saved analysis. |
| `cv_profile_id` | `uniqueidentifier` | Yes | Request context | FK. |
| `job_id` | `uniqueidentifier` | Yes | Request context | FK. |
| `overall_score` | `decimal(5,2)` | Yes | `CvSuggestionsResponse.overall_score` | 0-100. |
| `blocked_claims_json` | `nvarchar(max)` | No | `blocked_claims` | JSON array. |
| `source_analysis_version` | `nvarchar(100)` | Yes | `source_analysis_version` | Analyzer version. |
| `suggestion_version` | `nvarchar(100)` | Yes | `suggestion_version` | Example: `rule-based-suggestion-v1`. |
| `suggestion_json` | `nvarchar(max)` | Yes | `CvSuggestionsResponse.model_dump()` | Full snapshot. |
| `created_at` | `datetime2(3)` | Yes | Generated | Default UTC. |

### `cv_suggestion_items`

Stores one `CvSuggestion`.

| Column | SQL Server Type | Required | Source | Notes |
| --- | --- | --- | --- | --- |
| `suggestion_item_id` | `uniqueidentifier` | Yes | Generated | Primary key. |
| `suggestion_run_id` | `uniqueidentifier` | Yes | `cv_suggestions` | FK. |
| `section` | `nvarchar(50)` | Yes | `CvSuggestion.section` | `summary`, `skills`, `experience`, `projects`, `guardrail`. |
| `action` | `nvarchar(50)` | Yes | `CvSuggestion.action` | `add_if_true`, `clarify`, `rewrite`, `do_not_claim`. |
| `title` | `nvarchar(500)` | Yes | `CvSuggestion.title` | Display title. |
| `current_gap` | `nvarchar(2000)` | Yes | `CvSuggestion.current_gap` | Source gap. |
| `suggested_wording` | `nvarchar(max)` | Yes | `CvSuggestion.suggested_wording` | Evidence-bound wording. |
| `rationale` | `nvarchar(2000)` | Yes | `CvSuggestion.rationale` | Why it matters. |
| `sort_order` | `int` | Yes | Generated | Stable UI order. |
| `created_at` | `datetime2(3)` | Yes | Generated | Default UTC. |

### `evidence_refs`

Stores `EvidenceRef` records attached to fit gaps or suggestion items.

| Column | SQL Server Type | Required | Source | Notes |
| --- | --- | --- | --- | --- |
| `evidence_id` | `uniqueidentifier` | Yes | Generated | Primary key. |
| `parent_type` | `nvarchar(50)` | Yes | Pipeline | `fit_gap`, `suggestion_item`, `analysis`, `match_run`. |
| `parent_id` | `uniqueidentifier` | Yes | Parent row | Parent id. |
| `source` | `nvarchar(20)` | Yes | `EvidenceRef.source` | `cv`, `jd`. |
| `source_object_id` | `uniqueidentifier` | No | Parent CV/JD | `cv_profile_id` or `job_id`. |
| `section` | `nvarchar(100)` | No | `EvidenceRef.section` | Example: `skills`, `projects`, `requirements`. |
| `field_name` | `nvarchar(100)` | No | `EvidenceRef.field` | Source JSON field. |
| `text_hash` | `char(64)` | No | Evidence text | Use if raw text cannot be stored. |
| `text_preview` | `nvarchar(1000)` | Yes | `EvidenceRef.text` | Sanitized/trimmed preview. |
| `source_span` | `nvarchar(500)` | No | `EvidenceRef.source_span` | Matched span. |
| `confidence` | `decimal(5,4)` | Yes | `EvidenceRef.confidence` | 0-1. |
| `created_at` | `datetime2(3)` | Yes | Generated | Default UTC. |

Privacy: `text_preview` should be short and sanitized. Use `text_hash` for
long or sensitive spans.

### `guardrail_flags`

Stores guardrails attached to gaps, suggestions, or runs.

| Column | SQL Server Type | Required | Source | Notes |
| --- | --- | --- | --- | --- |
| `guardrail_id` | `uniqueidentifier` | Yes | Generated | Primary key. |
| `parent_type` | `nvarchar(50)` | Yes | Pipeline | `fit_gap`, `suggestion_item`, `suggestion_run`. |
| `parent_id` | `uniqueidentifier` | Yes | Parent row | Parent id. |
| `code` | `nvarchar(100)` | Yes | `SuggestionGuardrail.code` or derived from `FitGap.guardrail` | Example: `requires_verified_experience`. |
| `severity` | `nvarchar(30)` | Yes | `SuggestionGuardrail.severity` | `info`, `warning`, `blocker`. |
| `message` | `nvarchar(2000)` | Yes | Guardrail message | Human-readable rule. |
| `created_at` | `datetime2(3)` | Yes | Generated | Default UTC. |

## P1 Evaluation And Training Tables

These tables can be created in Phase 6.5, then populated during Phase 7 and
Phase 9.

### `labeled_cv_jd_pairs`

| Column | SQL Server Type | Required | Source | Notes |
| --- | --- | --- | --- | --- |
| `pair_id` | `uniqueidentifier` | Yes | Generated | Primary key. |
| `cv_profile_id` | `uniqueidentifier` | Yes | Labeling workflow | FK. |
| `job_id` | `uniqueidentifier` | Yes | Labeling workflow | FK. |
| `label` | `nvarchar(50)` | Yes | Human label | `strong`, `medium`, `weak`, `reject`, or numeric rubric. |
| `label_score` | `decimal(5,2)` | No | Human label | Optional 0-100 score. |
| `reason` | `nvarchar(2000)` | No | Reviewer | Explanation. |
| `reviewer` | `nvarchar(100)` | No | Labeling workflow | Human or trusted source. |
| `split` | `nvarchar(30)` | Yes | Dataset builder | `train`, `validation`, `test`. |
| `dataset_version` | `nvarchar(100)` | Yes | Dataset builder | Version. |
| `created_at` | `datetime2(3)` | Yes | Generated | Default UTC. |

### `labeled_entities`

| Column | SQL Server Type | Required | Source | Notes |
| --- | --- | --- | --- | --- |
| `labeled_entity_id` | `uniqueidentifier` | Yes | Generated | Primary key. |
| `object_type` | `nvarchar(30)` | Yes | Labeling workflow | `cv_profile`, `job_post`, `chat_message`. |
| `object_id` | `uniqueidentifier` | No | Labeling workflow | Parent id. |
| `text_hash` | `char(64)` | Yes | Labeling workflow | Hash of source text. |
| `text_preview` | `nvarchar(1000)` | No | Labeling workflow | Short sanitized context. |
| `start_char` | `int` | Yes | Labeling workflow | Gold span start. |
| `end_char` | `int` | Yes | Labeling workflow | Gold span end. |
| `entity_text` | `nvarchar(500)` | Yes | Labeling workflow | Gold entity text. |
| `entity_type` | `nvarchar(100)` | Yes | Labeling workflow | Gold label. |
| `normalized_text` | `nvarchar(500)` | No | Labeling workflow | Gold canonical text. |
| `esco_uri` | `nvarchar(500)` | No | Labeling workflow | Gold ESCO concept. |
| `reviewer` | `nvarchar(100)` | No | Labeling workflow | Reviewer id/name. |
| `split` | `nvarchar(30)` | Yes | Dataset builder | `train`, `validation`, `test`. |
| `dataset_version` | `nvarchar(100)` | Yes | Dataset builder | Version. |
| `created_at` | `datetime2(3)` | Yes | Generated | Default UTC. |

### `labeled_intents`

| Column | SQL Server Type | Required | Source | Notes |
| --- | --- | --- | --- | --- |
| `intent_label_id` | `uniqueidentifier` | Yes | Generated | Primary key. |
| `utterance_hash` | `char(64)` | Yes | Chat/log labeling | Hash of user utterance. |
| `utterance_preview` | `nvarchar(1000)` | No | Chat/log labeling | Sanitized preview. |
| `language` | `nvarchar(20)` | No | Labeling workflow | `vi`, `en`, `mixed`, `unknown`. |
| `expected_intent_json` | `nvarchar(max)` | Yes | Labeling workflow | Role/source/salary/location/work mode/etc. |
| `expected_follow_up_question` | `nvarchar(1000)` | No | Labeling workflow | Expected question if intent incomplete. |
| `reviewer` | `nvarchar(100)` | No | Labeling workflow | Reviewer. |
| `split` | `nvarchar(30)` | Yes | Dataset builder | `train`, `validation`, `test`. |
| `dataset_version` | `nvarchar(100)` | Yes | Dataset builder | Version. |
| `created_at` | `datetime2(3)` | Yes | Generated | Default UTC. |

### `model_experiments`

| Column | SQL Server Type | Required | Source | Notes |
| --- | --- | --- | --- | --- |
| `experiment_id` | `uniqueidentifier` | Yes | Generated | Primary key. |
| `experiment_type` | `nvarchar(50)` | Yes | Experiment runner | `embedding_benchmark`, `ner_finetune`, `intent_classifier`, `reranker`. |
| `model_name` | `nvarchar(255)` | Yes | Experiment runner | Example: `BAAI/bge-m3`. |
| `model_revision` | `nvarchar(255)` | No | Experiment runner | Pinned revision/hash. |
| `baseline_version` | `nvarchar(100)` | No | Experiment runner | Rule/model baseline. |
| `dataset_version` | `nvarchar(100)` | Yes | Experiment runner | Evaluation dataset. |
| `metrics_json` | `nvarchar(max)` | Yes | Experiment runner | NDCG, Precision@K, F1, latency, RAM. |
| `artifact_ref` | `nvarchar(500)` | No | Experiment runner | Model/report artifact path. |
| `decision` | `nvarchar(50)` | No | Reviewer | `accepted`, `rejected`, `needs_more_data`. |
| `notes` | `nvarchar(2000)` | No | Reviewer | Known failures/decision notes. |
| `created_at` | `datetime2(3)` | Yes | Generated | Default UTC. |

## P2 Vector/Cache Tables

These are useful once Phase 4 embedding benchmark starts using real text chunks.

### `text_chunks`

| Column | SQL Server Type | Required | Source | Notes |
| --- | --- | --- | --- | --- |
| `chunk_id` | `uniqueidentifier` | Yes | Generated | Primary key. |
| `object_type` | `nvarchar(30)` | Yes | Chunker | `cv_profile`, `job_post`. |
| `object_id` | `uniqueidentifier` | Yes | Chunker | Parent id. |
| `section` | `nvarchar(100)` | No | Chunker | CV/JD section. |
| `chunk_order` | `int` | Yes | Chunker | Stable order. |
| `chunk_text_hash` | `char(64)` | Yes | Chunker | Dedup/cache key. |
| `chunk_text_preview` | `nvarchar(1000)` | No | Chunker | Sanitized preview. |
| `token_count` | `int` | No | Chunker | Approximate token count. |
| `chunker_version` | `nvarchar(100)` | Yes | Chunker | Version. |
| `created_at` | `datetime2(3)` | Yes | Generated | Default UTC. |

### `embeddings`

| Column | SQL Server Type | Required | Source | Notes |
| --- | --- | --- | --- | --- |
| `embedding_id` | `uniqueidentifier` | Yes | Generated | Primary key. |
| `chunk_id` | `uniqueidentifier` | Yes | `text_chunks` | FK. |
| `model_name` | `nvarchar(255)` | Yes | Embedding service | Example: `BAAI/bge-m3`. |
| `model_revision` | `nvarchar(255)` | No | Embedding service | Pinned revision/hash. |
| `embedding_dim` | `int` | No | Embedding service | Vector dimension. |
| `vector_ref` | `nvarchar(500)` | No | Vector store | FAISS/Qdrant/S3/file reference. |
| `vector_blob` | `varbinary(max)` | No | Optional local storage | Only if storing vector in SQL Server. |
| `chunk_text_hash` | `char(64)` | Yes | `text_chunks.chunk_text_hash` | Cache invalidation. |
| `created_at` | `datetime2(3)` | Yes | Generated | Default UTC. |

Recommendation: keep SQL Server as metadata/cache owner and store large vectors
in a dedicated vector store or FAISS artifact unless the dataset is tiny.

## Relationship Summary

- `raw_cv_documents` 1 -> many `cv_profiles`
- `raw_job_postings` 1 -> 0/1 `job_posts_normalized`
- `crawl_runs` 1 -> many `raw_job_postings`
- `cv_profiles` and `job_posts_normalized` -> many `entities`
- `entities` 1 -> many `entity_concept_links`
- `esco_concepts` 1 -> many `entity_concept_links`
- `cv_profiles` + `job_posts_normalized` -> `cv_job_features` -> `match_runs`
- `match_runs` -> `job_fit_analyses` -> `job_fit_gap_items`
- `job_fit_analyses` -> `cv_suggestions` -> `cv_suggestion_items`
- `job_fit_gap_items` and `cv_suggestion_items` -> many `evidence_refs`
- `job_fit_gap_items`, `cv_suggestion_items`, and `cv_suggestions` -> many `guardrail_flags`
- `cv_profiles` + `job_posts_normalized` -> `labeled_cv_jd_pairs`
- `cv_profiles`/`job_posts_normalized` -> `text_chunks` -> `embeddings`

## Indexes To Add In Migrations

- `raw_job_postings(source, external_id)` unique filtered where `external_id` is not null.
- `raw_job_postings(source_url)` unique filtered where `source_url` is not null.
- `job_posts_normalized(source, external_id)` unique filtered where `external_id` is not null.
- `entities(object_type, object_id, entity_type)`.
- `entity_concept_links(esco_uri)`.
- `cv_job_features(cv_profile_id, job_id, feature_version)` unique.
- `match_runs(cv_profile_id, job_id, created_at desc)`.
- `job_fit_analyses(cv_profile_id, job_id, created_at desc)`.
- `cv_suggestions(cv_profile_id, job_id, created_at desc)`.
- `evidence_refs(parent_type, parent_id)`.
- `labeled_cv_jd_pairs(dataset_version, split)`.
- `model_experiments(experiment_type, dataset_version, model_name)`.
- `text_chunks(object_type, object_id, chunk_order)`.
- `embeddings(chunk_id, model_name, model_revision)`.

## Open Decisions Before Migration

- Whether AI-service writes SQL Server directly or Backend persists AI payloads.
- Whether `user_id` and `conversation_id` are UUIDs or Backend string ids.
- Whether full `description_text` and `requirements_text` are acceptable to store
  for all job sources.
- Whether full sanitized CV summary/project descriptions are acceptable to store.
- Whether vector data lives in SQL Server `varbinary(max)` or external vector
  storage referenced by `vector_ref`.
