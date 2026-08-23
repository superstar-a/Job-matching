/*
  Sample AI/Data persistence flow.

  Source files:
  - ai-service/data/samples/cv_sample.json
  - ai-service/data/samples/jd_sample.json
  - ai-service/data/samples/match_expected.json

  Requires:
  - 001_create_ai_data_tables.sql
  - 001_seed_esco_concepts.sql

  Safe to run more than once.
*/

SET XACT_ABORT ON;
BEGIN TRANSACTION;

DECLARE @raw_cv_id UNIQUEIDENTIFIER = '10000000-0000-0000-0000-000000000001';
DECLARE @cv_profile_id UNIQUEIDENTIFIER = '10000000-0000-0000-0000-000000000002';
DECLARE @crawl_run_id UNIQUEIDENTIFIER = '10000000-0000-0000-0000-000000000003';
DECLARE @raw_job_id UNIQUEIDENTIFIER = '10000000-0000-0000-0000-000000000004';
DECLARE @job_id UNIQUEIDENTIFIER = '10000000-0000-0000-0000-000000000005';
DECLARE @feature_id UNIQUEIDENTIFIER = '10000000-0000-0000-0000-000000000006';
DECLARE @match_run_id UNIQUEIDENTIFIER = '10000000-0000-0000-0000-000000000007';
DECLARE @analysis_id UNIQUEIDENTIFIER = '10000000-0000-0000-0000-000000000008';
DECLARE @gap_id UNIQUEIDENTIFIER = '10000000-0000-0000-0000-000000000009';
DECLARE @suggestion_run_id UNIQUEIDENTIFIER = '10000000-0000-0000-0000-000000000010';
DECLARE @suggestion_item_id UNIQUEIDENTIFIER = '10000000-0000-0000-0000-000000000011';
DECLARE @evidence_gap_id UNIQUEIDENTIFIER = '10000000-0000-0000-0000-000000000012';
DECLARE @guardrail_id UNIQUEIDENTIFIER = '10000000-0000-0000-0000-000000000013';
DECLARE @label_id UNIQUEIDENTIFIER = '10000000-0000-0000-0000-000000000014';
DECLARE @cv_chunk_id UNIQUEIDENTIFIER = '10000000-0000-0000-0000-000000000015';
DECLARE @job_chunk_id UNIQUEIDENTIFIER = '10000000-0000-0000-0000-000000000016';
DECLARE @cv_embedding_id UNIQUEIDENTIFIER = '10000000-0000-0000-0000-000000000017';
DECLARE @job_embedding_id UNIQUEIDENTIFIER = '10000000-0000-0000-0000-000000000018';
DECLARE @cv_python_entity_id UNIQUEIDENTIFIER = '10000000-0000-0000-0000-000000000021';
DECLARE @cv_fastapi_entity_id UNIQUEIDENTIFIER = '10000000-0000-0000-0000-000000000022';
DECLARE @cv_sql_entity_id UNIQUEIDENTIFIER = '10000000-0000-0000-0000-000000000023';
DECLARE @job_python_entity_id UNIQUEIDENTIFIER = '10000000-0000-0000-0000-000000000031';
DECLARE @job_fastapi_entity_id UNIQUEIDENTIFIER = '10000000-0000-0000-0000-000000000032';
DECLARE @job_sql_entity_id UNIQUEIDENTIFIER = '10000000-0000-0000-0000-000000000033';
DECLARE @job_docker_entity_id UNIQUEIDENTIFIER = '10000000-0000-0000-0000-000000000034';
DECLARE @job_occupation_entity_id UNIQUEIDENTIFIER = '10000000-0000-0000-0000-000000000035';
DECLARE @source_config_id UNIQUEIDENTIFIER = '10000000-0000-0000-0000-000000000040';
DECLARE @model_experiment_id UNIQUEIDENTIFIER = '10000000-0000-0000-0000-000000000041';
DECLARE @labeled_entity_id UNIQUEIDENTIFIER = '10000000-0000-0000-0000-000000000042';
DECLARE @labeled_intent_id UNIQUEIDENTIFIER = '10000000-0000-0000-0000-000000000043';

DECLARE @python_esco_uri NVARCHAR(450) = N'http://data.europa.eu/esco/skill/ccd0a1d9-afda-43d9-b901-96344886e14d';
DECLARE @sql_esco_uri NVARCHAR(450) = N'http://data.europa.eu/esco/skill/598de5b0-5b58-4ea7-8058-a4bc4d18c742';
DECLARE @software_dev_esco_uri NVARCHAR(450) = N'http://data.europa.eu/esco/occupation/f2b15a0e-e65a-438a-affb-29b9d50b77d1';

IF NOT EXISTS (SELECT 1 FROM ai_data.job_source_configs WHERE source_name = N'sample')
BEGIN
    INSERT INTO ai_data.job_source_configs (
        source_config_id,
        source_name,
        source_type,
        base_url,
        enabled,
        request_delay_seconds,
        robots_policy,
        auth_required,
        notes
    )
    VALUES (
        @source_config_id,
        N'sample',
        N'manual_seed',
        N'https://example.com/jobs',
        1,
        0,
        N'sample_only',
        0,
        N'Sample source used only for AI/Data local persistence smoke tests.'
    );
END;

SELECT @source_config_id = source_config_id
FROM ai_data.job_source_configs
WHERE source_name = N'sample';

IF NOT EXISTS (SELECT 1 FROM ai_data.raw_cv_documents WHERE raw_cv_id = @raw_cv_id)
BEGIN
    INSERT INTO ai_data.raw_cv_documents (
        raw_cv_id,
        user_id,
        conversation_id,
        source,
        original_filename,
        mime_type,
        file_sha256,
        text_sha256,
        text_preview,
        sanitized_json,
        language,
        pii_masked,
        parse_status,
        parser_name,
        parser_version
    )
    VALUES (
        @raw_cv_id,
        N'sample-user-001',
        N'sample-conversation-001',
        N'sample',
        N'cv_sample.json',
        N'application/json',
        N'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        N'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        N'Python Backend Developer with experience in FastAPI and SQL.',
        N'{"candidate_name":"Nguyen Van A","title":"Python Backend Developer","summary":"Backend developer with experience in FastAPI and SQL.","location":"Ho Chi Minh City","skills":["Python","FastAPI","SQL","Git"],"languages":["Vietnamese","English"],"total_years_experience":2}',
        N'en',
        1,
        N'parsed',
        N'rule-based-cv-parser',
        N'cv-parser-v1'
    );
END;

IF NOT EXISTS (SELECT 1 FROM ai_data.cv_profiles WHERE cv_profile_id = @cv_profile_id)
BEGIN
    INSERT INTO ai_data.cv_profiles (
        cv_profile_id,
        raw_cv_id,
        user_id,
        candidate_name_redacted,
        headline,
        summary,
        location_text,
        total_years_experience,
        skills_json,
        experiences_json,
        education_json,
        projects_json,
        certifications_json,
        languages_json,
        profile_json,
        schema_version,
        extractor_name,
        extractor_version,
        quality_score
    )
    VALUES (
        @cv_profile_id,
        @raw_cv_id,
        N'sample-user-001',
        N'Nguyen Van A',
        N'Python Backend Developer',
        N'Backend developer with experience in FastAPI and SQL.',
        N'Ho Chi Minh City',
        2,
        N'["Python","FastAPI","SQL","Git"]',
        N'[{"title":"Backend Developer","company":"Example Tech","start_date":"2024-01-01","end_date":null,"description":"Built REST APIs and data processing scripts with FastAPI.","skills":["Python","FastAPI","SQL"]}]',
        N'[{"school":"Example University","degree":"Bachelor","major":"Computer Science","start_year":2020,"end_year":2024}]',
        N'[{"name":"Job Matching AI","description":"Matched CVs to job descriptions using NLP features.","skills":["Python","NLP","Scikit-learn"],"url":null}]',
        N'["AWS Cloud Practitioner"]',
        N'["Vietnamese","English"]',
        N'{"candidate_name":"Nguyen Van A","title":"Python Backend Developer","summary":"Backend developer with experience in FastAPI and SQL.","email":null,"phone":null,"location":"Ho Chi Minh City","skills":["Python","FastAPI","SQL","Git"],"languages":["Vietnamese","English"],"total_years_experience":2,"experiences":[{"title":"Backend Developer","company":"Example Tech","start_date":"2024-01-01","end_date":null,"description":"Built REST APIs and data processing scripts with FastAPI.","skills":["Python","FastAPI","SQL"]}],"education":[{"school":"Example University","degree":"Bachelor","major":"Computer Science","start_year":2020,"end_year":2024}],"projects":[{"name":"Job Matching AI","description":"Matched CVs to job descriptions using NLP features.","skills":["Python","NLP","Scikit-learn"],"url":null}],"certificates":["AWS Cloud Practitioner"],"raw_text":null}',
        N'1.0',
        N'rule-based-cv-parser',
        N'cv-parser-v1',
        0.9400
    );
END;

IF NOT EXISTS (SELECT 1 FROM ai_data.crawl_runs WHERE crawl_run_id = @crawl_run_id)
BEGIN
    INSERT INTO ai_data.crawl_runs (
        crawl_run_id,
        source_config_id,
        source,
        query_text,
        parsed_intent_json,
        requested_by_user_id,
        status,
        started_at,
        finished_at,
        jobs_found_count,
        jobs_new_count,
        jobs_updated_count,
        crawler_name,
        crawler_version
    )
    VALUES (
        @crawl_run_id,
        @source_config_id,
        N'sample',
        N'Python FastAPI backend Ho Chi Minh',
        N'{"role":"Python FastAPI Developer","location":"Ho Chi Minh City","work_mode":null,"source":"sample"}',
        N'sample-user-001',
        N'succeeded',
        '2026-08-04T09:00:00',
        '2026-08-04T09:00:05',
        1,
        1,
        0,
        N'sample-loader',
        N'sample-seed-v1'
    );
END;

IF NOT EXISTS (SELECT 1 FROM ai_data.raw_job_postings WHERE raw_job_id = @raw_job_id)
BEGIN
    INSERT INTO ai_data.raw_job_postings (
        raw_job_id,
        crawl_run_id,
        source,
        external_id,
        source_url,
        source_url_hash,
        title_raw,
        company_raw,
        location_raw,
        salary_raw,
        employment_type_raw,
        posted_at_raw,
        description_text,
        raw_payload_json,
        content_hash,
        fetch_status,
        fetched_at
    )
    VALUES (
        @raw_job_id,
        @crawl_run_id,
        N'sample',
        N'sample-job-001',
        N'https://example.com/jobs/python-fastapi-engineer',
        N'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
        N'Python FastAPI Developer',
        N'Example Tech',
        N'Ho Chi Minh City',
        N'1200-2200 USD',
        N'full_time',
        N'2026-08-01',
        N'Build APIs and data pipelines for a job matching platform.',
        N'{"source":"sample","source_url":"https://example.com/jobs/python-fastapi-engineer","external_id":"sample-job-001","title":"Python FastAPI Developer","company_name":"Example Tech","location":"Ho Chi Minh City","salary_min":1200,"salary_max":2200,"currency":"USD","job_type":"full_time","level":"middle","posted_at":"2026-08-01","expired_at":"2026-09-01","required_skills":["Python","FastAPI","SQL","Docker"],"nice_to_have_skills":["AWS","NLP"],"min_years_experience":2,"description_text":"Build APIs and data pipelines for a job matching platform.","requirements_text":"Python, FastAPI, SQL, Docker, and 2+ years of backend experience.","benefits_text":"Hybrid work and training budget.","raw_html":null,"crawl_status":"success","crawled_at":"2026-08-04T09:00:00Z"}',
        N'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
        N'normalized',
        '2026-08-04T09:00:00'
    );
END;

IF NOT EXISTS (SELECT 1 FROM ai_data.job_posts_normalized WHERE job_id = @job_id)
BEGIN
    INSERT INTO ai_data.job_posts_normalized (
        job_id,
        raw_job_id,
        source,
        external_id,
        source_url,
        source_url_hash,
        title,
        company_name,
        location_text,
        remote_policy,
        employment_type,
        seniority_level,
        salary_min,
        salary_max,
        salary_currency,
        salary_period,
        required_skills_json,
        preferred_skills_json,
        responsibilities_json,
        requirements_json,
        benefits_json,
        description_text,
        requirements_text,
        language,
        normalized_json,
        title_esco_uri,
        title_esco_preferred_label,
        isco_group,
        normalizer_name,
        normalizer_version,
        quality_score,
        active,
        posted_at,
        expires_at
    )
    VALUES (
        @job_id,
        @raw_job_id,
        N'sample',
        N'sample-job-001',
        N'https://example.com/jobs/python-fastapi-engineer',
        N'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
        N'Python FastAPI Developer',
        N'Example Tech',
        N'Ho Chi Minh City',
        N'onsite_or_hybrid_unknown',
        N'full_time',
        N'middle',
        1200,
        2200,
        N'USD',
        N'month',
        N'["Python","FastAPI","SQL","Docker"]',
        N'["AWS","NLP"]',
        N'["Build APIs","Build data pipelines for a job matching platform"]',
        N'["Python","FastAPI","SQL","Docker","2+ years of backend experience"]',
        N'["Hybrid work","Training budget"]',
        N'Build APIs and data pipelines for a job matching platform.',
        N'Python, FastAPI, SQL, Docker, and 2+ years of backend experience.',
        N'en',
        N'{"source":"sample","source_url":"https://example.com/jobs/python-fastapi-engineer","external_id":"sample-job-001","title":"Python FastAPI Developer","company_name":"Example Tech","location":"Ho Chi Minh City","salary_min":1200,"salary_max":2200,"currency":"USD","job_type":"full_time","level":"middle","required_skills":["Python","FastAPI","SQL","Docker"],"nice_to_have_skills":["AWS","NLP"],"min_years_experience":2,"description_text":"Build APIs and data pipelines for a job matching platform.","requirements_text":"Python, FastAPI, SQL, Docker, and 2+ years of backend experience.","benefits_text":"Hybrid work and training budget."}',
        @software_dev_esco_uri,
        N'software developer',
        N'2512',
        N'rule-based-jd-normalizer',
        N'jd-normalizer-v1',
        0.9600,
        1,
        '2026-08-01T00:00:00',
        '2026-09-01T00:00:00'
    );
END;

IF NOT EXISTS (SELECT 1 FROM ai_data.entities WHERE entity_id = @cv_python_entity_id)
BEGIN
    INSERT INTO ai_data.entities (
        entity_id,
        object_type,
        object_id,
        cv_profile_id,
        job_id,
        entity_text,
        normalized_text,
        entity_type,
        confidence,
        extractor_name,
        extractor_version,
        evidence_text,
        metadata_json
    )
    VALUES
        (@cv_python_entity_id, N'cv_profile', @cv_profile_id, @cv_profile_id, NULL, N'Python', N'python', N'skill', 0.9900, N'rule-based-entity-extractor', N'entity-v1', N'CV skills: Python', N'{"source_field":"skills"}'),
        (@cv_fastapi_entity_id, N'cv_profile', @cv_profile_id, @cv_profile_id, NULL, N'FastAPI', N'fastapi', N'skill', 0.9700, N'rule-based-entity-extractor', N'entity-v1', N'CV skills: FastAPI', N'{"source_field":"skills"}'),
        (@cv_sql_entity_id, N'cv_profile', @cv_profile_id, @cv_profile_id, NULL, N'SQL', N'sql', N'skill', 0.9900, N'rule-based-entity-extractor', N'entity-v1', N'CV skills: SQL', N'{"source_field":"skills"}'),
        (@job_python_entity_id, N'job_post', @job_id, NULL, @job_id, N'Python', N'python', N'skill', 0.9900, N'rule-based-entity-extractor', N'entity-v1', N'JD required skills: Python', N'{"source_field":"required_skills"}'),
        (@job_fastapi_entity_id, N'job_post', @job_id, NULL, @job_id, N'FastAPI', N'fastapi', N'skill', 0.9700, N'rule-based-entity-extractor', N'entity-v1', N'JD required skills: FastAPI', N'{"source_field":"required_skills"}'),
        (@job_sql_entity_id, N'job_post', @job_id, NULL, @job_id, N'SQL', N'sql', N'skill', 0.9900, N'rule-based-entity-extractor', N'entity-v1', N'JD required skills: SQL', N'{"source_field":"required_skills"}'),
        (@job_docker_entity_id, N'job_post', @job_id, NULL, @job_id, N'Docker', N'docker', N'skill', 0.9400, N'rule-based-entity-extractor', N'entity-v1', N'JD required skills: Docker', N'{"source_field":"required_skills"}'),
        (@job_occupation_entity_id, N'job_post', @job_id, NULL, @job_id, N'Python FastAPI Developer', N'python fastapi developer', N'occupation', 0.8500, N'esco-taxonomy-mapper', N'esco-seed-v1', N'JD title: Python FastAPI Developer', N'{"source_field":"title"}');
END;

IF NOT EXISTS (SELECT 1 FROM ai_data.entity_concept_links WHERE entity_id = @cv_python_entity_id)
BEGIN
    INSERT INTO ai_data.entity_concept_links (
        entity_id,
        esco_uri,
        concept_type,
        preferred_label,
        isco_group,
        match_method,
        confidence,
        rank,
        mapper_version
    )
    VALUES
        (@cv_python_entity_id, @python_esco_uri, N'skill', N'Python (computer programming)', NULL, N'alias_exact', 0.9900, 1, N'esco-seed-v1'),
        (@cv_sql_entity_id, @sql_esco_uri, N'skill', N'SQL', NULL, N'alias_exact', 0.9900, 1, N'esco-seed-v1'),
        (@job_python_entity_id, @python_esco_uri, N'skill', N'Python (computer programming)', NULL, N'alias_exact', 0.9900, 1, N'esco-seed-v1'),
        (@job_sql_entity_id, @sql_esco_uri, N'skill', N'SQL', NULL, N'alias_exact', 0.9900, 1, N'esco-seed-v1'),
        (@job_occupation_entity_id, @software_dev_esco_uri, N'occupation', N'software developer', N'2512', N'alias_exact', 0.8500, 1, N'esco-seed-v1');
END;

IF NOT EXISTS (SELECT 1 FROM ai_data.cv_job_features WHERE feature_id = @feature_id)
BEGIN
    INSERT INTO ai_data.cv_job_features (
        feature_id,
        cv_profile_id,
        job_id,
        feature_version,
        required_skill_match_score,
        preferred_skill_match_score,
        title_similarity_score,
        seniority_fit_score,
        experience_fit_score,
        location_fit_score,
        salary_fit_score,
        semantic_similarity_score,
        overall_feature_score,
        matched_skills_json,
        missing_required_skills_json,
        missing_preferred_skills_json,
        evidence_summary_json,
        model_name,
        model_revision
    )
    VALUES (
        @feature_id,
        @cv_profile_id,
        @job_id,
        N'rule-based-feature-v1',
        0.7500,
        0.5000,
        0.8700,
        0.8200,
        1.0000,
        1.0000,
        NULL,
        0.8200,
        0.8250,
        N'["Python","FastAPI","SQL"]',
        N'["Docker"]',
        N'["AWS","NLP"]',
        N'{"experience_gap":"Candidate meets the minimum 2 years of experience.","salary_gap":null}',
        N'rule-based-matcher',
        N'matcher-v1'
    );
END;

IF NOT EXISTS (SELECT 1 FROM ai_data.match_runs WHERE match_run_id = @match_run_id)
BEGIN
    INSERT INTO ai_data.match_runs (
        match_run_id,
        cv_profile_id,
        job_id,
        feature_id,
        run_type,
        rank_position,
        match_score,
        confidence,
        decision_label,
        explanation_summary,
        scoring_model_name,
        scoring_model_revision,
        feature_version,
        response_payload_json
    )
    VALUES (
        @match_run_id,
        @cv_profile_id,
        @job_id,
        @feature_id,
        N'match-cv-jd',
        1,
        0.8250,
        0.9000,
        N'high',
        N'The CV is a strong backend Python fit, but should show Docker experience more clearly.',
        N'rule-based-matcher',
        N'matcher-v1',
        N'rule-based-feature-v1',
        N'{"overall_score":82.5,"matched_skills":["Python","FastAPI","SQL"],"missing_required_skills":["Docker"],"nice_to_have_skills":["AWS","NLP"],"experience_gap":"Candidate meets the minimum 2 years of experience.","salary_gap":null,"recommendation_reason":"The CV is a strong backend Python fit, but should show Docker experience more clearly."}'
    );
END;

IF NOT EXISTS (SELECT 1 FROM ai_data.job_fit_analyses WHERE analysis_id = @analysis_id)
BEGIN
    INSERT INTO ai_data.job_fit_analyses (
        analysis_id,
        match_run_id,
        cv_profile_id,
        job_id,
        analysis_version,
        overall_score,
        fit_label,
        summary,
        strengths_json,
        risks_json,
        recommendation,
        analyzer_model_name,
        analyzer_model_revision,
        response_payload_json
    )
    VALUES (
        @analysis_id,
        @match_run_id,
        @cv_profile_id,
        @job_id,
        N'rule-based-gap-v1',
        0.8250,
        N'high',
        N'Strong match on Python, FastAPI, SQL, location, and required experience.',
        N'["Python","FastAPI","SQL","2 years backend experience","Ho Chi Minh City"]',
        N'["Docker is required by the JD but not verified in the parsed CV"]',
        N'Clarify Docker only if the candidate truly has Docker experience.',
        N'rule-based-gap-analyzer',
        N'rule-based-gap-v1',
        N'{"overall_score":82.5,"matched_skills":["Python","FastAPI","SQL"],"missing_required_skills":["Docker"],"nice_to_have_skills":["AWS","NLP"],"recommendation_reason":"The CV is a strong backend Python fit, but should show Docker experience more clearly.","improvement_focus":["Docker"],"analyzer_version":"rule-based-gap-v1"}'
    );
END;

IF NOT EXISTS (SELECT 1 FROM ai_data.job_fit_gap_items WHERE gap_id = @gap_id)
BEGIN
    INSERT INTO ai_data.job_fit_gap_items (
        gap_id,
        analysis_id,
        category,
        severity,
        requirement_text,
        candidate_evidence_text,
        gap_summary,
        why_it_matters,
        action_hint,
        skill_label,
        evidence_refs_json,
        sort_order
    )
    VALUES (
        @gap_id,
        @analysis_id,
        N'skill',
        N'high',
        N'Docker',
        NULL,
        N'JD requires Docker but the parsed CV has no verified Docker evidence.',
        N'Docker is a required deployment/container skill in the JD.',
        N'Only add Docker to the CV if the candidate can name a real project, task, or role using Docker.',
        N'Docker',
        N'[{"source":"jd","section":"requirements","field":"required_skills","text":"Docker","confidence":1.0}]',
        1
    );
END;

IF NOT EXISTS (SELECT 1 FROM ai_data.cv_suggestions WHERE suggestion_run_id = @suggestion_run_id)
BEGIN
    INSERT INTO ai_data.cv_suggestions (
        suggestion_run_id,
        analysis_id,
        cv_profile_id,
        job_id,
        suggestion_version,
        target_cv_section,
        overall_guidance,
        guardrail_summary,
        generator_model_name,
        generator_model_revision,
        response_payload_json
    )
    VALUES (
        @suggestion_run_id,
        @analysis_id,
        @cv_profile_id,
        @job_id,
        N'rule-based-suggestion-v1',
        N'skills',
        N'Improve the CV by clarifying Docker only if the candidate has real verified experience.',
        N'Do not invent Docker experience. Treat Docker as a learning gap if unverified.',
        N'rule-based-suggestion-generator',
        N'rule-based-suggestion-v1',
        N'{"overall_score":82.5,"suggestions":[{"section":"skills","action":"add_if_true","title":"Clarify Docker only if true","current_gap":"JD requires Docker but the parsed CV has no verified Docker evidence.","suggested_wording":"Only if you have real Docker experience, add Docker under Skills and mention the project or role where you used it.","rationale":"Docker is a required skill in the JD and is currently missing from parsed CV evidence.","guardrail":{"code":"requires_verified_experience","severity":"blocker","message":"Do not claim Docker experience unless the candidate truly has it."}}],"blocked_claims":["Docker"],"source_analysis_version":"rule-based-gap-v1","suggestion_version":"rule-based-suggestion-v1"}'
    );
END;

IF NOT EXISTS (SELECT 1 FROM ai_data.cv_suggestion_items WHERE suggestion_item_id = @suggestion_item_id)
BEGIN
    INSERT INTO ai_data.cv_suggestion_items (
        suggestion_item_id,
        suggestion_run_id,
        section,
        action,
        title,
        current_gap,
        suggested_wording,
        reason,
        guardrail_code,
        guardrail_severity,
        required_evidence_text,
        related_gap_id,
        sort_order
    )
    VALUES (
        @suggestion_item_id,
        @suggestion_run_id,
        N'skills',
        N'add_if_true',
        N'Clarify Docker only if true',
        N'JD requires Docker but the parsed CV has no verified Docker evidence.',
        N'Only if you have real Docker experience, add Docker under Skills and mention the project or role where you used it.',
        N'Docker is required in the JD and missing from verified CV evidence.',
        N'requires_verified_experience',
        N'blocker',
        N'Candidate must confirm a real Docker project, task, or role before adding this claim.',
        @gap_id,
        1
    );
END;

IF NOT EXISTS (SELECT 1 FROM ai_data.evidence_refs WHERE evidence_ref_id = @evidence_gap_id)
BEGIN
    INSERT INTO ai_data.evidence_refs (
        evidence_ref_id,
        parent_type,
        parent_id,
        job_fit_gap_id,
        source_object_type,
        source_object_id,
        source_job_id,
        source_field,
        quote_hash,
        text_excerpt,
        confidence
    )
    VALUES (
        @evidence_gap_id,
        N'job_fit_gap_item',
        @gap_id,
        @gap_id,
        N'job_post',
        @job_id,
        @job_id,
        N'required_skills',
        N'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        N'Docker',
        1.0000
    );
END;

IF NOT EXISTS (SELECT 1 FROM ai_data.guardrail_flags WHERE flag_id = @guardrail_id)
BEGIN
    INSERT INTO ai_data.guardrail_flags (
        flag_id,
        parent_type,
        parent_id,
        cv_suggestion_item_id,
        code,
        severity,
        message,
        requires_user_confirmation,
        resolved
    )
    VALUES (
        @guardrail_id,
        N'cv_suggestion_item',
        @suggestion_item_id,
        @suggestion_item_id,
        N'requires_verified_experience',
        N'blocker',
        N'Do not claim Docker experience unless the candidate truly has it.',
        1,
        0
    );
END;

IF NOT EXISTS (SELECT 1 FROM ai_data.labeled_cv_jd_pairs WHERE label_id = @label_id)
BEGIN
    INSERT INTO ai_data.labeled_cv_jd_pairs (
        label_id,
        cv_profile_id,
        job_id,
        dataset_version,
        split,
        label_source,
        human_label,
        numeric_label,
        label_reason,
        cv_snapshot_json,
        job_snapshot_json
    )
    VALUES (
        @label_id,
        @cv_profile_id,
        @job_id,
        N'eval-seed-2026-08-21',
        N'test',
        N'sample_data',
        N'high',
        0.8250,
        N'Backend Python CV matches Python, FastAPI, SQL, location, and experience; Docker is the main gap.',
        N'{"cv_id":"cv-backend-sample","title":"Python Backend Developer","skills":["Python","FastAPI","SQL","Git"],"total_years_experience":2}',
        N'{"job_id":"sample-job-001","title":"Python FastAPI Developer","required_skills":["Python","FastAPI","SQL","Docker"],"min_years_experience":2}'
    );
END;

IF NOT EXISTS (SELECT 1 FROM ai_data.labeled_entities WHERE label_id = @labeled_entity_id)
BEGIN
    INSERT INTO ai_data.labeled_entities (
        label_id,
        object_type,
        object_id,
        entity_id,
        cv_profile_id,
        job_id,
        entity_text,
        entity_type_label,
        esco_uri_label,
        start_char,
        end_char,
        label_source,
        annotator_id,
        dataset_version,
        split
    )
    VALUES (
        @labeled_entity_id,
        N'cv_profile',
        @cv_profile_id,
        @cv_python_entity_id,
        @cv_profile_id,
        NULL,
        N'Python',
        N'skill',
        @python_esco_uri,
        NULL,
        NULL,
        N'sample_data',
        N'ai-data-seed',
        N'eval-seed-2026-08-21',
        N'test'
    );
END;

IF NOT EXISTS (SELECT 1 FROM ai_data.labeled_intents WHERE label_id = @labeled_intent_id)
BEGIN
    INSERT INTO ai_data.labeled_intents (
        label_id,
        message_text_hash,
        message_text_preview,
        intent_label,
        slots_json,
        source_channel,
        label_source,
        annotator_id,
        dataset_version,
        split
    )
    VALUES (
        @labeled_intent_id,
        N'2222222222222222222222222222222222222222222222222222222222222222',
        N'Find Python FastAPI backend jobs in Ho Chi Minh City',
        N'job_search',
        N'{"role":"Python FastAPI Developer","location":"Ho Chi Minh City","source":"sample"}',
        N'chat_assistant',
        N'sample_data',
        N'ai-data-seed',
        N'eval-seed-2026-08-21',
        N'test'
    );
END;

IF NOT EXISTS (SELECT 1 FROM ai_data.model_experiments WHERE experiment_id = @model_experiment_id)
BEGIN
    INSERT INTO ai_data.model_experiments (
        experiment_id,
        experiment_type,
        model_name,
        model_revision,
        dataset_version,
        metrics_json,
        params_json,
        artifact_uri,
        status,
        notes
    )
    VALUES (
        @model_experiment_id,
        N'embedding_benchmark',
        N'BAAI/bge-m3',
        N'not-run-yet',
        N'eval-seed-2026-08-21',
        N'{}',
        N'{"phase":"6.5","purpose":"prepare Phase 7 evaluation and Phase 4 benchmark"}',
        N'local://experiments/pending/bge-m3-eval-seed-2026-08-21',
        N'planned',
        N'Placeholder experiment record created by sample seed. Metrics are written in Phase 7/Phase 4.'
    );
END;

IF NOT EXISTS (SELECT 1 FROM ai_data.text_chunks WHERE chunk_id = @cv_chunk_id)
BEGIN
    INSERT INTO ai_data.text_chunks (
        chunk_id,
        object_type,
        object_id,
        cv_profile_id,
        job_id,
        source_field,
        chunk_order,
        chunk_text_hash,
        chunk_text_preview,
        token_count,
        chunker_name,
        chunker_version,
        metadata_json
    )
    VALUES
        (@cv_chunk_id, N'cv_profile', @cv_profile_id, @cv_profile_id, NULL, N'profile_json', 0, N'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', N'Python Backend Developer with FastAPI, SQL, and Git.', 12, N'sample-chunker', N'chunker-v1', N'{"purpose":"embedding_benchmark_seed"}'),
        (@job_chunk_id, N'job_post', @job_id, NULL, @job_id, N'normalized_json', 0, N'1111111111111111111111111111111111111111111111111111111111111111', N'Python FastAPI Developer requiring Python, FastAPI, SQL, Docker.', 13, N'sample-chunker', N'chunker-v1', N'{"purpose":"embedding_benchmark_seed"}');
END;

IF NOT EXISTS (SELECT 1 FROM ai_data.embeddings WHERE embedding_id = @cv_embedding_id)
BEGIN
    INSERT INTO ai_data.embeddings (
        embedding_id,
        chunk_id,
        model_name,
        model_revision,
        embedding_dimension,
        vector_ref,
        vector_blob,
        chunk_text_hash
    )
    VALUES
        (@cv_embedding_id, @cv_chunk_id, N'BAAI/bge-m3', N'not-computed-yet', 1024, N'local://pending/cv-backend-sample/profile_json/0', NULL, N'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'),
        (@job_embedding_id, @job_chunk_id, N'BAAI/bge-m3', N'not-computed-yet', 1024, N'local://pending/sample-job-001/normalized_json/0', NULL, N'1111111111111111111111111111111111111111111111111111111111111111');
END;

COMMIT TRANSACTION;

PRINT 'Seeded sample AI/Data flow: cv=1, job=1, match=1, analysis=1, suggestion=1, labels=3, embedding_refs=2, model_experiment=1';
