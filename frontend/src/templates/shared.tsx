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
import { useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'

import { CoverSheen } from './florals.tsx'
import { DRESS_CODE_CATEGORY_MAX } from './dressCodeLimits.ts'
import { LuxuryTable } from './tableScene.tsx'
import type { InvitationDraft } from './types.ts'

export const PAPER_FONT_SIZE = '2.6cqw'
const PAPER_FONT_RATIO = 0.026

/**
 * Container units arrived in Chrome 105 / Safari 16. Older phones — still
 * common among guests — drop the whole `cqw` declaration, so the paper fell
 * back to 16px body text and every invitation overflowed its frame. There,
 * the paper measures its own width and sets the same size in pixels.
 */
const SUPPORTS_CONTAINER_UNITS =
  typeof CSS === 'undefined' || typeof CSS.supports !== 'function' || CSS.supports('width', '1cqw')

function usePaperFontFallback() {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState<number | null>(null)
  useLayoutEffect(() => {
    const node = ref.current
    if (SUPPORTS_CONTAINER_UNITS || !node) return undefined
    const measure = () => setWidth(node.clientWidth)
    measure()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  const base = width === null ? PAPER_FONT_SIZE : `${width * PAPER_FONT_RATIO}px`
  return { ref, base }
}

export function InvitationPaper({
  children,
  style,
}: {
  children: ReactNode
  style?: CSSProperties
}) {
  const { ref, base } = usePaperFontFallback()
  return (
    <div ref={ref} className="h-full w-full" style={{ containerType: 'inline-size' }}>
      <article
        className="relative flex min-h-full w-full flex-col overflow-hidden"
        style={{
          containerType: 'inline-size',
          // `--invitation-scale` (see fontSizes.ts) multiplies the paper's
          // base size; every internal measure is `em`, so the whole
          // invitation scales together with the chosen text size.
          fontSize: `calc(var(--invitation-scale, 1) * ${base})`,
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

/**
 * Foil-gradient lettering that never crops its own glyphs. A script face
 * (Great Vibes, Parisienne) swashes well past its advance width and its
 * accents rise above the line box, while `background-clip: text` only paints
 * inside the box — so on a shrink-wrapped heading the final swash and the
 * « É » accent vanished. An INLINE span's padding enlarges the painted area
 * without moving a single line (vertical inline padding takes no layout
 * space; the horizontal bleed is cancelled by an equal negative margin), and
 * `box-decoration-break: clone` repeats it on every wrapped line.
 */
export function FoilText({ gradient, children }: { gradient: string; children: ReactNode }) {
  return (
    <span
      style={{
        backgroundImage: gradient,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        padding: '0.32em 0.42em',
        margin: '0 -0.42em',
        WebkitBoxDecorationBreak: 'clone',
        boxDecorationBreak: 'clone',
      }}
    >
      {children}
    </span>
  )
}

/**
 * The celebrated people's initials for a monogram: « Grâce & Éric » → G·E,
 * « Le Mariage de Léa et Gabriel » → L·G, a single name → its initial.
 * Leading formulae (« Le mariage de », « Les 30 ans de ») are skipped so the
 * crest carries names, never articles.
 */
export function monogramInitials(text: string): string[] {
  const cleaned = text
    .replace(/^.*?\b(?:de|d’|d')\s*(?=[A-ZÀ-Ý])/u, '')
    .trim()
  const parts = cleaned
    .split(/\s*(?:&|\bet\b|\+)\s*/iu)
    .map((part) => part.trim())
    .filter(Boolean)
  const initials = parts
    .slice(0, 2)
    .map((part) => part.match(/\p{L}/u)?.[0]?.toUpperCase() ?? '')
    .filter(Boolean)
  return initials.length ? initials : []
}

/** The first standalone number in a title (« Les 30 ans de Sarah » → "30"). */
export function titleNumber(text: string): string | null {
  const match = /(?:^|\D)(\d{1,3})(?=\D|$)/u.exec(text)
  return match ? match[1] : null
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
    return `linear-gradient(180deg in oklch, ${accentAlpha(paper, 0.62)}, ${accentAlpha(paper, 0.44)})`
  }
  const [r, g, b] = parseRgb(paper) ?? [246, 242, 234]
  const [vr, vg, vb] = parseRgb(veil) ?? [46, 38, 26]
  const tone = (f: number) => {
    // Paper shadow warmed ~45% toward the card's scrim hue: espresso, not grey.
    const mix = 0.45
    const rr = Math.round(r * f * (1 - mix) + vr * 0.85 * mix)
    const gg = Math.round(g * f * (1 - mix) + vg * 0.85 * mix)
    const bb = Math.round(b * f * (1 - mix) + vb * 0.85 * mix)
    return `rgba(${rr}, ${gg}, ${bb}, 0.58)`
  }
  return `linear-gradient(180deg in oklch, ${tone(0.32)}, ${tone(0.19)})`
}

/** The woven festive ribbon behind the plate: the card's accent, lit from the
 * top like satin. */
function ribbonGradient(accent: string | undefined): string {
  return `linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0) 42%, rgba(24,16,8,0.22)), linear-gradient(180deg in oklch, ${accentAlpha(accent, 0.8)}, ${accentAlpha(accent, 0.64)})`
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
  // A foil-gradient title is painted by an inner `FoilText` span so its
  // swashes are never cropped; the heading keeps the typographic settings.
  const foil =
    titleStyle?.backgroundClip === 'text' && typeof titleStyle.backgroundImage === 'string'
      ? titleStyle.backgroundImage
      : null
  const headingStyle: CSSProperties | undefined = foil
    ? Object.fromEntries(
        Object.entries(titleStyle ?? {}).filter(
          ([key]) => !['backgroundImage', 'WebkitBackgroundClip', 'backgroundClip', 'color'].includes(key),
        ),
      )
    : titleStyle
  // The cover names stay a caption on the photo, never a headline that hides
  // it: templates ask for 2.2–4.6em, the tile caps them at 2.4em and steps
  // long names down further.
  const asked = Number.parseFloat(String(headingStyle?.fontSize ?? '2.4em')) || 2.4
  const nameSize = Math.min(asked, 2.4) * (names.length > 22 ? 0.86 : 1)
  const darkPlate = luminanceOf(bandColor) < 0.62
  const nameStyle: CSSProperties = {
    ...headingStyle,
    fontSize: `${nameSize.toFixed(2)}em`,
    // A soft halo keeps the names legible on the lighter, see-through plate.
    textShadow:
      headingStyle?.textShadow ??
      (darkPlate ? '0 0.04em 0.35em rgba(10,6,2,0.55)' : '0 0 0.45em rgba(255,255,255,0.75)'),
  }
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
              className="absolute left-[-2.5em] top-1/2 h-[2.1em] w-[3em] -translate-y-1/2"
              style={{
                background: ribbonGradient(edgeColor),
                clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 0.9em 50%)',
                filter: `drop-shadow(0 0.35em 0.55em ${plaqueShadow(paperColor)})`,
              }}
            />
            <div
              aria-hidden="true"
              className="absolute right-[-2.5em] top-1/2 h-[2.1em] w-[3em] -translate-y-1/2"
              style={{
                background: ribbonGradient(edgeColor),
                clipPath: 'polygon(0 0, 100% 0, calc(100% - 0.9em) 50%, 100% 100%, 0 100%)',
                filter: `drop-shadow(0 0.35em 0.55em ${plaqueShadow(paperColor)})`,
              }}
            />
            <div
              aria-hidden="true"
              className="absolute left-[-0.15em] top-[calc(50%+0.9em)] h-[0.6em] w-[0.55em]"
              style={{ background: 'rgba(24,16,8,0.32)', clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }}
            />
            <div
              aria-hidden="true"
              className="absolute right-[-0.15em] top-[calc(50%+0.9em)] h-[0.6em] w-[0.55em]"
              style={{ background: 'rgba(24,16,8,0.32)', clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
            />
            {/* The tile: a plate in the card's own tone (dark engraved plate
                where the names are cream, light frosted plate where they are
                dark ink), framed in fine gold with corner diamonds. */}
            <div
              className="relative z-10 flex max-w-[21em] flex-col items-center px-[1.4em] py-[0.95em] text-center"
              style={{
                background: plateGradient(paperColor, bandColor),
                border: `1px solid ${accentAlpha(edgeColor, 0.75)}`,
                borderRadius: '0.5em',
                boxShadow: `inset 0 0 0 1px ${accentAlpha(edgeColor, 0.3)}, 0 0.8em 1.8em -0.8em ${plaqueShadow(paperColor)}`,
                // Frost the photo just behind the names (not the whole cover).
                backdropFilter: 'blur(3px)',
                WebkitBackdropFilter: 'blur(3px)',
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
                fontSize: '0.7em',
                letterSpacing: '0.42em',
                color: eyebrowColor ?? '#F5EDE0',
                opacity: 0.92,
                fontFamily: "'Montserrat', 'Inter', sans-serif",
                fontWeight: 500,
              }}
            >
              {eyebrow ?? 'Invitation'}
            </p>
            <span
              className="mt-[0.6em] flex items-center gap-[0.7em]"
              aria-hidden="true"
            >
              <span className="h-px w-[2.4em]" style={{ backgroundColor: edgeColor ?? 'rgba(226,194,124,0.85)' }} />
              <span
                className="inline-block h-[0.42em] w-[0.42em] rotate-45"
                style={{ backgroundColor: edgeColor ?? 'rgba(226,194,124,0.9)' }}
              />
              <span className="h-px w-[2.4em]" style={{ backgroundColor: edgeColor ?? 'rgba(226,194,124,0.85)' }} />
            </span>
            <h2
              className={`mt-[0.55em] w-full break-words text-balance leading-[1.08] ${titleClassName ?? ''}`}
              style={nameStyle}
            >
              {foil ? <FoilText gradient={foil}>{names}</FoilText> : names}
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
      {groupDressCode(draft.dressCode).map((group, groupIndex) => (
        <figure
          key={groupIndex}
          className={groupIndex === 0 ? 'mt-[1.8em]' : group.first ? 'mt-[2.2em]' : 'mt-[0.8em]'}
        >
          {/* One category, one row: photos shrink to share it (up to four). */}
          <div className="flex items-start justify-center gap-[0.8em]">
            {group.images.map((image, index) => (
              <img
                key={`${image.url}-${index}`}
                src={image.url}
                alt=""
                className="min-w-0 max-w-[10.5em] flex-1 rounded-[0.35em] object-cover"
                style={{ border: `1px solid ${accent}66`, aspectRatio: '3 / 4' }}
              />
            ))}
          </div>
          {group.caption && group.last ? (
            <figcaption
              className="mt-[0.7em] text-center text-[0.92em] italic leading-[1.45]"
              style={{ color: ink, opacity: 0.85 }}
            >
              {group.caption}
            </figcaption>
          ) : null}
        </figure>
      ))}
    </section>
  )
}

export interface DressCodeGroup {
  caption: string
  /** One row: at most DRESS_CODE_CATEGORY_MAX photos. */
  images: InvitationDraft['dressCode']
  /** First row of its category (where a label above it goes). */
  first: boolean
  /** Last row of its category (where a caption under it goes). */
  last: boolean
}

/**
 * Outfit categories, as photo rows. The organizer files up to four photos
 * under one caption (« Tenue des dames », « Tenue des messieurs »…); each
 * photo is still its own stored row carrying that caption, so consecutive
 * rows with the same caption form one category, shown on one row.
 *
 * Every template shares this rule. A category saved before the four-photo
 * limit, or a run of photos without any caption, is cut into rows of four
 * so no row ever holds more — one row per category in practice.
 */
export function groupDressCode(entries: InvitationDraft['dressCode']): DressCodeGroup[] {
  const categories: Array<{ caption: string; images: InvitationDraft['dressCode'] }> = []
  for (const entry of entries) {
    const caption = (entry.caption ?? '').trim()
    const last = categories[categories.length - 1]
    if (last && last.caption === caption) last.images.push(entry)
    else categories.push({ caption, images: [entry] })
  }
  return categories.flatMap(({ caption, images }) => {
    const rows: DressCodeGroup[] = []
    for (let i = 0; i < images.length; i += DRESS_CODE_CATEGORY_MAX) {
      rows.push({
        caption,
        images: images.slice(i, i + DRESS_CODE_CATEGORY_MAX),
        first: i === 0,
        last: i + DRESS_CODE_CATEGORY_MAX >= images.length,
      })
    }
    return rows
  })
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
