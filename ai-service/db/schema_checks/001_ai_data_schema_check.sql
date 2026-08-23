/*
  Schema checklist for ai_data migration 001.

  Run after ai-service/db/migrations/001_create_ai_data_tables.sql.
*/

SET NOCOUNT ON;

DECLARE @expected_tables TABLE (
    table_name SYSNAME NOT NULL PRIMARY KEY
);

INSERT INTO @expected_tables (table_name)
VALUES
    (N'job_source_configs'),
    (N'crawl_runs'),
    (N'raw_cv_documents'),
    (N'raw_job_postings'),
    (N'cv_profiles'),
    (N'job_posts_normalized'),
    (N'esco_concepts'),
    (N'entities'),
    (N'entity_concept_links'),
    (N'cv_job_features'),
    (N'match_runs'),
    (N'job_fit_analyses'),
    (N'job_fit_gap_items'),
    (N'cv_suggestions'),
    (N'cv_suggestion_items'),
    (N'evidence_refs'),
    (N'guardrail_flags'),
    (N'labeled_cv_jd_pairs'),
    (N'labeled_entities'),
    (N'labeled_intents'),
    (N'model_experiments'),
    (N'text_chunks'),
    (N'embeddings');

DECLARE @expected_columns TABLE (
    table_name SYSNAME NOT NULL,
    column_name SYSNAME NOT NULL,
    PRIMARY KEY (table_name, column_name)
);

INSERT INTO @expected_columns (table_name, column_name)
VALUES
    (N'raw_cv_documents', N'file_sha256'),
    (N'raw_cv_documents', N'text_preview'),
    (N'raw_cv_documents', N'sanitized_json'),
    (N'cv_profiles', N'profile_json'),
    (N'cv_profiles', N'skills_json'),
    (N'raw_job_postings', N'source'),
    (N'raw_job_postings', N'external_id'),
    (N'raw_job_postings', N'source_url_hash'),
    (N'raw_job_postings', N'content_hash'),
    (N'job_posts_normalized', N'normalized_json'),
    (N'job_posts_normalized', N'required_skills_json'),
    (N'job_posts_normalized', N'title_esco_uri'),
    (N'esco_concepts', N'esco_uri'),
    (N'esco_concepts', N'preferred_label'),
    (N'esco_concepts', N'concept_type'),
    (N'esco_concepts', N'isco_group'),
    (N'entities', N'object_type'),
    (N'entities', N'object_id'),
    (N'entities', N'entity_type'),
    (N'entity_concept_links', N'entity_id'),
    (N'entity_concept_links', N'esco_uri'),
    (N'entity_concept_links', N'confidence'),
    (N'cv_job_features', N'semantic_similarity_score'),
    (N'cv_job_features', N'overall_feature_score'),
    (N'match_runs', N'match_score'),
    (N'match_runs', N'scoring_model_name'),
    (N'job_fit_analyses', N'overall_score'),
    (N'job_fit_analyses', N'response_payload_json'),
    (N'job_fit_gap_items', N'category'),
    (N'job_fit_gap_items', N'severity'),
    (N'job_fit_gap_items', N'gap_summary'),
    (N'cv_suggestions', N'response_payload_json'),
    (N'cv_suggestion_items', N'suggested_wording'),
    (N'cv_suggestion_items', N'guardrail_code'),
    (N'evidence_refs', N'parent_type'),
    (N'evidence_refs', N'quote_hash'),
    (N'guardrail_flags', N'parent_type'),
    (N'guardrail_flags', N'code'),
    (N'labeled_cv_jd_pairs', N'dataset_version'),
    (N'labeled_cv_jd_pairs', N'split'),
    (N'labeled_entities', N'dataset_version'),
    (N'labeled_entities', N'esco_uri_label'),
    (N'labeled_intents', N'intent_label'),
    (N'labeled_intents', N'slots_json'),
    (N'model_experiments', N'metrics_json'),
    (N'model_experiments', N'artifact_uri'),
    (N'text_chunks', N'chunk_text_hash'),
    (N'embeddings', N'vector_ref'),
    (N'embeddings', N'model_revision');

WITH missing_tables AS (
    SELECT expected.table_name
    FROM @expected_tables AS expected
    LEFT JOIN INFORMATION_SCHEMA.TABLES AS actual
        ON actual.TABLE_SCHEMA = N'ai_data'
       AND actual.TABLE_NAME = expected.table_name
    WHERE actual.TABLE_NAME IS NULL
)
SELECT table_name AS missing_table
FROM missing_tables
ORDER BY table_name;

IF EXISTS (
    SELECT 1
    FROM @expected_tables AS expected
    LEFT JOIN INFORMATION_SCHEMA.TABLES AS actual
        ON actual.TABLE_SCHEMA = N'ai_data'
       AND actual.TABLE_NAME = expected.table_name
    WHERE actual.TABLE_NAME IS NULL
)
BEGIN
    THROW 51000, 'ai_data schema check failed: missing table(s).', 1;
END;

WITH missing_columns AS (
    SELECT expected.table_name, expected.column_name
    FROM @expected_columns AS expected
    LEFT JOIN INFORMATION_SCHEMA.COLUMNS AS actual
        ON actual.TABLE_SCHEMA = N'ai_data'
       AND actual.TABLE_NAME = expected.table_name
       AND actual.COLUMN_NAME = expected.column_name
    WHERE actual.COLUMN_NAME IS NULL
)
SELECT table_name AS missing_column_table, column_name AS missing_column
FROM missing_columns
ORDER BY table_name, column_name;

IF EXISTS (
    SELECT 1
    FROM @expected_columns AS expected
    LEFT JOIN INFORMATION_SCHEMA.COLUMNS AS actual
        ON actual.TABLE_SCHEMA = N'ai_data'
       AND actual.TABLE_NAME = expected.table_name
       AND actual.COLUMN_NAME = expected.column_name
    WHERE actual.COLUMN_NAME IS NULL
)
BEGIN
    THROW 51001, 'ai_data schema check failed: missing column(s).', 1;
END;

SELECT COUNT(*) AS ai_data_table_count
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = N'ai_data';

PRINT 'ai_data schema check passed.';
