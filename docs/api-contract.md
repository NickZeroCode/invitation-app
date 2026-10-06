# NickEvents — API contract (Phase 1)

Base URL: `/api` (same origin in production; the Vite dev server proxies it).

## Conventions

- **Auth**: session cookies (`credentials: 'include'`). Obtain a CSRF token
  from `GET /api/auth/csrf/` (sets the `csrftoken` cookie), then send it in
  the `X-CSRFToken` header on every `POST`/`PUT`/`PATCH`/`DELETE`.
- **Errors**: every failure uses the envelope

  ```json
  { "error": { "code": "validation_error", "message": "…", "fields": { "email": ["…"] } } }
  ```

  `code` is machine-readable, `message` is French and user-safe, `fields`
  holds per-field validation messages (`non_field_errors` for form-level
  issues). Internal exception details are never leaked.
- **Auth failures** are `401` (not `403`) with code `not_authenticated`.
- **Throttling**: login is throttled (20/min); other auth endpoints share a
  general auth throttle. `429` responses use code `throttled`.

## Endpoints

| Method | Path                       | Auth | Description                                     |
| ------ | -------------------------- | ---- | ----------------------------------------------- |
| GET    | `/api/health/`             | —    | Liveness probe: `{"status": "ok"}`              |
| GET    | `/api/auth/csrf/`          | —    | `204`, sets the `csrftoken` cookie              |
| POST   | `/api/auth/login/`         | —    | Body `{email, password}` → organizer payload    |
| POST   | `/api/auth/logout/`        | ✓    | `204`, destroys the session                     |
| GET    | `/api/auth/me/`            | ✓    | Current organizer profile                       |
| PATCH  | `/api/auth/me/`            | ✓    | Update `first_name`, `last_name`, `timezone`    |
| POST   | `/api/auth/password/`      | ✓    | `{current_password, new_password, confirm_password}` |
| GET    | `/api/dashboard/overview/` | ✓    | Organizer-scoped workspace statistics           |

### Organizer payload

```json
{
  "id": 1,
  "email": "organisateur@nickevents.cd",
  "first_name": "Néhémie",
  "last_name": "Kabongo",
  "full_name": "Néhémie Kabongo",
  "timezone": "Africa/Kinshasa",
  "date_joined": "2026-10-01T08:00:00Z"
}
```

### `GET /api/dashboard/overview/`

```json
{
  "events": { "total": 4, "upcoming": 1 },
  "invitations": { "total": 12, "active": 8, "expired": 3, "revoked": 2 },
  "responses": { "total": 7 },
  "generated_at": "2026-10-07T10:30:00Z"
}
```

Counts are computed server-side, scoped to the authenticated organizer.
`invitations.total` = active + expired + revoked (deleted invitations are
excluded everywhere).

### Error codes

| `code`                | Typical status | Notes                                  |
| --------------------- | -------------- | -------------------------------------- |
| `validation_error`    | 400            | `fields` carries per-field messages    |
| `not_authenticated`   | 401            | Session missing/expired                |
| `authentication_failed` | 401          | Login rejected ("Identifiants invalides.") |
| `permission_denied`   | 403            | Authenticated but not allowed          |
| `not_found`           | 404            |                                        |
| `method_not_allowed`  | 405            |                                        |
| `unsupported_media_type` | 415         |                                        |
| `throttled`           | 429            |                                        |
| `csrf_failed`         | 403            | CSRF token missing/mismatch            |
| `error`               | 500            | Generic ("Une erreur est survenue.")   |

Clients should branch on `code`, display `message`, and attach `fields` to
form inputs when present.
