# HireSignal: clear and precise

Status: design proposal for review, not production implementation.
Branch: codex/frontend-redesign, created from local main.

## Agreed brief
Professional, approachable and informative. Job seekers use phones and laptops, with phone usage expected to dominate. Recruiters primarily use desktop. Show information needed for the next decision; keep secondary evidence available without overwhelming the screen.

## Audit evidence and limits
The authentication screen was inspected in the running browser in its current dark appearance. The centered form, generic screening subtitle and empty surrounding space offer little product context. Registration intent needs to explain what each role enables. Improve input feedback and password visibility rather than adding decorative motion.

CandidateBrowse and JobCard use repeated cards, truncated descriptions, skill pills and two competing actions. Requirements are available but scanning across cards is difficult. Replace this with structured rows and persistent detail on desktop; a dedicated detail view with back navigation on mobile.

MatchView and MatchResultCard emphasize medal-like gradients, rank watermarks, a large total score and repeated score boxes. Relevant reasoning is collapsed. Replace ranking decoration with visible matched/missing skills and a concise explanation, with the numerical breakdown available on demand. Missing skills mean not found in the profile, not proof that the person lacks them.

Signed-in screens were audited from source, not a live authenticated session. No accounts or candidate records were created or modified. Before production changes, verify current candidate and recruiter flows with authorized local test accounts.

## Proposal
Open prototype.html through the local preview. Switch between authentication, job discovery and applicant review; toggle the 390px phone frame. All content is fictional. Role selection, password visibility, row selection, sample search and evidence expansion are interactive. Navigation labels are illustrative. Submission and shortlist actions demonstrate feedback only.

Palette: #FAFBF8 canvas, white content surfaces, #202721 text, #284B38 primary accent, #D9DDD5 dividers. Keep green limited to actions and selected states. Use one existing Geist family in implementation, 16px body on mobile, 13-14px supporting metadata, 30-38px page headings. The standalone prototype uses a system sans-serif fallback. Use 6px controls, 9px grouped panels, no ornamental gradients, and restrained motion honoring reduced-motion preferences. Retain a deliberate dark theme in the eventual rollout.

Desktop: constrained reading width; list/detail layout; consistent metadata positions. Mobile: single column; visible back action; preserved list position; labeled navigation; minimum 44px touch targets; no essential hover information. Authentication has contextual side content on desktop and a concise form-first mobile layout. Existing sign-in, recovery and verification flows remain required even though registration is the representative proposal.

## Data contract
Available in JobRequirement: title, description, required/preferred skills, required experience, education, open status, timestamps and last matching time. Company, location, work arrangement, salary, deadline and employment type are not dedicated fields. Do not infer them or invent them in live UI. A later explicit backend phase would add validated optional fields to posting, storage and responses. Prototype acknowledges missing information.

Available in MatchResult: candidate reference, total and component scores, matched/missing skills, reasons, explanation, shortlist flag and ranking. Candidate profile fields need endpoint population verification during implementation. Do not manufacture explanations when missing.

Applications support pending, reviewed, shortlisted and rejected, plus application and record timestamps. Do not promise interviews, offers or stage-history timestamps without new backend support. A record update timestamp is not automatically a stage-change timestamp. Pagination means loaded counts cannot be presented as total counts. Search in this prototype covers three sample records only; production search must explicitly handle server pagination.

## Rollout after review
1. Foundations and app shell: spacing, type, neutral palette, focus, responsive navigation and theme tokens.
2. Auth: role-aware registration, semantic forms, password visibility, inline errors, sign-in, verification and recovery. Preserve existing API contracts.
3. Candidate: job list/detail, application confirmation, application states, resume/profile clarity. Preserve route and scroll state.
4. Recruiter: role list, evidence-led review, shortlist feedback, pipeline and analytics consistency.
5. Supporting screens: support, admin and account settings; place destructive account actions in settings.
6. Optional data enrichment as a separately scoped backend change.

## Acceptance checks
Review at 390px and 1440px, then 320px, 768px and 200% zoom. No horizontal page overflow; readable focus, keyboard navigation, programmatic labels, announced feedback, usable touch targets, reduced motion and adequate contrast. Preserve all existing auth and hiring behavior. Cover loading, empty, missing-data, request failure and long-content states. Run frontend build and relevant existing interaction tests after implementation; verify candidate application, recruiter review and authentication end to end. Update graphify after production code changes if the command is available.

## Review decision
Confirm the overall visual density and hierarchy using the prototype before implementing production components. No new public marketing page is included in this initial scope.

## Implementation checkpoint — 2026-09-07
The user confirmed the direction and implementation proceeded on codex/frontend-redesign. Core changes are now in the frontend: neutral shared tokens with both themes, auth context and registration intent, semantic labeled forms and password visibility, job list/detail browsing, loaded-role search, resume prerequisite guidance, structured recruiter roles, evidence-first candidate review, account menu, focus styles, touch targets, role-loading feedback and main landmarks. No API schema changes were made. Existing backend/src/app.js and redesign-notes/00-overview.md edits were preserved.

The supporting pages inherit shared styling and layout updates; their individual workflows have not all received bespoke redesigns. Salary/company/location enrichment remains outside this implementation. Search is explicitly scoped to loaded results when pagination is present.

Development component review: http://127.0.0.1:5173/design-review.html. This renders actual components with fictional records and local-only shortlist state. The normal app is at http://127.0.0.1:5173/. The development review entry is not an input to the production build.

Validation: production build passed; 11 frontend tests passed, covering existing verification gating and match empty states plus registration intent, password visibility, job selection/filter pagination, resume prerequisite, confirmed application submission and shortlist callback. The application confirmation test exposed a React 18 ref warning in the existing dialog overlay; forwarding the ref resolved it. Browser inspection covered live auth and fixture-backed job/evidence components; 390px mobile job selection correctly hides the list and opens detail, 1440px shows both columns, and 320px evidence detail has no horizontal page overflow. These are focused responsive checks, not a complete accessibility audit. Live authenticated backend end-to-end validation remains outstanding.

`graphify update .` was attempted but the command is unavailable on PATH; no graphify-out/graph.json was present. No graph files were generated. No deployment, commit or merge was performed.


## Palette revision — Graphite
User selected Graphite after reviewing the implementation. Current light palette: #FAFAFA canvas, white surfaces, #242424 text, #262626 primary buttons, neutral gray selection and borders. Dark palette: #171717 canvas, #222222 surfaces, #EBEBEB primary actions, #B5B5B5 supporting text. Shared charts and default avatars are neutral too. Semantic success, warning and error colors remain available to communicate status. This supersedes the original forest palette; layout and interaction behavior are unchanged.

## Second screen pass
Redesigned Applications, Profile, Resume Library and Pipeline using graphite. Applications explain current statuses and confirm withdrawal; profile sections distinguish missing information; resume processing states explain next steps and accurately describe default-file behavior; pipeline supports filtered list/board views, labeled controls and scoped bulk updates. Added fictional local-only previews for all four screens.
Validation: frontend build and all 15 tests passed. Checked mobile applications/profile/resumes/pipeline and desktop pipeline. Live backend flows remain unverified. Graphify update was attempted but the command remains unavailable.
Working preference: keep token usage low, avoid redundant checks and large tool output. User allows delegation to Cursor/Antigravity and other agents. Check current hardware capacity before local-model use; do not overload the laptop. No extra agents or local models were started for this finishing pass.

## Third screen pass
Job posting now separates role details from publishing guidance and uses native form validation. Analytics shows neutral stage/score distributions with explicit explanations of their meaning. Support includes troubleshooting guidance and account context; the account menu identifies the workspace. Preview adds Post, Analytics and Support tabs using local-only callbacks. Frontend build and 17 tests passed; preview responds successfully. This pass was not visually inspected in the browser; live backend validation remains outstanding. Graphify remains unavailable. No new dependencies or agents were installed.

## Auth and plain-language matching
Graphite remains the style for all screens, including authentication. Added the actual auth form to the local component preview with isolated callbacks (no account or email operations). Job posting now uses plain examples and offers standard matching, skills focus, experience focus or custom importance choices. Custom priorities normalize automatically; all-zero priorities are blocked. Standard mode omits weights so the server retains control of platform defaults. Percentages are available only in an optional explanation. Production API contracts remain unchanged.

## Matching simplified further
Removed custom priorities and percentage explanations. Posting now has one optional dropdown: usual balance, right skills, or more work experience. Default leaves platform settings unchanged. This supersedes the previous custom-importance design.

## Recovery and admin pass
Recovery, reset and verification now share the graphite auth layout, clear next-step copy, labeled inputs and explicit return/sign-in actions. Removed timed redirects. Reset supports password visibility and missing-link recovery. Admin overview uses restrained metrics; tables use consistent spacing; platform defaults show percentages and handle unavailable settings without crashing. Preview includes recovery, reset, verification and admin statistics with local-only callbacks; a screen selector replaces the increasingly long tab strip.
Validation: production build and all 22 tests passed; preview module responds successfully. No new browser visual audit or live backend verification was performed in this pass. Graphify remains unavailable.
