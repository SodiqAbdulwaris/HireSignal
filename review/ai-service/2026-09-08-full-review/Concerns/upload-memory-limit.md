# Medium — upload size is checked after the full body is read

**Evidence:** `app/routers/parse.py` calls `await file.read()` and only then compares `len(contents)` with `MAX_FILE_SIZE_MB`.

**Impact:** A client can make the process allocate a large in-memory body before the configured resume limit is applied. Concurrent oversized requests can exhaust memory despite the later validation error.

**Recommendation:** Enforce a request-body limit at the proxy/server boundary and stream/read uploads in bounded chunks. Keep the current content-length/parsed-size check as defense in depth.

**Owner:** AI-service maintainer. **Priority:** before untrusted public traffic.

**Status (2026-09-08): Partially fixed.** `parse_resume()` now reads
the upload in 1MB chunks and aborts as soon as the running total
exceeds `MAX_FILE_SIZE_MB`, bounding worst-case memory to roughly one
chunk past the limit instead of the full body. The proxy/server-level
request-body limit this finding also recommended is still a deployment
configuration step, not something the application code can enforce.
