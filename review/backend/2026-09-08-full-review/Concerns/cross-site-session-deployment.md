# Medium — cross-site refresh cookies require browser validation

**Evidence:** `backend/src/controllers/auth.controller.js` issues a refresh cookie; `frontend/src/lib/api.js` sends requests with `credentials: "include"`. The configuration now supports `SameSite=None` and `Secure=true` for a hosted API and separate frontend origin.

**Impact:** Some browsers block third-party cookies even when CORS and cookie attributes are correct. Access-token refresh can fail after expiry for a LAN or public frontend hosted on a different site than the API.

**Recommendation:** Before deployment, choose a same-site frontend/API topology where possible. Otherwise test Chrome, Safari, and Firefox with the intended public origin; define the UX when silent refresh is blocked and confirm whether users will be required to sign in again.

**Owner:** product and deployment owner. **Priority:** before launch.

**Status (2026-09-08): Partially addressed.** Added a startup warning
in `app.js` when `AUTH_COOKIE_SAME_SITE=none` in production, pointing
back at this file. Also live-verified locally (see
`review/system/2026-09-08-full-review/Observations/cross-site-cookie-live-verified.md`):
in a Chromium-family browser, sign-in/refresh/sign-out worked correctly
over `http://localhost` with these settings, because Chromium treats
`localhost` as a secure-context exception. That is a partial answer,
not the full one — the real public origin still needs testing in
Chrome, Safari, and Firefox before launch, exactly as this finding
originally recommended.
