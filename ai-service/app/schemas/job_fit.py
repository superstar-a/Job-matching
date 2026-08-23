from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.cv import CVProfile
from app.schemas.job import JobDescription


EvidenceSource = Literal["cv", "jd"]
FitGapCategory = Literal[
    "skill",
    "experience",
    "location",
    "salary",
    "work_mode",
    "domain_project",
    "keyword",
]
FitGapStatus = Literal["match", "gap", "partial", "unknown"]
FitGapSeverity = Literal["low", "medium", "high"]


class EvidenceRef(BaseModel):
    source: EvidenceSource
    section: str | None = None
    field: str | None = None
    text: str
    source_span: str | None = None
    confidence: float = Field(default=1.0, ge=0, le=1)


class FitGap(BaseModel):
    category: FitGapCategory
    status: FitGapStatus
    severity: FitGapSeverity
    requirement: str
    message: str
    evidence: list[EvidenceRef] = Field(default_factory=list)
    guardrail: str | None = None


class JobFitAnalysis(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "overall_score": 82.5,
                "matched_skills": ["Python", "FastAPI", "SQL"],
                "missing_required_skills": ["Docker"],
                "nice_to_have_skills": ["AWS"],
                "recommendation_reason": "Strong match with a Docker evidence gap.",
                "improvement_focus": ["Docker"],
                "fit_gaps": [
                    {
                        "category": "skill",
                        "status": "gap",
                        "severity": "high",
                        "requirement": "Docker",
                        "message": "JD requires Docker but the parsed CV has no verified Docker evidence.",
                        "evidence": [
                            {
                                "source": "jd",
                                "section": "requirements",
                                "field": "required_skills",
                                "text": "Docker",
                            }
                        ],
                        "guardrail": "Ask the candidate to add Docker only if they truly have it; do not add it as verified experience.",
                    }
                ],
                "analyzer_version": "rule-based-gap-v1",
            }
        }
    )

    overall_score: float = Field(ge=0, le=100)
    matched_skills: list[str] = Field(default_factory=list)
    missing_required_skills: list[str] = Field(default_factory=list)
    nice_to_have_skills: list[str] = Field(default_factory=list)
    recommendation_reason: str
    improvement_focus: list[str] = Field(default_factory=list)
    fit_gaps: list[FitGap] = Field(default_factory=list)
    analyzer_version: str


class AnalyzeJobFitRequest(BaseModel):
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
                    "min_years_experience": 2,
                    "description_text": "Build APIs and data pipelines for job matching.",
                },
            }
        }
    )

    cv: CVProfile
    job: JobDescription
