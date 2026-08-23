/*
  Relationship checklist for ai_data migration 002.

  Run after ai-service/db/migrations/002_strengthen_ai_data_relationships.sql.
*/

SET NOCOUNT ON;

DECLARE @expected_columns TABLE (
    table_name SYSNAME NOT NULL,
    column_name SYSNAME NOT NULL,
    PRIMARY KEY (table_name, column_name)
);

INSERT INTO @expected_columns (table_name, column_name)
VALUES
    (N'entities', N'cv_profile_id'),
    (N'entities', N'job_id'),
    (N'text_chunks', N'cv_profile_id'),
    (N'text_chunks', N'job_id'),
    (N'evidence_refs', N'job_fit_analysis_id'),
    (N'evidence_refs', N'job_fit_gap_id'),
    (N'evidence_refs', N'cv_suggestion_run_id'),
    (N'evidence_refs', N'cv_suggestion_item_id'),
    (N'evidence_refs', N'source_cv_profile_id'),
    (N'evidence_refs', N'source_job_id'),
    (N'guardrail_flags', N'job_fit_analysis_id'),
    (N'guardrail_flags', N'job_fit_gap_id'),
    (N'guardrail_flags', N'cv_suggestion_run_id'),
    (N'guardrail_flags', N'cv_suggestion_item_id'),
    (N'labeled_entities', N'entity_id'),
    (N'labeled_entities', N'cv_profile_id'),
    (N'labeled_entities', N'job_id');

SELECT expected.table_name, expected.column_name
FROM @expected_columns AS expected
LEFT JOIN INFORMATION_SCHEMA.COLUMNS AS actual
    ON actual.TABLE_SCHEMA = N'ai_data'
   AND actual.TABLE_NAME = expected.table_name
   AND actual.COLUMN_NAME = expected.column_name
WHERE actual.COLUMN_NAME IS NULL
ORDER BY expected.table_name, expected.column_name;

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
    THROW 51200, 'ai_data relationship check failed: missing typed relationship column(s).', 1;
END;

DECLARE @expected_fks TABLE (
    fk_name SYSNAME NOT NULL PRIMARY KEY
);

INSERT INTO @expected_fks (fk_name)
VALUES
    (N'FK_entities_cv_profile'),
    (N'FK_entities_job'),
    (N'FK_text_chunks_cv_profile'),
    (N'FK_text_chunks_job'),
    (N'FK_evidence_refs_job_fit_analysis'),
    (N'FK_evidence_refs_job_fit_gap'),
    (N'FK_evidence_refs_cv_suggestion_run'),
    (N'FK_evidence_refs_cv_suggestion_item'),
    (N'FK_evidence_refs_source_cv_profile'),
    (N'FK_evidence_refs_source_job'),
    (N'FK_guardrail_flags_job_fit_analysis'),
    (N'FK_guardrail_flags_job_fit_gap'),
    (N'FK_guardrail_flags_cv_suggestion_run'),
    (N'FK_guardrail_flags_cv_suggestion_item'),
    (N'FK_labeled_entities_entity'),
    (N'FK_labeled_entities_cv_profile'),
    (N'FK_labeled_entities_job');

SELECT expected.fk_name AS missing_fk
FROM @expected_fks AS expected
LEFT JOIN sys.foreign_keys AS actual
    ON actual.name = expected.fk_name
WHERE actual.name IS NULL
ORDER BY expected.fk_name;

IF EXISTS (
    SELECT 1
    FROM @expected_fks AS expected
    LEFT JOIN sys.foreign_keys AS actual
        ON actual.name = expected.fk_name
    WHERE actual.name IS NULL
)
BEGIN
    THROW 51201, 'ai_data relationship check failed: missing foreign key(s).', 1;
END;

SELECT
    COUNT(*) AS strengthened_relationship_fk_count
FROM @expected_fks;

PRINT 'ai_data relationship check passed.';
