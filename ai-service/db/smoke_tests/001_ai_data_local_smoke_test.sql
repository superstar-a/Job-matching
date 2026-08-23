/*
  Local smoke test for the AI/Data schema and seed flow.

  Run after:
  - migrations/001_create_ai_data_tables.sql
  - migrations/002_strengthen_ai_data_relationships.sql
  - seeds/001_seed_esco_concepts.sql
  - seeds/002_seed_sample_ai_data.sql
*/

SET NOCOUNT ON;

DECLARE @table_count INT = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = N'ai_data'
);

IF @table_count <> 23
BEGIN
    THROW 51100, 'Expected 23 ai_data tables.', 1;
END;

IF (SELECT COUNT(*) FROM ai_data.esco_concepts) < 6
BEGIN
    THROW 51101, 'Expected at least 6 ESCO concepts.', 1;
END;

IF NOT EXISTS (
    SELECT 1
    FROM ai_data.cv_profiles AS cv
    JOIN ai_data.raw_cv_documents AS raw_cv
      ON raw_cv.raw_cv_id = cv.raw_cv_id
    WHERE cv.cv_profile_id = '10000000-0000-0000-0000-000000000002'
)
BEGIN
    THROW 51102, 'Missing sample CV profile flow.', 1;
END;

IF NOT EXISTS (
    SELECT 1
    FROM ai_data.job_posts_normalized AS job
    JOIN ai_data.raw_job_postings AS raw_job
      ON raw_job.raw_job_id = job.raw_job_id
    JOIN ai_data.crawl_runs AS crawl
      ON crawl.crawl_run_id = raw_job.crawl_run_id
    WHERE job.job_id = '10000000-0000-0000-0000-000000000005'
)
BEGIN
    THROW 51103, 'Missing sample JD ingestion flow.', 1;
END;

IF NOT EXISTS (
    SELECT 1
    FROM ai_data.match_runs AS match_run
    JOIN ai_data.cv_job_features AS feature
      ON feature.feature_id = match_run.feature_id
    JOIN ai_data.job_fit_analyses AS analysis
      ON analysis.match_run_id = match_run.match_run_id
    JOIN ai_data.cv_suggestions AS suggestion
      ON suggestion.analysis_id = analysis.analysis_id
    WHERE match_run.match_score = 0.8250
)
BEGIN
    THROW 51104, 'Missing sample match-analysis-suggestion flow.', 1;
END;

IF NOT EXISTS (
    SELECT 1
    FROM ai_data.entities AS entity
    JOIN ai_data.entity_concept_links AS link
      ON link.entity_id = entity.entity_id
    JOIN ai_data.esco_concepts AS concept
      ON concept.esco_uri = link.esco_uri
    WHERE entity.normalized_text = N'python'
      AND entity.cv_profile_id IS NOT NULL
      AND concept.preferred_label = N'Python (computer programming)'
)
BEGIN
    THROW 51105, 'Missing sample ESCO entity mapping.', 1;
END;

IF NOT EXISTS (
    SELECT 1
    FROM ai_data.labeled_cv_jd_pairs
    WHERE dataset_version = N'eval-seed-2026-08-21'
      AND split = N'test'
)
BEGIN
    THROW 51106, 'Missing sample evaluation label.', 1;
END;

IF NOT EXISTS (
    SELECT 1
    FROM ai_data.embeddings AS embedding
    JOIN ai_data.text_chunks AS chunk
      ON chunk.chunk_id = embedding.chunk_id
    WHERE embedding.vector_ref LIKE N'local://pending/%'
      AND embedding.model_name = N'BAAI/bge-m3'
)
BEGIN
    THROW 51107, 'Missing sample vector refs for embedding benchmark.', 1;
END;

IF NOT EXISTS (
    SELECT 1
    FROM ai_data.labeled_entities
    WHERE dataset_version = N'eval-seed-2026-08-21'
      AND entity_type_label = N'skill'
)
BEGIN
    THROW 51108, 'Missing sample labeled entity.', 1;
END;

IF NOT EXISTS (
    SELECT 1
    FROM ai_data.labeled_intents
    WHERE dataset_version = N'eval-seed-2026-08-21'
      AND intent_label = N'job_search'
)
BEGIN
    THROW 51109, 'Missing sample labeled intent.', 1;
END;

IF NOT EXISTS (
    SELECT 1
    FROM ai_data.model_experiments
    WHERE experiment_type = N'embedding_benchmark'
      AND dataset_version = N'eval-seed-2026-08-21'
      AND status = N'planned'
)
BEGIN
    THROW 51110, 'Missing sample model experiment placeholder.', 1;
END;

IF NOT EXISTS (
    SELECT 1
    FROM ai_data.evidence_refs AS evidence
    JOIN ai_data.job_fit_gap_items AS gap_item
      ON gap_item.gap_id = evidence.job_fit_gap_id
    JOIN ai_data.job_posts_normalized AS job
      ON job.job_id = evidence.source_job_id
    WHERE gap_item.skill_label = N'Docker'
)
BEGIN
    THROW 51111, 'Missing typed evidence relationship to gap/job.', 1;
END;

IF NOT EXISTS (
    SELECT 1
    FROM ai_data.guardrail_flags AS flag
    JOIN ai_data.cv_suggestion_items AS suggestion_item
      ON suggestion_item.suggestion_item_id = flag.cv_suggestion_item_id
    WHERE flag.code = N'requires_verified_experience'
)
BEGIN
    THROW 51112, 'Missing typed guardrail relationship to suggestion item.', 1;
END;

IF NOT EXISTS (
    SELECT 1
    FROM ai_data.text_chunks AS chunk
    JOIN ai_data.cv_profiles AS cv
      ON cv.cv_profile_id = chunk.cv_profile_id
    WHERE chunk.source_field = N'profile_json'
)
BEGIN
    THROW 51113, 'Missing typed text chunk relationship to CV profile.', 1;
END;

SELECT
    @table_count AS ai_data_table_count,
    (SELECT COUNT(*) FROM ai_data.esco_concepts) AS esco_concepts,
    (SELECT COUNT(*) FROM ai_data.cv_profiles) AS cv_profiles,
    (SELECT COUNT(*) FROM ai_data.job_posts_normalized) AS normalized_jobs,
    (SELECT COUNT(*) FROM ai_data.match_runs) AS match_runs,
    (SELECT COUNT(*) FROM ai_data.job_fit_analyses) AS job_fit_analyses,
    (SELECT COUNT(*) FROM ai_data.cv_suggestions) AS cv_suggestions,
    (SELECT COUNT(*) FROM ai_data.labeled_cv_jd_pairs) AS labeled_pairs,
    (SELECT COUNT(*) FROM ai_data.labeled_entities) AS labeled_entities,
    (SELECT COUNT(*) FROM ai_data.labeled_intents) AS labeled_intents,
    (SELECT COUNT(*) FROM ai_data.model_experiments) AS model_experiments,
    (SELECT COUNT(*) FROM ai_data.embeddings) AS embedding_refs;

PRINT 'ai_data local smoke test passed.';
