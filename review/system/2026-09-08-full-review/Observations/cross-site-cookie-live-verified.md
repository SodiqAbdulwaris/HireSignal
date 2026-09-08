# Observation — cross-site refresh cookie behavior partially validated live

`review/backend/2026-09-08-full-review/Concerns/cross-site-session-deployment.md` flagged that `SameSite=None` + `Secure=true` refresh cookies needed real-browser validation before launch, since some browsers block third-party cookies even when attributes are correct.

Live-verified on 2026-09-08 in a Chromium-family browser: with the backend's CORS origin allowlist correctly including the frontend's origin, sign-in, session persistence across multiple navigations and role switches, stage-advance, and sign-out all worked correctly over plain `http://localhost` with `AUTH_COOKIE_SECURE=true` set — Chromium treats `localhost` as a secure-context exception, so the `Secure` attribute did not block the cookie here.

This is a partial answer, not a full one: it confirms the mechanism works in principle in one browser family on `localhost`, but does **not** test a real non-localhost HTTP-vs-HTTPS mismatch, and does not test Safari or Firefox, both of which have historically been stricter about third-party/cross-site cookies than Chromium. The backend review's original recommendation — test the actual public frontend/API origins in Chrome, Safari, and Firefox before launch — still stands.
