# Decision — clarify the AI service’s data ownership

**Evidence:** `app/config/settings.py` requires `MONGO_URI`, but the reviewed routers and services do not use a database connection.

**Question:** Is the service intended to become stateful, or should it remain a stateless parser/matcher?

**Recommendation:** Remove the required setting if state is not planned. If persistence is planned, document the data model, retention, PII controls, migration strategy, and ownership before adding writes.
