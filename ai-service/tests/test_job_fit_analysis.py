from pathlib import Path

import pytest

from app.services.job_fit_analysis import analyze_job_fit
from app.schemas.cv import CVProfile
from app.schemas.job import JobDescription


SAMPLES_DIR = Path("data/samples")


def load_cv() -> CVProfile:
    return CVProfile.model_validate_json((SAMPLES_DIR / "cv_sample.json").read_text(encoding="utf-8"))


def load_job() -> JobDescription:
    return JobDescription.model_validate_json((SAMPLES_DIR / "jd_sample.json").read_text(encoding="utf-8"))


def test_analyze_job_fit_returns_evidence_backed_skill_and_experience_gaps():
    analysis = analyze_job_fit(load_cv(), load_job())

    assert analysis.overall_score >= 75
    assert analysis.matched_skills == ["Python", "FastAPI", "SQL"]
    assert analysis.missing_required_skills == ["Docker"]
    assert "Docker" in analysis.improvement_focus

    matched_python = next(
        gap
        for gap in analysis.fit_gaps
        if gap.category == "skill" and gap.status == "match" and gap.requirement == "Python"
    )
    assert {evidence.source for evidence in matched_python.evidence} == {"cv", "jd"}
    assert any(evidence.section == "skills" for evidence in matched_python.evidence)

    missing_docker = next(
        gap
        for gap in analysis.fit_gaps
        if gap.category == "skill" and gap.status == "gap" and gap.requirement == "Docker"
    )
    assert missing_docker.severity == "high"
    assert all(evidence.source == "jd" for evidence in missing_docker.evidence)
    assert "not add it as verified experience" in missing_docker.guardrail

    experience = next(gap for gap in analysis.fit_gaps if gap.category == "experience")
    assert experience.status == "match"
    assert experience.evidence


def test_analyze_job_fit_endpoint_returns_analysis_contract():
    pytest.importorskip("ssl")
    from fastapi.testclient import TestClient
    from main import app

    client = TestClient(app)
    response = client.post(
        "/api/analyze-job-fit",
        json={
            "cv": load_cv().model_dump(mode="json"),
            "job": load_job().model_dump(mode="json"),
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["overall_score"] >= 75
    assert body["matched_skills"] == ["Python", "FastAPI", "SQL"]
    assert body["missing_required_skills"] == ["Docker"]
    assert any(gap["category"] == "skill" and gap["status"] == "gap" for gap in body["fit_gaps"])
    assert body["analyzer_version"]


def test_analyze_job_fit_detects_remote_work_mode_match_from_cv_text():
    cv = CVProfile(
        candidate_name="Nguyen Remote",
        title="Python Backend Developer",
        location="Ho Chi Minh City",
        skills=["Python", "FastAPI"],
        total_years_experience=2,
        raw_text="Python backend developer. Work preference: open to remote work.",
    )
    job = JobDescription(
        source="sample",
        external_id="remote-python",
        title="Remote Python Backend Developer",
        company_name="Remote AI Lab",
        location="Da Nang (Remote)",
        job_type="remote",
        required_skills=["Python", "FastAPI"],
        min_years_experience=2,
        description_text="Remote backend role building Python APIs.",
        requirements_text="Python, FastAPI, remote collaboration.",
    )

    analysis = analyze_job_fit(cv, job)

    work_mode = next(gap for gap in analysis.fit_gaps if gap.category == "work_mode")
    assert work_mode.status == "match"
    assert {evidence.source for evidence in work_mode.evidence} == {"cv", "jd"}
    assert any(evidence.section == "preferences" for evidence in work_mode.evidence)


def test_analyze_job_fit_flags_work_mode_gap_when_cv_preference_conflicts_with_remote_jd():
    cv = CVProfile(
        candidate_name="Nguyen Onsite",
        title="Python Backend Developer",
        location="Ho Chi Minh City",
        skills=["Python", "FastAPI"],
        total_years_experience=2,
        raw_text="Python backend developer. Work preference: onsite only.",
    )
    job = JobDescription(
        source="sample",
        external_id="remote-python-onsite-cv",
        title="Remote Python Backend Developer",
        company_name="Remote AI Lab",
        location="Da Nang (Remote)",
        job_type="remote",
        required_skills=["Python", "FastAPI"],
        min_years_experience=2,
        description_text="Remote backend role building Python APIs.",
        requirements_text="Python, FastAPI, remote collaboration.",
    )

    analysis = analyze_job_fit(cv, job)

    work_mode = next(gap for gap in analysis.fit_gaps if gap.category == "work_mode")
    assert work_mode.status == "gap"
    assert work_mode.severity == "medium"
    assert work_mode.requirement == "remote"
    assert "onsite" in work_mode.message
    assert work_mode.guardrail is not None


def test_analyze_job_fit_flags_salary_gap_when_cv_expectation_exceeds_job_range():
    cv = CVProfile(
        candidate_name="Nguyen Salary",
        title="Python Backend Developer",
        location="Ho Chi Minh City",
        skills=["Python", "FastAPI"],
        total_years_experience=2,
        raw_text="Python backend developer. Expected salary: 3000 USD.",
    )
    job = JobDescription(
        source="sample",
        external_id="salary-python",
        title="Python Backend Developer",
        company_name="Budget AI Lab",
        location="Ho Chi Minh City",
        salary_min=1200,
        salary_max=2200,
        currency="USD",
        required_skills=["Python", "FastAPI"],
        min_years_experience=2,
        description_text="Backend role building Python APIs.",
        requirements_text="Python, FastAPI, 2+ years.",
    )

    analysis = analyze_job_fit(cv, job)

    salary = next(gap for gap in analysis.fit_gaps if gap.category == "salary")
    assert salary.status == "gap"
    assert salary.severity == "medium"
    assert {evidence.source for evidence in salary.evidence} == {"cv", "jd"}
    assert "3000" in salary.evidence[0].text


def test_analyze_job_fit_uses_project_evidence_when_skill_is_not_in_top_level_skills():
    cv = CVProfile(
        candidate_name="Nguyen Project",
        title="Backend Developer",
        location="Ho Chi Minh City",
        skills=["SQL"],
        total_years_experience=2,
        projects=[
            {
                "name": "Job Matching AI",
                "description": "Built matching services with Python and FastAPI.",
                "skills": ["Python", "FastAPI"],
            }
        ],
    )
    job = JobDescription(
        source="sample",
        external_id="project-python",
        title="Python FastAPI Developer",
        company_name="Evidence AI Lab",
        location="Ho Chi Minh City",
        required_skills=["Python", "FastAPI"],
        min_years_experience=2,
        description_text="Build Python FastAPI services.",
        requirements_text="Python and FastAPI.",
    )

    analysis = analyze_job_fit(cv, job)

    python = next(
        gap
        for gap in analysis.fit_gaps
        if gap.category == "skill" and gap.status == "match" and gap.requirement == "Python"
    )
    assert any(evidence.section == "projects" for evidence in python.evidence)
