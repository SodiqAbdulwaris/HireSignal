# HireSignal AI service

The FastAPI service reads only `ai-service/.env.<APP_ENV>` and defaults to `APP_ENV=local`. It never reads a plain `.env` file.

```bash
cp .env.example .env.local
# Edit .env.local, then run from the repository root:
python -m uvicorn app.main:app --reload --app-dir ai-service
```

Use `APP_ENV=development` for `.env.development` or `APP_ENV=production` for `.env.production`. Do not commit populated environment files; deployment platforms should supply these values through their managed environment configuration.
