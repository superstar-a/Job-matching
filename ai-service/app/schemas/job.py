from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl

JobType = Literal["full_time", "part_time", "contract", "internship", "remote", "unknown"]
JobLevel = Literal["intern", "fresher", "junior", "middle", "senior", "lead", "manager", "unknown"]


class JobDescription(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "source": "sample",
                "source_url": "https://example.com/jobs/python-fastapi-engineer",
                "external_id": "sample-job-001",
                "title": "Python FastAPI Developer",
                "company_name": "Example Tech",
                "location": "Ho Chi Minh City",
                "salary_min": 1200,
                "salary_max": 2200,
                "currency": "USD",
                "job_type": "full_time",
                "level": "middle",
                "posted_at": "2026-08-01",
                "expired_at": "2026-09-01",
                "required_skills": ["Python", "FastAPI", "SQL", "Docker"],
                "nice_to_have_skills": ["AWS", "NLP"],
                "min_years_experience": 2,
                "description_text": "Build APIs and data pipelines for job matching.",
                "requirements_text": "Python, FastAPI, SQL, Docker, 2+ years experience.",
                "benefits_text": "Hybrid work and training budget.",
                "raw_html": None,
                "crawl_status": "success",
                "crawled_at": "2026-08-04T09:00:00Z",
            }
        }
    )

    source: str
    source_url: HttpUrl | None = None
    external_id: str | None = None
    title: str
    company_name: str | None = None
    location: str | None = None
    salary_min: float | None = Field(default=None, ge=0)
    salary_max: float | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    job_type: JobType = "unknown"
    level: JobLevel = "unknown"
    posted_at: date | None = None
    expired_at: date | None = None
    required_skills: list[str] = Field(default_factory=list)
    nice_to_have_skills: list[str] = Field(default_factory=list)
    min_years_experience: float | None = Field(default=None, ge=0)
    description_text: str
    requirements_text: str | None = None
    benefits_text: str | None = None
    raw_html: str | None = None
    crawl_status: str | None = None
    crawled_at: datetime | None = None
