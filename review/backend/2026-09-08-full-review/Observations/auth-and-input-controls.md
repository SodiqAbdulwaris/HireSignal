# Observation — good baseline request controls

`auth.middleware.js` validates bearer tokens and rechecks deactivated users. Route-level role authorization prevents candidate/recruiter privilege crossover. Auth/job validation schemas and auth rate limiters reduce malformed-input and credential-stuffing exposure. Upload middleware and the centralized error mapper make file/AI failures predictable to API clients.

These controls should be preserved when adding endpoints; new routes should follow the same schema-validation and authorization pattern.
