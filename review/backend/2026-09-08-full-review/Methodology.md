# Methodology

The review used static inspection of the Express application, route registration, auth and validation middleware, MongoDB models, upload handling, mail and AI clients, environment/deployment configuration, and Jest tests. It also ran `npm audit --omit=dev --json` on 2026-09-08.

Severity reflects practical impact in the intended hosted-API deployment: High requires prompt remediation before public launch; Medium requires an owner and deployment decision; Low/Info improves maintainability or observability. Findings cite paths and behavior rather than reproducing secrets or exploit steps.
