# High — production dependency vulnerabilities

**Evidence:** `backend/package-lock.json`; `npm audit --omit=dev --json` on 2026-09-08 reported 11 production vulnerabilities: 7 high and 4 moderate. Directly used packages include affected Axios, FormData, Mongoose, Nodemailer, and Express dependency chains.

**Impact:** Known issues include denial-of-service, prototype-pollution, SSRF/trust-boundary, and message-construction risks. The backend processes multipart uploads and makes server-side HTTP requests, increasing the value of timely upgrades.

**Recommendation:** Upgrade direct dependencies to patched releases, regenerate the lockfile, run the complete Jest suite, and retain a CI dependency audit. Treat Nodemailer’s major-version upgrade as a separately tested compatibility change.

**Owner:** backend maintainer. **Priority:** before public deployment.

**Status (2026-09-08):** 9 of 11 resolved. `npm audit fix` (no breaking
changes) resolved axios, body-parser, brace-expansion, fast-uri,
form-data, ip-address, js-yaml, and mongoose. Nodemailer was upgraded
to v10 separately (major version bump; this codebase doesn't use the
vulnerable `raw` option, but upgraded anyway per this finding's own
recommendation to treat it as a separately tested change). Full Jest
suite (43 tests) passed after both.

**Remaining, deliberately not fixed in this pass:** 2 moderate `qs`
advisories (array-limit bypass, isBuffer DoS), pulled in transitively
through `express@4.22.2` — the latest 4.x release still pins the
vulnerable `qs@~6.15.1` range; no newer 4.x resolves it. The only fix
is Express 5, a major version with real breaking changes (async
middleware error handling, `path-to-regexp` behavior, several removed
APIs) that needs its own dedicated migration and testing pass, not a
same-session bundled fix. Left open with this note rather than
attempted blind.
