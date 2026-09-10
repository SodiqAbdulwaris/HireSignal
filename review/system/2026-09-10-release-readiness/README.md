# Release-readiness review — 2026-09-10

## Verdict

**Do not deploy yet.** The application code builds and its current automated tests pass, but the production release contract is incomplete and the CI build is presently misconfigured.

## Evidence collected

| Check | Result |
| --- | --- |
| Frontend production build | Passes when `VITE_API_BASE_URL` is supplied |
| Frontend tests | 41 passed |
| Backend tests | 45 passed |
| AI service tests | 35 passed |
| Frontend production dependencies | 0 advisories |
| Backend production dependencies | 2 moderate `qs` advisories through Express |
| Browser check | The local sign-in screen loaded and exposed usable controls. The browser automation session then lost its tab binding, so no authenticated, end-to-end manual workflow was claimed as verified. Component tests cover candidate, recruiter, and admin views. |

## Release blockers

1. **CI cannot build the frontend.** `frontend/vite.config.js` correctly rejects a production build without `VITE_API_BASE_URL`, but `.github/workflows/ci.yml` runs `npm run build` without providing it. Add a non-secret CI value such as `VITE_API_BASE_URL=https://api.invalid.example/api/v1`; Vercel must receive the real Railway API URL as a production build variable.
2. **No production topology is configured.** There is no Vercel project/configuration or Railway service linkage in the repository, and no public frontend/API URLs were supplied. Railway needs three services/resources: MongoDB, backend, and AI service. The backend requires the actual MongoDB URL, a strong unique `JWT_SECRET`, the AI service URL, matching `AI_SERVICE_API_KEY` values for backend/AI service, and exact frontend/CORS origins. Vercel requires `VITE_API_BASE_URL` pointing at the backend's `/api/v1` URL.
3. **Email is unsafe to leave unconfigured in production.** With neither Resend nor SMTP configured, `backend/src/services/email.service.js` reports successful delivery while placing full verification and password-reset URLs in application logs. Configure a real mail provider and sender before exposing registration or recovery, or make the no-provider branch fail outside local development.
4. **Backend dependency advisories remain.** `npm audit --omit=dev` reports two moderate `qs` denial-of-service advisories via Express. Upgrade Express/the lockfile and rerun the backend suite before release; do not use a blind audit fix on this auth/API service.

## Required public-origin validation after configuration

1. Deploy AI service privately on Railway; verify `/health` is ready after the embedding model loads.
2. Deploy backend on Railway; verify `/health`, CORS, email delivery, and authenticated parse/match calls.
3. Deploy frontend on Vercel with the final API URL.
4. In Chrome, Safari, and Firefox, verify register, email verification, login, refresh after navigation, logout, resume upload, matching, and password reset. This matters because hosted Vercel and Railway origins require a cross-site secure refresh cookie.

## Non-blocking cleanup

- Root `npm run ai` still points Uvicorn at `main:app`; use `app.main:app` as the Railway configuration already does.
- The AI test run emits Python/FastAPI deprecation warnings. Fix during routine dependency maintenance, not as a release stopper.
