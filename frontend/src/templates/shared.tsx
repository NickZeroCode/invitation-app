/**
 * Shared primitives for invitation templates.
 *
 * Every template is rendered inside `InvitationPaper`. Its outer wrapper is
 * the CSS container (container-type: inline-size), so the paper's font size
 * (`2.6cqw`) tracks the paper's own width — the container must be an
 * ANCESTOR of the element using `cqw`; an element can never be its own
 * container (the units would fall back to the viewport). All internal
 * spacing uses `em`, so a template scales perfectly from a small gallery
 * thumbnail to a full editor preview — no transform hacks.
 */
/* oxlint-disable react/only-export-components -- pure helpers + one primitive component */
import type { CSSProperties, ReactNode } from 'react'

import type { InvitationDraft } from './types.ts'

export const PAPER_FONT_SIZE = '2.6cqw'

export function InvitationPaper({
  children,
  style,
}: {
  children: ReactNode
  style?: CSSProperties
}) {
  return (
    <div className="h-full w-full" style={{ containerType: 'inline-size' }}>
      <article
        className="relative flex min-h-full w-full flex-col overflow-hidden"
        style={{
          containerType: 'inline-size',
          // `--invitation-scale` (see fontSizes.ts) multiplies the paper's
          // base size; every internal measure is `em`, so the whole
          // invitation scales together with the chosen text size.
          fontSize: `calc(var(--invitation-scale, 1) * ${PAPER_FONT_SIZE})`,
          // Typographic craft: full OpenType shaping and crisp serif rendering.
          fontFeatureSettings: "'kern', 'liga', 'calt'",
          fontKerning: 'normal',
          WebkitFontSmoothing: 'antialiased',
          // Printing must keep the designed paper colour, not a white blank.
          printColorAdjust: 'exact',
          ...style,
        }}
      >
        {children}
      </article>
    </div>
  )
}

function parseDate(iso: string): Date | null {
  const parts = iso.split('-').map(Number)
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return null
  return new Date(parts[0], parts[1] - 1, parts[2])
}

/** "samedi 12 décembre 2026" from an ISO date (no timezone shifting). */
export function formatEventDate(iso: string): string {
  const date = parseDate(iso)
  if (!date) return ''
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

/** "12 décembre 2026" from an ISO date. */
export function formatShortDate(iso: string): string {
  const date = parseDate(iso)
  if (!date) return ''
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function formatDayNumber(iso: string): string {
  const date = parseDate(iso)
  return date ? String(date.getDate()).padStart(2, '0') : ''
}

/** "DÉCEMBRE 2026" style month line. */
export function formatMonthYear(iso: string): string {
  const date = parseDate(iso)
  if (!date) return ''
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })
    .format(date)
    .toUpperCase()
}

/** "SAMEDI" style weekday line. */
export function formatWeekday(iso: string): string {
  const date = parseDate(iso)
  if (!date) return ''
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'long' })
    .format(date)
    .toUpperCase()
}

/** Designed date block: weekday caps, big day number, month-year and time. */
export function DateBlock({
  draft,
  accent,
  ink,
  emphasize = false,
}: {
  draft: InvitationDraft
  accent: string
  ink: string
  emphasize?: boolean
}) {
  return (
    <div className="flex w-full max-w-[32em] items-center justify-center gap-[1.4em]">
      <span className="h-px flex-1" style={{ backgroundColor: accent, opacity: 0.5 }} aria-hidden="true" />
      <div>
        <p className="text-[0.95em] uppercase" style={{ letterSpacing: '0.52em', color: accent }}>
          {formatWeekday(draft.event_date)}
        </p>
        <p
          className="mt-[0.35em] font-display leading-none"
          style={{ fontSize: emphasize ? '3.6em' : '2.9em', color: ink }}
        >
          {formatDayNumber(draft.event_date)}
        </p>
        <p className="mt-[0.5em] text-[1em] uppercase" style={{ letterSpacing: '0.42em', color: accent }}>
          {formatMonthYear(draft.event_date)}
        </p>
        {draft.event_time ? (
          <p className="mt-[0.65em] text-[1.02em] uppercase" style={{ letterSpacing: '0.35em', opacity: 0.82 }}>
            à {formatEventTime(draft.event_time)}
          </p>
        ) : null}
      </div>
      <span className="h-px flex-1" style={{ backgroundColor: accent, opacity: 0.5 }} aria-hidden="true" />
    </div>
  )
}

export function formatEventTime(time: string): string {
  return time ? time.slice(0, 5) : ''
}

export function guestLabel(draft: InvitationDraft): string {
  return draft.guestName?.trim() || 'Invité(e)'
}

export function isEmphasized(draft: InvitationDraft, field: string): boolean {
  return draft.emphasis.includes(field)
}
