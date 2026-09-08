# System-level full review

Reviewed on 2026-09-08: cross-service behavior that no single-service review can see — the actual request path from a live browser through the backend and AI service and back, exercised against real local infrastructure (a real local MongoDB, a real embedding model, a real Chromium-family browser), not mocked or stubbed at any layer.

This sits alongside the three per-service reviews (`review/backend/`, `review/ai-service/`, `review/frontend/`), each already complete. This folder records only what emerged from actually running the whole stack together: one high-priority cross-service bug in the match-explanation pipeline, one broken local dev script, and a live-verification result that resolves an open question the backend review had flagged.

| Priority | Count | Index |
| --- | ---: | --- |
| High | 1 | `Concerns/match-reasons-mislabeled-as-supporting.md` |
| Low / info | 1 | `Concerns/root-ai-dev-script-broken.md` |
| Verification | 1 | `Observations/cross-site-cookie-live-verified.md` |

**Status (2026-09-08):** both Concerns fixed — see each file's own Status note. The match-reasons fix is the most consequential: it spans all three services (ai-service schema, backend mapper/model, frontend rendering) as one coherent change, live-verified against the running dev stack before and after.

Start with [Methodology](Methodology.md) and [Executive summary](Executive-Summary.md).
