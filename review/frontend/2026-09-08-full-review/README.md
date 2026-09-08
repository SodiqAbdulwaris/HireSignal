# Frontend full review

Reviewed on 2026-09-08: React Router route tree and role gating, the API client and token-refresh interceptor, auth/theme context, candidate/recruiter/admin components and pages, shared UI primitives (including the `shadcn/` wrapper components), CSS tokens and responsive breakpoints, the Vitest suite, and production dependency tree. `npm run build` and `npx vitest run` were both executed and passed; `npm audit --omit=dev` was run for dependency findings.

This review found two confirmed high-priority issues — a live-reproduced auth-form bug that silently corrupts user passwords, and a shipped-runtime dependency (`react-router`) with multiple advisories — plus two medium-priority items needing an owner decision before public deployment. Findings are sanitized; no deployed URL, credential, token, or local environment value is included.

| Priority | Count | Index |
| --- | ---: | --- |
| High | 2 | `Concerns/auth-form-state-leaks-across-tabs.md`, `Concerns/react-router-dependency-vulnerabilities.md` |
| Medium | 2 | `Concerns/error-boundary-leaks-raw-errors.md`, `Concerns/untested-critical-paths.md` |
| Low / info | 5 | `Concerns/unused-shadcn-scaffold.md`, `Decisions/`, `Observations/`, `Recommendations/` |

**Status (2026-09-08):** every Concern and Decision listed above has a code fix in place — see each file's own Status note for specifics and verification. Two fixes surfaced real, previously-undocumented bugs beyond what static review found: a live-reproduced password-corruption bug in the auth form, and a deadlock in the token-refresh interceptor found while adding the recommended test coverage.

Start with [Methodology](Methodology.md) and [Executive summary](Executive-Summary.md).
