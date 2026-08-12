import json
from pathlib import Path

from app.schemas.cleaning import DataLayeredJob
from app.schemas.cv import CVProfile
from app.services.data_cleaning import (
    build_data_layers,
    extract_years_experience,
    load_skill_aliases,
    load_skill_taxonomy,
    normalize_job_record,
    normalize_location,
    normalize_salary,
    normalize_skills,
)


SAMPLES_DIR = Path("data/samples")


def test_taxonomy_has_required_categories_and_aliases():
    taxonomy = load_skill_taxonomy()
    aliases = load_skill_aliases()

    assert set(taxonomy["categories"]) >= {
        "language",
        "framework",
        "database",
        "cloud",
        "tool",
        "soft_skill",
    }
    assert aliases["js"] == "JavaScript"
    assert aliases["ts"] == "TypeScript"
    assert aliases["reactjs"] == "React"
    assert aliases["aws"] == "Amazon Web Services"


def test_normalize_skills_deduplicates_aliases():
    skills = normalize_skills(["js", "JavaScript", "ts", "reactjs", "aws"])

    assert skills == [
        "JavaScript",
        "TypeScript",
        "React",
        "Amazon Web Services",
    ]


def test_normalize_salary_location_and_years():
    assert normalize_salary("1,500 - 2,500 USD") == {
        "salary_min": 1500,
        "salary_max": 2500,
        "currency": "USD",
    }
    assert normalize_salary("20-35 trieu VND") == {
        "salary_min": 20_000_000,
        "salary_max": 35_000_000,
        "currency": "VND",
    }
    assert normalize_salary("Thoa thuan") == {
        "salary_min": None,
        "salary_max": None,
        "currency": None,
    }
    assert normalize_location("TP HCM / Hanoi / Remote") == (
        "Ho Chi Minh City, Ha Noi, Remote"
    )
    assert extract_years_experience("Need 3+ years of backend experience") == 3


def test_normalize_job_record_cleans_html_and_adds_quality_flags():
    raw = {
        "source": "manual_sample",
        "source_url": "https://example.com/jobs/senior-react-backend",
        "external_id": "cleaning-001",
        "title": "Senior ReactJS Backend Engineer",
        "company_name": "Example Tech",
        "location": "TP HCM / Hanoi / Remote",
        "salary_text": "1,500 - 2,500 USD",
        "job_type": "Full time",
        "description_text": (
            "<nav>Menu</nav><p>Build employer and candidate workflows for a "
            "job matching platform with reliable APIs, observability, and "
            "data integrations. You will be responsible for architecting, designing, and implementing scalable backend services. We value clean code and robust systems.</p><footer>Footer</footer>"
        ),
        "requirements_text": (
            "<ul><li>3+ years of experience</li>"
            "<li>Strong js, ts, reactjs, python, fastapi, sql, aws, docker</li></ul>"
        ),
    }

    normalized = normalize_job_record(raw)

    assert "Menu" not in normalized["description_text"]
    assert normalized["salary_min"] == 1500
    assert normalized["salary_max"] == 2500
    assert normalized["currency"] == "USD"
    assert normalized["location"] == "Ho Chi Minh City, Ha Noi, Remote"
    assert normalized["level"] == "senior"
    assert normalized["job_type"] == "full_time"
    assert normalized["min_years_experience"] == 3
    assert set(normalized["required_skills"]) == {
        "JavaScript",
        "TypeScript",
        "React",
        "Python",
        "FastAPI",
        "SQL",
        "Amazon Web Services",
        "Docker",
    }
    assert normalized["quality_flags"] == {
        "missing_salary": False,
        "missing_company": False,
        "short_description": False,
        "parse_confidence": 1.0,
    }


def test_quality_flags_cover_broken_records():
    normalized = normalize_job_record(
        {
            "title": "Junior Backend Developer",
            "description_text": "<p>Build APIs.</p>",
            "requirements_text": "Python",
        }
    )

    assert normalized["quality_flags"]["missing_salary"]
    assert normalized["quality_flags"]["missing_company"]
    assert normalized["quality_flags"]["short_description"]
    assert normalized["quality_flags"]["parse_confidence"] < 0.5


def test_build_data_layers_keeps_raw_cleaned_and_normalized_versions():
    layers = build_data_layers(
        {
            "title": "Senior ReactJS Backend Engineer",
            "company_name": "Example Tech",
            "location": "TP HCM / Hanoi",
            "salary_text": "1,500 - 2,500 USD",
            "job_type": "Full time",
            "description_text": "<nav>Menu</nav><p>Build APIs with ReactJS.</p>",
            "requirements_text": "3+ years, js, ts, reactjs, aws",
        }
    )

    assert isinstance(layers, DataLayeredJob)
    assert "<nav>Menu</nav>" in layers.raw["description_text"]
    assert "Menu" not in layers.cleaned["description_text"]
    assert layers.normalized["required_skills"] == [
        "JavaScript",
        "TypeScript",
        "React",
        "Amazon Web Services",
    ]


def test_normalized_sample_json_is_valid_expected_output():
    jd_expected = json.loads(
        (SAMPLES_DIR / "normalized/jd_backend_expected.json").read_text(encoding="utf-8")
    )
    cv_expected = json.loads(
        (SAMPLES_DIR / "normalized/cv_backend_expected.json").read_text(encoding="utf-8")
    )

    assert jd_expected["quality_flags"]["parse_confidence"] == 1.0
    assert jd_expected["required_skills"][0] == "JavaScript"
    assert CVProfile.model_validate(cv_expected).skills[-1] == "Amazon Web Services"


def test_sample_cv_pdf_and_docx_fixtures_exist():
    assert (SAMPLES_DIR / "raw/cv_backend_sample.docx").stat().st_size > 0
    assert (SAMPLES_DIR / "raw/cv_backend_sample.pdf").stat().st_size > 0
