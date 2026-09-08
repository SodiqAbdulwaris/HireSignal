# High — production dependency vulnerabilities

**Evidence:** `backend/package-lock.json`; `npm audit --omit=dev --json` on 2026-09-08 reported 11 production vulnerabilities: 7 high and 4 moderate. Directly used packages include affected Axios, FormData, Mongoose, Nodemailer, and Express dependency chains.

**Impact:** Known issues include denial-of-service, prototype-pollution, SSRF/trust-boundary, and message-construction risks. The backend processes multipart uploads and makes server-side HTTP requests, increasing the value of timely upgrades.

**Recommendation:** Upgrade direct dependencies to patched releases, regenerate the lockfile, run the complete Jest suite, and retain a CI dependency audit. Treat Nodemailer’s major-version upgrade as a separately tested compatibility change.

**Owner:** backend maintainer. **Priority:** before public deployment.
