from pathlib import Path

import pytest

from app.services.cv_suggestions import build_cv_suggestions
from app.schemas.cv import CVProfile
from app.schemas.job import JobDescription


SAMPLES_DIR = Path("data/samples")


def load_cv() -> CVProfile:
    return CVProfile.model_validate_json((SAMPLES_DIR / "cv_sample.json").read_text(encoding="utf-8"))


def load_job() -> JobDescription:
    return JobDescription.model_validate_json((SAMPLES_DIR / "jd_sample.json").read_text(encoding="utf-8"))


def test_cv_suggestions_guard_missing_skill_and_reference_jd_evidence():
    response = build_cv_suggestions(load_cv(), load_job())

    docker = next(
        suggestion
        for suggestion in response.suggestions
        if suggestion.section == "skills" and "Docker" in suggestion.title
    )

    assert docker.action == "add_if_true"
    assert docker.guardrail is not None
    assert docker.guardrail.code == "requires_verified_experience"
    assert "only if" in docker.suggested_wording.lower()
    assert "do not claim" in docker.guardrail.message.lower()
    assert all(evidence.source == "jd" for evidence in docker.evidence)
    assert "Docker" in response.blocked_claims


def test_cv_suggestions_guard_experience_gap_without_inflating_years():
    cv = CVProfile(
        candidate_name="Nguyen Junior",
        title="Python Backend Developer",
        location="Ho Chi Minh City",
        skills=["Python", "FastAPI"],
        total_years_experience=1,
    )
    job = JobDescription(
        source="sample",
        external_id="senior-python",
        title="Senior Python Backend Developer",
        company_name="Senior AI Lab",
        location="Ho Chi Minh City",
        required_skills=["Python", "FastAPI"],
        min_years_experience=4,
        description_text="Senior backend role building Python APIs.",
        requirements_text="Python, FastAPI, 4+ years experience.",
    )

    response = build_cv_suggestions(cv, job)

    experience = next(suggestion for suggestion in response.suggestions if suggestion.section == "experience")
    assert experience.guardrail is not None
    assert experience.guardrail.code == "do_not_inflate_experience"
    assert "factual" in experience.suggested_wording.lower()
    assert "inflated years of experience" in response.blocked_claims


def test_cv_suggestions_guard_salary_gap_without_rewriting_expectation_as_match():
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

    response = build_cv_suggestions(cv, job)

    salary = next(suggestion for suggestion in response.suggestions if "salary" in suggestion.title.lower())
    assert salary.section == "summary"
    assert salary.action == "clarify"
    assert salary.guardrail is not None
    assert salary.guardrail.code == "do_not_hide_salary_gap"
    assert "3000" in salary.current_gap


def test_cv_suggestions_guard_work_mode_gap_with_true_preference_only():
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

    response = build_cv_suggestions(cv, job)

    work_mode = next(
        suggestion
        for suggestion in response.suggestions
        if "onsite" in suggestion.current_gap
    )
    assert work_mode.section == "summary"
    assert work_mode.action == "clarify"
    assert work_mode.guardrail is not None
    assert work_mode.guardrail.code == "requires_true_preference"
    assert "onsite" in work_mode.current_gap
    assert "if true" in work_mode.suggested_wording.lower()


def test_cv_suggestions_endpoint_returns_suggestions_contract():
    pytest.importorskip("ssl")
    from fastapi.testclient import TestClient
    from main import app

    client = TestClient(app)
    response = client.post(
        "/api/cv-suggestions",
        json={
            "cv": load_cv().model_dump(mode="json"),
            "job": load_job().model_dump(mode="json"),
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["suggestion_version"]
    assert any(item["section"] == "skills" for item in body["suggestions"])
    assert "Docker" in body["blocked_claims"]
