# Methodology

Unlike the three per-service reviews (static inspection plus, where noted, isolated command runs), this review ran the entire stack together and drove it from a real browser:

- Started `backend` (Node/Express against a real local MongoDB), `frontend` (Vite dev server), and `ai-service` (FastAPI + a real `sentence-transformers` embedding model, downloaded and loaded live) simultaneously.
- Registered a fresh recruiter and a fresh candidate account through the actual UI (not seeded directly), verified both through the console-logged verification links (no SMTP configured locally), and signed in as each.
- Posted a real job as the recruiter, seeded one resume/profile/application directly in MongoDB for the candidate (the browser automation tool used for this review cannot drive a native OS file picker, so the resume-upload UI's file-selection step itself was not exercised — this is a known gap, not a pass), and ran AI matching end-to-end through to a real scored result with generated explanation text.
- Exercised sign-out/sign-in cycles, pipeline stage-advance, and the Analytics view reflecting the resulting state change, all against live network requests (inspected directly, not inferred from screenshots).

Two local environment defects were found and fixed *locally only*, in gitignored files, purely to make this live run possible — neither is a code change and neither is committed:
- `backend/.env.local` had `MONGODB_URI` pointing at port `27117` (no service listening there) instead of the actually-running local MongoDB on `27017`, and `CORS_ALLOWED_ORIGINS` did not include `http://localhost:5173`, so the frontend dev server's own requests were CORS-blocked. Both are local-only misconfigurations of a real dev environment; nothing about them reflects a defect in the shipped application, and neither line is committed.

Severity reflects practical impact the same way the other reviews calibrate it: High requires prompt remediation before public launch; Low/Info improves maintainability.
