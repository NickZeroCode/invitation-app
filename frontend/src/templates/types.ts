/**
 * Template rendering contract.
 *
 * Templates are pure presentation: they receive an `InvitationDraft` (the
 * event invitation model's content) and render it. Registry keys mirror the
 * backend catalog seeded in `templates_app/migrations/0002_seed_templates.py`.
 */
import type { ReactElement } from 'react'

import type { TemplateCategory } from '../lib/types.ts'

/** One dress-code photo with its caption (invitation section). */
export interface DressCodeEntry {
  url: string
  caption: string
}

/** One programme step: a time or time range + what happens then. */
export interface ProgramEntry {
  /** `HH:mm:ss` — templates render «19h30 » via `formatTime`. */
  start_time: string
  /** `HH:mm:ss`, or null for a single time. */
  end_time: string | null
  description: string
}

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
  /** Texte superposé à la photo de couverture (noms des concernés). */
  coverTitle: string
  emphasis: string[]
  /** Key from `MESSAGE_FONTS` — typeface of the message block. */
  messageFont?: string
  /** Key from `FONT_SIZES` — scales the whole invitation typography. */
  fontSize?: string
  /** Placeholder for Phase 3 individual invitations. */
  guestName?: string
  /** Dress-code gallery; empty = section hidden. */
  dressCode: DressCodeEntry[]
  /** Programme rows; empty = section hidden. */
  program: ProgramEntry[]
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
