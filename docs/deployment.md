# NickEvents — deployment topology

## Overview

Both tiers run on **Vercel**:

```
                    ┌────────────────────────────┐
  browser ────────► │ frontend (static, Vite)    │  *.vercel.app / custom domain
                    │  React SPA, French UI      │
                    └──────────┬─────────────────┘
                               │  same-origin /api/*  (or VITE_API_BASE_URL)
                    ┌──────────▼─────────────────┐
                    │ backend (Python serverless) │  Django 6.1 + DRF
                    │  api/index.py entry         │
                    └───┬────────────────────┬───┘
                        │                    │
              ┌─────────▼────────┐   ┌───────▼──────────────┐
              │ Neon Postgres    │   │ S3-compatible object │
              │ (DATABASE_URL,   │   │ storage (media —     │
              │  pooled)         │   │ Phase 2+)            │
              └──────────────────┘   └──────────────────────┘
```

## Frontend (static)

- Build: `npm run build` → `dist/` (Vite; `tsc -b` runs first and must pass).
- Framework preset: **Vite**. Output directory: `frontend/dist`.
- `VITE_API_BASE_URL` is empty by default → the SPA calls `/api/...` on its
  own origin. If the backend lives on a different Vercel project/domain, set
  it and configure CORS on the backend (`CORS_ALLOWED_ORIGINS`).

## Backend (Python serverless)

- Entry point: `backend/api/index.py` (ASGI/WSGI handler exported for
  Vercel's Python runtime), configured by `backend/vercel.json`.
- `DJANGO_SETTINGS_MODULE=config.settings.prod` in production.
- Required env vars: `DJANGO_SECRET_KEY`, `ALLOWED_HOSTS`,
  `CORS_ALLOWED_ORIGINS`, `DATABASE_URL`, `DJANGO_SETTINGS_MODULE`.
- Sessions are cookie-based (no external session store). Prod settings use
  `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`, `SameSite=None` so the
  frontend origin can send credentials cross-site (`CORS_ALLOW_CREDENTIALS`).
- Migrations run as a release step (or manually):
  `python manage.py migrate`.

## Database (Neon Postgres)

- Development uses SQLite (`backend/db.sqlite3`, gitignored) — zero local
  services.
- Staging/production set `DATABASE_URL` to a **pooled** Neon connection string
  (serverless drivers must not hold long-lived connections).
- Migrations are versioned in each app (`*/migrations/0001_initial.py`).

## Object storage (required from Phase 2)

Vercel functions are ephemeral — **never store uploads in the filesystem**.
Media (invitation designs, generated images) goes to an S3-compatible store
(AWS S3, Cloudflare R2, MinIO) via `django-storages` with env-provided
credentials. URLs are generated with short-lived signed links where privacy
matters.

## CI-equivalent local verification

| Gate    | Command                                        | Expected            |
| ------- | ---------------------------------------------- | ------------------- |
| Backend | `python -m pytest -q`                          | 30 passed           |
| Backend | `python manage.py check`                       | no issues           |
| Types   | `npx tsc -b` (in `frontend/`)                  | clean, strict mode  |
| Lint    | `npm run lint`                                 | 0 errors/warnings   |
| Tests   | `npm test`                                     | 17 passed           |
| Build   | `npm run build`                                | `dist/` produced    |

## Rollback

- Frontend: Vercel instant rollback to a previous deployment.
- Backend: redeploy the previous build; DB changes are forward-only — write
  reversible migrations (`AddField`/`RemoveField` pairs) before altering
  production tables.
