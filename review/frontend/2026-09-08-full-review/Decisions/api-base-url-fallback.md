# Decision — silent localhost fallback for the API base URL

**Evidence:** `frontend/src/lib/api.js:1` — `const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";`. `.env.example` documents the variable, but nothing in the build (`npm run build`) fails or warns if `VITE_API_BASE_URL` is absent; the build simply bakes in the localhost fallback.

**Question:** Should a production build that omits `VITE_API_BASE_URL` fail fast (so a misconfigured deployment is caught at build time), or is the current silent fallback to `localhost:5000` acceptable given the deployment process is expected to always set it?

**Recommendation:** Add a small build-time check (e.g. in `vite.config.js` or a `prebuild` script) that fails the build when `VITE_API_BASE_URL` is unset outside local development, so a missing environment variable cannot ship a build that talks to `localhost` in production.

**Owner:** frontend maintainer and deployment owner.

**Status (2026-09-08): Resolved.** `vite.config.js` now throws during
`vite build` when `VITE_API_BASE_URL` is unset, pointing at
`.env.example`. `vite dev` is unaffected. Verified: build fails with a
clear message when unset, succeeds when set.
