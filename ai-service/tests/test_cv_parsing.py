import base64
from pathlib import Path

from fastapi.testclient import TestClient

from app.services.cv_parser import extract_text_from_path, parse_cv_text
from app.services.entity_extraction import extract_entities_from_text
from main import app


SAMPLES_DIR = Path("data/samples")
RAW_CV_TEXT = (SAMPLES_DIR / "raw/cv_backend_sample.txt").read_text(encoding="utf-8")
client = TestClient(app)


def test_parse_cv_text_returns_structured_profile():
    profile = parse_cv_text(RAW_CV_TEXT)

    assert profile.candidate_name == "Nguyen Van A"
    assert profile.title == "Python Backend Developer"
    assert profile.location == "Ho Chi Minh City"
    assert profile.summary.startswith("Backend developer with 2 years")
    assert profile.skills == [
        "Python",
        "FastAPI",
        "SQL",
        "Git",
        "Amazon Web Services",
    ]
    assert profile.total_years_experience == 2
    assert profile.experiences[0].title == "Backend Developer"
    assert profile.experiences[0].company == "Example Tech"
    assert profile.experiences[0].start_date.isoformat() == "2024-01-01"
    assert profile.experiences[0].end_date is None
    assert "Docker" in profile.experiences[0].skills
    assert profile.education[0].degree == "Bachelor"
    assert profile.education[0].major == "Computer Science"
    assert profile.education[0].school == "Example University"
    assert profile.education[0].start_year == 2020
    assert profile.education[0].end_year == 2024
    assert profile.raw_text is None


def test_pdf_and_docx_sample_text_can_be_extracted():
    pdf_text = extract_text_from_path(SAMPLES_DIR / "raw/cv_backend_sample.pdf")
    docx_text = extract_text_from_path(SAMPLES_DIR / "raw/cv_backend_sample.docx")

    assert "Nguyen Van A" in pdf_text
    assert "FastAPI" in pdf_text
    assert "Nguyen Van A" in docx_text
    assert "FastAPI" in docx_text


def test_entity_extraction_returns_normalized_entities_with_sections():
    text = """
    Requirements
    Yeu cau Python, FastAPI, SQL, 2+ years experience in Ho Chi Minh or Remote.

    Nice to have
    AWS and Docker.
    """

    response = extract_entities_from_text(text, document_type="jd")
    entities = response.entities
    entity_keys = {(entity.label, entity.normalized, entity.section) for entity in entities}

    assert response.language == "mixed"
    assert response.document_type == "jd"
    assert ("skill", "Python", "required") in entity_keys
    assert ("skill", "FastAPI", "required") in entity_keys
    assert ("skill", "Amazon Web Services", "nice_to_have") in entity_keys
    assert ("years_experience", "2.0", "required") in entity_keys
    assert ("location", "Ho Chi Minh City", "required") in entity_keys
    assert ("work_mode", "remote", "required") in entity_keys
    assert all(entity.evidence for entity in entities)
    assert all(entity.start_char is not None for entity in entities)
    assert all(entity.end_char is not None for entity in entities)
    assert all(entity.source_span for entity in entities)

    python_entity = next(
        entity
        for entity in entities
        if entity.label == "skill" and entity.normalized == "Python"
    )
    assert (
        python_entity.esco_uri
        == "http://data.europa.eu/esco/skill/ccd0a1d9-afda-43d9-b901-96344886e14d"
    )
    assert python_entity.esco_preferred_label == "Python (computer programming)"
    assert python_entity.esco_type == "skill"


def test_entity_extraction_returns_esco_occupation_metadata():
    text = "We are hiring a Data Engineer to build SQL pipelines."

    response = extract_entities_from_text(text, document_type="jd")
    occupation = next(entity for entity in response.entities if entity.label == "occupation")

    assert occupation.normalized == "data engineer"
    assert (
        occupation.esco_uri
        == "http://data.europa.eu/esco/occupation/2079755f-d809-49e6-8037-4de6180e54c0"
    )
    assert occupation.esco_preferred_label == "data engineer"
    assert occupation.esco_type == "occupation"
    assert occupation.isco_group == "2511"


def test_parse_cv_endpoint_accepts_text_and_masks_pii():
    payload = {
        "text": (
            "Nguyen Van A\nPython Backend Developer\nnguyen@example.com\n"
            "+84 912 345 678\nHo Chi Minh City\n\nSkills\nPython, FastAPI"
        ),
        "include_raw_text": True,
    }

    response = client.post("/api/parse-cv", json=payload)

    assert response.status_code == 200
    body = response.json()
    assert body["candidate_name"] == "Nguyen Van A"
    assert body["email"] is None
    assert body["phone"] is None
    assert "nguyen@example.com" not in body["raw_text"]
    assert "+84 912 345 678" not in body["raw_text"]
    assert "[email]" in body["raw_text"]
    assert "[phone]" in body["raw_text"]


def test_parse_cv_endpoint_accepts_base64_docx_file():
    file_bytes = (SAMPLES_DIR / "raw/cv_backend_sample.docx").read_bytes()
    response = client.post(
        "/api/parse-cv",
        json={
            "filename": "cv_backend_sample.docx",
            "file_base64": base64.b64encode(file_bytes).decode("ascii"),
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["candidate_name"] == "Nguyen Van A"
    assert "FastAPI" in body["skills"]


def test_extract_entities_endpoint_accepts_cv_text():
    response = client.post(
        "/api/extract-entities",
        json={
            "text": RAW_CV_TEXT,
            "document_type": "cv",
            "language": "unknown",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["language"] == "en"
    assert body["document_type"] == "cv"
    assert any(
        entity["label"] == "skill" and entity["normalized"] == "FastAPI"
        for entity in body["entities"]
    )
