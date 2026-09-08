# Medium — ErrorBoundary shows raw JavaScript error text to every user

**Evidence:** `frontend/src/components/ui/ErrorBoundary.jsx` renders `this.state.error.toString()` inside the crash screen unconditionally — there is no `import.meta.env.DEV` (or similar) gate distinguishing development from a production build.

**Impact:** Any uncaught render error in production shows real users a raw JS error message (potentially including internal file paths, variable names, or library internals) inside a styled "Something went wrong" card. This is an information-disclosure and polish issue, not an exploitable vulnerability, but it is unprofessional and can leak implementation detail to the public.

**Recommendation:** Gate the error-message block behind `import.meta.env.DEV`, and in production show only the generic message plus the existing Reload/Clear-Session actions. Consider also reporting the error to a logging endpoint instead of only `console.error`.

**Owner:** frontend maintainer. **Priority:** before public deployment.

**Status (2026-09-08): Fixed.** Gated behind `import.meta.env.DEV`.
Reporting to a logging endpoint (the recommendation's secondary
suggestion) is not implemented — no such endpoint exists in this
codebase yet. Verified with 2 dedicated tests covering both branches.
