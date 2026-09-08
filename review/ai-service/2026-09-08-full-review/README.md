# AI-service full review

Reviewed on 2026-09-08: FastAPI application startup, endpoints, schemas, parsing/OCR pipeline, embedding lifecycle, matching, logging, deployment files, dependencies, and tests.

The service has clear request schemas, deterministic matching tests, and a useful `needs_review` signal for uncertain resume parses. Before public exposure, it needs an explicit network/authentication boundary and resource limits. The host Python could not run pytest because `pytest` is not installed; this is recorded as a verification gap, not a test pass.

**Status (2026-09-08):** pytest gap closed (35 tests now run and pass on this host). All three Concerns and the Decision have code fixes — see each file's own Status note: an opt-in shared-secret auth boundary, chunked upload reads bounding memory, a real `/health` readiness check, and removal of the unused Mongo setting. The service still needs to stay off the public network per its own deployment topology.

| Priority | Count | Index |
| --- | ---: | --- |
| High | 1 | `Concerns/internal-api-exposure.md` |
| Medium | 2 | `Concerns/upload-memory-limit.md`, `Concerns/model-readiness.md` |
| Low / info | 3 | `Decisions/`, `Observations/`, `Recommendations/` |

Read [Methodology](Methodology.md) and [Executive summary](Executive-Summary.md) first.
