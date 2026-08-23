"""Pydantic schemas shared by API endpoints."""

from app.schemas.common import ErrorResponse, HealthResponse
from app.schemas.cv import CVEducation, CVExperience, CVParseRequest, CVProfile, CVProject
from app.schemas.cv_suggestion import (
    CvSuggestion,
    CvSuggestionsRequest,
    CvSuggestionsResponse,
    SuggestionGuardrail,
)
from app.schemas.entity import EntityExtractionRequest, EntityExtractionResponse, ExtractedEntity
from app.schemas.job import JobDescription
from app.schemas.job_fit import AnalyzeJobFitRequest, EvidenceRef, FitGap, JobFitAnalysis
from app.schemas.match import MatchRequest, MatchResult, RecommendJobsRequest, RecommendedJob

__all__ = [
    "AnalyzeJobFitRequest",
    "CVEducation",
    "CVExperience",
    "CVParseRequest",
    "CVProfile",
    "CVProject",
    "CvSuggestion",
    "CvSuggestionsRequest",
    "CvSuggestionsResponse",
    "EntityExtractionRequest",
    "EntityExtractionResponse",
    "ErrorResponse",
    "EvidenceRef",
    "ExtractedEntity",
    "FitGap",
    "HealthResponse",
    "JobDescription",
    "JobFitAnalysis",
    "MatchRequest",
    "MatchResult",
    "RecommendJobsRequest",
    "RecommendedJob",
    "SuggestionGuardrail",
]
