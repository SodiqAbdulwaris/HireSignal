# High — AI endpoints have no explicit service authentication or network boundary

**Evidence:** `app/main.py` registers `/parse/` and `/match/` without authentication or origin/network controls. `app/routers/parse.py` accepts uploaded resumes; `app/routers/match.py` accepts profile and job data.

**Impact:** If the service is publicly reachable, unauthenticated callers can consume model/CPU capacity and submit resume PII directly. This increases denial-of-service and privacy exposure independent of the backend's own controls.

**Recommendation:** Keep the service private on the deployment network and restrict ingress to the backend. If public reachability is required, add service-to-service authentication, request rate/size limits, and an explicit threat model before exposing these routes.

**Owner:** deployment and backend owners. **Priority:** before public exposure.

**Status (2026-09-08): Partially fixed.** Added an opt-in shared-secret
`X-Service-Key` header check (`app/core/auth.py`, enforced on both
`/parse/` and `/match/`), sent automatically by the backend when
`AI_SERVICE_API_KEY` is configured on both sides. Unset on either side
means no-op — this is app-level defense-in-depth, not a replacement
for network isolation. The deployment must still keep the AI service
off the public network; that half of the recommendation is unchanged.
