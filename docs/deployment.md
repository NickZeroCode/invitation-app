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
- Required env vars: `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`,
  `CSRF_TRUSTED_ORIGINS`, `CORS_ALLOWED_ORIGINS`, `DATABASE_URL`,
  `DJANGO_SETTINGS_MODULE`, plus object storage credentials
  `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`, `AWS_STORAGE_BUCKET_NAME`
  (this project: `invitation-app`) and usually `AWS_S3_ENDPOINT_URL` /
  `AWS_S3_REGION_NAME`.
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
Media (cover images) goes to an S3-compatible store (AWS S3, Cloudflare R2,
MinIO, **Neon object storage**) via `django-storages`
(`STORAGES["default"] = storages.backends.s3.S3Storage` in
`config/settings/prod.py`). The reference setup is Neon object storage:

- Bucket: required `AWS_STORAGE_BUCKET_NAME` (this project: `invitation-app`;
  the endpoint can hold several buckets, so there is no default).
- Endpoint/region: `AWS_S3_ENDPOINT_URL` + `AWS_S3_REGION_NAME`; the
  boto3-native `AWS_ENDPOINT_URL_S3` / `AWS_REGION` spellings are accepted.
- Addressing: `AWS_S3_ADDRESSING_STYLE=path` (the default) — S3-compatible
  endpoints present a wildcard TLS cert for the bare host only, so
  virtual-hosted-style requests (`bucket.host`) fail certificate validation.
- Credentials: `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` (Neon dashboard
  → object storage credential).
- Object URLs are short-lived presigned GET links
  (`AWS_QUERYSTRING_AUTH`, `AWS_QUERYSTRING_EXPIRE=3600`) with a private
  bucket (`AWS_DEFAULT_ACL=None`) — same shape as boto3
  `generate_presigned_url("get_object", ..., ExpiresIn=3600)`.

`DATABASE_URL` query parameters are forwarded to libpq verbatim, so pooled
Neon strings with `sslmode=require&channel_binding=require` work as-is.

## CI-equivalent local verification

| Gate    | Command                                        | Expected            |
| ------- | ---------------------------------------------- | ------------------- |
| Backend | `python -m pytest -q`                          | 107 passed          |
| Backend | `python manage.py check`                       | no issues           |
| Types   | `npx tsc -b` (in `frontend/`)                  | clean, strict mode  |
| Lint    | `npm run lint`                                 | 0 errors/warnings   |
| Tests   | `npm test`                                     | 52 passed           |
| Build   | `npm run build`                                | `dist/` produced    |

## Rollback

- Frontend: Vercel instant rollback to a previous deployment.
- Backend: redeploy the previous build; DB changes are forward-only — write
  reversible migrations (`AddField`/`RemoveField` pairs) before altering
  production tables.
