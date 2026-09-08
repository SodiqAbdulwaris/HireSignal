# High — negative match reasons are presented as supporting evidence

**Evidence:** `ai-service/app/services/explanation_service.py:1-41` (`build_explanations`) appends both positive-toned strings ("Demonstrates a strong skills match for the role", "meets or exceeds the required experience") and negative-toned strings ("Shows weak skills alignment with the job requirements", "falls below the required experience level", "shows low contextual relevance to the role", "does not fully meet the requested education level") into one flat `reasons` list, with no field distinguishing which is which. `frontend/src/components/recruiter/MatchResultCard.jsx:13-14` renders that entire list, unfiltered, under a hardcoded heading: `<h3>What supports this match</h3>`.

Reproduced live on 2026-09-08 against a real match: a candidate scoring 0.87 overall (skills 1.0, experience 1.0, education 1.0, semantic <0.5) had this exact text rendered under "What supports this match": *"Demonstrates a strong skills match for the role. Possesses key skills like customer service, excel. Meets or exceeds the required experience. **Shows low contextual relevance to the role.** Satisfies the education requirements."*

**Impact:** This is the evidence-first review UI the frontend redesign was specifically built around (per `redesign-notes/clear-precise/plan.md`'s stated goal to "replace ranking decoration with visible matched/missing skills and a concise explanation"). Presenting a negative signal as if it supports the match actively misleads the recruiter reading it — worse than showing no explanation at all, because it reads as confirmed positive evidence. Any candidate with one weak sub-score alongside otherwise-strong ones will trigger this.

**Recommendation:** Have `build_explanations` return each reason tagged with its polarity (e.g. a list of `{text, supports: bool}` or two separate lists), and have the API response and `MatchResultCard` render "What supports this match" and something like "Worth reviewing further" as two distinct sections. This is a schema change to the match response (`MatchResult.reasons`), so coordinate with the backend/ai-service contract and update both services' tests together.

**Owner:** AI-service and frontend maintainers jointly (the fix spans the service boundary). **Priority:** before public deployment — this affects every match result with a mixed score profile, which will be common in practice.

**Status (2026-09-08): Fixed.** `build_explanations()` now returns
`(supporting_reasons, concerns)` as two separate lists; the
`RankedCandidate` schema, the backend mapper/model, and
`MatchResultCard` all follow the same split — concerns render under a
new "Worth reviewing further" section instead of mixing into the
supporting-evidence list. Verified with unit tests in all three
services and, live, by re-running matching against the running dev
stack and confirming the concern moved to its own section.
