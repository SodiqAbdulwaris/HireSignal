# Decision — production email delivery failure policy

**Evidence:** `backend/src/controllers/auth.controller.js` sends verification and resend mail asynchronously after returning an accepted response. `backend/src/services/email.service.js` logs messages to the terminal when no provider is configured.

**Question:** Should a configured provider failure remain indistinguishable from successful delivery (anti-enumeration friendly but hard to diagnose), or should the system persist delivery attempts and expose operational alerts?

**Recommendation:** Keep public responses generic, but add structured delivery metrics/logs and alerting for repeated provider failures. Retain terminal delivery only for explicitly local environments.

**Owner:** product/security and operations.
