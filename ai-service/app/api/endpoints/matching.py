from fastapi import APIRouter

from app.schemas.cv_suggestion import CvSuggestionsRequest, CvSuggestionsResponse
from app.schemas.match import (
    MatchRequest,
    MatchResult,
    RecommendJobsRequest,
    RecommendedJob,
)
from app.schemas.job_fit import AnalyzeJobFitRequest, JobFitAnalysis
from app.services.cv_suggestions import build_cv_suggestions
from app.services.job_fit_analysis import analyze_job_fit
from app.services.matching import recommend_jobs, score_cv_jd


router = APIRouter()


@router.post(
    "/match-cv-jd",
    response_model=MatchResult,
    summary="Score a CV against one job description",
)
def match_cv_jd(payload: MatchRequest):
    """Return a deterministic rule-based match score with explanation."""

    return score_cv_jd(payload.cv, payload.job)


@router.post(
    "/recommend-jobs",
    response_model=list[RecommendedJob],
    summary="Rank job descriptions for one CV",
)
def recommend_jobs_for_cv(payload: RecommendJobsRequest):
    """Rank jobs by rule-based matching score."""

    return recommend_jobs(payload.cv, payload.jobs)


@router.post(
    "/analyze-job-fit",
    response_model=JobFitAnalysis,
    summary="Analyze why a CV fits or does not fit one job",
)
def analyze_job_fit_for_cv(payload: AnalyzeJobFitRequest):
    """Return evidence-backed CV-JD fit gaps for AI/Data analysis."""

    return analyze_job_fit(payload.cv, payload.job)


@router.post(
    "/cv-suggestions",
    response_model=CvSuggestionsResponse,
    summary="Suggest evidence-backed CV improvements for one job",
)
def suggest_cv_improvements(payload: CvSuggestionsRequest):
    """Return guardrailed CV suggestions from parsed CV/JD evidence."""

    return build_cv_suggestions(payload.cv, payload.job, payload.analysis)
