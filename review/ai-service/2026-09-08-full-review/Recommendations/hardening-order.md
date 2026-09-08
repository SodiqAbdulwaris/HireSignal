# Recommendations — hardening order

1. Restrict the AI service to backend-only network access or add authenticated service-to-service access.
2. Enforce upload size at ingress and stream bounded reads.
3. Add a real readiness endpoint and deployment alerting for model-load failures.
4. Install dependencies in a reproducible environment and run pytest in CI; the host verification attempt could not run because pytest was absent.
5. Decide whether the service owns persistent data and remove/implement the unused database configuration accordingly.
