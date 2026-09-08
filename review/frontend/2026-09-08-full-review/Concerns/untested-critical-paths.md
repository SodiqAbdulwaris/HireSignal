# Medium — critical account and auth-adjacent paths have no test coverage

**Evidence:** `frontend/tests/*.test.jsx` (22 tests across 7 files) cover auth-form gating, registration intent, password recovery, job browse/apply confirmation, application withdrawal, bulk pipeline stage-advance, and matching presets. Grepping the test suite for the underlying `frontend/src/lib/api.js` exports shows `deleteMyAccount`, `advanceApplicationStage` (single-item, non-bulk), `uploadResume`, and `silentRefresh`/the `apiCall` 401-refresh interceptor are never invoked by any test — only `deactivateAdminUser` appears, and only as an unused `vi.fn()` mock in `AdminDashboard.test.jsx`, not exercised by a click.

**Impact:** The account-deletion flow (`frontend/src/components/layout/Nav.jsx`'s `DeleteAccountDialog`), the admin activate/deactivate toggle (`frontend/src/pages/AdminDashboard.jsx`), resume upload (`frontend/src/components/candidate/ResumeUpload.jsx`), and the token-refresh-and-retry logic that keeps every authenticated request working (`apiCall` in `lib/api.js`) are among the highest-consequence code paths in the app, and a regression in any of them would likely surface only in production.

**Recommendation:** Before launch, add focused tests for: (1) account deletion success/failure and that it signs the user out, (2) admin deactivate/reactivate toggling and re-rendering the correct badge, (3) resume upload success/failure updating the library list, and (4) `apiCall`'s 401 → refresh → retry → queued-request-replay behavior, including the failed-refresh logout path.

**Owner:** frontend maintainer. **Priority:** before public deployment.

**Status (2026-09-08): Fixed, and found a real bug along the way.**
Added tests for all four paths. Writing the `apiCall` interceptor
tests surfaced a genuine deadlock, not just a coverage gap: the request
that triggers a token refresh fell through into the same queuing path
used by other concurrent requests, but the refresh's completion
notification had already fired (to an empty subscriber list) before
this request got around to subscribing to itself — its promise never
resolved. Any single API call that hit a 401 and refreshed successfully
would hang forever. Fixed in its own commit
(`fix(frontend): the request that triggers a token refresh never got
retried`) with 4 tests. Account deletion, admin toggle, and resume
upload had no such surprises — straightforward coverage additions, 9
tests total across those three.
