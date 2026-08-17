from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from typing import Iterable

from app.schemas.entity import (
    DocumentType,
    EntityExtractionResponse,
    ExtractedEntity,
    LanguageCode,
)
from app.services.data_cleaning import (
    LEVEL_PATTERNS,
    LOCATION_ALIASES,
    SKILL_BOUNDARY,
    extract_years_experience,
    load_skill_aliases,
    normalize_level,
    normalize_salary,
    skill_key,
)


SECTION_ALIASES: dict[str, tuple[str, ...]] = {
    "summary": (
        "summary",
        "profile",
        "objective",
        "career objective",
        "about me",
        "gioi thieu",
        "muc tieu nghe nghiep",
    ),
    "skills": (
        "skills",
        "technical skills",
        "core skills",
        "key skills",
        "ky nang",
        "ky nang chuyen mon",
    ),
    "experience": (
        "experience",
        "work experience",
        "employment history",
        "professional experience",
        "kinh nghiem",
        "kinh nghiem lam viec",
    ),
    "education": (
        "education",
        "academic background",
        "hoc van",
        "dao tao",
    ),
    "projects": (
        "projects",
        "personal projects",
        "selected projects",
        "du an",
    ),
    "certificates": (
        "certificates",
        "certifications",
        "licenses",
        "chung chi",
    ),
    "languages": (
        "languages",
        "language",
        "ngoai ngu",
        "ngon ngu",
    ),
    "required": (
        "requirements",
        "required skills",
        "must have",
        "requirements and skills",
        "yeu cau",
        "yeu cau cong viec",
        "yeu cau ung vien",
    ),
    "nice_to_have": (
        "nice to have",
        "preferred qualifications",
        "preferred skills",
        "good to have",
        "uu tien",
        "diem cong",
    ),
    "responsibilities": (
        "responsibilities",
        "job description",
        "what you will do",
        "mo ta cong viec",
        "trach nhiem",
    ),
    "benefits": (
        "benefits",
        "why you will love working here",
        "phuc loi",
        "quyen loi",
    ),
}

SECTION_LOOKUP = {
    alias: section
    for section, aliases in SECTION_ALIASES.items()
    for alias in aliases
}

VIETNAMESE_WORDS = (
    "kinh nghiem",
    "ky nang",
    "hoc van",
    "du an",
    "chung chi",
    "yeu cau",
    "mo ta",
    "ung vien",
    "lam viec",
)
ENGLISH_WORDS = (
    "experience",
    "skills",
    "education",
    "project",
    "summary",
    "developer",
    "engineer",
    "requirements",
)
VIETNAMESE_CHAR_RE = re.compile(
    r"[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệ"
    r"íìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]",
    re.IGNORECASE,
)
PROFILE_LINK_RE = re.compile(
    r"https?://[^\s,;]+|(?:github|linkedin)\.com/[^\s,;]+",
    re.IGNORECASE,
)
SALARY_RE = re.compile(
    r"(?i)(?:up to|from|tu|toi da)?\s*(?:\$|usd|vnd)?\s*"
    r"\d+(?:[.,]\d+)?(?:\s*(?:-|to|den)\s*\d+(?:[.,]\d+)?)?\s*"
    r"(?:usd|vnd|trieu|million)?"
)
WORK_MODE_PATTERNS = (
    ("remote", r"\b(remote|tu xa)\b"),
    ("hybrid", r"\b(hybrid|linh hoat)\b"),
    ("on_site", r"\b(on[- ]?site|at office|van phong)\b"),
)


@dataclass(frozen=True)
class TextSection:
    name: str
    start: int
    end: int
    text: str


def detect_language(text: str) -> LanguageCode:
    folded = fold_for_search(text)
    has_vi = bool(VIETNAMESE_CHAR_RE.search(text)) or any(
        re.search(SKILL_BOUNDARY.format(re.escape(word)), folded)
        for word in VIETNAMESE_WORDS
    )
    has_en = any(
        re.search(SKILL_BOUNDARY.format(re.escape(word)), folded)
        for word in ENGLISH_WORDS
    )

    if has_vi and has_en:
        return "mixed"
    if has_vi:
        return "vi"
    if has_en or re.search(r"[a-zA-Z]{3,}", text):
        return "en"
    return "unknown"


def split_text_sections(text: str) -> list[TextSection]:
    normalized = normalize_newlines(text)
    if not normalized:
        return []

    sections: list[TextSection] = []
    current_name = "header"
    current_start = 0
    position = 0

    for line in normalized.splitlines(keepends=True):
        heading = detect_section_heading(line)
        if heading is not None:
            if position > current_start:
                sections.append(
                    TextSection(
                        name=current_name,
                        start=current_start,
                        end=position,
                        text=normalized[current_start:position].strip(),
                    )
                )
            current_name = heading
            current_start = position + len(line)
        position += len(line)

    if position >= current_start:
        sections.append(
            TextSection(
                name=current_name,
                start=current_start,
                end=position,
                text=normalized[current_start:position].strip(),
            )
        )

    return [section for section in sections if section.text]


def detect_section_heading(line: str) -> str | None:
    stripped = line.strip()
    if not stripped or len(stripped) > 60:
        return None
    normalized = fold_for_search(stripped).strip(" :-")
    return SECTION_LOOKUP.get(normalized)


def extract_entities_from_text(
    text: str,
    *,
    language: LanguageCode = "unknown",
    document_type: DocumentType = "other",
) -> EntityExtractionResponse:
    normalized_text = normalize_newlines(text).strip()
    resolved_language = detect_language(normalized_text) if language == "unknown" else language
    sections = split_text_sections(normalized_text)

    entities: list[ExtractedEntity] = []
    entities.extend(extract_skill_entities(normalized_text, sections))
    entities.extend(extract_year_entities(normalized_text, sections))
    entities.extend(extract_location_entities(normalized_text, sections))
    entities.extend(extract_seniority_entities(normalized_text, sections))
    entities.extend(extract_salary_entities(normalized_text, sections))
    entities.extend(extract_work_mode_entities(normalized_text, sections))
    entities.extend(extract_profile_link_entities(normalized_text, sections))

    return EntityExtractionResponse(
        language=resolved_language,
        document_type=document_type,
        entities=sort_and_dedupe_entities(entities),
    )


def extract_skill_entities(
    text: str,
    sections: list[TextSection],
) -> list[ExtractedEntity]:
    aliases = load_skill_aliases()
    folded_text = fold_for_search(text)
    entities: list[ExtractedEntity] = []
    seen: set[tuple[str, str]] = set()

    for alias, canonical in sorted(
        aliases.items(),
        key=lambda item: len(item[0]),
        reverse=True,
    ):
        pattern = SKILL_BOUNDARY.format(re.escape(alias).replace(r"\ ", r"\s+"))
        for match in re.finditer(pattern, folded_text):
            section = section_for_offset(sections, match.start())
            key = (skill_key(canonical), section)
            if key in seen:
                continue
            seen.add(key)
            raw_text = text[match.start() : match.end()]
            entities.append(
                build_entity(
                    text=text,
                    label="skill",
                    raw_text=raw_text,
                    normalized=canonical,
                    start=match.start(),
                    end=match.end(),
                    section=section,
                    confidence=0.92,
                    aliases=[alias] if skill_key(alias) != skill_key(canonical) else [],
                )
            )

    return entities


def extract_year_entities(
    text: str,
    sections: list[TextSection],
) -> list[ExtractedEntity]:
    folded_text = fold_for_search(text)
    entities: list[ExtractedEntity] = []
    for match in re.finditer(r"\b\d+(?:[.,]\d+)?\s*\+?\s*(?:years?|yrs?|nam)\b", folded_text):
        raw_text = text[match.start() : match.end()]
        value = extract_years_experience(raw_text)
        if value is None:
            continue
        entities.append(
            build_entity(
                text=text,
                label="years_experience",
                raw_text=raw_text,
                normalized=str(value),
                start=match.start(),
                end=match.end(),
                section=section_for_offset(sections, match.start()),
                confidence=0.85,
            )
        )
    return entities


def extract_location_entities(
    text: str,
    sections: list[TextSection],
) -> list[ExtractedEntity]:
    folded_text = fold_for_search(text)
    entities: list[ExtractedEntity] = []
    seen: set[str] = set()
    for alias, canonical in LOCATION_ALIASES:
        pattern = SKILL_BOUNDARY.format(re.escape(alias).replace(r"\ ", r"\s+"))
        for match in re.finditer(pattern, folded_text):
            key = skill_key(canonical)
            if key in seen:
                continue
            seen.add(key)
            entities.append(
                build_entity(
                    text=text,
                    label="location",
                    raw_text=text[match.start() : match.end()],
                    normalized=canonical,
                    start=match.start(),
                    end=match.end(),
                    section=section_for_offset(sections, match.start()),
                    confidence=0.8,
                )
            )
    return entities


def extract_seniority_entities(
    text: str,
    sections: list[TextSection],
) -> list[ExtractedEntity]:
    folded_text = fold_for_search(text)
    entities: list[ExtractedEntity] = []
    seen: set[str] = set()
    for _, pattern in LEVEL_PATTERNS:
        for match in re.finditer(pattern, folded_text):
            raw_text = text[match.start() : match.end()]
            normalized = normalize_level(raw_text)
            if normalized == "unknown" or normalized in seen:
                continue
            seen.add(normalized)
            entities.append(
                build_entity(
                    text=text,
                    label="seniority",
                    raw_text=raw_text,
                    normalized=normalized,
                    start=match.start(),
                    end=match.end(),
                    section=section_for_offset(sections, match.start()),
                    confidence=0.78,
                )
            )
    return entities


def extract_salary_entities(
    text: str,
    sections: list[TextSection],
) -> list[ExtractedEntity]:
    entities: list[ExtractedEntity] = []
    for match in SALARY_RE.finditer(text):
        raw_text = match.group(0).strip()
        if not raw_text:
            continue
        normalized = normalize_salary(raw_text)
        if normalized["salary_min"] is None and normalized["salary_max"] is None:
            continue
        if normalized["currency"] is None and not re.search(
            r"(?i)\b(salary|luong|compensation|usd|vnd|trieu|\$)\b",
            raw_text,
        ):
            continue
        entities.append(
            build_entity(
                text=text,
                label="salary_range",
                raw_text=raw_text,
                normalized=(
                    f"{normalized['salary_min']}-{normalized['salary_max']} "
                    f"{normalized['currency'] or ''}"
                ).strip(),
                start=match.start(),
                end=match.end(),
                section=section_for_offset(sections, match.start()),
                confidence=0.75,
            )
        )
    return entities


def extract_work_mode_entities(
    text: str,
    sections: list[TextSection],
) -> list[ExtractedEntity]:
    folded_text = fold_for_search(text)
    entities: list[ExtractedEntity] = []
    seen: set[str] = set()
    for normalized, pattern in WORK_MODE_PATTERNS:
        for match in re.finditer(pattern, folded_text):
            if normalized in seen:
                continue
            seen.add(normalized)
            entities.append(
                build_entity(
                    text=text,
                    label="work_mode",
                    raw_text=text[match.start() : match.end()],
                    normalized=normalized,
                    start=match.start(),
                    end=match.end(),
                    section=section_for_offset(sections, match.start()),
                    confidence=0.78,
                )
            )
    return entities


def extract_profile_link_entities(
    text: str,
    sections: list[TextSection],
) -> list[ExtractedEntity]:
    entities: list[ExtractedEntity] = []
    for match in PROFILE_LINK_RE.finditer(text):
        entities.append(
            build_entity(
                text=text,
                label="profile_link",
                raw_text=match.group(0),
                normalized=match.group(0),
                start=match.start(),
                end=match.end(),
                section=section_for_offset(sections, match.start()),
                confidence=0.9,
            )
        )
    return entities


def build_entity(
    *,
    text: str,
    label: str,
    raw_text: str,
    normalized: str | None,
    start: int,
    end: int,
    section: str,
    confidence: float,
    aliases: list[str] | None = None,
) -> ExtractedEntity:
    return ExtractedEntity(
        text=raw_text,
        label=label,
        normalized=normalized,
        confidence=confidence,
        start_char=start,
        end_char=end,
        source_span=raw_text,
        section=section,
        evidence=evidence_for_span(text, start, end),
        aliases=aliases or [],
    )


def sort_and_dedupe_entities(entities: Iterable[ExtractedEntity]) -> list[ExtractedEntity]:
    sorted_entities = sorted(
        entities,
        key=lambda entity: (
            entity.start_char if entity.start_char is not None else 10**9,
            entity.label,
            entity.normalized or entity.text,
        ),
    )
    deduped: list[ExtractedEntity] = []
    seen: set[tuple[str, str | None, str | None, int | None, int | None]] = set()
    for entity in sorted_entities:
        key = (
            entity.label,
            entity.normalized,
            entity.section,
            entity.start_char,
            entity.end_char,
        )
        if key in seen:
            continue
        seen.add(key)
        deduped.append(entity)
    return deduped


def section_for_offset(sections: list[TextSection], offset: int) -> str:
    for section in sections:
        if section.start <= offset < section.end:
            return section.name
    return "unknown"


def evidence_for_span(text: str, start: int, end: int) -> str:
    line_start = text.rfind("\n", 0, start) + 1
    line_end = text.find("\n", end)
    if line_end == -1:
        line_end = len(text)
    return text[line_start:line_end].strip()[:240]


def normalize_newlines(text: str) -> str:
    return re.sub(r"\r\n?", "\n", text or "")


def fold_for_search(value: str) -> str:
    text = value.replace("Đ", "D").replace("đ", "d")
    text = unicodedata.normalize("NFKD", text)
    text = "".join(char for char in text if not unicodedata.combining(char))
    return text.lower()
