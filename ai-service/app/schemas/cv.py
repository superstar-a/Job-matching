from datetime import date

from pydantic import BaseModel, ConfigDict, Field, model_validator


class CVExperience(BaseModel):
    title: str
    company: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    description: str | None = None
    skills: list[str] = Field(default_factory=list)


class CVEducation(BaseModel):
    school: str
    degree: str | None = None
    major: str | None = None
    start_year: int | None = Field(default=None, ge=1900, le=2100)
    end_year: int | None = Field(default=None, ge=1900, le=2100)


class CVProject(BaseModel):
    name: str
    description: str | None = None
    skills: list[str] = Field(default_factory=list)
    url: str | None = None


class CVProfile(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "candidate_name": "Nguyen Van A",
                "title": "Python Backend Developer",
                "summary": "Backend developer with experience in FastAPI and SQL.",
                "email": None,
                "phone": None,
                "location": "Ho Chi Minh City",
                "skills": ["Python", "FastAPI", "SQL", "Docker"],
                "languages": ["Vietnamese", "English"],
                "total_years_experience": 2.0,
                "experiences": [
                    {
                        "title": "Backend Developer",
                        "company": "Example Tech",
                        "start_date": "2024-01-01",
                        "end_date": None,
                        "description": "Built REST APIs with FastAPI.",
                        "skills": ["Python", "FastAPI", "SQL"],
                    }
                ],
                "education": [
                    {
                        "school": "Example University",
                        "degree": "Bachelor",
                        "major": "Computer Science",
                        "start_year": 2020,
                        "end_year": 2024,
                    }
                ],
                "projects": [
                    {
                        "name": "Job Matching AI",
                        "description": "Matched CVs to job descriptions.",
                        "skills": ["Python", "NLP", "Scikit-learn"],
                        "url": None,
                    }
                ],
                "certificates": ["AWS Cloud Practitioner"],
                "raw_text": None,
            }
        }
    )

    candidate_name: str | None = None
    title: str | None = None
    summary: str | None = None
    email: str | None = None
    phone: str | None = None
    location: str | None = None
    skills: list[str] = Field(default_factory=list)
    languages: list[str] = Field(default_factory=list)
    total_years_experience: float | None = Field(default=None, ge=0)
    experiences: list[CVExperience] = Field(default_factory=list)
    education: list[CVEducation] = Field(default_factory=list)
    projects: list[CVProject] = Field(default_factory=list)
    certificates: list[str] = Field(default_factory=list)
    raw_text: str | None = None


class CVParseRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "text": (
                    "Nguyen Van A\nPython Backend Developer\n\nSkills\n"
                    "Python, FastAPI, SQL\n\nExperience\n"
                    "Backend Developer, Example Tech, 2024-01 to Present"
                ),
                "filename": None,
                "file_base64": None,
                "include_raw_text": False,
                "mask_pii": True,
            }
        }
    )

    text: str | None = Field(
        default=None,
        description="Plain CV text. Use this or file_base64.",
    )
    filename: str | None = Field(
        default=None,
        description="Original filename when file_base64 is provided.",
    )
    file_base64: str | None = Field(
        default=None,
        description="Base64 encoded PDF, DOCX, or TXT file content.",
    )
    include_raw_text: bool = Field(
        default=False,
        description="Return extracted raw text in the response. PII is masked by default.",
    )
    mask_pii: bool = Field(
        default=True,
        description="Mask or omit email and phone fields from parsed output.",
    )

    @model_validator(mode="after")
    def require_text_or_file(self) -> "CVParseRequest":
        has_text = bool(self.text and self.text.strip())
        has_file = bool(self.file_base64 and self.file_base64.strip())
        if has_text == has_file:
            raise ValueError("Provide exactly one of text or file_base64")
        if has_file and not self.filename:
            raise ValueError("filename is required when file_base64 is provided")
        return self
