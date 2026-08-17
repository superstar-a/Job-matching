from fastapi import APIRouter, HTTPException

from app.schemas.cv import CVParseRequest, CVProfile
from app.schemas.entity import EntityExtractionRequest, EntityExtractionResponse
from app.services.cv_parser import CVParseError, parse_cv_request
from app.services.entity_extraction import extract_entities_from_text


router = APIRouter()


@router.post("/parse-cv", response_model=CVProfile, summary="Parse CV into structured JSON")
def parse_cv(payload: CVParseRequest):
    """Parse CV text or a base64 encoded PDF/DOCX/TXT file."""

    try:
        return parse_cv_request(payload)
    except CVParseError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post(
    "/extract-entities",
    response_model=EntityExtractionResponse,
    summary="Extract normalized entities from CV or JD text",
)
def extract_entities(payload: EntityExtractionRequest):
    """Extract rule-based MVP entities with spans and evidence."""

    return extract_entities_from_text(
        payload.text,
        language=payload.language,
        document_type=payload.document_type,
    )
