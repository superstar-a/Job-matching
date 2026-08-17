"""Pydantic schemas shared by API endpoints."""

from app.schemas.common import ErrorResponse, HealthResponse
from app.schemas.cv import CVEducation, CVExperience, CVParseRequest, CVProfile, CVProject
from app.schemas.entity import EntityExtractionRequest, EntityExtractionResponse, ExtractedEntity
from app.schemas.job import JobDescription
from app.schemas.match import MatchRequest, MatchResult, RecommendJobsRequest, RecommendedJob

__all__ = [
    "CVEducation",
    "CVExperience",
    "CVParseRequest",
    "CVProfile",
    "CVProject",
    "EntityExtractionRequest",
    "EntityExtractionResponse",
    "ErrorResponse",
    "ExtractedEntity",
    "HealthResponse",
    "JobDescription",
    "MatchRequest",
    "MatchResult",
    "RecommendJobsRequest",
    "RecommendedJob",
]
