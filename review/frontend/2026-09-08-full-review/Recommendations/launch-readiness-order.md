# Recommendations — launch readiness order

1. Upgrade `react-router-dom` to resolve `react-router` to `>=7.18.2`, then rerun `npm run build` and `npx vitest run` and re-verify the role-gated route tree.
2. Gate `ErrorBoundary`'s raw error text behind `import.meta.env.DEV` so production users never see internal error strings.
3. Add tests for account deletion, admin activate/deactivate, resume upload, and the `apiCall` refresh/retry/logout interceptor in `lib/api.js` — currently the least-covered high-consequence paths.
4. Decide and document the `VITE_API_BASE_URL` build-time contract (fail-fast vs. documented fallback), matching the backend review's open cross-site-cookie decision since this frontend always sends `credentials: "include"`.
5. Remove the unused shadcn scaffold files (`alert.jsx`, `badge.jsx`, `card.jsx`, `dropdown-menu.jsx`, `input.jsx`, `progress.jsx`, `select.jsx`, `tabs.jsx`, `textarea.jsx`) or formally adopt them in place of the custom `ui/*.jsx` equivalents.
6. Move build tooling (`vite`, `tailwindcss`, `@tailwindcss/vite`, `@vitejs/plugin-react`, `shadcn`) to `devDependencies` so future `npm audit --omit=dev` runs report shipped-runtime risk cleanly.
