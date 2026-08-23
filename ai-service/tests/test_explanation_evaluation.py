from app.services.explanation_evaluation import (
    ExplanationEvaluationRecord,
    evaluate_explanations,
    load_explanation_records,
)


def test_explanation_quality_flags_missing_evidence_and_guardrails():
    records = [
        ExplanationEvaluationRecord(
            sample_id="bad-docker-gap",
            analysis={
                "overall_score": 70,
                "matched_skills": ["Python"],
                "missing_required_skills": ["Docker"],
                "recommendation_reason": "Candidate needs Docker evidence.",
                "improvement_focus": ["Docker"],
                "fit_gaps": [
                    {
                        "category": "skill",
                        "status": "match",
                        "severity": "low",
                        "requirement": "Python",
                        "message": "Python matches.",
                        "evidence": [
                            {"source": "cv", "section": "skills", "text": "Python"},
                            {"source": "jd", "section": "requirements", "text": "Python"},
                        ],
                    },
                    {
                        "category": "skill",
                        "status": "gap",
                        "severity": "high",
                        "requirement": "Docker",
                        "message": "Docker is missing.",
                        "evidence": [],
                    },
                ],
            },
            suggestions={
                "overall_score": 70,
                "blocked_claims": [],
                "suggestions": [
                    {
                        "section": "skills",
                        "action": "add_if_true",
                        "title": "Add Docker",
                        "current_gap": "JD requires Docker.",
                        "suggested_wording": "Add Docker to Skills.",
                        "rationale": "Docker is required.",
                        "evidence": [],
                        "guardrail": None,
                    }
                ],
            },
        )
    ]

    report = evaluate_explanations(records)

    assert report.record_count == 1
    assert report.failed_check_count >= 4
    assert report.overall_pass_rate < 1.0
    violation_codes = {violation.check_id for violation in report.violations}
    assert "fit_gaps_have_evidence" in violation_codes
    assert "skill_gaps_have_guardrails" in violation_codes
    assert "suggestions_have_evidence" in violation_codes
    assert "add_if_true_suggestions_are_guarded" in violation_codes


def test_explanation_quality_passes_evidence_backed_guarded_output():
    records = [
        ExplanationEvaluationRecord(
            sample_id="good-docker-gap",
            analysis={
                "overall_score": 82.5,
                "matched_skills": ["Python", "FastAPI", "SQL"],
                "missing_required_skills": ["Docker"],
                "recommendation_reason": "Strong match with a Docker evidence gap.",
                "improvement_focus": ["Docker"],
                "fit_gaps": [
                    {
                        "category": "skill",
                        "status": "match",
                        "severity": "low",
                        "requirement": "Python",
                        "message": "Python appears in CV and JD.",
                        "evidence": [
                            {"source": "cv", "section": "skills", "text": "Python"},
                            {"source": "jd", "section": "requirements", "text": "Python"},
                        ],
                    },
                    {
                        "category": "skill",
                        "status": "gap",
                        "severity": "high",
                        "requirement": "Docker",
                        "message": "JD requires Docker but CV has no verified Docker evidence.",
                        "evidence": [
                            {"source": "jd", "section": "requirements", "text": "Docker"}
                        ],
                        "guardrail": "Add Docker only if the candidate truly has verified Docker experience.",
                    },
                ],
            },
            suggestions={
                "overall_score": 82.5,
                "blocked_claims": ["Docker"],
                "suggestions": [
                    {
                        "section": "skills",
                        "action": "add_if_true",
                        "title": "Clarify Docker only if true",
                        "current_gap": "JD requires Docker but parsed CV has no verified Docker evidence.",
                        "suggested_wording": "Only if you have real Docker experience, add Docker under Skills and mention the project where you used it.",
                        "rationale": "Docker is required in the JD and missing from parsed CV evidence.",
                        "evidence": [
                            {"source": "jd", "section": "requirements", "text": "Docker"}
                        ],
                        "guardrail": {
                            "code": "requires_verified_experience",
                            "severity": "blocker",
                            "message": "Do not claim Docker experience unless it is true.",
                        },
                    }
                ],
            },
        )
    ]

    report = evaluate_explanations(records)

    assert report.record_count == 1
    assert report.failed_check_count == 0
    assert report.overall_pass_rate == 1.0
    assert not report.violations


def test_sample_explanation_file_loads_into_quality_contract():
    records = load_explanation_records("data/samples/explanation_evaluation.json")

    report = evaluate_explanations(records)

    assert len(records) >= 1
    assert report.record_count == len(records)
    assert report.overall_pass_rate >= 0.9
    assert report.rule_metrics["fit_gaps_have_evidence"].pass_rate == 1.0
