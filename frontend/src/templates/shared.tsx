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
          // Long unbreakable tokens (map links, phone numbers, WhatsApp
          // handles) must wrap inside the paper instead of running past the
          // right frame and being clipped. `anywhere` breaks them at the
          // character level only when they cannot fit a line.
          overflowWrap: 'anywhere',
          // Mobile browsers may auto-size text without scaling the `em`
          // decorations with it; pin the scale so the paper never drifts
          // out of its frame on phones.
          textSizeAdjust: '100%',
          WebkitTextSizeAdjust: '100%',
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

/** Programme time in French style: « 19h30 » (minutes dropped when zero). */
export function formatProgramTime(time: string): string {
  const [hours = '', minutes = ''] = time.split(':')
  return minutes === '00' ? `${hours}h` : `${hours}h${minutes}`
}

/** Programme slot: a single time (« 19h30 ») or a range (« 19h30 – 20h30 »). */
export function formatProgramRange(start: string, end: string | null): string {
  return end ? `${formatProgramTime(start)} – ${formatProgramTime(end)}` : formatProgramTime(start)
}

export function guestLabel(draft: InvitationDraft): string {
  return draft.guestName?.trim() || 'Invité(e)'
}

export function isEmphasized(draft: InvitationDraft, field: string): boolean {
  return draft.emphasis.includes(field)
}

/**
 * Cover hero: the opening page of the invitation — full-bleed photo with the
 * celebrated names in calligraphy over a translucent band (LAC MUNKAMBA
 * reference, p.1). Only templates with `supportsCover` render it, and only
 * when a cover photo exists. Excluded from image export like every cover
 * placement (`data-export-skip`).
 */
export function CoverHero({
  draft,
  bandColor,
  titleStyle,
  titleClassName,
  edgeColor,
}: {
  draft: InvitationDraft
  /** Scrim colour with alpha, e.g. 'rgba(43,38,32,0.55)'. */
  bandColor: string
  /** Per-template calligraphy for the names. */
  titleStyle?: CSSProperties
  /** Per-template font classes (e.g. 'font-display italic'). */
  titleClassName?: string
  /** Hairline accent drawn above the band, e.g. 'rgba(166,124,61,0.8)'. */
  edgeColor?: string
}) {
  if (!draft.cover_url) return null
  const names = draft.coverTitle.trim()
  return (
    <div
      data-export-skip=""
      className="relative w-full shrink-0 overflow-hidden"
      style={{ aspectRatio: '4 / 5' }}
    >
      <img src={draft.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
      {names ? (
        <div
          className="absolute inset-x-0 bottom-0 flex flex-col items-center px-[1.6em] pb-[1.8em] pt-[5em]"
          style={{ background: `linear-gradient(to bottom, transparent, ${bandColor})` }}
        >
          {edgeColor ? (
            <span
              className="mb-[1.1em] h-px w-[9em]"
              style={{ backgroundColor: edgeColor }}
              aria-hidden="true"
            />
          ) : null}
          <h2
            className={`w-full break-words text-center leading-[1.16] ${titleClassName ?? ''}`}
            style={titleStyle}
          >
            {names}
          </h2>
        </div>
      ) : null}
    </div>
  )
}

/**
 * Programme section — time (or range) and description per step (LAC MUNKAMBA
 * reference, p.3). Renders nothing when no step is set.
 */
export function ProgramSection({
  draft,
  accent,
  ink,
  ornament,
  ornamentAlign,
  titleStyle,
  titleClassName,
}: {
  draft: InvitationDraft
  accent: string
  ink: string
  /** Small motif drawn under the section title (the template's own drawing). */
  ornament?: ReactNode
  ornamentAlign?: 'center' | 'left'
  titleStyle?: CSSProperties
  titleClassName?: string
}) {
  if (!draft.program.length) return null
  return (
    <section className="mt-[3.2em] w-full">
      <p
        className={`text-[1em] uppercase ${titleClassName ?? ''}`}
        style={{ letterSpacing: '0.38em', color: accent, ...titleStyle }}
      >
        Programme
      </p>
      {ornament ? (
        <div
          className={`mt-[1em] flex w-full ${ornamentAlign === 'left' ? 'justify-start' : 'justify-center'}`}
          aria-hidden="true"
        >
          <span className="block w-[10em]">{ornament}</span>
        </div>
      ) : null}
      <div className="mx-auto mt-[1.8em] grid w-full max-w-[32em] grid-cols-[auto_1fr] gap-x-[1.4em] gap-y-[0.9em] text-left">
        {draft.program.map((item, index) => (
          <div key={index} className="contents">
            <span
              className="whitespace-nowrap text-[1.02em] font-semibold uppercase"
              style={{ color: accent, letterSpacing: '0.12em' }}
            >
              {formatProgramRange(item.start_time, item.end_time)}
            </span>
            <span className="text-[1.05em] leading-[1.5]" style={{ color: ink }}>
              {item.description}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

/**
 * Dress-code section — photos with a caption under each (LAC MUNKAMBA
 * reference, p.3). Renders nothing when no photo is set.
 */
export function DressCodeSection({
  draft,
  accent,
  ink,
  ornament,
  ornamentAlign,
  titleStyle,
  titleClassName,
}: {
  draft: InvitationDraft
  accent: string
  ink: string
  /** Small motif drawn under the section title (the template's own drawing). */
  ornament?: ReactNode
  ornamentAlign?: 'center' | 'left'
  titleStyle?: CSSProperties
  titleClassName?: string
}) {
  if (!draft.dressCode.length) return null
  return (
    <section className="mt-[3.2em] w-full">
      <p
        className={`text-[1em] uppercase ${titleClassName ?? ''}`}
        style={{ letterSpacing: '0.38em', color: accent, ...titleStyle }}
      >
        Code vestimentaire
      </p>
      {ornament ? (
        <div
          className={`mt-[1em] flex w-full ${ornamentAlign === 'left' ? 'justify-start' : 'justify-center'}`}
          aria-hidden="true"
        >
          <span className="block w-[10em]">{ornament}</span>
        </div>
      ) : null}
      <div className="mt-[1.8em] flex flex-wrap items-start justify-center gap-[1.4em]">
        {draft.dressCode.map((image, index) => (
          <figure key={index} className="w-[11.5em]">
            <img
              src={image.url}
              alt=""
              className="w-full rounded-[0.35em] object-cover"
              style={{ border: `1px solid ${accent}66`, aspectRatio: '3 / 4' }}
            />
            {image.caption ? (
              <figcaption
                className="mt-[0.6em] text-[0.92em] italic leading-[1.45]"
                style={{ color: ink, opacity: 0.85 }}
              >
                {image.caption}
              </figcaption>
            ) : null}
          </figure>
        ))}
      </div>
    </section>
  )
}
