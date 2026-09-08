def build_explanations(
    candidate,
    matched_skills: list[str],
    missing_skills: list[str],
    skills_score: float,
    experience_score: float,
    semantic_score: float,
    education_score: float,
) -> tuple[list[str], list[str]]:
    """Returns (supporting_reasons, concerns) as two separate lists, never
    one mixed list — a candidate can score well overall while still having
    one weak sub-score, and that weak point must never render under a
    "what supports this match" heading."""
    supporting_reasons = []
    concerns = []

    # Skills Evaluation (Grouped context)
    if skills_score >= 0.8:
        supporting_reasons.append("Demonstrates a strong skills match for the role")
    elif skills_score < 0.5:
        concerns.append("Shows weak skills alignment with the job requirements")

    if matched_skills:
        supporting_reasons.append(f"possesses key skills like {', '.join(sorted(matched_skills))}")
    if missing_skills:
        concerns.append(f"is missing requested skills such as {', '.join(sorted(missing_skills))}")

    # Experience
    if experience_score == 1.0:
        supporting_reasons.append("meets or exceeds the required experience")
    elif experience_score < 0.7:
        concerns.append("falls below the required experience level")

    # Semantic
    if semantic_score >= 0.8:
        supporting_reasons.append("has a background highly relevant to the job description")
    elif semantic_score < 0.5:
        concerns.append("shows low contextual relevance to the role")

    # Education
    if education_score == 1.0:
        supporting_reasons.append("satisfies the education requirements")
    elif education_score < 0.7:
        concerns.append("does not fully meet the requested education level")

    return supporting_reasons, concerns


def generate_readable_summary(
    full_name: str | None,
    total_score: float,
    supporting_reasons: list[str],
    concerns: list[str],
) -> str:
    reasons = supporting_reasons + concerns
    name = full_name or "The candidate"

    if total_score >= 0.8:
        performance = "a strong match"
    elif total_score >= 0.6:
        performance = "a moderate match"
    else:
        performance = "a weak match"

    summary = f"{name} is {performance} for the role (overall score: {round(total_score, 2)})."

    if not reasons:
        return summary + " No detailed reasoning available."

    # Capitalize the first letter of each reason and join them smoothly
    formatted_reasons = [
        reason[0].upper() + reason[1:] + "." 
        for reason in reasons
    ]
    
    summary += " " + " ".join(formatted_reasons)

    return summary