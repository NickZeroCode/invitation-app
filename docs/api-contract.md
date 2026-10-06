# NickEvents — API contract (Phase 1–2)

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
| `event_has_invitations` | 400          | DELETE refused: the event model already generated invitations |
| `error`               | 500            | Generic ("Une erreur est survenue.")   |

Clients should branch on `code`, display `message`, and attach `fields` to
form inputs when present.

## Phase 2 — templates & event models

### Endpoints

| Method | Path                              | Auth | Description                                     |
| ------ | --------------------------------- | ---- | ----------------------------------------------- |
| GET    | `/api/templates/`                 | ✓    | Read-only catalog (7 seeded templates)          |
| GET    | `/api/templates/{key}/`           | ✓    | Single template by `key` (404 otherwise)        |
| GET    | `/api/events/`                    | ✓    | List own event models (paginated, 25 per page)  |
| POST   | `/api/events/`                    | ✓    | Create an event model                           |
| GET    | `/api/events/{id}/`               | ✓    | Retrieve own event model                        |
| PUT    | `/api/events/{id}/`               | ✓    | Full update                                     |
| PATCH  | `/api/events/{id}/`               | ✓    | Partial update                                  |
| DELETE | `/api/events/{id}/`               | ✓    | Delete (400 `event_has_invitations` if linked)  |
| PUT    | `/api/events/{id}/cover/`         | ✓    | Upload cover — multipart field `image`          |
| DELETE | `/api/events/{id}/cover/`         | ✓    | Remove the cover (`204`)                        |

`GET /api/events/` query params: `q` (title search), `category` (template
category), `is_active` (`true`/`false`), `page`. Results are scoped to the
authenticated organizer and ordered by `-event_date, -created_at`.

### Template payload

```json
{
  "key": "heritage-luxe",
  "name": "Héritage",
  "category": "wedding",
  "category_label": "Mariage",
  "description": "Composition classique et centrée.",
  "version": 1,
  "supports_cover": true,
  "config": {
    "supports_cover": true,
    "sections": [],
    "emphasis_fields": ["title", "date", "venue"]
  }
}
```

The catalog is seeded (`templates_app/migrations/0002_seed_templates.py`) with
the keys `heritage-luxe`, `jardin-floral`, `ligne-moderne`, `confetti`,
`sceau-academique`, `soiree-formelle`, `memoire`. The frontend renders each
key with its own design (`frontend/src/templates/`) — template config is data,
never executed as code.

### Event model payload

```json
{
  "id": 7,
  "template": "confetti",
  "template_detail": { "key": "confetti", "name": "Confetti", "…": "…" },
  "title": "Les 30 ans de Sarah",
  "message": "Une soirée festive vous attend.",
  "event_date": "2026-12-12",
  "event_time": "15:00:00",
  "timezone": "Africa/Kinshasa",
  "venue_name": "Le Palmier",
  "venue_address": "",
  "venue_details": "",
  "cover_url": "https://…/covers/event-7.jpg",
  "display_config": { "emphasis": ["title", "date"] },
  "preference_questions": [
    {
      "id": 3,
      "label": "Participerez-vous ?",
      "help_text": "",
      "input_type": "single",
      "required": false,
      "order": 0,
      "is_active": true,
      "options": [{ "id": 9, "label": "Oui" }, { "id": 10, "label": "Non" }]
    }
  ],
  "invitations_count": 0,
  "is_active": true,
  "created_at": "2026-10-07T10:00:00Z",
  "updated_at": "2026-10-07T10:00:00Z"
}
```

### Validation rules

- `template` is required and must reference an existing catalog `key`.
- `display_config.emphasis` must be a subset of the template's
  `config.emphasis_fields`.
- `event_date` + `event_time` are required; `timezone` defaults to
  `Africa/Kinshasa`.
- Preference questions: `label` required (max 255), `input_type` ∈
  `single|multiple`; `single`/`multiple` questions need ≥ 2 non-empty, distinct
  options; free-text questions must have none. Questions already answered by
  guests cannot be deleted or switched to free-text.
- Cover upload: `image` field, JPEG/PNG/WebP only (415 otherwise), 5 Mo max.
- **Field error keys are dotted paths**, e.g. `display_config.emphasis`,
  `preference_questions.0.options` — clients map them onto the matching input.

### Shared-model policy

An event model is a shared *model*: editing it propagates to **every** guest
invitation already generated from it. Changing the template only re-styles the
invitations (same content); deleting the model is refused with
`event_has_invitations` while invitations exist.
