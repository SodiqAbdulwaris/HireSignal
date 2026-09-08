# Recommendations — deployment readiness order

1. Upgrade audited dependencies and add dependency scanning to CI.
2. Populate ignored `.env.production` or managed deployment variables with the canonical HTTPS frontend URL and exact allowed origins.
3. Exercise registration, resend, verification, login, refresh, logout, upload, and AI failure behavior against the actual public origins in real browsers.
4. Add structured request/error and mail-delivery telemetry before accepting production traffic.
