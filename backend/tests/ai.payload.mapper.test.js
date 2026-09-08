const { aiRankedCandidateToMatchResult } = require('../src/mappers/ai.payload.mapper');

describe('aiRankedCandidateToMatchResult', () => {
  it('maps the AI service\'s split supporting_reasons/concerns onto separate fields', () => {
    const ranked = {
      total_score: 0.87,
      matched_skills: ['excel'],
      missing_skills: [],
      score_breakdown: { skills_score: 1, experience_score: 1, semantic_score: 0.3, education_score: 1 },
      readable_summary: 'Strong match overall.',
      supporting_reasons: ['meets or exceeds the required experience'],
      concerns: ['shows low contextual relevance to the role'],
    };

    const result = aiRankedCandidateToMatchResult(ranked, 1);

    expect(result.supportingReasons).toEqual(['meets or exceeds the required experience']);
    expect(result.concerns).toEqual(['shows low contextual relevance to the role']);
    // A concern must never end up in the supporting list, or vice versa.
    expect(result.supportingReasons).not.toContain('shows low contextual relevance to the role');
  });

  it('defaults both fields to empty arrays when the AI service omits them', () => {
    const result = aiRankedCandidateToMatchResult({ score_breakdown: {} }, 1);

    expect(result.supportingReasons).toEqual([]);
    expect(result.concerns).toEqual([]);
  });
});
