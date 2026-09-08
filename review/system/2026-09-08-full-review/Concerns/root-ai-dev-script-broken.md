# Low — the documented root dev script cannot start the AI service

**Evidence:** `package.json:10` (repo root) defines `"ai": "python -m uvicorn main:app --reload --app-dir ai-service"`. There is no `ai-service/main.py`; the actual FastAPI app is `ai-service/app/main.py`, importable as `app.main:app`. `ai-service/railway.toml:6` records the correct command (`uvicorn app.main:app --host 0.0.0.0 --port $PORT`), so the fix is already known and used for the real deployment — it just never made it into the root script. Reproduced live on 2026-09-08: running the documented command produces `ERROR: Error loading ASGI app. Could not import module "main".` and exits without starting.

**Impact:** `npm run dev` (root) runs `concurrently` across `backend`, `frontend`, and `ai`; the AI service silently fails to start while the other two keep running, so a new contributor following the documented setup gets a working app that can post jobs but can never run matching or parse a resume, with no obvious signal pointing at this specific script as the cause.

**Recommendation:** Change the root script to `"ai": "python -m uvicorn app.main:app --reload --app-dir ai-service"`, or run it from within `ai-service/` directly. Also confirm the `install:all` script's `pip install -r ai-service/requirements.txt` and this script agree on how the AI service's working directory is expected to resolve `.env.local` (see `ai-service/app/config/settings.py`'s `env_file=f".env.{APP_ENV}"`, which resolves relative to the process's actual working directory, not `--app-dir`).

**Owner:** repo maintainer. **Priority:** low — affects local onboarding only, not the deployed service.

**Status (2026-09-08): Fixed.** Corrected to `cd ai-service && python
-m uvicorn app.main:app --reload`, which also fixes `.env.local`
resolution as a side effect (Settings looks for `.env.{APP_ENV}`
relative to the process's working directory).
