# HireSignal — Backend

Express + MongoDB backend that owns persistence and business logic, and wraps the Python AI service for resume parsing and candidate matching.

## Setup

```bash
npm install
# Copy the template to the slug you want to run. APP_ENV defaults to local.
cp .env.example .env.local
# Edit .env.local with your MongoDB URI, JWT secret, public frontend URL, and allowed browser origins.
npm run dev
```

The backend reads only `backend/.env.<APP_ENV>`; it never reads a plain `.env` file. Use `APP_ENV=development` for `.env.development` and `APP_ENV=production` for `.env.production`. Deployment platforms should provide the same values as environment variables instead of committing a production file.

The server listens on `PORT` (default `5000`) and connects to MongoDB before accepting requests — if the connection fails, the process exits rather than serving broken responses.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Port the server listens on |
| `MONGODB_URI` | — (required) | MongoDB connection string |
| `JWT_SECRET` | — (required) | Secret used to sign access tokens and verification/reset JWTs. The process refuses to start if this is unset. |
| `AI_SERVICE_URL` | `http://localhost:8000` | Base URL of the AI service |
| `AI_SERVICE_TIMEOUT_MS` | `30000` | Timeout for AI service calls, in milliseconds |
| `MAX_FILE_SIZE_BYTES` | `5242880` (5MB) | Maximum resume upload size in bytes |
| `ACCESS_TOKEN_EXPIRY` | `15m` | JWT access token lifetime |
| `FRONTEND_URL` | — (required) | Canonical public HTTPS frontend origin used to build verification/reset links |
| `CORS_ALLOWED_ORIGINS` | — | Comma-separated exact browser origins allowed to call the API; include each LAN IP with its port |
| `AUTH_COOKIE_SAME_SITE` | `none` in production, otherwise `lax` | `strict`, `lax`, or `none` refresh-cookie same-site policy |
| `AUTH_COOKIE_SECURE` | `true` in production, otherwise `false` | Whether refresh cookies require HTTPS |
| `DEFAULT_PAGE_LIMIT` | `20` | Default page size for cursor-paginated list endpoints |
| `MAX_PAGE_LIMIT` | `100` | Upper bound a client can request via `?limit=` |
| `RESEND_API_KEY` | — | If set, email is sent via [Resend](https://resend.com) (takes priority over SMTP) |
| `RESEND_FROM_EMAIL` | — | From-address used with Resend; also used as a fallback for `EMAIL_FROM` |
| `SMTP_HOST` | `smtp.gmail.com` | SMTP host, used only if `RESEND_API_KEY` is unset |
| `SMTP_PORT` | `587` | SMTP port |
| `SMTP_USER` | — | SMTP username — both `SMTP_USER` and `SMTP_PASS` must be set to enable SMTP |
| `SMTP_PASS` | — | SMTP password/app-password |
| `EMAIL_FROM` | `RESEND_FROM_EMAIL` or `noreply@hiresignal.com` | From-address for all outgoing email |
| `CONTACT_FEEDBACK_TO_EMAIL` | — | Recipient address for the public `/contact` form |

If none of `RESEND_API_KEY` or `SMTP_USER`/`SMTP_PASS` are set, outgoing email (including the full verification/reset URL) is logged to the terminal instead of being sent. Registration and resend remain available, so local testing does not crash or require a mail provider.

## API Endpoints

All routes below are mounted under `/api/v1`. Interactive Swagger docs are served at `/api/docs`. A `GET /health` check exists outside the `/api/v1` prefix.

### Auth (`/api/v1/auth`)

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | — | Register a new user (rate-limited). Sends a verification email; no session is issued until the account is verified. |
| `POST` | `/login` | — | Log in (rate-limited per IP+email). Returns `403` with `needsVerification:true` if the account isn't verified yet. |
| `POST` | `/logout` | — | Clear the refresh-token cookie and invalidate it server-side |
| `POST` | `/refresh` | — | Exchange the `refreshToken` cookie for a new access token |
| `GET` | `/verify-email?token=...` | — | Verify an account from the emailed link |
| `POST` | `/resend-verification` | — | Resend the verification email (rate-limited, generic response regardless of account state) |
| `POST` | `/forgot-password` | — | Request a password reset email (rate-limited, generic response regardless of account state) |
| `POST` | `/reset-password` | — | Reset password using a reset token |
| `GET` | `/me` | Bearer | Get the current user's profile |

### Resumes (`/api/v1/resumes`)

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/` | Candidate | Upload a resume (multipart, field name: `file`) — parses it via the AI service and upserts the candidate profile |
| `GET` | `/:resumeId` | Candidate/Recruiter | Get resume metadata and parse status |

### Candidates (`/api/v1/candidates`)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/me` | Candidate | Get the logged-in candidate's own profile |
| `POST` / `PATCH` | `/me/accept-parsed-name` | Candidate | Accept the name extracted from their resume as their display name |

### Jobs (`/api/v1/jobs`)

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/` | Recruiter | Create a job requirement |
| `GET` | `/` | Optional | List jobs (paginated) — candidates/guests see open roles, recruiters see their own |
| `GET` | `/my-applications` | Candidate | List the candidate's own applications |
| `GET` | `/:jobId` | Bearer | Get a single job's details |
| `PATCH` | `/:jobId` | Recruiter | Open/close a job |
| `POST` | `/:jobId/apply` | Candidate | Apply to a job |
| `DELETE` | `/:jobId/apply` | Candidate | Cancel an application |
| `POST` | `/:jobId/match` | Recruiter | Run AI matching against all applicants |
| `GET` | `/:jobId/matches` | Recruiter | Get ranked match results (paginated, optional `?shortlisted=true`) |
| `PATCH` | `/:jobId/matches/:matchId` | Recruiter | Toggle a candidate's shortlist status |
| `GET` | `/:jobId/matches/export.csv` | Recruiter | Export match results as CSV |

### Contact (`/api/v1/contact`)

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/` | — | Submit the public contact/feedback form (rate-limited) |

**Create job example:**
```bash
curl -X POST http://localhost:5000/api/v1/jobs \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Backend Engineer",
    "description": "We are looking for...",
    "requiredSkills": ["node.js", "mongodb"],
    "preferredSkills": ["redis"],
    "requiredExperienceYears": 3,
    "requiredEducationLevel": "bachelor"
  }'
```

**Run match example:**
```bash
curl -X POST http://localhost:5000/api/v1/jobs/<jobId>/match \
  -H "Authorization: Bearer <token>"
```

## Project Structure

```
src/
├── index.js                          # App entry point
├── config/
│   └── env.js                        # Zod-validated environment loader
├── controllers/
│   ├── auth.controller.js            # Register, login, verification, password reset
│   ├── resume.controller.js          # Upload + get resume
│   ├── candidate.controller.js       # Get/update candidate profile
│   ├── job.controller.js             # Create job, apply, run match, get matches, CSV export
│   └── contact.controller.js         # Public contact form handler
├── mappers/
│   └── ai.payload.mapper.js          # All field transforms between backend ↔ AI
├── middlewares/
│   ├── auth.middleware.js            # JWT auth + role-based authorization
│   ├── upload.middleware.js          # Multer config (PDF/DOCX, configurable size limit)
│   ├── validate.middleware.js        # Zod request-body validation
│   ├── validateObjectId.middleware.js # Rejects malformed Mongo ObjectId route params
│   └── error.middleware.js           # Global error handler
├── models/
│   ├── User.js
│   ├── RefreshToken.js
│   ├── Resume.js
│   ├── CandidateProfile.js
│   ├── JobRequirement.js
│   ├── Application.js
│   ├── MatchResult.js
│   └── RecruiterProfile.js           # Defined but not yet wired into any controller/route
├── routes/
│   ├── auth.routes.js
│   ├── resume.routes.js
│   ├── candidate.routes.js
│   ├── job.routes.js
│   └── contact.routes.js
├── validations/
│   ├── auth.validation.js
│   └── job.validation.js
└── services/
    ├── ai.client.js                  # HTTP client for AI service calls
    ├── match.service.js              # Matching orchestration logic
    └── email.service.js              # Resend/SMTP/console-log email sending
```

## Key Design Decisions

- **Scores stored as 0–1 floats**: the AI service returns scores in the 0–1 range, and `MatchResult` persists them as-is (schema-enforced `min:0, max:1`). The `*100` conversion to a percentage happens only at display/export time (e.g. CSV export), never at write time.
- **Education levels**: Both sides use the same lowercase literals (`olevel`, `bachelor`, `master`, `phd`). `any` on the backend becomes `null` for the AI.
- **`raw_text` forwarding**: Every match request includes `raw_text` from `Resume.rawText` for richer AI embeddings.
- **Upsert on `{jobId, candidateId}`**: Re-running a match updates existing results rather than duplicating rows.
- **One adapter module**: All field renames live in `mappers/ai.payload.mapper.js`. Controllers never transform AI fields directly.
- **Email verification gates login, not registration**: `register()` creates the account as unverified and sends a verification email but issues no session; `login()` returns `403` until the account is verified. If no email backend is configured, verification links are logged to the console instead of sent.
- **`PARSER_AI_ENABLED`** (ai-service side): resume parsing always runs a heuristic/regex parser first. If that produces a sparse result (e.g. missing name/skills/experience) *and* `PARSER_AI_ENABLED=true` with a `PARSER_AI_URL` configured, the ai-service calls out to an **externally hosted** AI-correction service (not implemented in this repo) to try to fill the gaps. The default (`false`) means parsing is always heuristic-only. Either way, a resume that's still too sparse after this step is flagged `needs_review` rather than silently reported as a clean parse.

## Known limitations

- Matching weights (skills 40% / experience 30% / semantic 20% / education 10%) are currently hardcoded in `ai-service/app/services/matching_service.py` — there's no per-job or admin-configurable override yet. Planned, not yet built.
