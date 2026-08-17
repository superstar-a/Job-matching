import json
from pathlib import Path

from fastapi.testclient import TestClient

from app.schemas.cv import CVProfile
from app.schemas.job import JobDescription
from app.services.matching import recommend_jobs, score_cv_jd
from main import app


SAMPLES_DIR = Path("data/samples")
EVALUATION_PATH = SAMPLES_DIR / "matching_evaluation.json"
client = TestClient(app)


def load_cv() -> CVProfile:
    return CVProfile.model_validate_json((SAMPLES_DIR / "cv_sample.json").read_text(encoding="utf-8"))


def load_job() -> JobDescription:
    return JobDescription.model_validate_json((SAMPLES_DIR / "jd_sample.json").read_text(encoding="utf-8"))


def test_score_cv_jd_returns_high_score_with_explanation_for_strong_backend_match():
    result = score_cv_jd(load_cv(), load_job())

    assert result.overall_score >= 75
    assert result.matched_skills == ["Python", "FastAPI", "SQL"]
    assert result.missing_required_skills == ["Docker"]
    assert result.nice_to_have_skills == ["AWS", "NLP"]
    assert result.experience_gap == "Candidate meets the minimum 2 years of experience."
    assert result.salary_gap is None
    assert "strong" in result.recommendation_reason.lower()


def test_score_cv_jd_returns_mid_score_when_candidate_has_partial_skill_overlap():
    cv = CVProfile(
        candidate_name="Tran Thi B",
        title="QA Automation Engineer",
        location="Ho Chi Minh City",
        skills=["Python", "Selenium", "Pytest", "SQL"],
        total_years_experience=1.5,
        raw_text="QA engineer using Python, Selenium, Pytest, SQL, and API testing.",
    )
    job = load_job()

    result = score_cv_jd(cv, job)

    assert 35 <= result.overall_score < 75
    assert result.matched_skills == ["Python", "SQL"]
    assert result.missing_required_skills == ["FastAPI", "Docker"]
    assert "needs" in result.recommendation_reason.lower()


def test_score_cv_jd_returns_low_score_for_unrelated_profile():
    cv = CVProfile(
        candidate_name="Le Van C",
        title="Product Designer",
        location="Ha Noi",
        skills=["Figma", "User Research", "Wireframes"],
        total_years_experience=3,
        raw_text="Product designer focused on user research, Figma, wireframes, and prototypes.",
    )
    job = load_job()

    result = score_cv_jd(cv, job)

    assert result.overall_score < 35
    assert result.matched_skills == []
    assert result.missing_required_skills == ["Python", "FastAPI", "SQL", "Docker"]
    assert "low" in result.recommendation_reason.lower()


def test_recommend_jobs_ranks_best_matching_job_first():
    cv = load_cv()
    jobs = [
        JobDescription.model_validate(record)
        for record in json.loads((SAMPLES_DIR / "jd_samples_20.json").read_text(encoding="utf-8"))[:5]
    ]

    recommendations = recommend_jobs(cv, jobs)

    assert [item.job_id for item in recommendations[:2]] == ["manual-jd-001", "manual-jd-003"]
    assert recommendations[0].overall_score >= recommendations[1].overall_score
    assert "Python" in recommendations[0].matched_skills
    assert recommendations[-1].overall_score <= recommendations[0].overall_score


def test_match_cv_jd_endpoint_returns_score_and_explanation():
    response = client.post(
        "/api/match-cv-jd",
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
    assert body["recommendation_reason"]


def test_recommend_jobs_endpoint_returns_ranked_jobs():
    jobs = json.loads((SAMPLES_DIR / "jd_samples_20.json").read_text(encoding="utf-8"))[:5]
    response = client.post(
        "/api/recommend-jobs",
        json={
            "cv": load_cv().model_dump(mode="json"),
            "jobs": jobs,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert [item["job_id"] for item in body[:2]] == ["manual-jd-001", "manual-jd-003"]
    assert body[0]["overall_score"] >= body[1]["overall_score"]
    assert body[0]["missing_required_skills"]


def test_matching_evaluation_set_has_labeled_cv_job_pairs():
    records = json.loads(EVALUATION_PATH.read_text(encoding="utf-8"))

    assert len(records) >= 5
    for record in records:
        assert record["cv_id"]
        assert record["job_id"]
        assert record["label"] in {"high", "medium", "low"}
        assert 0 <= record["expected_min_score"] <= record["expected_max_score"] <= 100
        assert record["reason"]
