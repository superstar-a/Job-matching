from __future__ import annotations

import math
import re
from collections import Counter
from typing import Iterable

from app.schemas.cv import CVProfile
from app.schemas.job import JobDescription
from app.schemas.match import MatchResult, RecommendedJob
from app.services.data_cleaning import (
    extract_known_skills,
    fold_text,
    normalize_location,
    normalize_skills,
    skill_key,
)


SKILL_WEIGHT = 45.0
EXPERIENCE_WEIGHT = 20.0
TITLE_WEIGHT = 15.0
LOCATION_WEIGHT = 10.0
TEXT_WEIGHT = 10.0


def score_cv_jd(cv: CVProfile, job: JobDescription) -> MatchResult:
    cv_skill_values = collect_cv_skills(cv)
    required_skills = collect_job_required_skills(job)
    nice_skills = collect_job_nice_to_have_skills(job)

    matched_required = match_skills(required_skills, cv_skill_values)
    missing_required = [
        skill for skill in required_skills if normalized_skill_key(skill) not in matched_required
    ]
    matched_nice = match_skills(nice_skills, cv_skill_values)

    skill_score = score_required_skills(required_skills, matched_required)
    experience_score, experience_gap = score_experience(cv, job)
    title_score = score_title(cv.title, job.title)
    location_score = score_location(cv.location, job.location)
    text_score = score_text_similarity(build_cv_text(cv), build_job_text(job))

    overall_score = round(
        skill_score + experience_score + title_score + location_score + text_score,
        1,
    )
    overall_score = max(0.0, min(100.0, overall_score))

    return MatchResult(
        overall_score=overall_score,
        matched_skills=list(matched_required.values()),
        missing_required_skills=missing_required,
        nice_to_have_skills=list(matched_nice.values()),
        experience_gap=experience_gap,
        salary_gap=None,
        recommendation_reason=build_recommendation_reason(
            overall_score,
            matched_required=list(matched_required.values()),
            missing_required=missing_required,
            experience_gap=experience_gap,
        ),
    )


def recommend_jobs(cv: CVProfile, jobs: Iterable[JobDescription]) -> list[RecommendedJob]:
    recommendations: list[RecommendedJob] = []
    for job in jobs:
        result = score_cv_jd(cv, job)
        job_id = job.external_id or (str(job.source_url) if job.source_url else None)
        recommendations.append(
            RecommendedJob(
                job_id=job_id,
                title=job.title,
                company_name=job.company_name,
                overall_score=result.overall_score,
                matched_skills=result.matched_skills,
                missing_required_skills=result.missing_required_skills,
            )
        )

    return sorted(
        recommendations,
        key=lambda item: (item.overall_score, len(item.matched_skills)),
        reverse=True,
    )


def collect_cv_skills(cv: CVProfile) -> list[str]:
    values: list[str] = []
    values.extend(cv.skills)
    values.extend(cv.certificates)
    for experience in cv.experiences:
        values.extend(experience.skills)
        values.extend(extract_known_skills(experience.description))
    for project in cv.projects:
        values.extend(project.skills)
        values.extend(extract_known_skills(project.description))

    values.extend(extract_known_skills(build_cv_text(cv)))
    return normalize_skills(values)


def collect_job_required_skills(job: JobDescription) -> list[str]:
    if job.required_skills:
        return dedupe_job_skill_labels(job.required_skills)

    return extract_known_skills(
        " ".join(
            text
            for text in (
                job.requirements_text,
                job.description_text,
                job.title,
            )
            if text
        )
    )


def collect_job_nice_to_have_skills(job: JobDescription) -> list[str]:
    if job.nice_to_have_skills:
        return dedupe_job_skill_labels(job.nice_to_have_skills)

    return extract_known_skills(job.benefits_text)


def match_skills(job_skills: list[str], cv_skills: list[str]) -> dict[str, str]:
    cv_keys = {skill_key(skill) for skill in normalize_skills(cv_skills)}
    matched: dict[str, str] = {}
    for skill in job_skills:
        key = normalized_skill_key(skill)
        if key in cv_keys:
            matched[key] = skill
    return matched


def dedupe_job_skill_labels(skills: list[str]) -> list[str]:
    deduped: list[str] = []
    seen: set[str] = set()
    for skill in skills:
        key = normalized_skill_key(skill)
        if not key or key in seen:
            continue
        deduped.append(skill.strip())
        seen.add(key)
    return deduped


def normalized_skill_key(skill: str) -> str:
    normalized = normalize_skills([skill])
    return skill_key(normalized[0] if normalized else skill)


def score_required_skills(required_skills: list[str], matched_required: dict[str, str]) -> float:
    if not required_skills:
        return SKILL_WEIGHT * 0.5
    return SKILL_WEIGHT * (len(matched_required) / len(required_skills))


def score_experience(cv: CVProfile, job: JobDescription) -> tuple[float, str | None]:
    if job.min_years_experience is None:
        return EXPERIENCE_WEIGHT, None

    candidate_years = cv.total_years_experience or 0.0
    required_years = job.min_years_experience
    if candidate_years >= required_years:
        years_text = format_years(required_years)
        return (
            EXPERIENCE_WEIGHT,
            f"Candidate meets the minimum {years_text} years of experience.",
        )

    ratio = candidate_years / required_years if required_years else 1.0
    gap = round(required_years - candidate_years, 1)
    return (
        EXPERIENCE_WEIGHT * max(0.0, min(1.0, ratio)),
        (
            f"Candidate has {format_years(candidate_years)} years, "
            f"job asks for {format_years(required_years)} years; gap is {format_years(gap)} years."
        ),
    )


def score_title(cv_title: str | None, job_title: str | None) -> float:
    cv_tokens = meaningful_tokens(cv_title)
    job_tokens = meaningful_tokens(job_title)
    if not cv_tokens or not job_tokens:
        return TITLE_WEIGHT * 0.4

    overlap = cv_tokens & job_tokens
    return TITLE_WEIGHT * (len(overlap) / len(job_tokens))


def score_location(cv_location: str | None, job_location: str | None) -> float:
    if not cv_location or not job_location:
        return LOCATION_WEIGHT * 0.5

    normalized_cv = normalize_location(cv_location) or cv_location
    normalized_job = normalize_location(job_location) or job_location
    cv_key = skill_key(normalized_cv)
    job_key = skill_key(normalized_job)
    if cv_key == job_key or "remote" in {cv_key, job_key}:
        return LOCATION_WEIGHT
    if cv_key in job_key or job_key in cv_key:
        return LOCATION_WEIGHT * 0.8
    return 0.0


def score_text_similarity(cv_text: str, job_text: str) -> float:
    cv_tokens = text_tokens(cv_text)
    job_tokens = text_tokens(job_text)
    if not cv_tokens or not job_tokens:
        return 0.0

    cv_vector, job_vector = build_tfidf_vectors(cv_tokens, job_tokens)
    vocabulary = set(cv_vector) | set(job_vector)
    dot = sum(cv_vector.get(token, 0.0) * job_vector.get(token, 0.0) for token in vocabulary)
    cv_norm = math.sqrt(sum(value * value for value in cv_vector.values()))
    job_norm = math.sqrt(sum(value * value for value in job_vector.values()))
    if not cv_norm or not job_norm:
        return 0.0
    return TEXT_WEIGHT * (dot / (cv_norm * job_norm))


def build_tfidf_vectors(
    cv_tokens: list[str],
    job_tokens: list[str],
) -> tuple[dict[str, float], dict[str, float]]:
    cv_counts = Counter(cv_tokens)
    job_counts = Counter(job_tokens)
    vocabulary = set(cv_counts) | set(job_counts)
    document_count = 2

    def vectorize(counts: Counter[str]) -> dict[str, float]:
        total = sum(counts.values()) or 1
        vector: dict[str, float] = {}
        for token in vocabulary:
            term_frequency = counts[token] / total
            document_frequency = int(token in cv_counts) + int(token in job_counts)
            inverse_document_frequency = math.log(
                (document_count + 1) / (document_frequency + 1)
            ) + 1
            vector[token] = term_frequency * inverse_document_frequency
        return vector

    return vectorize(cv_counts), vectorize(job_counts)


def build_cv_text(cv: CVProfile) -> str:
    parts: list[str] = [
        cv.title or "",
        cv.summary or "",
        " ".join(cv.skills),
        " ".join(cv.languages),
        " ".join(cv.certificates),
        cv.raw_text or "",
    ]
    for experience in cv.experiences:
        parts.extend(
            [
                experience.title,
                experience.company or "",
                experience.description or "",
                " ".join(experience.skills),
            ]
        )
    for project in cv.projects:
        parts.extend([project.name, project.description or "", " ".join(project.skills)])
    for education in cv.education:
        parts.extend([education.school, education.degree or "", education.major or ""])
    return " ".join(parts)


def build_job_text(job: JobDescription) -> str:
    return " ".join(
        text
        for text in (
            job.title,
            job.company_name,
            job.location,
            " ".join(job.required_skills),
            " ".join(job.nice_to_have_skills),
            job.description_text,
            job.requirements_text,
            job.benefits_text,
        )
        if text
    )


def build_recommendation_reason(
    overall_score: float,
    *,
    matched_required: list[str],
    missing_required: list[str],
    experience_gap: str | None,
) -> str:
    if overall_score >= 75:
        if missing_required:
            return (
                "Strong match based on required skills and experience, "
                f"but should show {', '.join(missing_required)} experience more clearly."
            )
        return "Strong match based on required skills, experience, and profile context."

    if overall_score >= 35:
        missing_text = ", ".join(missing_required) if missing_required else "some job requirements"
        return (
            f"Candidate needs stronger evidence for {missing_text}; "
            f"matched skills: {', '.join(matched_required) or 'none'}."
        )

    return (
        "Low match because the CV has limited overlap with required skills "
        "and job context."
    )


def meaningful_tokens(value: str | None) -> set[str]:
    stop_words = {"and", "or", "for", "the", "a", "an", "of", "with"}
    return {token for token in text_tokens(value or "") if token not in stop_words}


def text_tokens(value: str) -> list[str]:
    folded = fold_text(value)
    return re.findall(r"[a-z0-9+#.]{2,}", folded)


def format_years(value: float) -> str:
    return str(int(value)) if float(value).is_integer() else str(value)
