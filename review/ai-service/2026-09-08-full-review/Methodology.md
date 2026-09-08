# Methodology

The review statically inspected FastAPI startup and middleware, routers, Pydantic schemas, parsers and extraction utilities, embedding and matching services, settings, tests, requirements, and Railway/Nixpacks deployment files.

`py -3 -m pytest` was attempted on 2026-09-08 but the available host Python lacked the `pytest` module. No claim is made about current runtime test health. Severity reflects a service that should remain internal to the backend unless explicitly hardened for public access.
