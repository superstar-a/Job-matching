"""Pydantic schemas shared by API endpoints."""

from app.schemas.common import ErrorResponse, HealthResponse
from app.schemas.cv import CVEducation, CVExperience, CVProfile, CVProject
from app.schemas.entity import EntityExtractionRequest, EntityExtractionResponse, ExtractedEntity
from app.schemas.job import JobDescription
from app.schemas.match import MatchRequest, MatchResult, RecommendedJob

__all__ = [
    "CVEducation",
    "CVExperience",
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
    "RecommendedJob",
]
