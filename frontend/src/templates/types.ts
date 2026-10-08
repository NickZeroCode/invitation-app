/**
 * Template rendering contract.
 *
 * Templates are pure presentation: they receive an `InvitationDraft` (the
 * event invitation model's content) and render it. Registry keys mirror the
 * backend catalog seeded in `templates_app/migrations/0002_seed_templates.py`.
 */
import type { ReactElement } from 'react'

import type { TemplateCategory } from '../lib/types.ts'

export interface InvitationDraft {
  title: string
  message: string
  event_date: string // ISO date, e.g. 2026-12-12
  event_time: string // HH:mm or HH:mm:ss
  timezone: string
  venue_name: string
  venue_address: string
  venue_details: string
  cover_url: string | null
  emphasis: string[]
  /** Key from `MESSAGE_FONTS` — typeface of the message block. */
  messageFont?: string
  /** Key from `FONT_SIZES` — scales the whole invitation typography. */
  fontSize?: string
  /** Placeholder for Phase 3 individual invitations. */
  guestName?: string
}

export interface TemplateProps {
  draft: InvitationDraft
}

export interface TemplateDefinition {
  key: string
  name: string
  category: TemplateCategory
  categoryLabel: string
  description: string
  supportsCover: boolean
  emphasisFields: string[]
  Component: (props: TemplateProps) => ReactElement
}
