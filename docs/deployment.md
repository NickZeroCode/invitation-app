# NickEvents — deployment topology (Vercel Services)

Status: implemented in the root `vercel.json`; local gates green. The live
deployment runbook is at the end of this document.

## Overview — one Vercel project, two services, one origin

Both tiers deploy as **Vercel Services inside a single project** (the
`services` key of the root `vercel.json`). A service is a framework/runtime
component with its own root directory, and public routing happens through
top-level rewrites that dispatch to a service by name. Everything shares one
deployment and one domain, so the SPA and the API are **same-origin**.

**Production domain:** `https://www.nickevents.com` (apex `nickevents.com`
redirects). `prod.py` always trusts both hosts/origins, so the custom domain
works even when the Vercel env vars are stale; env vars can only extend the
lists.

```
 browser ──► https://<domain>
              │
              ▼
 ┌────────────────────────────────────────────────┐  one Vercel project
 │ vercel.json top-level rewrites                 │  one deployment
 │   /api/*  /admin/*  /static/*  ──► backend     │  one domain (same-origin
 │   /*                             ──► frontend  │  cookies, no CORS needed)
 │                                                │
 │   frontend service          backend service    │
 │   Vite static SPA           Django 6.1 + DRF   │
 │   (zero secrets)            config.wsgi:app    │
 └────────────────────┬───────────────────────────┘
                      │
       ┌──────────────┴───────────────┐
       ▼                              ▼
 Neon Postgres (pooled)   Neon object storage (S3 API, path-style)
```

### Why Services (not two projects)

The SPA's CSRF flow reads the `csrftoken` cookie via `document.cookie` and
sends `X-CSRFToken` on unsafe requests, with `credentials: 'include'` session
cookies. That design requires same-origin (or fragile cross-site third-party
cookies). Services give us one domain, so session/CSRF cookies use the safe
`SameSite=Lax` default and no CORS at all. The split-domain fallback is kept
documented below, and `config/settings/prod.py` still supports it via env.

### Routing semantics (verified in Vercel docs)

- The service receives the **original request path** (`GET /api/events/` is
  delivered to Django as `/api/events/`, not `/events/`).
- Routing into a service is final: once a rewrite sends a request to a
  service, that service handles the rest of the routing.
- Within a service, the framework's own routing applies (Vite static output
  with SPA fallback; Django's URLconf).

## Root `vercel.json`

| Piece | Value | Purpose |
| --- | --- | --- |
| `services.frontend` | `root: frontend/`, `framework: vite` | static SPA build (`dist/`) |
| `services.frontend.rewrites` | `/(.*)` → `/index.html` | SPA fallback so deep links (`/evenements/3`) load the router |
| `services.backend` | `root: backend/`, `framework: django`, `entrypoint: config.wsgi:application` | Django WSGI app as a Vercel Function |
| top-level `rewrites` | `/api/(.*)`, `/admin/(.*)`, `/static/(.*)` → `backend`; `/(.*)` → `frontend` | same-origin dispatch, original paths preserved |

Notes:

- The Django preset finds `manage.py` (immediately under `backend/`),
  discovers `DJANGO_SETTINGS_MODULE`, and resolves the entrypoint from
  `WSGI_APPLICATION = "config.wsgi.application"`. The explicit
  `entrypoint: config.wsgi:application` is belt-and-braces.
- `config/wsgi.py` defaults to `config.settings.prod` (fail-fast on missing
  secrets). Local `manage.py` flows default to `config.settings.dev`.
- Vercel auto-runs `collectstatic` at build (WhiteNoise-compatible) and serves
  the collected files from its CDN at `STATIC_URL` (`/static/...` routes to
  the backend service). WhiteNoise stays active only for local `vercel dev`.
- Function bundle limit is 500 MB uncompressed for Python; dependencies come
  from `backend/requirements.txt`. Nothing gitignored ships: `.env`,
  `.venv/`, `db.sqlite3`, `staticfiles/` are excluded by `.gitignore`, so no
  secret can reach a deployment through the CLI or Git.
- Body/response cap: **4.5 MB** per request/response to a function (platform
  returns 413 above it). The cover-image policy is therefore capped at
  **4 MB** (`MAX_COVER_BYTES`, backend and frontend) to stay safely inside
  multipart overhead. Media bytes themselves never traverse functions:
  uploads go through the API while the image is fetched by presigned S3 URL.

## Backend service (Django)

- Entry point: `config.wsgi:application` (`backend/config/wsgi.py`).
- Sessions are cookie-based (no external session store). Same-origin
  topology: `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`,
  `SameSite=Lax` (prod defaults).
- `DJANGO_SETTINGS_MODULE=config.settings.prod` is also set explicitly as a
  Vercel env var (documentation value; wsgi.py already defaults to it).
- Migrations run as a **release step, never at cold start** — see runbook.
- Process env vars take precedence over any local `.env` (dev-only
  convenience loader in `config/env.py`); on Vercel only process env exists.

## Environment variables (Vercel project scope)

Frontend service needs **no secrets** — leave `VITE_API_BASE_URL` unset so
the SPA calls `/api/...` on its own origin.

| Variable | Required | Value / notes |
| --- | --- | --- |
| `DJANGO_SECRET_KEY` | yes | ≥50 random chars, generated once; missing → boot fails fast |
| `DJANGO_SETTINGS_MODULE` | recommended | `config.settings.prod` |
| `DJANGO_ALLOWED_HOSTS` | yes | comma list: `www.<domain>,<domain>`; add `.vercel.app` to make preview deployments work |
| `CSRF_TRUSTED_ORIGINS` | yes | `https://www.<domain>,https://<domain>` (comma list) |
| `CORS_ALLOWED_ORIGINS` | no | same as above; only matters for the split-domain fallback |
| `DATABASE_URL` | yes | **pooled** Neon string incl. `sslmode=require&channel_binding=require` |
| `AWS_STORAGE_BUCKET_NAME` | yes | `invitation-app` |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | yes | **rotated** Neon object-storage credential |
| `AWS_S3_ENDPOINT_URL` | yes | `https://br-lively-resonance-b53rcvqv.storage.c-7.us-east-2.aws.neon.tech` (`AWS_ENDPOINT_URL_S3` spelling also accepted) |
| `AWS_S3_REGION_NAME` | yes | `us-east-2` (`AWS_REGION` spelling also accepted) |
| `AWS_S3_ADDRESSING_STYLE` | default `path` | keep `path` — mandatory for this endpoint's TLS cert |
| `DJANGO_SECURE_SSL_REDIRECT` | leave unset | defaults to `true`; only set `false` for local HTTP debugging |
| `SESSION_COOKIE_SAMESITE` / `CSRF_COOKIE_SAMESITE` | leave unset | default `Lax` (this topology); `None` only for split-domain fallback |
| `VITE_API_BASE_URL` | leave unset | empty = same-origin |

Set them with `vercel env add <NAME> production` (values typed by you in your
terminal — never pasted into chat) or the dashboard. Migrations and local
runs read the same names from `backend/.env` (gitignored).

## Database (Neon Postgres)

- Development uses SQLite (`backend/db.sqlite3`, gitignored) — zero local
  services. Production/staging use Neon via `DATABASE_URL`.
- Use the **pooled** Neon connection string (serverless instances open many
  short-lived connections). `parse_database_url` forwards all query params to
  libpq verbatim and applies `CONN_MAX_AGE=60` (idle connections are cheap to
  discard on the function side).
- Migrations are versioned in each app (`*/migrations/`), currently 25
  applied, 19 tables, 7 seeded templates.

## Object storage (Neon S3-compatible)

Vercel functions are ephemeral — **never store uploads in the filesystem**.
Cover images go to the S3-compatible store via `django-storages`
(`STORAGES["default"] = storages.backends.s3.S3Storage` in
`config/settings/prod.py`):

- Bucket `invitation-app`; endpoint/region as in the table above.
- `AWS_S3_ADDRESSING_STYLE=path` (default) — the endpoint presents a
  wildcard cert for the bare host only, so virtual-hosted style fails TLS.
- Private bucket (`AWS_DEFAULT_ACL=None`); delivery is short-lived presigned
  GET links (`AWS_QUERYSTRING_AUTH`, `AWS_QUERYSTRING_EXPIRE=3600`).
- Upload path: SPA `PUT /api/events/<id>/cover/` (multipart) → Pillow
  validation (type + 4 MB cap) → S3 `covers/%Y/%m/` → presigned URL in the
  API response.

## CI-equivalent local verification

| Gate | Command | Expected |
| --- | --- | --- |
| Backend | `python -m pytest -q` (from `backend/`, clean env) | 108 passed |
| Backend | `python manage.py check --deploy` (prod settings, probe key) | only W005/W021 (deliberate HSTS policy) + W020 until `DJANGO_ALLOWED_HOSTS` is set |
| Types | `npx tsc -b` (in `frontend/`) | clean, strict mode |
| Lint | `npm run lint` | 0 errors/warnings |
| Tests | `npm test` | 52 passed (13 files) |
| Build | `npm run build` | `dist/` produced |

Deliberate `check --deploy` deviations: `SECURE_HSTS_INCLUDE_SUBDOMAINS=False`
and `SECURE_HSTS_PRELOAD=False` — HSTS stays scoped to the exact host because
preview deployments and sibling subdomains are not under our SSL control.

## Production error monitoring

- Django `LOGGING` writes to stdout/stderr → captured per invocation in
  Vercel function logs (Observability tab). Unhandled exceptions appear there
  with tracebacks.
- API errors use one envelope everywhere:
  `{"error": {"code": "...", "message": "...", "fields": {...}}}` with proper
  4xx/5xx codes — alert on 5xx rates at the platform level.
- Health probe: `GET /api/health/` (200 JSON) for uptime monitoring.
- Recommended: enable Vercel notifications/Slack alerts for function errors;
  add an external uptime check on `/api/health/`.

## Release runbook

0. **Rotate credentials first**: the Neon DB password (`npg_…`) and object
   storage keys (`nak_live_…` / `nsk_live_…`) were pasted into a chat earlier
   and are compromised. Rotate them in the Neon dashboard, update
   `backend/.env`, and use only the **new** values on Vercel.
1. Push the repo to GitHub (the `origin` remote) — `main` must contain the
   root `vercel.json`. (Commits stay local until you push them yourself.)
2. Vercel dashboard → Add New → Project → import the GitHub repository
   (Git integration). Every push to `main` then builds and deploys
   automatically.
3. **Root Directory: leave it at the repository root** (Settings → General).
   Do NOT point it at `frontend/` or `backend/` — the root `vercel.json`
   `services` entries already define their own roots.
4. Set every variable from the table above in Settings → Environment
   Variables (scope: Production and Preview; keep them available at build
   time). Do this **before the first build**: the build runs
   `collectstatic` under `config.settings.prod`, whose fail-fast checks
   abort the build when secrets are missing.
5. Apply DB migrations before the first deploy (from `backend/`, local
   venv): `.\.venv\Scripts\python.exe manage.py migrate` against Neon.
   Never auto-migrate at boot.
6. First deploy → check the production URL: `/api/health/` returns 200
   JSON and `/admin/login/` renders. (Preview deployments may be gated by
   Deployment Protection — disable it, or test on the production domain.)
7. Live E2E over HTTPS: real password login, create an event, upload a
   cover (round-trip the presigned URL), publish an invitation, submit a
   guest response, revoke, delete.
8. If the final domain differs from what you configured, update
   `DJANGO_ALLOWED_HOSTS` / `CSRF_TRUSTED_ORIGINS` and redeploy.

Alternative — CLI flow (no Git integration): `vercel login`, `vercel link`,
`vercel env add <NAME> production` per variable, `vercel deploy`, then
`vercel deploy --prod`.

Local parity while developing: `vercel dev -L` runs both services locally
without cloud auth. Database state is the same either way (Neon), so test
writes are visible in production data — be careful.

## Rollback

- Frontend/backend: Vercel instant rollback to a previous deployment.
- DB changes are forward-only — write reversible migrations
  (`AddField`/`RemoveField` pairs) before altering production tables.
- Env var changes: restore the previous value in Vercel and redeploy.

## Split-domain fallback (two Vercel projects)

Only if Services were not available: deploy the SPA and API as separate
projects, set `VITE_API_BASE_URL` to the API origin at build time, set
`SESSION_COOKIE_SAMESITE=None` + `CSRF_COOKIE_SAMESITE=None` on the backend,
and allow the SPA origin in `CORS_ALLOWED_ORIGINS` (with
`CORS_ALLOW_CREDENTIALS`, already on). Caveat: browsers block third-party
cookies, which can break login for some users — reason enough to prefer
Services.

## Spec §18 confirmations

| # | Question | Answer |
| --- | --- | --- |
| 1 | How is Django hosted? | As a Vercel Function via the Services `backend` service (`root: backend/`, entrypoint `config.wsgi:application`), Django preset (manage.py auto-detected), Python 3.12, deps from `requirements.txt`. |
| 2 | How does Vercel communicate with the backend? | Same project, same domain: top-level rewrites route `/api/*`, `/admin/*`, `/static/*` to the backend service (original paths preserved); everything else to the frontend service. Same-origin fetch with cookies + CSRF header. |
| 3 | Environment variable split? | Frontend: none (same-origin). Backend: secrets (`DJANGO_SECRET_KEY`, `DATABASE_URL`, `AWS_*`) + host/origin lists. Full table above; set in the Vercel dashboard or via `vercel env add` — values typed by the user. |
| 4 | Database connection pooling? | Pooled Neon `DATABASE_URL` (all params forwarded to libpq) + `CONN_MAX_AGE=60`; serverless functions open short-lived connections. |
| 5 | Media upload/storage/delivery? | Multipart upload through the API (4 MB cap under the 4.5 MB platform body limit), Pillow type/size validation, private S3 bucket (path-style), delivery via presigned GET links (1 h). |
| 6 | Safe migrations? | Never at boot/cold start. Run `manage.py migrate` from a trusted local/CI step before deploying; reversible migrations; forward-only policy documented. |
| 7 | Production error monitoring? | stdout/stderr logging → Vercel function logs; uniform error envelope; `/api/health/` probe; platform error/5xx alerting. |
