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

// ---------------------------------------------------------------------------
// Phase 2 — template catalog & event invitation models
// ---------------------------------------------------------------------------

export type TemplateCategory =
  | 'wedding'
  | 'birthday'
  | 'graduation'
  | 'reception'
  | 'anniversary'
  | 'memorial'
  | 'corporate'
  | 'other'

export interface TemplateConfig {
  supports_cover: boolean
  sections: string[]
  emphasis_fields: string[]
}

export interface InvitationTemplate {
  key: string
  name: string
  category: TemplateCategory
  category_label: string
  description: string
  version: number
  supports_cover: boolean
  config: TemplateConfig
}

export interface PreferenceOptionPayload {
  id?: number
  label: string
}

export interface PreferenceQuestionPayload {
  id?: number
  label: string
  help_text: string
  input_type: 'single' | 'multiple'
  required: boolean
  order: number
  is_active: boolean
  options: PreferenceOptionPayload[]
}

export interface PreferenceOption extends PreferenceOptionPayload {
  id: number
  order: number
}

export interface PreferenceQuestion extends Omit<PreferenceQuestionPayload, 'options'> {
  id: number
  options: PreferenceOption[]
}

export interface EventModel {
  id: number
  template: string
  template_detail: InvitationTemplate
  title: string
  message: string
  event_date: string
  event_time: string
  timezone: string
  venue_name: string
  venue_address: string
  venue_details: string
  cover_url: string | null
  display_config: { emphasis?: string[] }
  preference_questions: PreferenceQuestion[]
  invitations_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface EventListPage {
  count: number
  next: string | null
  previous: string | null
  results: EventModel[]
}

export interface EventListParams {
  q?: string
  category?: TemplateCategory | ''
  is_active?: 'true' | 'false' | ''
  page?: number
}

export interface EventPayload {
  template: string
  title: string
  message: string
  event_date: string
  event_time: string
  timezone: string
  venue_name: string
  venue_address: string
  venue_details: string
  display_config: { emphasis: string[] }
  preference_questions: PreferenceQuestionPayload[]
  is_active?: boolean
}

export interface CoverUploadResponse {
  cover_url: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Phase 3 — individual guest invitations
// ---------------------------------------------------------------------------

export type InvitationCivility = 'none' | 'm' | 'mme' | 'mlle' | 'couple'

export type InvitationState = 'active' | 'revoked' | 'expired' | 'deleted'

export interface Invitation {
  id: number
  event: number
  event_title: string
  guest_name: string
  civility: InvitationCivility
  display_name: string
  token: string
  issued_at: string
  expires_at: string | null
  /** Stored lifecycle state (authoritative). */
  state: InvitationState
  /** Effective state: an active invitation past its expiry reads as expired. */
  status: InvitationState
  is_valid: boolean
  has_response: boolean
  created_at: string
  updated_at: string
}

export interface InvitationPayload {
  guest_name: string
  civility?: InvitationCivility
  expires_at?: string | null
}

export interface InvitationListPage {
  count: number
  next: string | null
  previous: string | null
  results: Invitation[]
}

export interface InvitationListParams {
  q?: string
  state?: InvitationState | ''
  page?: number
}

export interface InvitationBulkResult {
  count: number
  invitations: Invitation[]
}
