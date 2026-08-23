/*
  Seed ESCO concepts from ai-service/data/taxonomy/esco_seed.json.

  Generated for seed version: esco-v1.2.0-seed-2026-08-21.
  Safe to run more than once.
*/

SET XACT_ABORT ON;
BEGIN TRANSACTION;

MERGE ai_data.esco_concepts AS target
USING (VALUES
    (N'http://data.europa.eu/esco/skill/ccd0a1d9-afda-43d9-b901-96344886e14d', N'Python (computer programming)', N'["Python", "py", "python 3", "python 3k"]', N'skill', NULL, NULL, N'source=ESCO API selectedVersion=v1.2.0; language=en; skill_type=knowledge; reuse_level=sector-specific', N'esco-v1.2.0-seed-2026-08-21'),
    (N'http://data.europa.eu/esco/skill/598de5b0-5b58-4ea7-8058-a4bc4d18c742', N'SQL', N'["SQL", "structured query language"]', N'skill', NULL, NULL, N'source=ESCO API selectedVersion=v1.2.0; language=en; skill_type=knowledge; reuse_level=sector-specific', N'esco-v1.2.0-seed-2026-08-21'),
    (N'http://data.europa.eu/esco/skill/c062bab3-3ea0-4291-9220-a2d8fef4bead', N'SQL Server', N'["SQL Server", "Microsoft SQL Server", "MSSQL"]', N'skill', NULL, NULL, N'source=ESCO API selectedVersion=v1.2.0; language=en; skill_type=knowledge; reuse_level=sector-specific', N'esco-v1.2.0-seed-2026-08-21'),
    (N'http://data.europa.eu/esco/occupation/f2b15a0e-e65a-438a-affb-29b9d50b77d1', N'software developer', N'["software developer", "software engineer", "backend developer", "python backend", "lap trinh vien", "lap trinh vien phan mem"]', N'occupation', N'2512', NULL, N'source=ESCO API selectedVersion=v1.2.0; language=en; code=2512.4', N'esco-v1.2.0-seed-2026-08-21'),
    (N'http://data.europa.eu/esco/occupation/2079755f-d809-49e6-8037-4de6180e54c0', N'data engineer', N'["data engineer", "data engineering", "ky su du lieu", "ki su du lieu"]', N'occupation', N'2511', NULL, N'source=ESCO API selectedVersion=v1.2.0; language=en; code=2511.20', N'esco-v1.2.0-seed-2026-08-21'),
    (N'http://data.europa.eu/esco/occupation/35553663-deab-4d9a-bf22-15c1625d28e8', N'artificial intelligence engineer', N'["artificial intelligence engineer", "ai engineer", "machine learning engineer", "ky su ai", "ky su tri tue nhan tao"]', N'occupation', N'2511', NULL, N'source=ESCO API selectedVersion=v1.2.0; language=en; code=2511.11', N'esco-v1.2.0-seed-2026-08-21')
) AS source (esco_uri, preferred_label, alt_labels_json, concept_type, isco_group, broader_uri, description_text, source_version)
ON target.esco_uri = source.esco_uri
WHEN MATCHED THEN
    UPDATE SET
        preferred_label = source.preferred_label,
        alt_labels_json = source.alt_labels_json,
        concept_type = source.concept_type,
        isco_group = source.isco_group,
        broader_uri = source.broader_uri,
        description_text = source.description_text,
        source_version = source.source_version,
        updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN
    INSERT (esco_uri, preferred_label, alt_labels_json, concept_type, isco_group, broader_uri, description_text, source_version)
    VALUES (source.esco_uri, source.preferred_label, source.alt_labels_json, source.concept_type, source.isco_group, source.broader_uri, source.description_text, source.source_version);

COMMIT TRANSACTION;

PRINT 'Seeded ESCO concepts: 6';
