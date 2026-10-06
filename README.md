# NickEvents

Invitation-creation SaaS for the DRC market — create event invitation models,
generate individual guest invitations, share them by link or image, and verify
guests via QR code. The product UI is **French (fr-FR)**.

> **Status: Phase 1 complete** — authentication, organizer workspace shell,
> dashboard statistics, and the full data model. Template editing, invitation
> generation, sharing and QR verification are the next phases.

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
.\.venv\Scripts\python.exe -m pytest -q        # 30 tests
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
npm test           # Vitest (17 tests)
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

## Environment variables

Backend (see `backend/.env.example`):

| Variable                | Purpose                                          |
| ----------------------- | ------------------------------------------------ |
| `DJANGO_SETTINGS_MODULE`| `config.settings.dev` or `config.settings.prod`  |
| `DJANGO_SECRET_KEY`     | Required in prod                                 |
| `DATABASE_URL`          | Postgres DSN (Neon, pooled) — omitted in dev     |
| `ALLOWED_HOSTS`         | Comma-separated hostnames                        |
| `CORS_ALLOWED_ORIGINS`  | Frontend origin(s) for cross-site cookies        |

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
