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

import { CoverSheen } from './florals.tsx'
import { LuxuryTable } from './tableScene.tsx'
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
export function formatProgramTime(time: string | null | undefined): string {
  if (!time) return ''
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

/** `#RGB`/`#RRGGBB` plus alpha as `rgba(...)`; non-hex colours pass through. */
function withAlpha(color: string, alpha: number): string {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim())
  if (!match) return color
  const digits =
    match[1].length === 3
      ? match[1]
          .split('')
          .map((digit) => digit + digit)
          .join('')
      : match[1]
  const value = Number.parseInt(digits, 16)
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`
}

/** rgb channels of a `#RGB`/`#RRGGBB`/`rgb()`/`rgba()` colour (null if unknown). */
function parseRgb(color: string): [number, number, number] | null {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim())
  if (hex) {
    const digits = hex[1].length === 3 ? hex[1].split('').map((d) => d + d).join('') : hex[1]
    const value = Number.parseInt(digits, 16)
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
  }
  const fn = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(color.trim())
  return fn ? [Number(fn[1]), Number(fn[2]), Number(fn[3])] : null
}

/** Relative luminance of a colour string (0 dark ... 1 light). */
function luminanceOf(color: string): number {
  const [r, g, b] = parseRgb(color) ?? [255, 255, 255]
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

/**
 * The plate the cover text rests on. A dark engraved plate (the card's own
 * shadow tone, warmed toward its scrim hue) where the names are cream; a light
 * frosted plate where the names are dark ink — every template keeps its
 * contrast in its own palette.
 */
function plateGradient(paper: string, veil: string): string {
  if (luminanceOf(veil) >= 0.62) {
    return `linear-gradient(180deg in oklch, ${accentAlpha(paper, 0.92)}, ${accentAlpha(paper, 0.72)})`
  }
  const [r, g, b] = parseRgb(paper) ?? [246, 242, 234]
  const [vr, vg, vb] = parseRgb(veil) ?? [46, 38, 26]
  const tone = (f: number) => {
    // Paper shadow warmed ~45% toward the card's scrim hue: espresso, not grey.
    const mix = 0.45
    const rr = Math.round(r * f * (1 - mix) + vr * 0.85 * mix)
    const gg = Math.round(g * f * (1 - mix) + vg * 0.85 * mix)
    const bb = Math.round(b * f * (1 - mix) + vb * 0.85 * mix)
    return `rgba(${rr}, ${gg}, ${bb}, 0.96)`
  }
  return `linear-gradient(180deg in oklch, ${tone(0.32)}, ${tone(0.19)})`
}

/** The woven festive ribbon behind the plate: the card's accent, lit from the
 * top like satin. */
function ribbonGradient(accent: string | undefined): string {
  return `linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0) 42%, rgba(24,16,8,0.22)), linear-gradient(180deg in oklch, ${accentAlpha(accent, 0.95)}, ${accentAlpha(accent, 0.8)})`
}

/**
 * A melt-gradient builder: fades `color` from fully transparent to its full
 * opacity along `direction`, laying `steps` evenly-spaced smoothstep stops
 * (zero slope at both ends, no step-knees in between) and interpolating in
 * oklch — so the fade glides through the colour's own hue and never through a
 * grey mid-band. This is what makes the cover→card hand-off read as one
 * continuous, barely-perceptible gradient rather than two stops meeting.
 */
function meltGradient(direction: string, color: string, steps = 18): string {
  const stops: string[] = []
  for (let i = 0; i < steps; i += 1) {
    const x = i / (steps - 1)
    const alpha = x * x * (3 - 2 * x)
    stops.push(`${withAlpha(color, Number(alpha.toFixed(3)))} ${Number((x * 100).toFixed(1))}%`)
  }
  return `linear-gradient(${direction} in oklch, ${stops.join(', ')})`
}

/** `rgba(...)` (or pass-through) with a new opacity — for softening a hex or
 * rgba accent into a border / shadow tone. Falls back to a warm gold. */
function accentAlpha(color: string | undefined, alpha: number): string {
  if (color) {
    const rgba = /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,/i.exec(color.trim())
    if (rgba) return `rgba(${rgba[1]}, ${rgba[2]}, ${rgba[3]}, ${alpha})`
    const hex = withAlpha(color, alpha)
    if (hex.startsWith('rgba')) return hex
  }
  return `rgba(226, 194, 124, ${alpha})`
}

/** A deep, warm shadow tone for the plaque's drop shadow (never cold grey). */
function plaqueShadow(paper: string): string {
  const match = /^#([0-9a-f]{6})$/i.exec(paper.trim())
  if (!match) return 'rgba(46, 36, 24, 0.28)'
  const v = Number.parseInt(match[1], 16)
  const r = Math.round(((v >> 16) & 255) * 0.22)
  const g = Math.round(((v >> 8) & 255) * 0.2)
  const b = Math.round((v & 255) * 0.16)
  return `rgba(${r}, ${g}, ${b}, 0.28)`
}

/**
 * Cover page: the opening page of the invitation — a full-bleed photo with a
 * refined, editorial text zone over a translucent gradient band. Only
 * templates with `supportsCover` render it, and only when a cover photo
 * exists. The exporter keeps `[data-export-skip="cover"]` on the invitation
 * sheet: the cover melts into the card through its paper wash, so both are
 * captured as one continuous page.
 *
 * The text zone is deliberately stylish: a small letterspaced eyebrow line,
 * a delicate rule, then the celebrated names in large calligraphy — far more
 * premium than a bare caption on a photo.
 */
export function CoverHero({
  draft,
  bandColor,
  titleStyle,
  titleClassName,
  edgeColor,
  eyebrow,
  eyebrowColor,
  paperColor = '#FFFFFF',
  motifColor,
}: {
  draft: InvitationDraft
  /** Scrim colour with alpha, e.g. 'rgba(43,38,32,0.55)'. BELONGS TO THE
   * CARD'S PALETTE: the card's own accent darkened (gold card → gold-brown,
   * crimson card → crimson-black), or a light veil for dark names. A foreign
   * dark hue (navy on a cream card) drags the composition through grey — the
   * tile and melt must glide along the card's colour line. Its luminance also
   * picks the names plate: dark scrim → dark engraved plate (cream names),
   * light veil → light frosted plate (dark ink names). */
  bandColor: string
  /** Per-template calligraphy for the names. */
  titleStyle?: CSSProperties
  /** Per-template font classes (e.g. 'font-display italic'). */
  titleClassName?: string
  /** Hairline accent drawn above the band, e.g. 'rgba(166,124,61,0.8)'. */
  edgeColor?: string
  /** Small caps line above the names (defaults to a neutral invitation word). */
  eyebrow?: string
  /** Eyebrow ink — the light-veiled templates pass their dark ink; cream by
   * default so it reads on the smoky scrim. */
  eyebrowColor?: string
  /** The interior paper colour — the cover's photo melts into it, so the
   * cover and the card below read as one continuous page. */
  paperColor?: string
  /** Accent for the cover's own subtle trellis motif (defaults to warm gold). */
  motifColor?: string
}) {
  if (!draft.cover_url) return null
  // The cover always celebrates something: the chosen names or, when the
  // organizer left them empty, the event title itself (never a bare photo).
  const names = draft.coverTitle.trim() || draft.title.trim()
  return (
    <div
      data-export-skip="cover"
      // `relative z-20` lifts the cover above the paper's `absolute inset-*`
      // decorations (which sit at z-auto): the opaque full-bleed photo covers
      // them, so template florals never scatter across the photograph. They
      // remain visible on the interior card below the cover.
      className="relative z-20 w-full shrink-0 overflow-hidden"
      // A4 portrait so the exported first page is a true full-bleed cover.
      style={{ aspectRatio: '210 / 297' }}
    >
      <img src={draft.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
      {/* The cover's own subtle premium motif — a faint silk trellis, never
          the template's florals. */}
      <CoverSheen
        className="pointer-events-none absolute inset-0 h-full w-full"
        color={motifColor ?? edgeColor ?? '#E2C27C'}
        opacity={0.14}
      />
      {/* Soft top-to-bottom vignette so any photo sits in a premium frame. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(20,16,12,0.22), transparent 30%, transparent 55%, transparent)',
        }}
        aria-hidden="true"
      />
      {/* The card's paper colour rises from the page below up into the cover,
          painted beneath the names veil: one single, very long melt (lower 55%
          of the cover). oklch interpolation keeps it on the paper's own hue
          (no grey mid-band) and the smoothstep stops erase every corner, so
          the photo quietly becomes the card's paper with no seam anywhere. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%]"
        style={{
          background: meltGradient('to bottom', paperColor),
        }}
        aria-hidden="true"
      />
      {/* Names tile + ribbon — the cover text rests on a physical festive
          object rather than a painted gradient: a plate in the card's own tone
          framed in fine gold with corner diamonds, laid over a satin ribbon
          woven behind it and finished in swallow-tail ends with shadowed
          folds. Soft shadows make the assembly sit ON the photograph like a
          real engraved plaque. The paper melt still runs beneath, so the tile
          and the card below share one continuous, expensive paper. */}
      {names ? (
        <div className="absolute inset-x-0 bottom-[8.5em] flex justify-center px-[1.7em]">
          <div className="relative">
            {/* Festive ribbon woven behind the tile — satin in the card's
                accent, swallow-tail ends with shadowed folds. */}
            <div
              aria-hidden="true"
              className="absolute left-[-3.2em] top-1/2 h-[2.7em] w-[3.7em] -translate-y-1/2"
              style={{
                background: ribbonGradient(edgeColor),
                clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 1.15em 50%)',
                filter: `drop-shadow(0 0.35em 0.55em ${plaqueShadow(paperColor)})`,
              }}
            />
            <div
              aria-hidden="true"
              className="absolute right-[-3.2em] top-1/2 h-[2.7em] w-[3.7em] -translate-y-1/2"
              style={{
                background: ribbonGradient(edgeColor),
                clipPath: 'polygon(0 0, 100% 0, calc(100% - 1.15em) 50%, 100% 100%, 0 100%)',
                filter: `drop-shadow(0 0.35em 0.55em ${plaqueShadow(paperColor)})`,
              }}
            />
            <div
              aria-hidden="true"
              className="absolute left-[-0.15em] top-[calc(50%+1.15em)] h-[0.8em] w-[0.72em]"
              style={{ background: 'rgba(24,16,8,0.32)', clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }}
            />
            <div
              aria-hidden="true"
              className="absolute right-[-0.15em] top-[calc(50%+1.15em)] h-[0.8em] w-[0.72em]"
              style={{ background: 'rgba(24,16,8,0.32)', clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
            />
            {/* The tile: a plate in the card's own tone (dark engraved plate
                where the names are cream, light frosted plate where they are
                dark ink), framed in fine gold with corner diamonds. */}
            <div
              className="relative z-10 flex flex-col items-center px-[2.2em] py-[1.75em] text-center"
              style={{
                background: plateGradient(paperColor, bandColor),
                border: `1px solid ${accentAlpha(edgeColor, 0.75)}`,
                borderRadius: '0.5em',
                boxShadow: `inset 0 0 0 1px ${accentAlpha(edgeColor, 0.35)}, 0 1.4em 3em -0.8em ${plaqueShadow(paperColor)}, 0 0.4em 1.1em -0.4em ${plaqueShadow(paperColor)}`,
              }}
            >
            {/* Gold corner diamonds — a quiet festive frame. */}
            <span aria-hidden="true" className="absolute left-[0.55em] top-[0.55em] h-[0.4em] w-[0.4em] rotate-45" style={{ backgroundColor: accentAlpha(edgeColor, 0.95) }} />
            <span aria-hidden="true" className="absolute right-[0.55em] top-[0.55em] h-[0.4em] w-[0.4em] rotate-45" style={{ backgroundColor: accentAlpha(edgeColor, 0.95) }} />
            <span aria-hidden="true" className="absolute bottom-[0.55em] left-[0.55em] h-[0.4em] w-[0.4em] rotate-45" style={{ backgroundColor: accentAlpha(edgeColor, 0.95) }} />
            <span aria-hidden="true" className="absolute bottom-[0.55em] right-[0.55em] h-[0.4em] w-[0.4em] rotate-45" style={{ backgroundColor: accentAlpha(edgeColor, 0.95) }} />
            <p
              className="uppercase"
              style={{
                fontSize: '0.82em',
                letterSpacing: '0.5em',
                color: eyebrowColor ?? '#F5EDE0',
                opacity: 0.92,
                fontFamily: "'Montserrat', 'Inter', sans-serif",
                fontWeight: 500,
              }}
            >
              {eyebrow ?? 'Invitation'}
            </p>
            <span
              className="mt-[0.95em] flex items-center gap-[0.9em]"
              aria-hidden="true"
            >
              <span className="h-px w-[3.4em]" style={{ backgroundColor: edgeColor ?? 'rgba(226,194,124,0.85)' }} />
              <span
                className="inline-block h-[0.42em] w-[0.42em] rotate-45"
                style={{ backgroundColor: edgeColor ?? 'rgba(226,194,124,0.9)' }}
              />
              <span className="h-px w-[3.4em]" style={{ backgroundColor: edgeColor ?? 'rgba(226,194,124,0.85)' }} />
            </span>
            <h2
              className={`mt-[1.02em] w-full break-words text-balance leading-[1.08] ${titleClassName ?? ''}`}
              style={titleStyle}
            >
              {names}
            </h2>
            </div>
          </div>
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
    <section data-export-skip="" className="mt-[3.2em] w-full">
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
 * Table section — the guest's seating assignment: a luxury table with the
 * assigned number on it and the optional text under it (LAC MUNKAMBA
 * reference, table card). Renders nothing when no number is set.
 */
export function TableSection({
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
  if (!draft.tableNumber) return null
  return (
    <section data-export-skip="" className="mt-[3.2em] w-full">
      <p
        className={`text-[1em] uppercase ${titleClassName ?? ''}`}
        style={{ letterSpacing: '0.38em', color: accent, ...titleStyle }}
      >
        Votre table
      </p>
      {ornament ? (
        <div
          className={`mt-[1em] flex w-full ${ornamentAlign === 'left' ? 'justify-start' : 'justify-center'}`}
          aria-hidden="true"
        >
          <span className="block w-[10em]">{ornament}</span>
        </div>
      ) : null}
      <div className="mx-auto mt-[1.6em] flex w-full max-w-[26em] flex-col items-center">
        <LuxuryTable number={draft.tableNumber} accent={accent} ink={ink} className="w-full" />
        {draft.tableText ? (
          <p
            className="mt-[1.2em] text-center text-[1.05em] italic leading-[1.5]"
            style={{ color: ink, opacity: 0.85 }}
          >
            {draft.tableText}
          </p>
        ) : null}
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
    <section data-export-skip="" className="mt-[3.2em] w-full">
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

/**
 * Note section — the organizer's practical note to the guests (« Le respect
 * de l'heure est vivement souhaité »). A plain italic line, no labelled
 * title: it reads as part of the invitation, not as a section. It sits at the
 * same spot on screen and on the PDF card. Renders nothing when no note is set.
 */
export function NoteSection({ draft, ink }: { draft: InvitationDraft; ink: string }) {
  if (!draft.note) return null
  return (
    <section className="mt-[2.6em] w-full">
      <p
        className="mx-auto max-w-[30em] text-pretty text-[1.08em] italic leading-[1.65] break-words"
        style={{ color: ink, opacity: 0.92 }}
      >
        {draft.note}
      </p>
    </section>
  )
}
