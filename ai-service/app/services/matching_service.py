import numpy as np
from app.config.parser_config import DEGREE_HIERARCHY
from app.schemas.match import (
    MatchRequest,
    MatchResponse,
    RankedCandidate,
    ScoreBreakdown,
)
from app.services.embedding_service import EmbeddingService
from app.services.explanation_service import build_explanations, generate_readable_summary
from app.utils.resume_text_builder import build_candidate_text
from app.utils.timing import log_time


# CONFIG
WEIGHTS = {
    "skills": 0.4,
    "experience": 0.3,
    "semantic": 0.2,
    "education": 0.1,
}

# Start at 1 so unknown doesn't collide with olevel
EDU_RANK = {k.lower(): v for v, k in enumerate(DEGREE_HIERARCHY.keys(), start=1)}
EDU_RANK["unknown"] = 0


def _weights_without_skills(base: dict) -> dict:
    """`base` with the skills share proportionally redistributed to the rest."""
    remaining = base["experience"] + base["semantic"] + base["education"]
    skills_weight = base["skills"]
    if remaining <= 0:
        # The base weights put everything on skills with nothing to redistribute
        # to (e.g. an admin set skills=1.0, everything else=0) — fall back to an
        # even split rather than dividing by zero.
        return {"skills": 0.0, "experience": 1 / 3, "semantic": 1 / 3, "education": 1 / 3}
    return {
        "skills": 0.0,
        "experience": base["experience"] + skills_weight * (base["experience"] / remaining),
        "semantic": base["semantic"] + skills_weight * (base["semantic"] / remaining),
        "education": base["education"] + skills_weight * (base["education"] / remaining),
    }


# ENTRY
async def match_candidates_service(
    request: MatchRequest,
    embedding_service: EmbeddingService,
) -> MatchResponse:

    with log_time(
        "match_candidates_service",
        extra={"candidate_count": len(request.candidates)},
    ):
        job_text = (request.job.description or "").strip()
        if not job_text:
            job_text = " ".join(request.job.required_skills)

        # Returns a normalized np.ndarray
        job_embedding = embedding_service.generate_embedding(job_text)

        required = {s.lower().strip() for s in request.job.required_skills}
        preferred = {s.lower().strip() for s in request.job.preferred_skills}

        # The backend resolves job-level override -> admin global default before
        # this ever runs; request.job.weights being unset means "use ours."
        base_weights = request.job.weights.model_dump() if request.job.weights else WEIGHTS

        # A job with no required/preferred skills has nothing to score candidates
        # against on that dimension — granting everyone a free 1.0 (the old
        # behaviour) silently inflates every candidate's total. Redistribute the
        # skills weight across the other three dimensions instead.
        weights = base_weights if (required or preferred) else _weights_without_skills(base_weights)

        candidate_texts = [
            build_candidate_text(c) or " ".join(c.skills or [])
            for c in request.candidates
        ]

        # Returns a 2D np.ndarray of shape (num_candidates, vector_dimension)
        candidate_embeddings = embedding_service.generate_batch_embeddings(candidate_texts)

        ranked = []

        for candidate, emb in zip(request.candidates, candidate_embeddings):
            with log_time("score_candidate", extra={"candidate": candidate.full_name}):
                ranked.append(
                    score_candidate(
                        candidate,
                        emb,
                        job_embedding,
                        embedding_service,
                        required,
                        preferred,
                        request.job.required_experience_years,
                        request.job.required_education_level,
                        weights,
                    )
                )

        ranked.sort(key=lambda x: x.total_score, reverse=True)

        return MatchResponse(
            job_id=request.job.job_id,
            ranked_candidates=ranked,
        )


def score_candidate(
    candidate,
    candidate_embedding: np.ndarray,
    job_embedding: np.ndarray,
    embedding_service: EmbeddingService,
    required_skills: set[str],
    preferred_skills: set[str],
    required_experience: float,
    required_education: str | None,
    weights: dict,
) -> RankedCandidate:

    # SEMANTIC SCORE -> optimized using Dot Product
    semantic = embedding_service.calculate_similarity(
        candidate_embedding,
        job_embedding,
    )

    # SKILLS SCORE
    skills = {s.lower().strip() for s in candidate.skills or []}

    matched_required = required_skills & skills
    missing_required = required_skills - skills
    matched_preferred = preferred_skills & skills

    req_score = len(matched_required) / len(required_skills) if required_skills else 1.0
    pref_score = len(matched_preferred) / len(preferred_skills) if preferred_skills else 1.0
    missing_penalty = len(missing_required) / len(required_skills) if required_skills else 0.0

    skills_score = (req_score * 0.6) + (pref_score * 0.4) - (missing_penalty * 0.3)
    skills_score = max(0.0, min(1.0, skills_score))

    # EXPERIENCE SCORE
    if required_experience <= 0:
        exp_score = 1.0
    else:
        exp_score = max(0.0, min(candidate.years_experience / required_experience, 1.0))

    # EDUCATION SCORE (Ordinal-safe)
    req_rank = EDU_RANK.get((required_education or "").lower(), 0)
    cand_rank = EDU_RANK.get((candidate.education_level or "unknown").lower(), 0)

    if req_rank == 0:
        edu_score = 1.0
    else:
        edu_score = 1.0 if cand_rank >= req_rank else cand_rank / req_rank

    total = (
        skills_score * weights["skills"]
        + exp_score * weights["experience"]
        + semantic * weights["semantic"]
        + edu_score * weights["education"]
    )

    supporting_reasons, concerns = build_explanations(
        candidate=candidate,
        matched_skills=list(matched_required),
        missing_skills=list(missing_required),
        skills_score=skills_score,
        experience_score=exp_score,
        semantic_score=semantic,
        education_score=edu_score,
    )

    summary = generate_readable_summary(
        full_name=candidate.full_name,
        total_score=total,
        supporting_reasons=supporting_reasons,
        concerns=concerns,
    )

    return RankedCandidate(
        candidate_id=candidate.candidate_id,
        full_name=candidate.full_name,
        total_score=round(total, 3),
        matched_skills=sorted(matched_required),
        missing_skills=sorted(missing_required),
        score_breakdown=ScoreBreakdown(
            skills_score=round(skills_score, 3),
            experience_score=round(exp_score, 3),
            semantic_score=round(semantic, 3),
            education_score=round(edu_score, 3),
        ),
        supporting_reasons=supporting_reasons,
        concerns=concerns,
        readable_summary=summary,
    )
