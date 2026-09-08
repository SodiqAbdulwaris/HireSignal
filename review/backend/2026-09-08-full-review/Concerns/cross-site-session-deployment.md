# Medium — cross-site refresh cookies require browser validation

**Evidence:** `backend/src/controllers/auth.controller.js` issues a refresh cookie; `frontend/src/lib/api.js` sends requests with `credentials: "include"`. The configuration now supports `SameSite=None` and `Secure=true` for a hosted API and separate frontend origin.

**Impact:** Some browsers block third-party cookies even when CORS and cookie attributes are correct. Access-token refresh can fail after expiry for a LAN or public frontend hosted on a different site than the API.

**Recommendation:** Before deployment, choose a same-site frontend/API topology where possible. Otherwise test Chrome, Safari, and Firefox with the intended public origin; define the UX when silent refresh is blocked and confirm whether users will be required to sign in again.

**Owner:** product and deployment owner. **Priority:** before launch.
