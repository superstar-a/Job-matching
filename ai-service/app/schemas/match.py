from pydantic import BaseModel, ConfigDict, Field

from app.schemas.cv import CVProfile
from app.schemas.job import JobDescription


class MatchRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "cv": {
                    "candidate_name": "Nguyen Van A",
                    "title": "Python Backend Developer",
                    "skills": ["Python", "FastAPI", "SQL", "Git"],
                    "total_years_experience": 2,
                },
                "job": {
                    "source": "sample",
                    "title": "Python FastAPI Developer",
                    "required_skills": ["Python", "FastAPI", "SQL", "Docker"],
                    "description_text": "Build APIs and data pipelines for job matching.",
                },
            }
        }
    )

    cv: CVProfile
    job: JobDescription


class RecommendJobsRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "cv": {
                    "candidate_name": "Nguyen Van A",
                    "title": "Python Backend Developer",
                    "skills": ["Python", "FastAPI", "SQL", "Git"],
                    "total_years_experience": 2,
                },
                "jobs": [
                    {
                        "source": "sample",
                        "external_id": "sample-job-001",
                        "title": "Python FastAPI Developer",
                        "required_skills": ["Python", "FastAPI", "SQL", "Docker"],
                        "description_text": "Build APIs and data pipelines for job matching.",
                    }
                ],
            }
        }
    )

    cv: CVProfile
    jobs: list[JobDescription]


class MatchResult(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "overall_score": 82.5,
                "matched_skills": ["Python", "FastAPI", "SQL"],
                "missing_required_skills": ["Docker"],
                "nice_to_have_skills": ["AWS"],
                "experience_gap": "Candidate has 2 years, job asks for 2 years.",
                "salary_gap": None,
                "recommendation_reason": "Strong Python backend fit with a small Docker gap.",
            }
        }
    )

    overall_score: float = Field(ge=0, le=100)
    matched_skills: list[str] = Field(default_factory=list)
    missing_required_skills: list[str] = Field(default_factory=list)
    nice_to_have_skills: list[str] = Field(default_factory=list)
    experience_gap: str | None = None
    salary_gap: str | None = None
    recommendation_reason: str


class RecommendedJob(BaseModel):
    job_id: str | None = None
    title: str
    company_name: str | None = None
    overall_score: float = Field(ge=0, le=100)
    matched_skills: list[str] = Field(default_factory=list)
    missing_required_skills: list[str] = Field(default_factory=list)
    recommendation_reason: str | None = None
