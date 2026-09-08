from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.common import EducationLevel

class CandidateInput(BaseModel):
    candidate_id: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    skills: list[str] = Field(default_factory=list)
    years_experience: float = Field(default=0.0, ge=0)
    education_level: Optional[EducationLevel] = None
    raw_text: Optional[str] = None

class WeightsInput(BaseModel):
    skills: float = Field(ge=0, le=1)
    experience: float = Field(ge=0, le=1)
    semantic: float = Field(ge=0, le=1)
    education: float = Field(ge=0, le=1)

class JobInput(BaseModel):
    job_id: str
    title: str
    description: str
    required_skills: list[str] = Field(default_factory=list)
    preferred_skills: list[str] = Field(default_factory=list)
    required_experience_years: float = Field(default=0.0, ge=0)
    required_education_level: Optional[EducationLevel] = None
    # Optional override of the scoring weights — the backend resolves job-level
    # override -> admin global default before sending this; None here means
    # "use this service's own hardcoded fallback" (see matching_service.WEIGHTS).
    weights: Optional[WeightsInput] = None

class MatchRequest(BaseModel):
    job: JobInput
    candidates: list[CandidateInput]

class ScoreBreakdown(BaseModel):
    skills_score: float = Field(default=0.0, ge=0, le=1.0)
    experience_score: float = Field(default=0.0, ge=0, le=1.0)
    semantic_score: float = Field(default=0.0, ge=0, le=1.0)
    education_score: float = Field(default=0.0, ge=0, le=1.0)

class RankedCandidate(BaseModel):
    candidate_id: str
    full_name: Optional[str] = None
    total_score: float = Field(default=0.0, ge=0, le=1.0)
    matched_skills: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)
    score_breakdown: ScoreBreakdown
    supporting_reasons: list[str] = Field(default_factory=list)
    concerns: list[str] = Field(default_factory=list)
    readable_summary: Optional[str] = None

class MatchResponse(BaseModel):
    job_id: str
    ranked_candidates: list[RankedCandidate]