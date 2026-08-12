from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path
from typing import Any

from app.schemas.cleaning import DataLayeredJob, DataQualityFlags
from app.utils.html_cleaner import clean_html


DATA_DIR = Path(__file__).resolve().parents[2] / "data"
DEFAULT_TAXONOMY_PATH = DATA_DIR / "taxonomy" / "skills.json"
DEFAULT_ALIASES_PATH = DATA_DIR / "taxonomy" / "aliases.json"

SKILL_BOUNDARY = r"(?<![a-z0-9+#.]){}(?![a-z0-9+#.])"
SHORT_DESCRIPTION_WORD_LIMIT = 25

LOCATION_ALIASES = (
    ("ho chi minh", "Ho Chi Minh City"),
    ("hcm", "Ho Chi Minh City"),
    ("tphcm", "Ho Chi Minh City"),
    ("tp hcm", "Ho Chi Minh City"),
    ("saigon", "Ho Chi Minh City"),
    ("ha noi", "Ha Noi"),
    ("hanoi", "Ha Noi"),
    ("da nang", "Da Nang"),
    ("danang", "Da Nang"),
    ("remote", "Remote"),
    ("tu xa", "Remote"),
)

LEVEL_PATTERNS = (
    ("intern", r"\b(intern|internship|thuc tap)\b"),
    ("fresher", r"\b(fresher|entry level|new graduate|graduate)\b"),
    ("junior", r"\b(junior|jr)\b"),
    ("middle", r"\b(middle|mid level|mid-level|mid)\b"),
    ("manager", r"\b(manager|head|director)\b"),
    ("lead", r"\b(lead|principal|staff)\b"),
    ("senior", r"\b(senior|sr)\b"),
)

JOB_TYPE_PATTERNS = (
    ("full_time", r"\b(full time|full-time|toan thoi gian|permanent)\b"),
    ("part_time", r"\b(part time|part-time|ban thoi gian)\b"),
    ("contract", r"\b(contract|contractor|freelance|hop dong)\b"),
    ("internship", r"\b(internship|intern|thuc tap)\b"),
    ("remote", r"\b(remote|tu xa)\b"),
)


def load_skill_taxonomy(path: Path | str = DEFAULT_TAXONOMY_PATH) -> dict[str, Any]:
    taxonomy_path = Path(path)
    return json.loads(taxonomy_path.read_text(encoding="utf-8"))


def load_skill_aliases(path: Path | str = DEFAULT_ALIASES_PATH) -> dict[str, str]:
    aliases_path = Path(path)
    raw_aliases = json.loads(aliases_path.read_text(encoding="utf-8"))
    return {skill_key(alias): canonical for alias, canonical in raw_aliases.items()}


def normalize_skills(
    values: list[str] | str | None,
    aliases: dict[str, str] | None = None,
) -> list[str]:
    if aliases is None:
        aliases = load_skill_aliases()

    if not values:
        return []

    raw_values = split_skill_values(values) if isinstance(values, str) else values
    normalized: list[str] = []
    seen: set[str] = set()

    for value in raw_values:
        key = skill_key(value)
        if not key:
            continue
        canonical = aliases.get(key) or value.strip()
        canonical_key = skill_key(canonical)
        if canonical_key in seen:
            continue
        normalized.append(canonical)
        seen.add(canonical_key)

    return normalized


def extract_known_skills(
    text: str | None,
    aliases: dict[str, str] | None = None,
) -> list[str]:
    if aliases is None:
        aliases = load_skill_aliases()

    folded_text = fold_text(text or "")
    extracted: list[str] = []
    seen: set[str] = set()

    for alias, canonical in aliases.items():
        if re.search(SKILL_BOUNDARY.format(re.escape(alias)), folded_text):
            canonical_key = skill_key(canonical)
            if canonical_key not in seen:
                extracted.append(canonical)
                seen.add(canonical_key)

    return extracted


def split_skill_values(values: str) -> list[str]:
    return [part.strip() for part in re.split(r"[,;/|]+", values) if part.strip()]


def clean_text(value: Any) -> str:
    if value is None:
        return ""
    return re.sub(r"\s+", " ", clean_html(str(value))).strip()


def normalize_salary(value: Any) -> dict[str, float | str | None]:
    if value is None:
        return {"salary_min": None, "salary_max": None, "currency": None}

    raw_text = str(value).strip()
    folded = fold_text(raw_text)
    if not folded or any(
        phrase in folded
        for phrase in ("negotiable", "thoa thuan", "competitive", "canh tranh")
    ):
        return {"salary_min": None, "salary_max": None, "currency": None}

    currency = detect_currency(raw_text)
    multiplier = detect_salary_multiplier(folded, currency)
    numbers = [
        _parse_number_token(match.group(0)) * multiplier
        for match in re.finditer(r"\d+(?:[.,]\d+)?", raw_text)
    ]

    if not numbers:
        return {"salary_min": None, "salary_max": None, "currency": currency}

    if "up to" in folded or "toi da" in folded:
        salary_min = None
        salary_max = max(numbers)
    elif "from" in folded or "tu " in folded:
        salary_min = min(numbers)
        salary_max = None
    else:
        salary_min = min(numbers)
        salary_max = max(numbers)

    return {
        "salary_min": normalize_number(salary_min),
        "salary_max": normalize_number(salary_max),
        "currency": currency,
    }


def normalize_location(value: Any) -> str | None:
    text = clean_text(value)
    if not text:
        return None

    folded = fold_text(text)
    normalized: list[str] = []
    seen: set[str] = set()

    for alias, canonical in LOCATION_ALIASES:
        if re.search(SKILL_BOUNDARY.format(re.escape(alias)), folded):
            key = skill_key(canonical)
            if key not in seen:
                normalized.append(canonical)
                seen.add(key)

    return ", ".join(normalized) if normalized else text


def normalize_level(*values: Any) -> str:
    folded = fold_text(" ".join(clean_text(value) for value in values if value))
    for level, pattern in LEVEL_PATTERNS:
        if re.search(pattern, folded):
            return level
    return "unknown"


def normalize_job_type(value: Any) -> str:
    folded = fold_text(clean_text(value))
    for job_type, pattern in JOB_TYPE_PATTERNS:
        if re.search(pattern, folded):
            return job_type
    return "unknown"


def extract_years_experience(text: Any) -> float | None:
    folded = fold_text(clean_text(text))
    matches = re.findall(r"(\d+(?:[.,]\d+)?)\s*\+?\s*(?:years?|yrs?|nam)", folded)
    if not matches:
        return None
    return min(_parse_number_token(value) for value in matches)


def clean_job_record(record: dict[str, Any]) -> dict[str, Any]:
    cleaned = dict(record)
    for key in ("description_text", "requirements_text", "benefits_text", "raw_html"):
        if key in cleaned and cleaned[key] is not None:
            cleaned[key] = clean_text(cleaned[key])
    text_keys = (
        "title",
        "company_name",
        "location",
        "job_type",
        "level",
        "salary_text",
        "salary",
    )
    for key in text_keys:
        if key in cleaned and cleaned[key] is not None:
            cleaned[key] = clean_text(cleaned[key])
    return cleaned


def normalize_job_record(
    record: dict[str, Any],
    aliases: dict[str, str] | None = None,
) -> dict[str, Any]:
    if aliases is None:
        aliases = load_skill_aliases()

    cleaned = clean_job_record(record)
    normalized = dict(cleaned)

    salary = normalize_salary(cleaned.get("salary_text") or cleaned.get("salary"))
    salary_min = (
        salary["salary_min"]
        if salary["salary_min"] is not None
        else to_number(cleaned.get("salary_min"))
    )
    salary_max = (
        salary["salary_max"]
        if salary["salary_max"] is not None
        else to_number(cleaned.get("salary_max"))
    )
    currency = salary["currency"] or normalize_currency(cleaned.get("currency"))

    normalized["salary_min"] = salary_min
    normalized["salary_max"] = salary_max
    normalized["currency"] = currency
    normalized["location"] = normalize_location(cleaned.get("location"))
    normalized["job_type"] = normalize_job_type(cleaned.get("job_type"))
    normalized["level"] = normalize_level(
        cleaned.get("level"),
        cleaned.get("title"),
        cleaned.get("description_text"),
        cleaned.get("requirements_text"),
    )

    combined_text = " ".join(
        filter(
            None,
            [
                cleaned.get("description_text"),
                cleaned.get("requirements_text"),
                cleaned.get("benefits_text"),
            ],
        )
    )
    normalized["min_years_experience"] = (
        to_number(cleaned.get("min_years_experience"))
        or extract_years_experience(combined_text)
    )

    required_skills = cleaned.get("required_skills") or extract_known_skills(
        cleaned.get("requirements_text") or combined_text,
        aliases,
    )
    nice_to_have_skills = cleaned.get("nice_to_have_skills") or extract_known_skills(
        cleaned.get("benefits_text"),
        aliases,
    )

    normalized["required_skills"] = normalize_skills(required_skills, aliases)
    normalized["nice_to_have_skills"] = normalize_skills(nice_to_have_skills, aliases)
    normalized["quality_flags"] = build_quality_flags(normalized).model_dump()
    return normalized


def build_data_layers(record: dict[str, Any]) -> DataLayeredJob:
    return DataLayeredJob(
        raw=dict(record),
        cleaned=clean_job_record(record),
        normalized=normalize_job_record(record),
    )


def build_quality_flags(record: dict[str, Any]) -> DataQualityFlags:
    description = clean_text(record.get("description_text"))
    missing_salary = record.get("salary_min") is None and record.get("salary_max") is None
    missing_company = not clean_text(record.get("company_name"))
    short_description = len(description.split()) < SHORT_DESCRIPTION_WORD_LIMIT

    confidence = 1.0
    if missing_salary:
        confidence -= 0.2
    if missing_company:
        confidence -= 0.25
    if short_description:
        confidence -= 0.25
    if not clean_text(record.get("title")):
        confidence -= 0.15

    return DataQualityFlags(
        missing_salary=missing_salary,
        missing_company=missing_company,
        short_description=short_description,
        parse_confidence=round(max(confidence, 0.0), 2),
    )


def detect_currency(value: str) -> str | None:
    folded = fold_text(value)
    if "$" in value or "usd" in folded:
        return "USD"
    if "vnd" in folded or "dong" in folded or "trieu" in folded:
        return "VND"
    return None


def detect_salary_multiplier(folded_text: str, currency: str | None) -> int:
    if "trieu" in folded_text or "million vnd" in folded_text:
        return 1_000_000
    if "k usd" in folded_text:
        return 1_000
    if currency == "VND" and "000" not in folded_text:
        return 1_000_000
    return 1


def normalize_currency(value: Any) -> str | None:
    if value is None:
        return None
    currency = clean_text(value).upper()
    return currency if currency else None


def to_number(value: Any) -> float | int | None:
    if value is None or value == "":
        return None
    try:
        return normalize_number(float(value))
    except (TypeError, ValueError):
        return None


def normalize_number(value: float | None) -> float | int | None:
    if value is None:
        return None
    return int(value) if float(value).is_integer() else value


def _parse_number_token(value: str) -> float:
    token = value.strip()
    if "," in token and "." not in token:
        parts = token.split(",")
        token = "".join(parts) if len(parts[-1]) == 3 else token.replace(",", ".")
    else:
        token = token.replace(",", "")
    return float(token)


def skill_key(value: Any) -> str:
    return fold_text(str(value or "")).strip()


def fold_text(value: str) -> str:
    text = value.replace("Đ", "D").replace("đ", "d")
    text = unicodedata.normalize("NFKD", text)
    text = "".join(char for char in text if not unicodedata.combining(char))
    return re.sub(r"\s+", " ", text.lower()).strip()
