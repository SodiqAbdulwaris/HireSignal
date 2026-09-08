# Low — unused shadcn primitives left over from initial scaffolding

**Evidence:** `frontend/src/components/ui/shadcn/` contains `alert.jsx`, `badge.jsx`, `card.jsx`, `dropdown-menu.jsx`, `input.jsx`, `progress.jsx`, `select.jsx`, `tabs.jsx`, and `textarea.jsx`. None of these nine files are imported anywhere else under `frontend/src` — the app uses hand-rolled equivalents instead (`components/ui/Alert.jsx`, `Badge.jsx`, `Tabs.jsx`, plain `<input>`/`<select>`/`<textarea>` styled via `global.css`). Only `dialog.jsx`, `button.jsx`, `avatar.jsx`, `separator.jsx`, and `skeleton.jsx` from the shadcn set are actually referenced.

**Impact:** No functional risk — dead code is tree-shaken out of the production bundle. It is maintenance noise: a future contributor may import the unused shadcn version instead of the canonical custom component, producing visually inconsistent UI.

**Recommendation:** Delete the nine unused files, or if the plan is to migrate fully onto shadcn primitives, track that as an explicit follow-up and remove the now-duplicate custom `ui/*.jsx` components instead.

**Owner:** frontend maintainer. **Priority:** housekeeping, non-blocking.

**Status (2026-09-08): Fixed.** Deleted the nine unused files after
re-confirming via grep. Bonus: the CSS bundle shrank from 85.99kB to
65.44kB (gzip 15.72kB → 12.86kB) now that Tailwind isn't scanning
their class names.
