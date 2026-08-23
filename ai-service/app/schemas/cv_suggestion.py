from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.cv import CVProfile
from app.schemas.job import JobDescription
from app.schemas.job_fit import EvidenceRef, JobFitAnalysis


SuggestionSection = Literal["summary", "skills", "experience", "projects", "guardrail"]
SuggestionAction = Literal["add_if_true", "clarify", "rewrite", "do_not_claim"]
GuardrailSeverity = Literal["info", "warning", "blocker"]


class SuggestionGuardrail(BaseModel):
    code: str
    severity: GuardrailSeverity
    message: str


class CvSuggestion(BaseModel):
    section: SuggestionSection
    action: SuggestionAction
    title: str
    current_gap: str
    suggested_wording: str
    rationale: str
    evidence: list[EvidenceRef] = Field(default_factory=list)
    guardrail: SuggestionGuardrail | None = None


class CvSuggestionsResponse(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "overall_score": 82.5,
                "suggestions": [
                    {
                        "section": "skills",
                        "action": "add_if_true",
                        "title": "Clarify Docker only if true",
                        "current_gap": "JD requires Docker but the parsed CV has no verified Docker evidence.",
                        "suggested_wording": "Only if you have real Docker experience, add Docker under Skills and mention the project or role where you used it.",
                        "rationale": "Docker is a required skill in the JD and is currently missing from parsed CV evidence.",
                        "evidence": [
                            {
                                "source": "jd",
                                "section": "requirements",
                                "field": "required_skills",
                                "text": "Docker",
                            }
                        ],
                        "guardrail": {
                            "code": "requires_verified_experience",
                            "severity": "blocker",
                            "message": "Do not claim Docker experience unless the candidate truly has it.",
                        },
                    }
                ],
                "blocked_claims": ["Docker"],
                "source_analysis_version": "rule-based-gap-v1",
                "suggestion_version": "rule-based-suggestion-v1",
            }
        }
    )

    overall_score: float = Field(ge=0, le=100)
    suggestions: list[CvSuggestion] = Field(default_factory=list)
    blocked_claims: list[str] = Field(default_factory=list)
    source_analysis_version: str
    suggestion_version: str


class CvSuggestionsRequest(BaseModel):
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
    analysis: JobFitAnalysis | None = None
