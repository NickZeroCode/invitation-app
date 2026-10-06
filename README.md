# NickEvents

Invitation-creation SaaS for the DRC market — create event invitation models,
generate individual guest invitations, share them by link or image, and verify
guests via QR code. The product UI is **French (fr-FR)**.

> **Status: Phase 2 complete** — authentication, organizer workspace shell,
> dashboard statistics, the full data model, the template gallery, and the
> event model editor (content, schedule, cover, emphasis, preference
> questions, live preview). Invitation generation, sharing and QR
> verification are the next phases.

## Stack

| Layer     | Technology                                                              |
| --------- | ----------------------------------------------------------------------- |
| Frontend  | React 19 + Vite 8 + TypeScript 6 (strict) + Tailwind CSS 4 + TanStack Query 5 |
| Backend   | Django 6.1 + Django REST Framework 3.18, session-cookie auth + CSRF     |
| Database  | SQLite in development; Neon Postgres (`DATABASE_URL`) for staging/prod  |
| Hosting   | Vercel — static frontend build + Python serverless backend              |

## Repository layout

```
backend/    Django project (config/ + apps: accounts, core, templates_app,
            events, invitations, preferences)
frontend/   Vite + React workspace (design system, auth flow, pages)
docs/       API contract and deployment topology
```

## Backend — local development

```powershell
cd backend
.venv\Scripts\python.exe -m pip install -r requirements.txt   # or create the venv first
.venv\Scripts\python.exe manage.py migrate
.venv\Scripts\python.exe manage.py createsuperuser             # organizers are provisioned via /admin/
.venv\Scripts\python.exe manage.py runserver
```

The API listens on `http://localhost:8000/api/`. Tests:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest -q        # 58 tests
.\.venv\Scripts\python.exe manage.py check
```

Key backend notes:

- `AUTH_USER_MODEL = "accounts.Organizer"` — email-based login, no usernames.
- Every response uses the error envelope
  `{"error": {"code", "message", "fields"}}` with French, internals-free
  messages (`core/exceptions.py`).
- CSRF: cookie `csrftoken` + `X-CSRFToken` header. Enforced even for
  anonymous requests (`core/authentication.py`) so the login endpoint is
  protected. Bootstrap with `GET /api/auth/csrf/`.
- Sessions use `SESSION_COOKIE_HTTPONLY` + `SameSite` (Lax in dev, None +
  `Secure` in prod where the frontend is a different Vercel domain).

## Frontend — local development

```powershell
cd frontend
npm install
npm run dev        # http://localhost:5173 — proxies /api to localhost:8000
npm test           # Vitest (29 tests)
npm run lint       # oxlint
npm run build      # tsc -b (strict) + vite build → dist/
```

Key frontend notes:

- All user-facing copy lives in `src/locales/fr.ts`.
- Session bootstrap: `AuthProvider` calls `GET /api/auth/me/`; anonymous users
  are redirected to `/connexion`, authenticated users away from it.
- The API client (`src/lib/api.ts`) echoes the CSRF cookie in `X-CSRFToken`
  on every unsafe request and surfaces every failure as `ApiError` with a
  French, user-safe message.
- Seven invitation designs live in `src/templates/` (one renderer per catalog
  key) and scale from gallery thumbnail to editor preview via CSS container
  queries; template config from the API is data, never executed as code.
- Pages: dashboard (`/`), event models (`/evenements`), editor
  (`/evenements/nouveau`, `/evenements/:id`), template gallery (`/modeles`),
  settings (`/parametres`).

## Environment variables

Backend (see `backend/.env.example`):

| Variable                | Purpose                                          |
| ----------------------- | ------------------------------------------------ |
| `DJANGO_SETTINGS_MODULE`| `config.settings.dev` or `config.settings.prod`  |
| `DJANGO_SECRET_KEY`     | Required in prod                                 |
| `DATABASE_URL`          | Postgres DSN (Neon, pooled) — omitted in dev     |
| `ALLOWED_HOSTS`         | Comma-separated hostnames                        |
| `CORS_ALLOWED_ORIGINS`  | Frontend origin(s) for cross-site cookies        |
| `AWS_STORAGE_BUCKET_NAME` | Media bucket (covers, invitation images)       |
| `AWS_ACCESS_KEY_ID`     | S3-compatible access key                         |
| `AWS_SECRET_ACCESS_KEY` | S3-compatible secret key                         |
| `AWS_S3_ENDPOINT_URL`   | S3-compatible endpoint (e.g. Contabo, Scaleway)  |
| `AWS_S3_REGION_NAME`    | Bucket region                                    |
| `AWS_QUERYSTRING_EXPIRE`| Signed URL lifetime in seconds                   |

Media files (event covers, later invitation images) are stored through
django-storages in an S3-compatible object store — Vercel's filesystem is
ephemeral, so never store uploads locally in production.

Frontend (optional):

| Variable           | Purpose                                              |
| ------------------ | ---------------------------------------------------- |
| `VITE_API_BASE_URL`| Absolute API origin; empty = same origin (Vercel/proxy) |

## Deployment

Both tiers deploy on Vercel — frontend as a static build, backend as a Python
serverless function (`backend/api/index.py` + `backend/vercel.json`). Database
is Neon Postgres; media storage must be an external S3-compatible object store
(servers are ephemeral). Full details in `docs/deployment.md`; the endpoint
contract is in `docs/api-contract.md`.
