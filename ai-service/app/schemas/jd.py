from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, HttpUrl


class JDCreate(BaseModel):
    """Input schema for a JD URL scrape request."""

    url: HttpUrl = Field(..., description="Job description URL to scrape")


class JDResponse(BaseModel):
    """Normalized job description schema."""

    source: str = Field(..., description="Data source, e.g. TopCV or ITviec")
    source_url: str = Field(..., description="Original job posting URL")
    external_id: Optional[str] = Field(None, description="Posting ID from the source")

    title: Optional[str] = Field(None, description="Job title")
    company_name: Optional[str] = Field(None, description="Company name")
    location: Optional[str] = Field(None, description="Work location")

    salary_min: Optional[int] = Field(None, description="Minimum salary")
    salary_max: Optional[int] = Field(None, description="Maximum salary")
    currency: Optional[str] = Field("VND", description="Salary currency")

    job_type: Optional[str] = Field(None, description="Employment type")
    level: Optional[str] = Field(None, description="Seniority level")

    posted_at: Optional[datetime] = Field(None, description="Posting date")
    expired_at: Optional[datetime] = Field(None, description="Expiration date")

    description_text: str = Field(..., description="Cleaned job description text")
    requirements_text: Optional[str] = Field(None, description="Cleaned requirements text")
    benefits_text: Optional[str] = Field(None, description="Cleaned benefits text")

    raw_html: Optional[str] = Field(None, description="Raw HTML sample for debugging")
    crawl_status: str = Field("success", description="success, failed, skipped, blocked")
    crawled_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="UTC time when the URL was crawled",
    )
