# Observation — consistent loading/error/empty state handling and role gating

Every data-driven view checked (`ResumeUpload`/`ResumeLibrary`, `MatchView`, `Pipeline`, `PostJobView`'s `JobForm`, `AuthPage`'s `AuthForm`) follows the same pattern: a local `error`/`message` pair fed through the shared `Alert` component, a `busy`/`loading` flag disabling the triggering control, and an explicit empty state with actionable copy (e.g. "No match results yet. Run AI matching to rank candidates.", distinguished from "AI matching ran, but no candidates matched"). Backend failures surface `result.message` to the user rather than failing silently — the concern the backend/ai-service reviews raised about AI-service and deactivated-account failures reaching the UI is largely addressed at the component level, contingent on the backend continuing to populate `message` on every error response.

Route-level role separation in `frontend/src/App.jsx` is also clean: `AppRoutes` branches once on `user.role` and only registers that role's routes, so a candidate navigating directly to a recruiter URL hits the role's own catch-all redirect rather than a route that happens to render recruiter UI. This is client-side only and does not substitute for backend authorization (already covered in the backend review), but it is a sound first layer.

These patterns should be preserved as new screens are added.
