from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

DocumentType = Literal["jd", "cv", "other"]
LanguageCode = Literal["vi", "en", "mixed", "unknown"]


class ExtractedEntity(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "text": "FastAPI",
                "label": "skill",
                "normalized": "FastAPI",
                "confidence": 0.95,
                "start_char": 42,
                "end_char": 49,
                "source_span": "FastAPI",
                "section": "skills",
                "evidence": "Skills: Python, FastAPI, SQL",
                "esco_uri": None,
                "esco_preferred_label": None,
                "esco_type": None,
                "isco_group": None,
            }
        }
    )

    text: str
    label: str = Field(
        description="Entity group, for example skill, experience, salary, location, education."
    )
    normalized: str | None = None
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    start_char: int | None = Field(default=None, ge=0)
    end_char: int | None = Field(default=None, ge=0)
    source_span: str | None = None
    section: str | None = None
    evidence: str | None = None
    aliases: list[str] = Field(default_factory=list)
    recency: str | None = None
    esco_uri: str | None = None
    esco_preferred_label: str | None = None
    esco_type: str | None = None
    isco_group: str | None = None


class EntityExtractionRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "text": "We need a Python FastAPI developer with 2+ years of experience.",
                "language": "en",
                "document_type": "jd",
            }
        }
    )

    text: str = Field(min_length=1)
    language: LanguageCode = "unknown"
    document_type: DocumentType = "other"


class EntityExtractionResponse(BaseModel):
    language: LanguageCode
    document_type: DocumentType
    entities: list[ExtractedEntity]
