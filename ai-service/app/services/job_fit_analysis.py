from __future__ import annotations

import re

from app.schemas.cv import CVExperience, CVProfile, CVProject
from app.schemas.job import JobDescription
from app.schemas.job_fit import EvidenceRef, FitGap, JobFitAnalysis
from app.services.data_cleaning import (
    fold_text,
    normalize_location,
    normalize_salary,
    normalize_skills,
    skill_key,
)
from app.services.matching import (
    collect_job_nice_to_have_skills,
    collect_job_required_skills,
    format_years,
    normalized_skill_key,
    score_cv_jd,
)


ANALYZER_VERSION = "rule-based-gap-v1"
WORK_MODE_PATTERNS = (
    ("remote", r"\b(remote|work from home|wfh|tu xa)\b"),
    ("hybrid", r"\b(hybrid|ket hop)\b"),
    ("onsite", r"\b(on[- ]?site|onsite|office|tai van phong|van phong)\b"),
)


def analyze_job_fit(cv: CVProfile, job: JobDescription) -> JobFitAnalysis:
    match_result = score_cv_jd(cv, job)
    fit_gaps: list[FitGap] = []

    for skill in match_result.matched_skills:
        fit_gaps.append(
            FitGap(
                category="skill",
                status="match",
                severity="low",
                requirement=skill,
                message=f"CV has verified evidence for required skill {skill}.",
                evidence=find_cv_skill_evidence(cv, skill) + find_jd_skill_evidence(job, skill),
            )
        )

    for skill in match_result.missing_required_skills:
        fit_gaps.append(
            FitGap(
                category="skill",
                status="gap",
                severity="high",
                requirement=skill,
                message=(
                    f"JD requires {skill} but the parsed CV has no verified "
                    f"{skill} evidence."
                ),
                evidence=find_jd_skill_evidence(job, skill),
                guardrail=(
                    f"Ask the candidate to add {skill} only if they truly have it; "
                    "do not add it as verified experience."
                ),
            )
        )

    experience_gap = build_experience_gap(cv, job)
    if experience_gap:
        fit_gaps.append(experience_gap)

    location_gap = build_location_gap(cv, job)
    if location_gap:
        fit_gaps.append(location_gap)

    work_mode_gap = build_work_mode_gap(cv, job)
    if work_mode_gap:
        fit_gaps.append(work_mode_gap)

    salary_gap = build_salary_gap(cv, job)
    if salary_gap:
        fit_gaps.append(salary_gap)

    improvement_focus = list(match_result.missing_required_skills)
    if experience_gap and experience_gap.status == "gap":
        improvement_focus.append("experience evidence")
    if location_gap and location_gap.status == "gap":
        improvement_focus.append("location/work mode alignment")
    if work_mode_gap and work_mode_gap.status == "gap":
        improvement_focus.append("work mode preference")
    if salary_gap and salary_gap.status == "gap":
        improvement_focus.append("salary expectation alignment")

    return JobFitAnalysis(
        overall_score=match_result.overall_score,
        matched_skills=match_result.matched_skills,
        missing_required_skills=match_result.missing_required_skills,
        nice_to_have_skills=match_result.nice_to_have_skills,
        recommendation_reason=match_result.recommendation_reason,
        improvement_focus=improvement_focus,
        fit_gaps=fit_gaps,
        analyzer_version=ANALYZER_VERSION,
    )


def find_cv_skill_evidence(cv: CVProfile, skill: str) -> list[EvidenceRef]:
    target_key = normalized_skill_key(skill)
    evidence: list[EvidenceRef] = []

    for cv_skill in normalize_skills(cv.skills):
        if normalized_skill_key(cv_skill) == target_key:
            evidence.append(
                EvidenceRef(
                    source="cv",
                    section="skills",
                    field="skills",
                    text=cv_skill,
                    source_span=cv_skill,
                )
            )
            break

    for experience in cv.experiences:
        evidence.extend(find_experience_skill_evidence(experience, skill, target_key))

    for project in cv.projects:
        evidence.extend(find_project_skill_evidence(project, skill, target_key))

    if not evidence and cv.summary and contains_skill_text(cv.summary, skill):
        evidence.append(
            EvidenceRef(
                source="cv",
                section="summary",
                field="summary",
                text=trim_evidence_text(cv.summary),
                source_span=skill,
                confidence=0.8,
            )
        )

    if not evidence and cv.raw_text and contains_skill_text(cv.raw_text, skill):
        evidence.append(
            EvidenceRef(
                source="cv",
                section="raw_text",
                field="raw_text",
                text=trim_evidence_text(cv.raw_text),
                source_span=skill,
                confidence=0.7,
            )
        )

    return evidence[:3]


def find_experience_skill_evidence(
    experience: CVExperience,
    skill: str,
    target_key: str,
) -> list[EvidenceRef]:
    evidence: list[EvidenceRef] = []
    for exp_skill in normalize_skills(experience.skills):
        if normalized_skill_key(exp_skill) == target_key:
            evidence.append(
                EvidenceRef(
                    source="cv",
                    section="experience",
                    field="skills",
                    text=f"{experience.title}: {exp_skill}",
                    source_span=exp_skill,
                )
            )
            break

    if experience.description and contains_skill_text(experience.description, skill):
        evidence.append(
            EvidenceRef(
                source="cv",
                section="experience",
                field="description",
                text=trim_evidence_text(experience.description),
                source_span=skill,
                confidence=0.8,
            )
        )

    return evidence


def find_project_skill_evidence(
    project: CVProject,
    skill: str,
    target_key: str,
) -> list[EvidenceRef]:
    evidence: list[EvidenceRef] = []
    for project_skill in normalize_skills(project.skills):
        if normalized_skill_key(project_skill) == target_key:
            evidence.append(
                EvidenceRef(
                    source="cv",
                    section="projects",
                    field="skills",
                    text=f"{project.name}: {project_skill}",
                    source_span=project_skill,
                )
            )
            break

    if project.description and contains_skill_text(project.description, skill):
        evidence.append(
            EvidenceRef(
                source="cv",
                section="projects",
                field="description",
                text=trim_evidence_text(project.description),
                source_span=skill,
                confidence=0.8,
            )
        )

    return evidence


def find_jd_skill_evidence(job: JobDescription, skill: str) -> list[EvidenceRef]:
    target_key = normalized_skill_key(skill)
    evidence: list[EvidenceRef] = []

    for required_skill in collect_job_required_skills(job):
        if normalized_skill_key(required_skill) == target_key:
            evidence.append(
                EvidenceRef(
                    source="jd",
                    section="requirements",
                    field="required_skills",
                    text=required_skill,
                    source_span=required_skill,
                )
            )
            break

    for nice_skill in collect_job_nice_to_have_skills(job):
        if normalized_skill_key(nice_skill) == target_key:
            evidence.append(
                EvidenceRef(
                    source="jd",
                    section="requirements",
                    field="nice_to_have_skills",
                    text=nice_skill,
                    source_span=nice_skill,
                )
            )
            break

    for section, field, text in (
        ("requirements", "requirements_text", job.requirements_text),
        ("description", "description_text", job.description_text),
    ):
        if text and contains_skill_text(text, skill):
            evidence.append(
                EvidenceRef(
                    source="jd",
                    section=section,
                    field=field,
                    text=trim_evidence_text(text),
                    source_span=skill,
                    confidence=0.8,
                )
            )
            break

    return evidence[:3]


def build_experience_gap(cv: CVProfile, job: JobDescription) -> FitGap | None:
    if job.min_years_experience is None:
        return None

    candidate_years = cv.total_years_experience or 0.0
    required_years = job.min_years_experience
    status = "match" if candidate_years >= required_years else "gap"
    severity = "low" if status == "match" else "high"
    if status == "match":
        message = (
            f"CV shows {format_years(candidate_years)} years and meets the "
            f"{format_years(required_years)} year requirement."
        )
        guardrail = None
    else:
        message = (
            f"CV shows {format_years(candidate_years)} years but JD asks for "
            f"{format_years(required_years)} years."
        )
        guardrail = (
            "Do not inflate years of experience; suggest clearer evidence only "
            "when the candidate actually has it."
        )

    return FitGap(
        category="experience",
        status=status,
        severity=severity,
        requirement=f"{format_years(required_years)} years experience",
        message=message,
        evidence=[
            EvidenceRef(
                source="cv",
                section="profile",
                field="total_years_experience",
                text=f"{format_years(candidate_years)} years",
            ),
            EvidenceRef(
                source="jd",
                section="requirements",
                field="min_years_experience",
                text=f"{format_years(required_years)} years",
            ),
        ],
        guardrail=guardrail,
    )


def build_location_gap(cv: CVProfile, job: JobDescription) -> FitGap | None:
    if not cv.location or not job.location:
        return None

    cv_location = normalize_location(cv.location) or cv.location
    job_location = normalize_location(job.location) or job.location
    cv_key = skill_key(cv_location)
    job_key = skill_key(job_location)
    is_match = cv_key == job_key or "remote" in {cv_key, job_key}

    return FitGap(
        category="location",
        status="match" if is_match else "gap",
        severity="low" if is_match else "medium",
        requirement=job.location,
        message=(
            "CV location aligns with the job location/work mode."
            if is_match
            else "CV location does not clearly align with the job location/work mode."
        ),
        evidence=[
            EvidenceRef(
                source="cv",
                section="profile",
                field="location",
                text=cv.location,
            ),
            EvidenceRef(
                source="jd",
                section="job_metadata",
                field="location",
                text=job.location,
            ),
        ],
        guardrail=(
            None
            if is_match
            else "Ask the candidate to state relocation or remote preference only if true."
        ),
    )


def build_work_mode_gap(cv: CVProfile, job: JobDescription) -> FitGap | None:
    job_mode = normalize_work_mode_text(extract_job_work_mode_text(job))
    cv_mode = normalize_work_mode_text(extract_cv_preference_text(cv))
    if job_mode == "unknown" or cv_mode == "unknown":
        return None

    if cv_mode == job_mode:
        status = "match"
        severity = "low"
        message = f"CV work mode preference aligns with the JD: {job_mode}."
        guardrail = None
    elif {cv_mode, job_mode} <= {"remote", "hybrid"}:
        status = "partial"
        severity = "low"
        message = (
            f"CV work mode preference ({cv_mode}) partially aligns with "
            f"JD mode ({job_mode}); confirm schedule expectations."
        )
        guardrail = "Only state a remote or hybrid preference if it is true."
    else:
        status = "gap"
        severity = "medium"
        message = (
            f"CV work mode preference ({cv_mode}) does not clearly align "
            f"with JD mode ({job_mode})."
        )
        guardrail = "Only state a remote, hybrid, or onsite preference if it is true."

    return FitGap(
        category="work_mode",
        status=status,
        severity=severity,
        requirement=job_mode,
        message=message,
        evidence=[
            EvidenceRef(
                source="cv",
                section="preferences",
                field="raw_text",
                text=trim_evidence_text(extract_cv_preference_text(cv)),
                source_span=cv_mode,
                confidence=0.8,
            ),
            EvidenceRef(
                source="jd",
                section="job_metadata",
                field="work_mode",
                text=trim_evidence_text(extract_job_work_mode_text(job)),
                source_span=job_mode,
            ),
        ],
        guardrail=guardrail,
    )


def build_salary_gap(cv: CVProfile, job: JobDescription) -> FitGap | None:
    if job.salary_min is None and job.salary_max is None:
        return None

    cv_salary = extract_cv_salary_expectation(cv)
    if not cv_salary:
        return None

    expected_min = cv_salary.get("salary_min")
    expected_max = cv_salary.get("salary_max")
    expected_value = expected_max or expected_min
    if expected_value is None:
        return None

    job_max = job.salary_max
    job_min = job.salary_min
    if job_max is not None and expected_value > job_max:
        status = "gap"
        severity = "medium"
        message = (
            f"CV salary expectation {format_salary(expected_value, cv_salary.get('currency'))} "
            f"is above the JD maximum {format_salary(job_max, job.currency)}."
        )
        guardrail = "Do not hide or rewrite salary expectations as matching if they are materially above the JD range."
    elif job_min is not None and expected_value < job_min:
        status = "partial"
        severity = "low"
        message = (
            f"CV salary expectation {format_salary(expected_value, cv_salary.get('currency'))} "
            f"is below the JD minimum {format_salary(job_min, job.currency)}."
        )
        guardrail = None
    else:
        status = "match"
        severity = "low"
        message = "CV salary expectation appears compatible with the JD salary range."
        guardrail = None

    return FitGap(
        category="salary",
        status=status,
        severity=severity,
        requirement=format_job_salary_range(job),
        message=message,
        evidence=[
            EvidenceRef(
                source="cv",
                section="preferences",
                field="raw_text",
                text=extract_cv_salary_text(cv),
                source_span=format_salary(expected_value, cv_salary.get("currency")),
                confidence=0.7,
            ),
            EvidenceRef(
                source="jd",
                section="job_metadata",
                field="salary_range",
                text=format_job_salary_range(job),
            ),
        ],
        guardrail=guardrail,
    )


def extract_cv_preference_text(cv: CVProfile) -> str:
    return " ".join(text for text in (cv.summary, cv.raw_text, cv.location) if text)


def extract_job_work_mode_text(job: JobDescription) -> str:
    return " ".join(
        text
        for text in (job.job_type, job.location, job.description_text, job.requirements_text)
        if text and text != "unknown"
    )


def normalize_work_mode_text(text: str) -> str:
    folded = fold_text(text)
    for work_mode, pattern in WORK_MODE_PATTERNS:
        if re.search(pattern, folded):
            return work_mode
    return "unknown"


def extract_cv_salary_expectation(cv: CVProfile) -> dict[str, float | str | None] | None:
    text = extract_cv_salary_text(cv)
    if not text:
        return None
    salary = normalize_salary(text)
    if salary.get("salary_min") is None and salary.get("salary_max") is None:
        return None
    return salary


def extract_cv_salary_text(cv: CVProfile) -> str:
    folded_keywords = ("salary", "expected", "expectation", "luong", "muc luong")
    for text in (cv.summary, cv.raw_text):
        if not text:
            continue
        folded = fold_text(text)
        if any(keyword in folded for keyword in folded_keywords):
            return trim_evidence_text(text)
    return ""


def format_job_salary_range(job: JobDescription) -> str:
    currency = job.currency
    if job.salary_min is not None and job.salary_max is not None:
        return f"{format_salary(job.salary_min, currency)} - {format_salary(job.salary_max, currency)}"
    if job.salary_min is not None:
        return f"from {format_salary(job.salary_min, currency)}"
    if job.salary_max is not None:
        return f"up to {format_salary(job.salary_max, currency)}"
    return "salary hidden"


def format_salary(value: float, currency: str | None) -> str:
    amount = str(int(value)) if float(value).is_integer() else str(value)
    return f"{amount} {currency}" if currency else amount


def contains_skill_text(text: str, skill: str) -> bool:
    folded_text = fold_text(text)
    folded_skill = fold_text(skill)
    return folded_skill in folded_text


def trim_evidence_text(text: str, limit: int = 180) -> str:
    normalized = " ".join(text.split())
    if len(normalized) <= limit:
        return normalized
    return normalized[: limit - 3].rstrip() + "..."
