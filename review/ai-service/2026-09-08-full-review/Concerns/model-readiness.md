# Medium — startup can report healthy while matching cannot run

**Evidence:** `app/main.py` catches embedding-model load errors, sets `model_ready=False`, then continues startup. `/health` returns HTTP 200 with that false flag, while `get_embedding_service` later raises when `/match/` is called.

**Impact:** An orchestrator can route traffic to an instance that cannot serve matching, causing avoidable 500 responses.

**Recommendation:** Make readiness fail with a non-2xx status until the embedding service is available, or fail process startup and let the platform restart it. Separate liveness from readiness checks.

**Owner:** AI-service/deployment owner. **Priority:** before production matching.
