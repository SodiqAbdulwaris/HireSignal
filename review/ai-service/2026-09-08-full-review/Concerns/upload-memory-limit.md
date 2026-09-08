# Medium — upload size is checked after the full body is read

**Evidence:** `app/routers/parse.py` calls `await file.read()` and only then compares `len(contents)` with `MAX_FILE_SIZE_MB`.

**Impact:** A client can make the process allocate a large in-memory body before the configured resume limit is applied. Concurrent oversized requests can exhaust memory despite the later validation error.

**Recommendation:** Enforce a request-body limit at the proxy/server boundary and stream/read uploads in bounded chunks. Keep the current content-length/parsed-size check as defense in depth.

**Owner:** AI-service maintainer. **Priority:** before untrusted public traffic.
