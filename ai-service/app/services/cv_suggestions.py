from __future__ import annotations

from app.schemas.cv import CVProfile
from app.schemas.cv_suggestion import (
    CvSuggestion,
    CvSuggestionsResponse,
    SuggestionGuardrail,
)
from app.schemas.job import JobDescription
from app.schemas.job_fit import FitGap, JobFitAnalysis
from app.services.job_fit_analysis import analyze_job_fit


SUGGESTION_VERSION = "rule-based-suggestion-v1"


def build_cv_suggestions(
    cv: CVProfile,
    job: JobDescription,
    analysis: JobFitAnalysis | None = None,
) -> CvSuggestionsResponse:
    source_analysis = analysis or analyze_job_fit(cv, job)
    suggestions: list[CvSuggestion] = []
    blocked_claims: list[str] = []

    for gap in source_analysis.fit_gaps:
        if gap.category == "skill" and gap.status == "gap":
            suggestions.append(build_missing_skill_suggestion(gap))
            blocked_claims.append(gap.requirement)
        elif gap.category == "experience" and gap.status == "gap":
            suggestions.append(build_experience_gap_suggestion(gap))
            blocked_claims.append("inflated years of experience")
        elif gap.category == "location" and gap.status == "gap":
            suggestions.append(build_location_gap_suggestion(gap))
        elif gap.category == "work_mode" and gap.status in {"gap", "partial"}:
            suggestions.append(build_work_mode_gap_suggestion(gap))
        elif gap.category == "salary" and gap.status == "gap":
            suggestions.append(build_salary_gap_suggestion(gap))
            blocked_claims.append("hidden salary mismatch")

    if not suggestions and source_analysis.overall_score >= 75:
        suggestions.append(build_strengthen_summary_suggestion(source_analysis))

    return CvSuggestionsResponse(
        overall_score=source_analysis.overall_score,
        suggestions=suggestions,
        blocked_claims=dedupe_preserve_order(blocked_claims),
        source_analysis_version=source_analysis.analyzer_version,
        suggestion_version=SUGGESTION_VERSION,
    )


def build_missing_skill_suggestion(gap: FitGap) -> CvSuggestion:
    skill = gap.requirement
    return CvSuggestion(
        section="skills",
        action="add_if_true",
        title=f"Clarify {skill} only if true",
        current_gap=gap.message,
        suggested_wording=(
            f"Only if you have real {skill} experience, add {skill} under Skills and "
            "mention the project, role, or task where you used it. If you do not "
            f"have {skill} yet, leave it out and treat it as a learning gap."
        ),
        rationale=(
            f"{skill} appears as a required JD skill, but the parsed CV has no "
            "verified CV evidence for it."
        ),
        evidence=gap.evidence,
        guardrail=SuggestionGuardrail(
            code="requires_verified_experience",
            severity="blocker",
            message=f"Do not claim {skill} experience unless the candidate truly has it.",
        ),
    )


def build_experience_gap_suggestion(gap: FitGap) -> CvSuggestion:
    return CvSuggestion(
        section="experience",
        action="clarify",
        title="Clarify relevant experience without inflating years",
        current_gap=gap.message,
        suggested_wording=(
            "Add concise bullets that show relevant responsibilities, scope, and "
            "impact from real projects or roles. Keep years of experience factual."
        ),
        rationale="The JD asks for more experience than the parsed CV currently shows.",
        evidence=gap.evidence,
        guardrail=SuggestionGuardrail(
            code="do_not_inflate_experience",
            severity="blocker",
            message="Do not increase years of experience or seniority unless it is factual.",
        ),
    )


def build_location_gap_suggestion(gap: FitGap) -> CvSuggestion:
    return CvSuggestion(
        section="summary",
        action="clarify",
        title="Clarify location or work mode preference",
        current_gap=gap.message,
        suggested_wording=(
            "If true, add a short line about relocation, remote, or hybrid work "
            "preference in the CV summary or profile section."
        ),
        rationale="The JD location/work mode does not clearly align with the parsed CV.",
        evidence=gap.evidence,
        guardrail=SuggestionGuardrail(
            code="requires_true_preference",
            severity="warning",
            message="Only state relocation or remote preference if it is true.",
        ),
    )


def build_work_mode_gap_suggestion(gap: FitGap) -> CvSuggestion:
    return CvSuggestion(
        section="summary",
        action="clarify",
        title="Clarify work mode preference",
        current_gap=gap.message,
        suggested_wording=(
            "If true, add a short profile line about remote, hybrid, or onsite "
            "preference. If this JD requires a different work mode, keep the "
            "preference factual and treat it as a job-fit consideration."
        ),
        rationale="The JD work mode and parsed CV preference are not a clear match.",
        evidence=gap.evidence,
        guardrail=SuggestionGuardrail(
            code="requires_true_preference",
            severity="warning",
            message="Only state remote, hybrid, or onsite preference if it is true.",
        ),
    )


def build_salary_gap_suggestion(gap: FitGap) -> CvSuggestion:
    return CvSuggestion(
        section="summary",
        action="clarify",
        title="Clarify salary expectation honestly",
        current_gap=gap.message,
        suggested_wording=(
            "Keep the salary expectation transparent. If the candidate is flexible, "
            "state the real flexible range; otherwise do not rewrite the CV to make "
            "the salary expectation look compatible with this JD."
        ),
        rationale="The parsed CV salary expectation is above the JD salary range.",
        evidence=gap.evidence,
        guardrail=SuggestionGuardrail(
            code="do_not_hide_salary_gap",
            severity="warning",
            message="Do not hide or rewrite salary expectations as a match.",
        ),
    )


def build_strengthen_summary_suggestion(analysis: JobFitAnalysis) -> CvSuggestion:
    matched = ", ".join(analysis.matched_skills[:3]) or "the strongest matching skills"
    return CvSuggestion(
        section="summary",
        action="rewrite",
        title="Make the strongest match visible in the summary",
        current_gap="The CV matches the JD, but the strongest evidence can be made easier to scan.",
        suggested_wording=(
            f"Rewrite the summary to mention {matched} and connect them to the target role, "
            "using only experience already present in the CV."
        ),
        rationale="A strong CV-JD match should surface the most relevant evidence early.",
        evidence=[
            evidence
            for gap in analysis.fit_gaps
            if gap.status == "match"
            for evidence in gap.evidence
        ][:4],
        guardrail=SuggestionGuardrail(
            code="use_existing_evidence_only",
            severity="warning",
            message="Suggested wording must use only verified CV evidence.",
        ),
    )


def dedupe_preserve_order(values: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        if value in seen:
            continue
        seen.add(value)
        result.append(value)
    return result
