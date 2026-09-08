# HireSignal

**HireSignal** is an AI-powered resume screening and candidate matching platform that bridges the gap between job seekers and recruiters. Candidates upload their resumes and receive automatically structured profiles — extracting skills, experience, education, projects, and certifications — then apply to open positions. Recruiters post job requirements and trigger a multi-dimensional AI matching engine that ranks all applicants by their fit score, with full score breakdowns, matched/missing skills, and natural-language AI reasoning.


> 📁 **GitHub Repository**: [github.com/SodiqAbdulwaris/AI-Resume-Screener](https://github.com/SodiqAbdulwaris/AI-Resume-Screener)

Built as a school project on the MERN stack with a Python/FastAPI AI microservice.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 5 |
| Backend | Node.js + Express 4 + MongoDB (Mongoose) |
| AI service | Python + FastAPI + Uvicorn |
| Embeddings | `all-MiniLM-L6-v2` via sentence-transformers |
| Auth | JWT access token (15 min) + httpOnly refresh-token cookie (30 days) |

---

## Project Structure

```text
.
├── ai-service/
│   ├── app/
│   │   ├── config/          # Settings and central parser vocabulary
│   │   ├── core/            # Exceptions, logging, request middleware
│   │   ├── parsers/         # Contact, skills, education, experience, projects, certifications
│   │   ├── routers/         # POST /parse/  POST /match/
│   │   ├── schemas/         # Pydantic request and response shapes
│   │   ├── services/        # Parse, match, embedding, and explanation services
│   │   └── utils/           # Text extraction, section splitting, normalisation
│   ├── main.py
│   └── requirements.txt
├── backend/
│   └── src/
│       ├── config/          # Zod-validated environment loader
│       ├── controllers/     # Auth, resume, candidate, job, application
│       ├── mappers/         # Node ↔ FastAPI payload translation
│       ├── middlewares/     # Auth, error, upload (Multer), ObjectId validation
│       ├── models/          # User, Resume, CandidateProfile, JobRequirement, Application, MatchResult
│       ├── routes/          # /api/v1/ route registration
│       └── services/        # AI client (axios) and match orchestration
├── frontend/
│   └── src/
│       ├── components/      # Candidate, recruiter, layout, and UI primitives
│       ├── context/         # Auth state and localStorage session
│       ├── lib/             # API wrapper and utilities
│       ├── pages/           # AuthPage, CandidateDashboard, RecruiterDashboard
│       └── styles/          # Design system and global CSS
├── .gitignore
├── AGENTS.md
├── package.json             # Root scripts — installs and runs all services
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js (compatible with Vite 5)
- Python (3.10+ recommended)
- MongoDB running locally, or a MongoDB Atlas connection string

### Environment variables

Create `backend/.env.local` (or select another slug with `APP_ENV`, for example `.env.development` or `.env.production`):

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-resume-screener
JWT_SECRET=your-secret-here
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_TIMEOUT_MS=30000
MAX_FILE_SIZE_BYTES=5242880
FRONTEND_URL=https://app.example.com
CORS_ALLOWED_ORIGINS=https://app.example.com,http://192.168.1.25:5173
AUTH_COOKIE_SAME_SITE=none
AUTH_COOKIE_SECURE=true
```

Create `ai-service/.env.local`:

```env
MONGO_URI=mongodb://localhost:27017/ai-resume-screener
AI_SERVICE_PORT=8000
EMBEDDING_MODEL=all-MiniLM-L6-v2
HF_TOKEN=
MODEL_CACHE_DIR=app/embedding-models
MAX_FILE_SIZE_MB=5

# Optional external AI-correction fallback for sparse resume parses — see "How It Works" below.
PARSER_AI_ENABLED=false
PARSER_AI_URL=
PARSER_AI_API_KEY=
PARSER_AI_TIMEOUT_SECONDS=20.0
```

`HF_TOKEN` is only needed if the configured `EMBEDDING_MODEL` requires authentication to download from Hugging Face. See [backend/README.md](backend/README.md) for the full backend environment variable reference.

### Install

```bash
npm run install:all
pip install -r ai-service/requirements.txt
```

### Run

Start each service individually:

```bash
npm run dev --prefix backend
npm run dev --prefix frontend
python -m uvicorn main:app --reload --app-dir ai-service
```

`APP_ENV` selects slugged backend and AI-service files and defaults to `local`; Vite reads the matching mode file (`.env.local`, `.env.development`, or `.env.production`). Plain `.env` files are intentionally ignored.

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:5000/health |
| AI service | http://localhost:8000/health |

---

## How It Works

The backend owns all persistence and business logic. The AI service exposes two narrow endpoints — `POST /parse/` for resume parsing and `POST /match/` for candidate ranking — and is never called directly by the frontend.

When a candidate uploads a resume, the backend forwards the file to `/parse/`, stores the structured result as a candidate profile in MongoDB, and keeps the cleaned resume text for later matching. When a recruiter triggers a match, the backend loads all applicants for that job, builds a payload, calls `/match/`, and persists the ranked results.

Matching scores each candidate across four dimensions: skills (40%), experience (30%), semantic similarity (20%), and education level (10%).

Resume parsing always runs a heuristic/regex parser first. If the result is too sparse (missing name, contact info, skills, experience, or education) and `PARSER_AI_ENABLED=true` with a `PARSER_AI_URL` configured, the ai-service calls out to an **externally hosted** AI-correction service — not implemented in this repo — to try to fill the gaps. The default (`PARSER_AI_ENABLED=false`) means parsing is always heuristic-only. Either way, a resume that's still too sparse afterward is flagged for the candidate to review rather than silently treated as a complete profile.

## Known limitations

- **Matching weights are fixed**, not configurable per job or globally. The 40/30/20/10 split above is a hardcoded constant in `ai-service/app/services/matching_service.py`. Making it configurable is planned but not yet built.
- **No OCR**: scanned/image-only PDF resumes extract no text and are flagged for manual review rather than read.
- **English-only parsing**: resume section/skill detection is keyword-based and English-only; non-English resumes are flagged for manual review rather than misread.

---

## Team

| Person | Owns |
|---|---|
| S.A | Python/FastAPI AI service |
| Dan | Node.js/Express backend |
| Frontend dev | React/Vite frontend |
