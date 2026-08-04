from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class HealthResponse(BaseModel):
    status: str = Field(examples=["ok"])
    service: str = Field(examples=["ai-service"])
    version: str = Field(examples=["1.0.0"])


class ErrorResponse(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "code": "INVALID_INPUT",
                "message": "Input text is empty",
                "details": {"field": "text"},
                "request_id": "req_123",
            }
        }
    )

    code: str
    message: str
    details: dict[str, Any] | None = None
    request_id: str | None = None
