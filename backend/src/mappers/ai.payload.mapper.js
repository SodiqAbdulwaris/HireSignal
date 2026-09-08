const BACKEND_TO_AI_EDUCATION = {
  any: null,
  olevel: 'olevel',
  bachelor: 'bachelor',
  master: 'master',
  phd: 'phd',
};

const AI_TO_BACKEND_EDUCATION = {
  olevel: 'olevel',
  bachelor: 'bachelor',
  Bachelor: 'bachelor',
  master: 'master',
  Master: 'master',
  phd: 'phd',
  PhD: 'phd',
  null: null,
};

function backendEducationToAi(level) {
  if (level == null) return null;
  return BACKEND_TO_AI_EDUCATION[level] ?? null;
}

function aiEducationToBackend(level) {
  if (level == null) return null;
  return AI_TO_BACKEND_EDUCATION[level] ?? null;
}

function normalizeSkills(skills = []) {
  return [...new Set(skills.map((s) => s.toLowerCase().trim()).filter(Boolean))];
}

// `fallbackWeights` is the admin-configured global default (Settings.defaultWeights),
// resolved by the caller since fetching it requires a DB read this function shouldn't
// own. Resolution order: job-level override -> admin global default -> ai-service's
// own hardcoded fallback (used when this is undefined too).
function jobToAiInput(job, fallbackWeights) {
  const weights = job.weights || fallbackWeights || undefined;
  return {
    job_id: job._id.toString(),
    title: job.title,
    description: job.description,
    required_skills: normalizeSkills(job.requiredSkills),
    preferred_skills: normalizeSkills(job.preferredSkills),
    required_experience_years: job.requiredExperienceYears ?? 0,
    required_education_level: backendEducationToAi(job.requiredEducationLevel),
    ...(weights && {
      weights: {
        skills: weights.skills,
        experience: weights.experience,
        semantic: weights.semantic,
        education: weights.education,
      },
    }),
  };
}

function candidateToAiInput(profile, resume) {
  return {
    candidate_id: profile._id.toString(),
    full_name: profile.fullName ?? null,
    email: profile.email ?? null,
    skills: normalizeSkills(profile.skills || []),
    years_experience: profile.yearsExperience ?? 0,
    education_level: backendEducationToAi(profile.educationLevel),
    raw_text: resume?.rawText ?? null,
  };
}

function parsedCandidateToBackend(parsed) {
  const resumeFields = {
    rawText: parsed.raw_text ?? null,
    needsReview: parsed.needs_review ?? false,
    fallbackReasons: parsed.fallback_reasons || [],
    extractionMethod: parsed.extraction_method || 'text',
    ocrConfidence: parsed.ocr_confidence ?? null,
  };

  const profileFields = {
    parsedFullName: parsed.full_name ?? null,
    email: parsed.email ?? null,
    phone: parsed.phone ?? null,
    location: parsed.location ?? null,
    skills: normalizeSkills(parsed.skills || []),
    educationLevel: aiEducationToBackend(parsed.education_level),
    yearsExperience: parsed.years_experience ?? 0,
    certifications: parsed.certifications || [],

    education: (parsed.education || []).map((e) => ({
      institution: e.institution ?? null,
      degree: e.degree ?? null,
      startYear: e.start_year ?? null,
      endYear: e.end_year ?? null,
      gpa: e.gpa ?? null,
    })),

    experience: (parsed.experience?.entries || []).map((e) => ({
      role: e.role ?? null,
      company: e.company ?? null,
      startYear: e.start_year ?? null,
      endYear: e.end_year ?? null,
    })),

    projects: (parsed.projects || []).map((p) => ({
      name: p.name ?? null,
      technologies: p.technologies || [],
    })),
  };

  return { resumeFields, profileFields };
}

function aiRankedCandidateToMatchResult(ranked, position) {
  const breakdown = ranked.score_breakdown || {};
  return {
    rankedPosition: position,
    totalScore: ranked.total_score ?? 0,
    matchedSkills: ranked.matched_skills || [],
    missingSkills: ranked.missing_skills || [],
    scoreBreakdown: {
      skills: breakdown.skills_score ?? null,
      experience: breakdown.experience_score ?? null,
      education: breakdown.education_score ?? null,
      semantic: breakdown.semantic_score ?? null,
    },
    explanation: ranked.readable_summary ?? null,
    supportingReasons: ranked.supporting_reasons || [],
    concerns: ranked.concerns || [],
  };
}

module.exports = {
  jobToAiInput,
  candidateToAiInput,
  parsedCandidateToBackend,
  aiRankedCandidateToMatchResult,
  aiEducationToBackend,
  normalizeSkills,
};
