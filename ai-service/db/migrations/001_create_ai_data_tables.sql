/*
  AI/Data schema for JobMatch AI.

  Target: Microsoft SQL Server 2022+.
  Scope: CV/JD normalized data, ESCO entities, matching features, analysis,
  CV suggestions, evidence, labeled datasets, experiments, and vector cache refs.

  This migration intentionally does not run USE [database_name].
  Select the target database in your connection before running it.
*/

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'ai_data')
BEGIN
    EXEC(N'CREATE SCHEMA ai_data');
END;
GO

IF OBJECT_ID(N'ai_data.job_source_configs', N'U') IS NULL
BEGIN
    CREATE TABLE ai_data.job_source_configs (
        source_config_id UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_job_source_configs PRIMARY KEY
            CONSTRAINT DF_job_source_configs_id DEFAULT NEWID(),
        source_name NVARCHAR(80) NOT NULL,
        source_type NVARCHAR(40) NOT NULL,
        base_url NVARCHAR(1000) NULL,
        enabled BIT NOT NULL
            CONSTRAINT DF_job_source_configs_enabled DEFAULT (1),
        request_delay_seconds DECIMAL(6,2) NOT NULL
            CONSTRAINT DF_job_source_configs_delay DEFAULT (1),
        robots_policy NVARCHAR(40) NULL,
        auth_required BIT NOT NULL
            CONSTRAINT DF_job_source_configs_auth_required DEFAULT (0),
        notes NVARCHAR(1000) NULL,
        created_at DATETIME2(3) NOT NULL
            CONSTRAINT DF_job_source_configs_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2(3) NOT NULL
            CONSTRAINT DF_job_source_configs_updated_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UX_job_source_configs_source_name UNIQUE (source_name)
    );
END;
GO

IF OBJECT_ID(N'ai_data.crawl_runs', N'U') IS NULL
BEGIN
    CREATE TABLE ai_data.crawl_runs (
        crawl_run_id UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_crawl_runs PRIMARY KEY
            CONSTRAINT DF_crawl_runs_id DEFAULT NEWID(),
        source_config_id UNIQUEIDENTIFIER NULL,
        source NVARCHAR(80) NOT NULL,
        query_text NVARCHAR(1000) NULL,
        parsed_intent_json NVARCHAR(MAX) NULL,
        requested_by_user_id NVARCHAR(64) NULL,
        status NVARCHAR(30) NOT NULL
            CONSTRAINT DF_crawl_runs_status DEFAULT N'queued',
        started_at DATETIME2(3) NULL,
        finished_at DATETIME2(3) NULL,
        jobs_found_count INT NOT NULL
            CONSTRAINT DF_crawl_runs_jobs_found DEFAULT (0),
        jobs_new_count INT NOT NULL
            CONSTRAINT DF_crawl_runs_jobs_new DEFAULT (0),
        jobs_updated_count INT NOT NULL
            CONSTRAINT DF_crawl_runs_jobs_updated DEFAULT (0),
        error_message NVARCHAR(2000) NULL,
        crawler_name NVARCHAR(120) NULL,
        crawler_version NVARCHAR(80) NULL,
        created_at DATETIME2(3) NOT NULL
            CONSTRAINT DF_crawl_runs_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_crawl_runs_source_config
            FOREIGN KEY (source_config_id)
            REFERENCES ai_data.job_source_configs(source_config_id),
        CONSTRAINT CK_crawl_runs_status
            CHECK (status IN (N'queued', N'running', N'succeeded', N'failed', N'cancelled'))
    );
END;
GO

IF OBJECT_ID(N'ai_data.raw_cv_documents', N'U') IS NULL
BEGIN
    CREATE TABLE ai_data.raw_cv_documents (
        raw_cv_id UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_raw_cv_documents PRIMARY KEY
            CONSTRAINT DF_raw_cv_documents_id DEFAULT NEWID(),
        user_id NVARCHAR(64) NULL,
        conversation_id NVARCHAR(64) NULL,
        source NVARCHAR(40) NOT NULL
            CONSTRAINT DF_raw_cv_documents_source DEFAULT N'upload',
        original_filename NVARCHAR(260) NULL,
        mime_type NVARCHAR(100) NULL,
        storage_uri NVARCHAR(1000) NULL,
        file_sha256 CHAR(64) NULL,
        text_sha256 CHAR(64) NULL,
        text_preview NVARCHAR(1000) NULL,
        sanitized_text NVARCHAR(MAX) NULL,
        sanitized_json NVARCHAR(MAX) NULL,
        language NVARCHAR(20) NULL,
        pii_masked BIT NOT NULL
            CONSTRAINT DF_raw_cv_documents_pii_masked DEFAULT (1),
        parse_status NVARCHAR(30) NOT NULL
            CONSTRAINT DF_raw_cv_documents_parse_status DEFAULT N'pending',
        parser_name NVARCHAR(120) NULL,
        parser_version NVARCHAR(80) NULL,
        created_at DATETIME2(3) NOT NULL
            CONSTRAINT DF_raw_cv_documents_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2(3) NOT NULL
            CONSTRAINT DF_raw_cv_documents_updated_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_raw_cv_documents_parse_status
            CHECK (parse_status IN (N'pending', N'parsed', N'failed', N'skipped'))
    );
END;
GO

IF OBJECT_ID(N'ai_data.raw_job_postings', N'U') IS NULL
BEGIN
    CREATE TABLE ai_data.raw_job_postings (
        raw_job_id UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_raw_job_postings PRIMARY KEY
            CONSTRAINT DF_raw_job_postings_id DEFAULT NEWID(),
        crawl_run_id UNIQUEIDENTIFIER NULL,
        source NVARCHAR(80) NOT NULL,
        external_id NVARCHAR(200) NULL,
        source_url NVARCHAR(1000) NULL,
        source_url_hash CHAR(64) NULL,
        title_raw NVARCHAR(300) NULL,
        company_raw NVARCHAR(300) NULL,
        location_raw NVARCHAR(300) NULL,
        salary_raw NVARCHAR(300) NULL,
        employment_type_raw NVARCHAR(120) NULL,
        remote_policy_raw NVARCHAR(120) NULL,
        posted_at_raw NVARCHAR(120) NULL,
        description_html NVARCHAR(MAX) NULL,
        description_text NVARCHAR(MAX) NULL,
        raw_payload_json NVARCHAR(MAX) NULL,
        content_hash CHAR(64) NULL,
        fetch_status NVARCHAR(30) NOT NULL
            CONSTRAINT DF_raw_job_postings_fetch_status DEFAULT N'fetched',
        fetched_at DATETIME2(3) NOT NULL
            CONSTRAINT DF_raw_job_postings_fetched_at DEFAULT SYSUTCDATETIME(),
        created_at DATETIME2(3) NOT NULL
            CONSTRAINT DF_raw_job_postings_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_raw_job_postings_crawl_run
            FOREIGN KEY (crawl_run_id)
            REFERENCES ai_data.crawl_runs(crawl_run_id),
        CONSTRAINT CK_raw_job_postings_fetch_status
            CHECK (fetch_status IN (N'fetched', N'normalized', N'duplicate', N'failed', N'skipped'))
    );
END;
GO

IF OBJECT_ID(N'ai_data.cv_profiles', N'U') IS NULL
BEGIN
    CREATE TABLE ai_data.cv_profiles (
        cv_profile_id UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_cv_profiles PRIMARY KEY
            CONSTRAINT DF_cv_profiles_id DEFAULT NEWID(),
        raw_cv_id UNIQUEIDENTIFIER NULL,
        user_id NVARCHAR(64) NULL,
        candidate_name_redacted NVARCHAR(160) NULL,
        headline NVARCHAR(300) NULL,
        summary NVARCHAR(MAX) NULL,
        location_text NVARCHAR(300) NULL,
        email_hash CHAR(64) NULL,
        phone_hash CHAR(64) NULL,
        total_years_experience DECIMAL(4,1) NULL,
        skills_json NVARCHAR(MAX) NULL,
        experiences_json NVARCHAR(MAX) NULL,
        education_json NVARCHAR(MAX) NULL,
        projects_json NVARCHAR(MAX) NULL,
        certifications_json NVARCHAR(MAX) NULL,
        languages_json NVARCHAR(MAX) NULL,
        profile_json NVARCHAR(MAX) NOT NULL,
        schema_version NVARCHAR(40) NOT NULL
            CONSTRAINT DF_cv_profiles_schema_version DEFAULT N'1.0',
        extractor_name NVARCHAR(120) NULL,
        extractor_version NVARCHAR(80) NULL,
        quality_score DECIMAL(5,4) NULL,
        created_at DATETIME2(3) NOT NULL
            CONSTRAINT DF_cv_profiles_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2(3) NOT NULL
            CONSTRAINT DF_cv_profiles_updated_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_cv_profiles_raw_cv
            FOREIGN KEY (raw_cv_id)
            REFERENCES ai_data.raw_cv_documents(raw_cv_id),
        CONSTRAINT CK_cv_profiles_quality_score
            CHECK (quality_score IS NULL OR (quality_score >= 0 AND quality_score <= 1))
    );
END;
GO

IF OBJECT_ID(N'ai_data.job_posts_normalized', N'U') IS NULL
BEGIN
    CREATE TABLE ai_data.job_posts_normalized (
        job_id UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_job_posts_normalized PRIMARY KEY
            CONSTRAINT DF_job_posts_normalized_id DEFAULT NEWID(),
        raw_job_id UNIQUEIDENTIFIER NULL,
        source NVARCHAR(80) NOT NULL,
        external_id NVARCHAR(200) NULL,
        source_url NVARCHAR(1000) NULL,
        source_url_hash CHAR(64) NULL,
        title NVARCHAR(300) NOT NULL,
        company_name NVARCHAR(300) NULL,
        company_industry NVARCHAR(200) NULL,
        location_text NVARCHAR(300) NULL,
        country_code CHAR(2) NULL,
        remote_policy NVARCHAR(80) NULL,
        employment_type NVARCHAR(120) NULL,
        seniority_level NVARCHAR(120) NULL,
        salary_min DECIMAL(18,2) NULL,
        salary_max DECIMAL(18,2) NULL,
        salary_currency CHAR(3) NULL,
        salary_period NVARCHAR(40) NULL,
        required_skills_json NVARCHAR(MAX) NULL,
        preferred_skills_json NVARCHAR(MAX) NULL,
        responsibilities_json NVARCHAR(MAX) NULL,
        requirements_json NVARCHAR(MAX) NULL,
        benefits_json NVARCHAR(MAX) NULL,
        description_text NVARCHAR(MAX) NULL,
        requirements_text NVARCHAR(MAX) NULL,
        language NVARCHAR(20) NULL,
        normalized_json NVARCHAR(MAX) NOT NULL,
        title_esco_uri NVARCHAR(450) NULL,
        title_esco_preferred_label NVARCHAR(300) NULL,
        isco_group NVARCHAR(40) NULL,
        normalizer_name NVARCHAR(120) NULL,
        normalizer_version NVARCHAR(80) NULL,
        quality_score DECIMAL(5,4) NULL,
        active BIT NOT NULL
            CONSTRAINT DF_job_posts_normalized_active DEFAULT (1),
        posted_at DATETIME2(3) NULL,
        expires_at DATETIME2(3) NULL,
        created_at DATETIME2(3) NOT NULL
            CONSTRAINT DF_job_posts_normalized_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2(3) NOT NULL
            CONSTRAINT DF_job_posts_normalized_updated_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_job_posts_normalized_raw_job
            FOREIGN KEY (raw_job_id)
            REFERENCES ai_data.raw_job_postings(raw_job_id),
        CONSTRAINT CK_job_posts_normalized_quality_score
            CHECK (quality_score IS NULL OR (quality_score >= 0 AND quality_score <= 1)),
        CONSTRAINT CK_job_posts_normalized_salary
            CHECK (salary_min IS NULL OR salary_max IS NULL OR salary_min <= salary_max)
    );
END;
GO

IF OBJECT_ID(N'ai_data.esco_concepts', N'U') IS NULL
BEGIN
    CREATE TABLE ai_data.esco_concepts (
        esco_uri NVARCHAR(450) NOT NULL
            CONSTRAINT PK_esco_concepts PRIMARY KEY,
        preferred_label NVARCHAR(300) NOT NULL,
        alt_labels_json NVARCHAR(MAX) NULL,
        concept_type NVARCHAR(40) NOT NULL,
        isco_group NVARCHAR(40) NULL,
        broader_uri NVARCHAR(450) NULL,
        description_text NVARCHAR(MAX) NULL,
        source_version NVARCHAR(80) NULL,
        created_at DATETIME2(3) NOT NULL
            CONSTRAINT DF_esco_concepts_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2(3) NOT NULL
            CONSTRAINT DF_esco_concepts_updated_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_esco_concepts_type
            CHECK (concept_type IN (N'skill', N'occupation', N'knowledge', N'qualification', N'other'))
    );
END;
GO

IF OBJECT_ID(N'ai_data.entities', N'U') IS NULL
BEGIN
    CREATE TABLE ai_data.entities (
        entity_id UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_entities PRIMARY KEY
            CONSTRAINT DF_entities_id DEFAULT NEWID(),
        object_type NVARCHAR(40) NOT NULL,
        object_id UNIQUEIDENTIFIER NULL,
        object_external_id NVARCHAR(128) NULL,
        entity_text NVARCHAR(500) NOT NULL,
        normalized_text NVARCHAR(500) NULL,
        entity_type NVARCHAR(60) NOT NULL,
        start_char INT NULL,
        end_char INT NULL,
        confidence DECIMAL(5,4) NULL,
        extractor_name NVARCHAR(120) NULL,
        extractor_version NVARCHAR(80) NULL,
        evidence_text NVARCHAR(1000) NULL,
        metadata_json NVARCHAR(MAX) NULL,
        created_at DATETIME2(3) NOT NULL
            CONSTRAINT DF_entities_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_entities_confidence
            CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
        CONSTRAINT CK_entities_span
            CHECK (start_char IS NULL OR end_char IS NULL OR start_char <= end_char)
    );
END;
GO

IF OBJECT_ID(N'ai_data.entity_concept_links', N'U') IS NULL
BEGIN
    CREATE TABLE ai_data.entity_concept_links (
        link_id UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_entity_concept_links PRIMARY KEY
            CONSTRAINT DF_entity_concept_links_id DEFAULT NEWID(),
        entity_id UNIQUEIDENTIFIER NOT NULL,
        esco_uri NVARCHAR(450) NULL,
        concept_type NVARCHAR(40) NULL,
        preferred_label NVARCHAR(300) NULL,
        isco_group NVARCHAR(40) NULL,
        match_method NVARCHAR(80) NOT NULL,
        confidence DECIMAL(5,4) NULL,
        rank INT NOT NULL
            CONSTRAINT DF_entity_concept_links_rank DEFAULT (1),
        mapper_version NVARCHAR(80) NULL,
        created_at DATETIME2(3) NOT NULL
            CONSTRAINT DF_entity_concept_links_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_entity_concept_links_entity
            FOREIGN KEY (entity_id)
            REFERENCES ai_data.entities(entity_id)
            ON DELETE CASCADE,
        CONSTRAINT FK_entity_concept_links_esco
            FOREIGN KEY (esco_uri)
            REFERENCES ai_data.esco_concepts(esco_uri),
        CONSTRAINT CK_entity_concept_links_confidence
            CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1))
    );
END;
GO

IF OBJECT_ID(N'ai_data.cv_job_features', N'U') IS NULL
BEGIN
    CREATE TABLE ai_data.cv_job_features (
        feature_id UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_cv_job_features PRIMARY KEY
            CONSTRAINT DF_cv_job_features_id DEFAULT NEWID(),
        cv_profile_id UNIQUEIDENTIFIER NOT NULL,
        job_id UNIQUEIDENTIFIER NOT NULL,
        feature_version NVARCHAR(80) NOT NULL,
        required_skill_match_score DECIMAL(5,4) NULL,
        preferred_skill_match_score DECIMAL(5,4) NULL,
        title_similarity_score DECIMAL(5,4) NULL,
        seniority_fit_score DECIMAL(5,4) NULL,
        experience_fit_score DECIMAL(5,4) NULL,
        location_fit_score DECIMAL(5,4) NULL,
        salary_fit_score DECIMAL(5,4) NULL,
        semantic_similarity_score DECIMAL(5,4) NULL,
        overall_feature_score DECIMAL(5,4) NULL,
        matched_skills_json NVARCHAR(MAX) NULL,
        missing_required_skills_json NVARCHAR(MAX) NULL,
        missing_preferred_skills_json NVARCHAR(MAX) NULL,
        evidence_summary_json NVARCHAR(MAX) NULL,
        model_name NVARCHAR(160) NULL,
        model_revision NVARCHAR(120) NULL,
        created_at DATETIME2(3) NOT NULL
            CONSTRAINT DF_cv_job_features_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_cv_job_features_cv
            FOREIGN KEY (cv_profile_id)
            REFERENCES ai_data.cv_profiles(cv_profile_id),
        CONSTRAINT FK_cv_job_features_job
            FOREIGN KEY (job_id)
            REFERENCES ai_data.job_posts_normalized(job_id),
        CONSTRAINT UQ_cv_job_features_cv_job_version
            UNIQUE (cv_profile_id, job_id, feature_version),
        CONSTRAINT CK_cv_job_features_required_skill_score
            CHECK (required_skill_match_score IS NULL OR (required_skill_match_score >= 0 AND required_skill_match_score <= 1)),
        CONSTRAINT CK_cv_job_features_preferred_skill_score
            CHECK (preferred_skill_match_score IS NULL OR (preferred_skill_match_score >= 0 AND preferred_skill_match_score <= 1)),
        CONSTRAINT CK_cv_job_features_title_score
            CHECK (title_similarity_score IS NULL OR (title_similarity_score >= 0 AND title_similarity_score <= 1)),
        CONSTRAINT CK_cv_job_features_seniority_score
            CHECK (seniority_fit_score IS NULL OR (seniority_fit_score >= 0 AND seniority_fit_score <= 1)),
        CONSTRAINT CK_cv_job_features_experience_score
            CHECK (experience_fit_score IS NULL OR (experience_fit_score >= 0 AND experience_fit_score <= 1)),
        CONSTRAINT CK_cv_job_features_location_score
            CHECK (location_fit_score IS NULL OR (location_fit_score >= 0 AND location_fit_score <= 1)),
        CONSTRAINT CK_cv_job_features_salary_score
            CHECK (salary_fit_score IS NULL OR (salary_fit_score >= 0 AND salary_fit_score <= 1)),
        CONSTRAINT CK_cv_job_features_semantic_score
            CHECK (semantic_similarity_score IS NULL OR (semantic_similarity_score >= 0 AND semantic_similarity_score <= 1)),
        CONSTRAINT CK_cv_job_features_overall_score
            CHECK (overall_feature_score IS NULL OR (overall_feature_score >= 0 AND overall_feature_score <= 1))
    );
END;
GO

IF OBJECT_ID(N'ai_data.match_runs', N'U') IS NULL
BEGIN
    CREATE TABLE ai_data.match_runs (
        match_run_id UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_match_runs PRIMARY KEY
            CONSTRAINT DF_match_runs_id DEFAULT NEWID(),
        cv_profile_id UNIQUEIDENTIFIER NOT NULL,
        job_id UNIQUEIDENTIFIER NOT NULL,
        feature_id UNIQUEIDENTIFIER NULL,
        run_type NVARCHAR(60) NOT NULL,
        rank_position INT NULL,
        match_score DECIMAL(5,4) NOT NULL,
        confidence DECIMAL(5,4) NULL,
        decision_label NVARCHAR(80) NULL,
        explanation_summary NVARCHAR(MAX) NULL,
        scoring_model_name NVARCHAR(160) NULL,
        scoring_model_revision NVARCHAR(120) NULL,
        feature_version NVARCHAR(80) NULL,
        request_payload_json NVARCHAR(MAX) NULL,
        response_payload_json NVARCHAR(MAX) NULL,
        created_at DATETIME2(3) NOT NULL
            CONSTRAINT DF_match_runs_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_match_runs_cv
            FOREIGN KEY (cv_profile_id)
            REFERENCES ai_data.cv_profiles(cv_profile_id),
        CONSTRAINT FK_match_runs_job
            FOREIGN KEY (job_id)
            REFERENCES ai_data.job_posts_normalized(job_id),
        CONSTRAINT FK_match_runs_feature
            FOREIGN KEY (feature_id)
            REFERENCES ai_data.cv_job_features(feature_id),
        CONSTRAINT CK_match_runs_match_score
            CHECK (match_score >= 0 AND match_score <= 1),
        CONSTRAINT CK_match_runs_confidence
            CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1))
    );
END;
GO

IF OBJECT_ID(N'ai_data.job_fit_analyses', N'U') IS NULL
BEGIN
    CREATE TABLE ai_data.job_fit_analyses (
        analysis_id UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_job_fit_analyses PRIMARY KEY
            CONSTRAINT DF_job_fit_analyses_id DEFAULT NEWID(),
        match_run_id UNIQUEIDENTIFIER NULL,
        cv_profile_id UNIQUEIDENTIFIER NOT NULL,
        job_id UNIQUEIDENTIFIER NOT NULL,
        analysis_version NVARCHAR(80) NOT NULL,
        overall_score DECIMAL(5,4) NOT NULL,
        fit_label NVARCHAR(80) NULL,
        summary NVARCHAR(MAX) NULL,
        strengths_json NVARCHAR(MAX) NULL,
        risks_json NVARCHAR(MAX) NULL,
        recommendation NVARCHAR(MAX) NULL,
        analyzer_model_name NVARCHAR(160) NULL,
        analyzer_model_revision NVARCHAR(120) NULL,
        request_payload_json NVARCHAR(MAX) NULL,
        response_payload_json NVARCHAR(MAX) NULL,
        created_at DATETIME2(3) NOT NULL
            CONSTRAINT DF_job_fit_analyses_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_job_fit_analyses_match_run
            FOREIGN KEY (match_run_id)
            REFERENCES ai_data.match_runs(match_run_id),
        CONSTRAINT FK_job_fit_analyses_cv
            FOREIGN KEY (cv_profile_id)
            REFERENCES ai_data.cv_profiles(cv_profile_id),
        CONSTRAINT FK_job_fit_analyses_job
            FOREIGN KEY (job_id)
            REFERENCES ai_data.job_posts_normalized(job_id),
        CONSTRAINT CK_job_fit_analyses_overall_score
            CHECK (overall_score >= 0 AND overall_score <= 1)
    );
END;
GO

IF OBJECT_ID(N'ai_data.job_fit_gap_items', N'U') IS NULL
BEGIN
    CREATE TABLE ai_data.job_fit_gap_items (
        gap_id UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_job_fit_gap_items PRIMARY KEY
            CONSTRAINT DF_job_fit_gap_items_id DEFAULT NEWID(),
        analysis_id UNIQUEIDENTIFIER NOT NULL,
        category NVARCHAR(80) NOT NULL,
        severity NVARCHAR(40) NOT NULL,
        requirement_text NVARCHAR(MAX) NULL,
        candidate_evidence_text NVARCHAR(MAX) NULL,
        gap_summary NVARCHAR(MAX) NOT NULL,
        why_it_matters NVARCHAR(MAX) NULL,
        action_hint NVARCHAR(MAX) NULL,
        skill_esco_uri NVARCHAR(450) NULL,
        skill_label NVARCHAR(300) NULL,
        evidence_refs_json NVARCHAR(MAX) NULL,
        sort_order INT NOT NULL
            CONSTRAINT DF_job_fit_gap_items_sort_order DEFAULT (0),
        created_at DATETIME2(3) NOT NULL
            CONSTRAINT DF_job_fit_gap_items_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_job_fit_gap_items_analysis
            FOREIGN KEY (analysis_id)
            REFERENCES ai_data.job_fit_analyses(analysis_id)
            ON DELETE CASCADE,
        CONSTRAINT FK_job_fit_gap_items_skill_esco
            FOREIGN KEY (skill_esco_uri)
            REFERENCES ai_data.esco_concepts(esco_uri),
        CONSTRAINT CK_job_fit_gap_items_severity
            CHECK (severity IN (N'info', N'low', N'medium', N'high', N'blocker'))
    );
END;
GO

IF OBJECT_ID(N'ai_data.cv_suggestions', N'U') IS NULL
BEGIN
    CREATE TABLE ai_data.cv_suggestions (
        suggestion_run_id UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_cv_suggestions PRIMARY KEY
            CONSTRAINT DF_cv_suggestions_id DEFAULT NEWID(),
        analysis_id UNIQUEIDENTIFIER NULL,
        cv_profile_id UNIQUEIDENTIFIER NOT NULL,
        job_id UNIQUEIDENTIFIER NOT NULL,
        suggestion_version NVARCHAR(80) NOT NULL,
        target_cv_section NVARCHAR(80) NULL,
        overall_guidance NVARCHAR(MAX) NULL,
        guardrail_summary NVARCHAR(MAX) NULL,
        generator_model_name NVARCHAR(160) NULL,
        generator_model_revision NVARCHAR(120) NULL,
        request_payload_json NVARCHAR(MAX) NULL,
        response_payload_json NVARCHAR(MAX) NULL,
        created_at DATETIME2(3) NOT NULL
            CONSTRAINT DF_cv_suggestions_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_cv_suggestions_analysis
            FOREIGN KEY (analysis_id)
            REFERENCES ai_data.job_fit_analyses(analysis_id),
        CONSTRAINT FK_cv_suggestions_cv
            FOREIGN KEY (cv_profile_id)
            REFERENCES ai_data.cv_profiles(cv_profile_id),
        CONSTRAINT FK_cv_suggestions_job
            FOREIGN KEY (job_id)
            REFERENCES ai_data.job_posts_normalized(job_id)
    );
END;
GO

IF OBJECT_ID(N'ai_data.cv_suggestion_items', N'U') IS NULL
BEGIN
    CREATE TABLE ai_data.cv_suggestion_items (
        suggestion_item_id UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_cv_suggestion_items PRIMARY KEY
            CONSTRAINT DF_cv_suggestion_items_id DEFAULT NEWID(),
        suggestion_run_id UNIQUEIDENTIFIER NOT NULL,
        section NVARCHAR(80) NOT NULL,
        action NVARCHAR(80) NOT NULL,
        title NVARCHAR(300) NOT NULL,
        current_gap NVARCHAR(MAX) NULL,
        suggested_wording NVARCHAR(MAX) NULL,
        reason NVARCHAR(MAX) NULL,
        guardrail_code NVARCHAR(120) NULL,
        guardrail_severity NVARCHAR(40) NULL,
        required_evidence_text NVARCHAR(MAX) NULL,
        related_gap_id UNIQUEIDENTIFIER NULL,
        sort_order INT NOT NULL
            CONSTRAINT DF_cv_suggestion_items_sort_order DEFAULT (0),
        created_at DATETIME2(3) NOT NULL
            CONSTRAINT DF_cv_suggestion_items_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_cv_suggestion_items_run
            FOREIGN KEY (suggestion_run_id)
            REFERENCES ai_data.cv_suggestions(suggestion_run_id)
            ON DELETE CASCADE,
        CONSTRAINT FK_cv_suggestion_items_gap
            FOREIGN KEY (related_gap_id)
            REFERENCES ai_data.job_fit_gap_items(gap_id),
        CONSTRAINT CK_cv_suggestion_items_guardrail_severity
            CHECK (guardrail_severity IS NULL OR guardrail_severity IN (N'info', N'low', N'medium', N'high', N'blocker'))
    );
END;
GO

IF OBJECT_ID(N'ai_data.evidence_refs', N'U') IS NULL
BEGIN
    CREATE TABLE ai_data.evidence_refs (
        evidence_ref_id UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_evidence_refs PRIMARY KEY
            CONSTRAINT DF_evidence_refs_id DEFAULT NEWID(),
        parent_type NVARCHAR(80) NOT NULL,
        parent_id UNIQUEIDENTIFIER NOT NULL,
        source_object_type NVARCHAR(80) NOT NULL,
        source_object_id UNIQUEIDENTIFIER NULL,
        source_field NVARCHAR(120) NULL,
        quote_hash CHAR(64) NULL,
        text_excerpt NVARCHAR(1000) NULL,
        start_char INT NULL,
        end_char INT NULL,
        confidence DECIMAL(5,4) NULL,
        created_at DATETIME2(3) NOT NULL
            CONSTRAINT DF_evidence_refs_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_evidence_refs_confidence
            CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
        CONSTRAINT CK_evidence_refs_span
            CHECK (start_char IS NULL OR end_char IS NULL OR start_char <= end_char)
    );
END;
GO

IF OBJECT_ID(N'ai_data.guardrail_flags', N'U') IS NULL
BEGIN
    CREATE TABLE ai_data.guardrail_flags (
        flag_id UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_guardrail_flags PRIMARY KEY
            CONSTRAINT DF_guardrail_flags_id DEFAULT NEWID(),
        parent_type NVARCHAR(80) NOT NULL,
        parent_id UNIQUEIDENTIFIER NOT NULL,
        code NVARCHAR(120) NOT NULL,
        severity NVARCHAR(40) NOT NULL,
        message NVARCHAR(MAX) NOT NULL,
        requires_user_confirmation BIT NOT NULL
            CONSTRAINT DF_guardrail_flags_requires_confirmation DEFAULT (0),
        resolved BIT NOT NULL
            CONSTRAINT DF_guardrail_flags_resolved DEFAULT (0),
        created_at DATETIME2(3) NOT NULL
            CONSTRAINT DF_guardrail_flags_created_at DEFAULT SYSUTCDATETIME(),
        resolved_at DATETIME2(3) NULL,
        CONSTRAINT CK_guardrail_flags_severity
            CHECK (severity IN (N'info', N'low', N'medium', N'high', N'blocker'))
    );
END;
GO

IF OBJECT_ID(N'ai_data.labeled_cv_jd_pairs', N'U') IS NULL
BEGIN
    CREATE TABLE ai_data.labeled_cv_jd_pairs (
        label_id UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_labeled_cv_jd_pairs PRIMARY KEY
            CONSTRAINT DF_labeled_cv_jd_pairs_id DEFAULT NEWID(),
        cv_profile_id UNIQUEIDENTIFIER NULL,
        job_id UNIQUEIDENTIFIER NULL,
        dataset_version NVARCHAR(80) NOT NULL,
        split NVARCHAR(40) NOT NULL,
        label_source NVARCHAR(80) NOT NULL,
        human_label NVARCHAR(80) NULL,
        numeric_label DECIMAL(5,4) NULL,
        label_reason NVARCHAR(MAX) NULL,
        annotator_id NVARCHAR(64) NULL,
        cv_snapshot_json NVARCHAR(MAX) NULL,
        job_snapshot_json NVARCHAR(MAX) NULL,
        created_at DATETIME2(3) NOT NULL
            CONSTRAINT DF_labeled_cv_jd_pairs_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_labeled_cv_jd_pairs_cv
            FOREIGN KEY (cv_profile_id)
            REFERENCES ai_data.cv_profiles(cv_profile_id),
        CONSTRAINT FK_labeled_cv_jd_pairs_job
            FOREIGN KEY (job_id)
            REFERENCES ai_data.job_posts_normalized(job_id),
        CONSTRAINT CK_labeled_cv_jd_pairs_split
            CHECK (split IN (N'train', N'validation', N'test', N'holdout')),
        CONSTRAINT CK_labeled_cv_jd_pairs_numeric_label
            CHECK (numeric_label IS NULL OR (numeric_label >= 0 AND numeric_label <= 1))
    );
END;
GO

IF OBJECT_ID(N'ai_data.labeled_entities', N'U') IS NULL
BEGIN
    CREATE TABLE ai_data.labeled_entities (
        label_id UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_labeled_entities PRIMARY KEY
            CONSTRAINT DF_labeled_entities_id DEFAULT NEWID(),
        object_type NVARCHAR(40) NOT NULL,
        object_id UNIQUEIDENTIFIER NULL,
        entity_text NVARCHAR(500) NOT NULL,
        entity_type_label NVARCHAR(60) NOT NULL,
        esco_uri_label NVARCHAR(450) NULL,
        start_char INT NULL,
        end_char INT NULL,
        label_source NVARCHAR(80) NOT NULL,
        annotator_id NVARCHAR(64) NULL,
        dataset_version NVARCHAR(80) NOT NULL,
        split NVARCHAR(40) NOT NULL,
        created_at DATETIME2(3) NOT NULL
            CONSTRAINT DF_labeled_entities_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_labeled_entities_esco
            FOREIGN KEY (esco_uri_label)
            REFERENCES ai_data.esco_concepts(esco_uri),
        CONSTRAINT CK_labeled_entities_split
            CHECK (split IN (N'train', N'validation', N'test', N'holdout')),
        CONSTRAINT CK_labeled_entities_span
            CHECK (start_char IS NULL OR end_char IS NULL OR start_char <= end_char)
    );
END;
GO

IF OBJECT_ID(N'ai_data.labeled_intents', N'U') IS NULL
BEGIN
    CREATE TABLE ai_data.labeled_intents (
        label_id UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_labeled_intents PRIMARY KEY
            CONSTRAINT DF_labeled_intents_id DEFAULT NEWID(),
        message_text_hash CHAR(64) NULL,
        message_text_preview NVARCHAR(1000) NULL,
        intent_label NVARCHAR(120) NOT NULL,
        slots_json NVARCHAR(MAX) NULL,
        source_channel NVARCHAR(80) NULL,
        label_source NVARCHAR(80) NOT NULL,
        annotator_id NVARCHAR(64) NULL,
        dataset_version NVARCHAR(80) NOT NULL,
        split NVARCHAR(40) NOT NULL,
        created_at DATETIME2(3) NOT NULL
            CONSTRAINT DF_labeled_intents_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_labeled_intents_split
            CHECK (split IN (N'train', N'validation', N'test', N'holdout'))
    );
END;
GO

IF OBJECT_ID(N'ai_data.model_experiments', N'U') IS NULL
BEGIN
    CREATE TABLE ai_data.model_experiments (
        experiment_id UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_model_experiments PRIMARY KEY
            CONSTRAINT DF_model_experiments_id DEFAULT NEWID(),
        experiment_type NVARCHAR(80) NOT NULL,
        model_name NVARCHAR(160) NOT NULL,
        model_revision NVARCHAR(120) NULL,
        dataset_version NVARCHAR(80) NULL,
        metrics_json NVARCHAR(MAX) NULL,
        params_json NVARCHAR(MAX) NULL,
        artifact_uri NVARCHAR(1000) NULL,
        status NVARCHAR(40) NOT NULL
            CONSTRAINT DF_model_experiments_status DEFAULT N'planned',
        started_at DATETIME2(3) NULL,
        finished_at DATETIME2(3) NULL,
        notes NVARCHAR(MAX) NULL,
        created_at DATETIME2(3) NOT NULL
            CONSTRAINT DF_model_experiments_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_model_experiments_status
            CHECK (status IN (N'planned', N'running', N'succeeded', N'failed', N'cancelled'))
    );
END;
GO

IF OBJECT_ID(N'ai_data.text_chunks', N'U') IS NULL
BEGIN
    CREATE TABLE ai_data.text_chunks (
        chunk_id UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_text_chunks PRIMARY KEY
            CONSTRAINT DF_text_chunks_id DEFAULT NEWID(),
        object_type NVARCHAR(40) NOT NULL,
        object_id UNIQUEIDENTIFIER NULL,
        source_field NVARCHAR(120) NOT NULL,
        chunk_order INT NOT NULL,
        chunk_text_hash CHAR(64) NOT NULL,
        chunk_text_preview NVARCHAR(1000) NULL,
        token_count INT NULL,
        chunker_name NVARCHAR(120) NULL,
        chunker_version NVARCHAR(80) NULL,
        metadata_json NVARCHAR(MAX) NULL,
        created_at DATETIME2(3) NOT NULL
            CONSTRAINT DF_text_chunks_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_text_chunks_chunk_order
            CHECK (chunk_order >= 0),
        CONSTRAINT CK_text_chunks_token_count
            CHECK (token_count IS NULL OR token_count >= 0)
    );
END;
GO

IF OBJECT_ID(N'ai_data.embeddings', N'U') IS NULL
BEGIN
    CREATE TABLE ai_data.embeddings (
        embedding_id UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_embeddings PRIMARY KEY
            CONSTRAINT DF_embeddings_id DEFAULT NEWID(),
        chunk_id UNIQUEIDENTIFIER NOT NULL,
        model_name NVARCHAR(160) NOT NULL,
        model_revision NVARCHAR(120) NULL,
        embedding_dimension INT NULL,
        vector_ref NVARCHAR(1000) NULL,
        vector_blob VARBINARY(MAX) NULL,
        chunk_text_hash CHAR(64) NOT NULL,
        created_at DATETIME2(3) NOT NULL
            CONSTRAINT DF_embeddings_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_embeddings_chunk
            FOREIGN KEY (chunk_id)
            REFERENCES ai_data.text_chunks(chunk_id)
            ON DELETE CASCADE,
        CONSTRAINT UQ_embeddings_chunk_model_revision
            UNIQUE (chunk_id, model_name, model_revision),
        CONSTRAINT CK_embeddings_dimension
            CHECK (embedding_dimension IS NULL OR embedding_dimension > 0)
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_raw_cv_documents_user_created' AND object_id = OBJECT_ID(N'ai_data.raw_cv_documents'))
    CREATE INDEX IX_raw_cv_documents_user_created
    ON ai_data.raw_cv_documents(user_id, created_at DESC);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_raw_cv_documents_file_sha256' AND object_id = OBJECT_ID(N'ai_data.raw_cv_documents'))
    CREATE INDEX IX_raw_cv_documents_file_sha256
    ON ai_data.raw_cv_documents(file_sha256)
    WHERE file_sha256 IS NOT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_cv_profiles_user_created' AND object_id = OBJECT_ID(N'ai_data.cv_profiles'))
    CREATE INDEX IX_cv_profiles_user_created
    ON ai_data.cv_profiles(user_id, created_at DESC);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_crawl_runs_source_created' AND object_id = OBJECT_ID(N'ai_data.crawl_runs'))
    CREATE INDEX IX_crawl_runs_source_created
    ON ai_data.crawl_runs(source, created_at DESC);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_raw_job_postings_source_external_id' AND object_id = OBJECT_ID(N'ai_data.raw_job_postings'))
    CREATE UNIQUE INDEX UX_raw_job_postings_source_external_id
    ON ai_data.raw_job_postings(source, external_id)
    WHERE external_id IS NOT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_raw_job_postings_source_url_hash' AND object_id = OBJECT_ID(N'ai_data.raw_job_postings'))
    CREATE UNIQUE INDEX UX_raw_job_postings_source_url_hash
    ON ai_data.raw_job_postings(source_url_hash)
    WHERE source_url_hash IS NOT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_raw_job_postings_content_hash' AND object_id = OBJECT_ID(N'ai_data.raw_job_postings'))
    CREATE INDEX IX_raw_job_postings_content_hash
    ON ai_data.raw_job_postings(content_hash)
    WHERE content_hash IS NOT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_job_posts_normalized_source_external_id' AND object_id = OBJECT_ID(N'ai_data.job_posts_normalized'))
    CREATE UNIQUE INDEX UX_job_posts_normalized_source_external_id
    ON ai_data.job_posts_normalized(source, external_id)
    WHERE external_id IS NOT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_job_posts_normalized_source_url_hash' AND object_id = OBJECT_ID(N'ai_data.job_posts_normalized'))
    CREATE UNIQUE INDEX UX_job_posts_normalized_source_url_hash
    ON ai_data.job_posts_normalized(source_url_hash)
    WHERE source_url_hash IS NOT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_job_posts_normalized_active_posted' AND object_id = OBJECT_ID(N'ai_data.job_posts_normalized'))
    CREATE INDEX IX_job_posts_normalized_active_posted
    ON ai_data.job_posts_normalized(active, posted_at DESC);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_job_posts_normalized_title_esco' AND object_id = OBJECT_ID(N'ai_data.job_posts_normalized'))
    CREATE INDEX IX_job_posts_normalized_title_esco
    ON ai_data.job_posts_normalized(title_esco_uri);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_entities_object_type_id_type' AND object_id = OBJECT_ID(N'ai_data.entities'))
    CREATE INDEX IX_entities_object_type_id_type
    ON ai_data.entities(object_type, object_id, entity_type);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_entities_normalized_text' AND object_id = OBJECT_ID(N'ai_data.entities'))
    CREATE INDEX IX_entities_normalized_text
    ON ai_data.entities(normalized_text, entity_type);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_entity_concept_links_esco_uri' AND object_id = OBJECT_ID(N'ai_data.entity_concept_links'))
    CREATE INDEX IX_entity_concept_links_esco_uri
    ON ai_data.entity_concept_links(esco_uri);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_entity_concept_links_entity_rank' AND object_id = OBJECT_ID(N'ai_data.entity_concept_links'))
    CREATE INDEX IX_entity_concept_links_entity_rank
    ON ai_data.entity_concept_links(entity_id, rank);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_match_runs_cv_job_created' AND object_id = OBJECT_ID(N'ai_data.match_runs'))
    CREATE INDEX IX_match_runs_cv_job_created
    ON ai_data.match_runs(cv_profile_id, job_id, created_at DESC);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_match_runs_job_score' AND object_id = OBJECT_ID(N'ai_data.match_runs'))
    CREATE INDEX IX_match_runs_job_score
    ON ai_data.match_runs(job_id, match_score DESC);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_job_fit_analyses_cv_job_created' AND object_id = OBJECT_ID(N'ai_data.job_fit_analyses'))
    CREATE INDEX IX_job_fit_analyses_cv_job_created
    ON ai_data.job_fit_analyses(cv_profile_id, job_id, created_at DESC);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_job_fit_gap_items_analysis_order' AND object_id = OBJECT_ID(N'ai_data.job_fit_gap_items'))
    CREATE INDEX IX_job_fit_gap_items_analysis_order
    ON ai_data.job_fit_gap_items(analysis_id, sort_order);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_cv_suggestions_cv_job_created' AND object_id = OBJECT_ID(N'ai_data.cv_suggestions'))
    CREATE INDEX IX_cv_suggestions_cv_job_created
    ON ai_data.cv_suggestions(cv_profile_id, job_id, created_at DESC);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_cv_suggestion_items_run_order' AND object_id = OBJECT_ID(N'ai_data.cv_suggestion_items'))
    CREATE INDEX IX_cv_suggestion_items_run_order
    ON ai_data.cv_suggestion_items(suggestion_run_id, sort_order);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_evidence_refs_parent' AND object_id = OBJECT_ID(N'ai_data.evidence_refs'))
    CREATE INDEX IX_evidence_refs_parent
    ON ai_data.evidence_refs(parent_type, parent_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_guardrail_flags_parent' AND object_id = OBJECT_ID(N'ai_data.guardrail_flags'))
    CREATE INDEX IX_guardrail_flags_parent
    ON ai_data.guardrail_flags(parent_type, parent_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_labeled_cv_jd_pairs_dataset_split' AND object_id = OBJECT_ID(N'ai_data.labeled_cv_jd_pairs'))
    CREATE INDEX IX_labeled_cv_jd_pairs_dataset_split
    ON ai_data.labeled_cv_jd_pairs(dataset_version, split);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_labeled_entities_dataset_split' AND object_id = OBJECT_ID(N'ai_data.labeled_entities'))
    CREATE INDEX IX_labeled_entities_dataset_split
    ON ai_data.labeled_entities(dataset_version, split);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_labeled_intents_dataset_split' AND object_id = OBJECT_ID(N'ai_data.labeled_intents'))
    CREATE INDEX IX_labeled_intents_dataset_split
    ON ai_data.labeled_intents(dataset_version, split);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_model_experiments_lookup' AND object_id = OBJECT_ID(N'ai_data.model_experiments'))
    CREATE INDEX IX_model_experiments_lookup
    ON ai_data.model_experiments(experiment_type, dataset_version, model_name);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_text_chunks_object_order' AND object_id = OBJECT_ID(N'ai_data.text_chunks'))
    CREATE INDEX IX_text_chunks_object_order
    ON ai_data.text_chunks(object_type, object_id, chunk_order);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_text_chunks_hash' AND object_id = OBJECT_ID(N'ai_data.text_chunks'))
    CREATE INDEX IX_text_chunks_hash
    ON ai_data.text_chunks(chunk_text_hash);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_embeddings_chunk_model' AND object_id = OBJECT_ID(N'ai_data.embeddings'))
    CREATE INDEX IX_embeddings_chunk_model
    ON ai_data.embeddings(chunk_id, model_name, model_revision);
GO
