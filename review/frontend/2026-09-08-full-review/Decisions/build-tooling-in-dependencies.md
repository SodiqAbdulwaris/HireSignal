# Decision — build tooling is listed under `dependencies`, not `devDependencies`

**Evidence:** `frontend/package.json` places `vite`, `tailwindcss`, `@tailwindcss/vite`, `@vitejs/plugin-react`, and `shadcn` under `"dependencies"`, while only the test toolchain (`vitest`, `@testing-library/*`, `jsdom`) sits under `"devDependencies"`. Because of this, `npm audit --omit=dev` — the flag the backend and ai-service reviews used to isolate genuine runtime risk — still reports build-only advisories (`browserslist`, `esbuild`, `nanoid`, `postcss`, `vite` itself) alongside the one advisory that actually ships to the browser (`react-router`, see `Concerns/react-router-dependency-vulnerabilities.md`).

**Question:** Should build tooling move to `devDependencies` so `npm audit --omit=dev` cleanly separates shipped-runtime risk from build-time risk, or is the current layout intentional (e.g. to keep a single `npm ci` step for both build and dev)?

**Recommendation:** Move `vite`, `tailwindcss`, `@tailwindcss/vite`, `@vitejs/plugin-react`, and `shadcn` to `devDependencies`. This doesn't change what `vite build` produces, but it makes future `npm audit --omit=dev` runs a more accurate signal of shipped-bundle risk.

**Owner:** frontend maintainer.

**Status (2026-09-08): Resolved.** Moved `vite`, `tailwindcss`,
`@tailwindcss/vite`, `@vitejs/plugin-react`, and `shadcn` to
`devDependencies`. `npm audit --omit=dev` now reports 0 vulnerabilities
instead of 5 unrelated build-tooling ones. Verified: build and full
Vitest suite both clean.
