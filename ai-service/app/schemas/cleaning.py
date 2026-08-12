from typing import Any

from pydantic import BaseModel, Field


class DataQualityFlags(BaseModel):
    missing_salary: bool = False
    missing_company: bool = False
    short_description: bool = False
    parse_confidence: float = Field(default=1.0, ge=0.0, le=1.0)


class DataLayeredJob(BaseModel):
    raw: dict[str, Any]
    cleaned: dict[str, Any]
    normalized: dict[str, Any]

