# Full system review — index

Four reviews, all dated 2026-09-08, covering the whole HireSignal stack (React/Vite frontend, Node/Express backend, Python/FastAPI ai-service) as it stands after the Graphite redesign landed on `main`. Read in this order:

1. **[system/2026-09-08-full-review/](system/2026-09-08-full-review/)** — cross-service findings from actually running the stack together and driving it from a real browser. Read this one last if you want the punchline first, or first if you want the most consequential findings before the per-service detail.
2. **[backend/2026-09-08-full-review/](backend/2026-09-08-full-review/)** — Express routes, controllers, models, middleware, deployment config, dependency audit.
3. **[ai-service/2026-09-08-full-review/](ai-service/2026-09-08-full-review/)** — FastAPI app, parsing/OCR pipeline, embedding lifecycle, matching, deployment config.
4. **[frontend/2026-09-08-full-review/](frontend/2026-09-08-full-review/)** — routing, auth forms, API client, accessibility, responsive behavior, dependency audit, plus one live-reproduced High finding (`Concerns/auth-form-state-leaks-across-tabs.md`) found during the live walkthrough that fed into the system review.

## Combined priority count

| Priority | Backend | AI service | Frontend | System | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| High | 1 | 1 | 2 | 1 | 5 |
| Medium | 2 | 2 | 2 | 0 | 6 |
| Low / info | 3 | 3 | 5 | 1 | 12 |

## The five High findings, in one place

1. **Backend** — 11 production dependency vulnerabilities (7 high), including Axios, FormData, Mongoose, Nodemailer, Express-chain packages. `review/backend/.../Concerns/dependency-vulnerabilities.md`
2. **AI service** — `/parse/` and `/match/` have no authentication or network boundary; must stay backend-only until that's added. `review/ai-service/.../Concerns/internal-api-exposure.md`
3. **Frontend** — `react-router`, a shipped runtime dependency, carries 5 advisories including an unauthenticated DoS and a CSRF bypass. `review/frontend/.../Concerns/react-router-dependency-vulnerabilities.md`
4. **Frontend** — the Sign in / Create account tabs share unreset form state; a user switching tabs can silently register or sign in with a password that's the masked concatenation of two different things they typed. Live-reproduced by directly inspecting the resulting bcrypt hash. `review/frontend/.../Concerns/auth-form-state-leaks-across-tabs.md`
5. **System** — the AI service's match-explanation generator mixes positive and negative-toned reasons in one unlabeled list; the frontend renders the whole list under a hardcoded "What supports this match" heading, so a negative signal on an otherwise-strong match is shown to the recruiter as if it supports the match. Live-reproduced against a real scored result. `review/system/.../Concerns/match-reasons-mislabeled-as-supporting.md`

None of these five are hypothetical — each was either statically confirmed with cited evidence or, for #4 and #5, directly reproduced against a real running instance of the app during this review.

## Status (2026-09-08): everything above is fixed

Every Concern and Decision across all four reviews has a code fix in place, each verified with its own tests (and, for the two live-reproduced bugs, re-confirmed against the running dev stack) — see each finding's own file for the specific Status note and what was and wasn't covered. One residual item is deliberately deferred rather than fixed blind: the backend's `express`→`qs` dependency chain needs an Express 5 migration, a real breaking change that warrants its own dedicated pass rather than a same-session bundled fix — reasoning in `backend/.../Concerns/dependency-vulnerabilities.md`.

Two fixes went beyond what the original static review found, surfaced only by actually running the app and by writing the tests the review recommended:
- **Auth form state leak** (frontend) — switching between Sign in and Create account without clearing the password field let a user silently register with a masked, corrupted password. Found live, reproduced by inspecting the resulting bcrypt hash.
- **Token-refresh deadlock** (frontend) — the request that triggers a 401 token refresh never got retried after a successful refresh; only a second, genuinely concurrent request masked it. Found while adding the test coverage the review itself recommended for this exact code path.
