# High — react-router carries multiple shipped-runtime vulnerabilities

**Evidence:** `frontend/package.json` declares `react-router-dom@^7.16.0` as a direct dependency; it pulls in `react-router` 6.0.0–7.18.1. `npm audit --omit=dev --json` on 2026-09-08 reported this range affected by five advisories, two rated high: an unauthenticated denial-of-service via inefficient route matching (GHSA-chx6-hx7r-mcp5) and a CSRF bypass allowing action execution before a 400 response (GHSA-qwww-vcr4-c8h2), plus moderate open-redirect (`<Link>`/`useNavigate` backslash bypass), reflected-XSS (missing protocol validation), and an arbitrary constructor-injection issue. `fixAvailable: true`.

**Impact:** Unlike the build-tooling advisories in the same audit (`browserslist`, `esbuild`, `nanoid`, `postcss`, `vite` — all devDependency-chain packages that never ship to the browser), `react-router`/`react-router-dom` is the library that drives this app's actual client-side routing, including the candidate/recruiter/admin role gating in `frontend/src/App.jsx`. These issues are in the shipped bundle end users execute.

**Recommendation:** Upgrade `react-router-dom` to a version resolving to `react-router >=7.18.2`, rerun `npm run build` and `npx vitest run`, and re-check the role-gated route tree still behaves as expected (candidate/recruiter/admin separation, catch-all redirects).

**Owner:** frontend maintainer. **Priority:** before public deployment.

**Status (2026-09-08): Fixed.** `npm audit fix` resolved this within
the existing `^7.16.0` range — no `package.json` change, no breaking
API surface touched. Verified with the full Vitest suite and a
production build.
