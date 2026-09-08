from app.services.explanation_service import build_explanations, generate_readable_summary


def test_a_weak_sub_score_never_lands_in_supporting_reasons():
    """Regression test for the live-reproduced bug: a candidate who is
    strong everywhere except semantic relevance must not have "shows low
    contextual relevance" appear anywhere in supporting_reasons."""
    supporting_reasons, concerns = build_explanations(
        candidate=None,
        matched_skills=["customer service", "excel"],
        missing_skills=[],
        skills_score=1.0,
        experience_score=1.0,
        semantic_score=0.3,
        education_score=1.0,
    )

    assert "shows low contextual relevance to the role" in concerns
    assert "shows low contextual relevance to the role" not in supporting_reasons
    assert all("low contextual relevance" not in reason for reason in supporting_reasons)


def test_strong_candidate_has_no_concerns():
    supporting_reasons, concerns = build_explanations(
        candidate=None,
        matched_skills=["python"],
        missing_skills=[],
        skills_score=1.0,
        experience_score=1.0,
        semantic_score=1.0,
        education_score=1.0,
    )

    assert concerns == []
    assert len(supporting_reasons) > 0


def test_weak_candidate_has_no_supporting_reasons_from_the_weak_dimensions():
    supporting_reasons, concerns = build_explanations(
        candidate=None,
        matched_skills=[],
        missing_skills=["python"],
        skills_score=0.2,
        experience_score=0.2,
        semantic_score=0.2,
        education_score=0.2,
    )

    assert supporting_reasons == []
    assert len(concerns) > 0


def test_readable_summary_still_includes_both_supporting_and_concern_text():
    summary = generate_readable_summary(
        full_name="Jane Doe",
        total_score=0.87,
        supporting_reasons=["meets or exceeds the required experience"],
        concerns=["shows low contextual relevance to the role"],
    )

    assert "meets or exceeds the required experience" in summary.lower()
    assert "shows low contextual relevance to the role" in summary.lower()
