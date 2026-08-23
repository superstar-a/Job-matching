/*
  Strengthen AI/Data relationships for clearer SQL Server ERD.

  Migration 001 intentionally kept several audit/evidence tables generic with
  object_type/object_id and parent_type/parent_id. This migration keeps those
  generic fields for flexibility, but adds typed nullable FK columns so SSMS and
  other ERD tools can show the core AI/Data graph clearly.

  Run after 001_create_ai_data_tables.sql.
*/

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF COL_LENGTH(N'ai_data.entities', N'cv_profile_id') IS NULL
    ALTER TABLE ai_data.entities ADD cv_profile_id UNIQUEIDENTIFIER NULL;
GO

IF COL_LENGTH(N'ai_data.entities', N'job_id') IS NULL
    ALTER TABLE ai_data.entities ADD job_id UNIQUEIDENTIFIER NULL;
GO

IF COL_LENGTH(N'ai_data.text_chunks', N'cv_profile_id') IS NULL
    ALTER TABLE ai_data.text_chunks ADD cv_profile_id UNIQUEIDENTIFIER NULL;
GO

IF COL_LENGTH(N'ai_data.text_chunks', N'job_id') IS NULL
    ALTER TABLE ai_data.text_chunks ADD job_id UNIQUEIDENTIFIER NULL;
GO

IF COL_LENGTH(N'ai_data.evidence_refs', N'job_fit_analysis_id') IS NULL
    ALTER TABLE ai_data.evidence_refs ADD job_fit_analysis_id UNIQUEIDENTIFIER NULL;
GO

IF COL_LENGTH(N'ai_data.evidence_refs', N'job_fit_gap_id') IS NULL
    ALTER TABLE ai_data.evidence_refs ADD job_fit_gap_id UNIQUEIDENTIFIER NULL;
GO

IF COL_LENGTH(N'ai_data.evidence_refs', N'cv_suggestion_run_id') IS NULL
    ALTER TABLE ai_data.evidence_refs ADD cv_suggestion_run_id UNIQUEIDENTIFIER NULL;
GO

IF COL_LENGTH(N'ai_data.evidence_refs', N'cv_suggestion_item_id') IS NULL
    ALTER TABLE ai_data.evidence_refs ADD cv_suggestion_item_id UNIQUEIDENTIFIER NULL;
GO

IF COL_LENGTH(N'ai_data.evidence_refs', N'source_cv_profile_id') IS NULL
    ALTER TABLE ai_data.evidence_refs ADD source_cv_profile_id UNIQUEIDENTIFIER NULL;
GO

IF COL_LENGTH(N'ai_data.evidence_refs', N'source_job_id') IS NULL
    ALTER TABLE ai_data.evidence_refs ADD source_job_id UNIQUEIDENTIFIER NULL;
GO

IF COL_LENGTH(N'ai_data.guardrail_flags', N'job_fit_analysis_id') IS NULL
    ALTER TABLE ai_data.guardrail_flags ADD job_fit_analysis_id UNIQUEIDENTIFIER NULL;
GO

IF COL_LENGTH(N'ai_data.guardrail_flags', N'job_fit_gap_id') IS NULL
    ALTER TABLE ai_data.guardrail_flags ADD job_fit_gap_id UNIQUEIDENTIFIER NULL;
GO

IF COL_LENGTH(N'ai_data.guardrail_flags', N'cv_suggestion_run_id') IS NULL
    ALTER TABLE ai_data.guardrail_flags ADD cv_suggestion_run_id UNIQUEIDENTIFIER NULL;
GO

IF COL_LENGTH(N'ai_data.guardrail_flags', N'cv_suggestion_item_id') IS NULL
    ALTER TABLE ai_data.guardrail_flags ADD cv_suggestion_item_id UNIQUEIDENTIFIER NULL;
GO

IF COL_LENGTH(N'ai_data.labeled_entities', N'entity_id') IS NULL
    ALTER TABLE ai_data.labeled_entities ADD entity_id UNIQUEIDENTIFIER NULL;
GO

IF COL_LENGTH(N'ai_data.labeled_entities', N'cv_profile_id') IS NULL
    ALTER TABLE ai_data.labeled_entities ADD cv_profile_id UNIQUEIDENTIFIER NULL;
GO

IF COL_LENGTH(N'ai_data.labeled_entities', N'job_id') IS NULL
    ALTER TABLE ai_data.labeled_entities ADD job_id UNIQUEIDENTIFIER NULL;
GO

UPDATE entity
SET cv_profile_id = entity.object_id
FROM ai_data.entities AS entity
JOIN ai_data.cv_profiles AS cv
  ON cv.cv_profile_id = entity.object_id
WHERE entity.cv_profile_id IS NULL
  AND entity.object_type IN (N'cv', N'cv_profile');
GO

UPDATE entity
SET job_id = entity.object_id
FROM ai_data.entities AS entity
JOIN ai_data.job_posts_normalized AS job
  ON job.job_id = entity.object_id
WHERE entity.job_id IS NULL
  AND entity.object_type IN (N'job', N'job_post', N'job_posts_normalized');
GO

UPDATE chunk
SET cv_profile_id = chunk.object_id
FROM ai_data.text_chunks AS chunk
JOIN ai_data.cv_profiles AS cv
  ON cv.cv_profile_id = chunk.object_id
WHERE chunk.cv_profile_id IS NULL
  AND chunk.object_type IN (N'cv', N'cv_profile');
GO

UPDATE chunk
SET job_id = chunk.object_id
FROM ai_data.text_chunks AS chunk
JOIN ai_data.job_posts_normalized AS job
  ON job.job_id = chunk.object_id
WHERE chunk.job_id IS NULL
  AND chunk.object_type IN (N'job', N'job_post', N'job_posts_normalized');
GO

UPDATE evidence
SET job_fit_analysis_id = evidence.parent_id
FROM ai_data.evidence_refs AS evidence
JOIN ai_data.job_fit_analyses AS analysis
  ON analysis.analysis_id = evidence.parent_id
WHERE evidence.job_fit_analysis_id IS NULL
  AND evidence.parent_type IN (N'job_fit_analysis', N'job_fit_analyses');
GO

UPDATE evidence
SET job_fit_gap_id = evidence.parent_id
FROM ai_data.evidence_refs AS evidence
JOIN ai_data.job_fit_gap_items AS gap_item
  ON gap_item.gap_id = evidence.parent_id
WHERE evidence.job_fit_gap_id IS NULL
  AND evidence.parent_type IN (N'job_fit_gap', N'job_fit_gap_item', N'job_fit_gap_items');
GO

UPDATE evidence
SET cv_suggestion_run_id = evidence.parent_id
FROM ai_data.evidence_refs AS evidence
JOIN ai_data.cv_suggestions AS suggestion_run
  ON suggestion_run.suggestion_run_id = evidence.parent_id
WHERE evidence.cv_suggestion_run_id IS NULL
  AND evidence.parent_type IN (N'cv_suggestion', N'cv_suggestions');
GO

UPDATE evidence
SET cv_suggestion_item_id = evidence.parent_id
FROM ai_data.evidence_refs AS evidence
JOIN ai_data.cv_suggestion_items AS suggestion_item
  ON suggestion_item.suggestion_item_id = evidence.parent_id
WHERE evidence.cv_suggestion_item_id IS NULL
  AND evidence.parent_type IN (N'cv_suggestion_item', N'cv_suggestion_items');
GO

UPDATE evidence
SET source_cv_profile_id = evidence.source_object_id
FROM ai_data.evidence_refs AS evidence
JOIN ai_data.cv_profiles AS cv
  ON cv.cv_profile_id = evidence.source_object_id
WHERE evidence.source_cv_profile_id IS NULL
  AND evidence.source_object_type IN (N'cv', N'cv_profile');
GO

UPDATE evidence
SET source_job_id = evidence.source_object_id
FROM ai_data.evidence_refs AS evidence
JOIN ai_data.job_posts_normalized AS job
  ON job.job_id = evidence.source_object_id
WHERE evidence.source_job_id IS NULL
  AND evidence.source_object_type IN (N'job', N'job_post', N'job_posts_normalized');
GO

UPDATE flag
SET job_fit_analysis_id = flag.parent_id
FROM ai_data.guardrail_flags AS flag
JOIN ai_data.job_fit_analyses AS analysis
  ON analysis.analysis_id = flag.parent_id
WHERE flag.job_fit_analysis_id IS NULL
  AND flag.parent_type IN (N'job_fit_analysis', N'job_fit_analyses');
GO

UPDATE flag
SET job_fit_gap_id = flag.parent_id
FROM ai_data.guardrail_flags AS flag
JOIN ai_data.job_fit_gap_items AS gap_item
  ON gap_item.gap_id = flag.parent_id
WHERE flag.job_fit_gap_id IS NULL
  AND flag.parent_type IN (N'job_fit_gap', N'job_fit_gap_item', N'job_fit_gap_items');
GO

UPDATE flag
SET cv_suggestion_run_id = flag.parent_id
FROM ai_data.guardrail_flags AS flag
JOIN ai_data.cv_suggestions AS suggestion_run
  ON suggestion_run.suggestion_run_id = flag.parent_id
WHERE flag.cv_suggestion_run_id IS NULL
  AND flag.parent_type IN (N'cv_suggestion', N'cv_suggestions');
GO

UPDATE flag
SET cv_suggestion_item_id = flag.parent_id
FROM ai_data.guardrail_flags AS flag
JOIN ai_data.cv_suggestion_items AS suggestion_item
  ON suggestion_item.suggestion_item_id = flag.parent_id
WHERE flag.cv_suggestion_item_id IS NULL
  AND flag.parent_type IN (N'cv_suggestion_item', N'cv_suggestion_items');
GO

UPDATE label
SET cv_profile_id = label.object_id
FROM ai_data.labeled_entities AS label
JOIN ai_data.cv_profiles AS cv
  ON cv.cv_profile_id = label.object_id
WHERE label.cv_profile_id IS NULL
  AND label.object_type IN (N'cv', N'cv_profile');
GO

UPDATE label
SET job_id = label.object_id
FROM ai_data.labeled_entities AS label
JOIN ai_data.job_posts_normalized AS job
  ON job.job_id = label.object_id
WHERE label.job_id IS NULL
  AND label.object_type IN (N'job', N'job_post', N'job_posts_normalized');
GO

UPDATE label
SET entity_id = entity.entity_id
FROM ai_data.labeled_entities AS label
JOIN ai_data.entities AS entity
  ON entity.entity_text = label.entity_text
 AND entity.entity_type = label.entity_type_label
 AND (
        (label.cv_profile_id IS NOT NULL AND entity.cv_profile_id = label.cv_profile_id)
     OR (label.job_id IS NOT NULL AND entity.job_id = label.job_id)
 )
WHERE label.entity_id IS NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_entities_cv_profile')
    ALTER TABLE ai_data.entities WITH CHECK
    ADD CONSTRAINT FK_entities_cv_profile
    FOREIGN KEY (cv_profile_id)
    REFERENCES ai_data.cv_profiles(cv_profile_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_entities_job')
    ALTER TABLE ai_data.entities WITH CHECK
    ADD CONSTRAINT FK_entities_job
    FOREIGN KEY (job_id)
    REFERENCES ai_data.job_posts_normalized(job_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_text_chunks_cv_profile')
    ALTER TABLE ai_data.text_chunks WITH CHECK
    ADD CONSTRAINT FK_text_chunks_cv_profile
    FOREIGN KEY (cv_profile_id)
    REFERENCES ai_data.cv_profiles(cv_profile_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_text_chunks_job')
    ALTER TABLE ai_data.text_chunks WITH CHECK
    ADD CONSTRAINT FK_text_chunks_job
    FOREIGN KEY (job_id)
    REFERENCES ai_data.job_posts_normalized(job_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_evidence_refs_job_fit_analysis')
    ALTER TABLE ai_data.evidence_refs WITH CHECK
    ADD CONSTRAINT FK_evidence_refs_job_fit_analysis
    FOREIGN KEY (job_fit_analysis_id)
    REFERENCES ai_data.job_fit_analyses(analysis_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_evidence_refs_job_fit_gap')
    ALTER TABLE ai_data.evidence_refs WITH CHECK
    ADD CONSTRAINT FK_evidence_refs_job_fit_gap
    FOREIGN KEY (job_fit_gap_id)
    REFERENCES ai_data.job_fit_gap_items(gap_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_evidence_refs_cv_suggestion_run')
    ALTER TABLE ai_data.evidence_refs WITH CHECK
    ADD CONSTRAINT FK_evidence_refs_cv_suggestion_run
    FOREIGN KEY (cv_suggestion_run_id)
    REFERENCES ai_data.cv_suggestions(suggestion_run_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_evidence_refs_cv_suggestion_item')
    ALTER TABLE ai_data.evidence_refs WITH CHECK
    ADD CONSTRAINT FK_evidence_refs_cv_suggestion_item
    FOREIGN KEY (cv_suggestion_item_id)
    REFERENCES ai_data.cv_suggestion_items(suggestion_item_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_evidence_refs_source_cv_profile')
    ALTER TABLE ai_data.evidence_refs WITH CHECK
    ADD CONSTRAINT FK_evidence_refs_source_cv_profile
    FOREIGN KEY (source_cv_profile_id)
    REFERENCES ai_data.cv_profiles(cv_profile_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_evidence_refs_source_job')
    ALTER TABLE ai_data.evidence_refs WITH CHECK
    ADD CONSTRAINT FK_evidence_refs_source_job
    FOREIGN KEY (source_job_id)
    REFERENCES ai_data.job_posts_normalized(job_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_guardrail_flags_job_fit_analysis')
    ALTER TABLE ai_data.guardrail_flags WITH CHECK
    ADD CONSTRAINT FK_guardrail_flags_job_fit_analysis
    FOREIGN KEY (job_fit_analysis_id)
    REFERENCES ai_data.job_fit_analyses(analysis_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_guardrail_flags_job_fit_gap')
    ALTER TABLE ai_data.guardrail_flags WITH CHECK
    ADD CONSTRAINT FK_guardrail_flags_job_fit_gap
    FOREIGN KEY (job_fit_gap_id)
    REFERENCES ai_data.job_fit_gap_items(gap_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_guardrail_flags_cv_suggestion_run')
    ALTER TABLE ai_data.guardrail_flags WITH CHECK
    ADD CONSTRAINT FK_guardrail_flags_cv_suggestion_run
    FOREIGN KEY (cv_suggestion_run_id)
    REFERENCES ai_data.cv_suggestions(suggestion_run_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_guardrail_flags_cv_suggestion_item')
    ALTER TABLE ai_data.guardrail_flags WITH CHECK
    ADD CONSTRAINT FK_guardrail_flags_cv_suggestion_item
    FOREIGN KEY (cv_suggestion_item_id)
    REFERENCES ai_data.cv_suggestion_items(suggestion_item_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_labeled_entities_entity')
    ALTER TABLE ai_data.labeled_entities WITH CHECK
    ADD CONSTRAINT FK_labeled_entities_entity
    FOREIGN KEY (entity_id)
    REFERENCES ai_data.entities(entity_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_labeled_entities_cv_profile')
    ALTER TABLE ai_data.labeled_entities WITH CHECK
    ADD CONSTRAINT FK_labeled_entities_cv_profile
    FOREIGN KEY (cv_profile_id)
    REFERENCES ai_data.cv_profiles(cv_profile_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_labeled_entities_job')
    ALTER TABLE ai_data.labeled_entities WITH CHECK
    ADD CONSTRAINT FK_labeled_entities_job
    FOREIGN KEY (job_id)
    REFERENCES ai_data.job_posts_normalized(job_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_entities_cv_profile_type' AND object_id = OBJECT_ID(N'ai_data.entities'))
    CREATE INDEX IX_entities_cv_profile_type
    ON ai_data.entities(cv_profile_id, entity_type)
    WHERE cv_profile_id IS NOT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_entities_job_type' AND object_id = OBJECT_ID(N'ai_data.entities'))
    CREATE INDEX IX_entities_job_type
    ON ai_data.entities(job_id, entity_type)
    WHERE job_id IS NOT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_text_chunks_cv_profile_order' AND object_id = OBJECT_ID(N'ai_data.text_chunks'))
    CREATE INDEX IX_text_chunks_cv_profile_order
    ON ai_data.text_chunks(cv_profile_id, chunk_order)
    WHERE cv_profile_id IS NOT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_text_chunks_job_order' AND object_id = OBJECT_ID(N'ai_data.text_chunks'))
    CREATE INDEX IX_text_chunks_job_order
    ON ai_data.text_chunks(job_id, chunk_order)
    WHERE job_id IS NOT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_evidence_refs_typed_parents' AND object_id = OBJECT_ID(N'ai_data.evidence_refs'))
    CREATE INDEX IX_evidence_refs_typed_parents
    ON ai_data.evidence_refs(job_fit_analysis_id, job_fit_gap_id, cv_suggestion_run_id, cv_suggestion_item_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_guardrail_flags_typed_parents' AND object_id = OBJECT_ID(N'ai_data.guardrail_flags'))
    CREATE INDEX IX_guardrail_flags_typed_parents
    ON ai_data.guardrail_flags(job_fit_analysis_id, job_fit_gap_id, cv_suggestion_run_id, cv_suggestion_item_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_labeled_entities_typed_refs' AND object_id = OBJECT_ID(N'ai_data.labeled_entities'))
    CREATE INDEX IX_labeled_entities_typed_refs
    ON ai_data.labeled_entities(entity_id, cv_profile_id, job_id);
GO
