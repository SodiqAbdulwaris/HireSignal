# AI-service full review

Reviewed on 2026-09-08: FastAPI application startup, endpoints, schemas, parsing/OCR pipeline, embedding lifecycle, matching, logging, deployment files, dependencies, and tests.

The service has clear request schemas, deterministic matching tests, and a useful `needs_review` signal for uncertain resume parses. Before public exposure, it needs an explicit network/authentication boundary and resource limits. The host Python could not run pytest because `pytest` is not installed; this is recorded as a verification gap, not a test pass.

| Priority | Count | Index |
| --- | ---: | --- |
| High | 1 | `Concerns/internal-api-exposure.md` |
| Medium | 2 | `Concerns/upload-memory-limit.md`, `Concerns/model-readiness.md` |
| Low / info | 3 | `Decisions/`, `Observations/`, `Recommendations/` |

Read [Methodology](Methodology.md) and [Executive summary](Executive-Summary.md) first.
