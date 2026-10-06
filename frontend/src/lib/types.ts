/**
 * Shared API types mirroring the Django REST Framework serializers.
 * Keep in sync with backend/accounts/serializers.py and backend/core/views.py.
 */

export interface Organizer {
  id: number
  email: string
  first_name: string
  last_name: string
  full_name: string
  timezone: string
  date_joined: string
}

export interface DashboardOverview {
  events: {
    total: number
    upcoming: number
  }
  invitations: {
    total: number
    active: number
    expired: number
    revoked: number
  }
  responses: {
    total: number
  }
  generated_at: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface ProfileUpdatePayload {
  first_name?: string
  last_name?: string
  timezone?: string
}

export interface ChangePasswordPayload {
  current_password: string
  new_password: string
  confirm_password: string
}

/** Error envelope produced by core.exceptions.api_exception_handler. */
export interface ApiErrorBody {
  error: {
    code: string
    message: string
    fields?: Record<string, string[]>
  }
}
