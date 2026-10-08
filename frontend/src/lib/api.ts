/**
 * Typed API client for the Django REST backend.
 *
 * - Session-cookie authentication (`credentials: 'include'`).
 * - CSRF protection: reads Django's `csrftoken` cookie and echoes it in the
 *   `X-CSRFToken` header on every unsafe request (fetching the cookie first
 *   if needed).
 * - All failures surface as `ApiError` with a safe, user-facing French message
 *   and optional per-field validation errors from the backend envelope.
 */
import type {
  ApiErrorBody,
  ChangePasswordPayload,
  CoverUploadResponse,
  DashboardOverview,
  DressCodeImage,
  EventListParams,
  EventListPage,
  EventModel,
  EventPayload,
  EventResponsesPage,
  Invitation,
  InvitationBulkResult,
  InvitationListParams,
  InvitationListPage,
  InvitationPayload,
  InvitationTemplate,
  GuestResponsePayload,
  GuestResponseSubmission,
  LoginPayload,
  Organizer,
  ProfileUpdatePayload,
  PublicInvitationPayload,
  PublicInvitationVerification,
  RegisterPayload,
} from './types.ts'

const NETWORK_MESSAGE = 'Impossible de joindre le serveur. Vérifiez votre connexion internet.'
const UNKNOWN_MESSAGE = 'Une erreur est survenue.'

/** Mirrors the backend's French messages for responses without an envelope. */
const STATUS_MESSAGES: Record<number, string> = {
  400: 'Les données envoyées sont invalides.',
  401: 'Authentification requise.',
  403: "Vous n'avez pas les droits nécessaires.",
  404: 'Ressource introuvable.',
  405: 'Méthode non autorisée.',
  415: 'Format de requête non supporté.',
  429: 'Trop de requêtes. Veuillez réessayer plus tard.',
}

const STATUS_CODES: Record<number, string> = {
  400: 'validation_error',
  401: 'not_authenticated',
  403: 'permission_denied',
  404: 'not_found',
  429: 'throttled',
}

const CSRF_COOKIE = 'csrftoken'
const CSRF_HEADER = 'X-CSRFToken'

const API_BASE = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '').replace(/\/+$/, '')

export class ApiError extends Error {
  readonly code: string
  readonly status: number
  readonly fields: Record<string, string[]>

  constructor(
    code: string,
    status: number,
    message: string,
    fields: Record<string, string[]> = {},
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.fields = fields
  }
}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

/** Returns the CSRF token, ensuring Django has set the cookie first. */
async function ensureCsrfToken(): Promise<string> {
  const existing = readCookie(CSRF_COOKIE)
  if (existing) return existing

  let res: Response
  try {
    res = await fetch(API_BASE + '/api/auth/csrf/', {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
  } catch {
    throw new ApiError('network', 0, NETWORK_MESSAGE)
  }
  if (!res.ok) {
    throw new ApiError('csrf_failed', res.status, UNKNOWN_MESSAGE)
  }
  const token = readCookie(CSRF_COOKIE)
  if (!token) {
    throw new ApiError('csrf_failed', res.status, UNKNOWN_MESSAGE)
  }
  return token
}

function toApiError(status: number, data: unknown): ApiError {
  const envelope =
    data !== null && typeof data === 'object'
      ? (data as Partial<ApiErrorBody>).error
      : undefined
  if (envelope && typeof envelope.message === 'string') {
    return new ApiError(envelope.code ?? 'error', status, envelope.message, envelope.fields ?? {})
  }
  return new ApiError(
    STATUS_CODES[status] ?? 'error',
    status,
    STATUS_MESSAGES[status] ?? UNKNOWN_MESSAGE,
  )
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  let payload: BodyInit | undefined
  if (body instanceof FormData) {
    // Multipart upload: the browser sets Content-Type with the boundary.
    payload = body
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }
  if (method !== 'GET') {
    headers[CSRF_HEADER] = await ensureCsrfToken()
  }

  let res: Response
  try {
    res = await fetch(API_BASE + path, {
      method,
      headers,
      credentials: 'include',
      body: payload,
    })
  } catch {
    throw new ApiError('network', 0, NETWORK_MESSAGE)
  }

  if (res.status === 204) {
    return undefined as T
  }

  let data: unknown = null
  try {
    data = await res.json()
  } catch {
    data = null
  }

  if (!res.ok) {
    throw toApiError(res.status, data)
  }
  return data as T
}

export const authApi = {
  me: () => request<Organizer>('GET', '/api/auth/me/'),
  login: (payload: LoginPayload) => request<Organizer>('POST', '/api/auth/login/', payload),
  register: (payload: RegisterPayload) => request<Organizer>('POST', '/api/auth/register/', payload),
  logout: () => request<void>('POST', '/api/auth/logout/'),
  updateProfile: (payload: ProfileUpdatePayload) =>
    request<Organizer>('PATCH', '/api/auth/me/', payload),
  changePassword: (payload: ChangePasswordPayload) =>
    request<void>('POST', '/api/auth/password/', payload),
}

export const dashboardApi = {
  overview: () => request<DashboardOverview>('GET', '/api/dashboard/overview/'),
}

export const templatesApi = {
  list: () => request<InvitationTemplate[]>('GET', '/api/templates/'),
  get: (key: string) =>
    request<InvitationTemplate>('GET', `/api/templates/${encodeURIComponent(key)}/`),
}

export const eventsApi = {
  list: (params: EventListParams = {}) => {
    const query = new URLSearchParams()
    if (params.q) query.set('q', params.q)
    if (params.category) query.set('category', params.category)
    if (params.is_active) query.set('is_active', params.is_active)
    if (params.page && params.page > 1) query.set('page', String(params.page))
    const suffix = query.size > 0 ? `?${query.toString()}` : ''
    return request<EventListPage>('GET', `/api/events/${suffix}`)
  },
  get: (id: number) => request<EventModel>('GET', `/api/events/${id}/`),
  create: (payload: EventPayload) => request<EventModel>('POST', '/api/events/', payload),
  update: (id: number, payload: Partial<EventPayload>) =>
    request<EventModel>('PATCH', `/api/events/${id}/`, payload),
  remove: (id: number) => request<void>('DELETE', `/api/events/${id}/`),
  uploadCover: (id: number, file: File) => {
    const form = new FormData()
    form.append('image', file)
    return request<CoverUploadResponse>('PUT', `/api/events/${id}/cover/`, form)
  },
  removeCover: (id: number) => request<void>('DELETE', `/api/events/${id}/cover/`),
  uploadDressCode: (id: number, file: File, caption: string, order?: number) => {
    const form = new FormData()
    form.append('image', file)
    form.append('caption', caption)
    if (order !== undefined) form.append('order', String(order))
    return request<DressCodeImage>('POST', `/api/events/${id}/dress-code/`, form)
  },
  updateDressCode: (
    id: number,
    itemId: number,
    payload: { caption?: string; order?: number },
  ) =>
    request<DressCodeImage>(
      'PATCH',
      `/api/events/${id}/dress-code/${itemId}/`,
      payload,
    ),
  removeDressCode: (id: number, itemId: number) =>
    request<void>('DELETE', `/api/events/${id}/dress-code/${itemId}/`),
  responses: (id: number, params: { page?: number } = {}) => {
    const query = new URLSearchParams()
    if (params.page && params.page > 1) query.set('page', String(params.page))
    const suffix = query.size > 0 ? `?${query.toString()}` : ''
    return request<EventResponsesPage>('GET', `/api/events/${id}/responses/${suffix}`)
  },
}

export const publicApi = {
  invitation: (token: string) =>
    request<PublicInvitationPayload>('GET', `/api/public/invitations/${encodeURIComponent(token)}/`),
  verify: (token: string) =>
    request<PublicInvitationVerification>(
      'GET',
      `/api/public/invitations/${encodeURIComponent(token)}/verify/`,
    ),
  submitResponse: (token: string, payload: GuestResponseSubmission) =>
    request<GuestResponsePayload>(
      'POST',
      `/api/public/invitations/${encodeURIComponent(token)}/response/`,
      payload,
    ),
}

export const invitationsApi = {
  listForEvent: (eventId: number, params: InvitationListParams = {}) => {
    const query = new URLSearchParams()
    if (params.q) query.set('q', params.q)
    if (params.state) query.set('state', params.state)
    if (params.page && params.page > 1) query.set('page', String(params.page))
    const suffix = query.size > 0 ? `?${query.toString()}` : ''
    return request<InvitationListPage>('GET', `/api/events/${eventId}/invitations/${suffix}`)
  },
  get: (id: number) => request<Invitation>('GET', `/api/invitations/${id}/`),
  create: (eventId: number, payload: InvitationPayload) =>
    request<Invitation>('POST', `/api/events/${eventId}/invitations/`, payload),
  bulkCreate: (eventId: number, invitations: InvitationPayload[]) =>
    request<InvitationBulkResult>('POST', `/api/events/${eventId}/invitations/bulk/`, {
      invitations,
    }),
  update: (id: number, payload: Partial<InvitationPayload>) =>
    request<Invitation>('PATCH', `/api/invitations/${id}/`, payload),
  remove: (id: number) => request<void>('DELETE', `/api/invitations/${id}/`),
  revoke: (id: number) => request<Invitation>('POST', `/api/invitations/${id}/revoke/`),
  duplicate: (id: number) => request<Invitation>('POST', `/api/invitations/${id}/duplicate/`),
}
