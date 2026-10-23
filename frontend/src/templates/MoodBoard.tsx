/**
 * « Mood Board » — reproduction of the editorial board in
 * `Downloads/IMG_9952.png`, `IMG_9953.png` and `IMG_9954.png`.
 *
 * White paper, black ink. A full-bleed couple photo carries a huge monoline
 * « Save the date » and melts into the paper, where a fine gold chain ring,
 * wrapped by black line-art roses, holds the thin serif monogram. Below: the
 * names in spaced capitals, the occasion in a large signature script, the
 * quote in small capitals with its author in bold, the month and the event
 * week with the day circled in red pen, then the board itself — « MoodBoard »,
 * « THÈME : TERRACOTTA » in condensed capitals, the colour palette as five
 * tall pills, the outfits as staggered photos under script labels with a
 * hand-drawn arrow, the rings flourish, the thanks, and the couple again
 * behind a torn-paper edge.
 */
import type { ReactNode } from 'react'

import { EngravedBouquet } from './engravedFlora.tsx'
import type { EngravedItem } from './engravedFlora.tsx'
import { monogramFrom } from './luxeMotifs.tsx'
import { messageFontCss } from './messageFonts.ts'
import { TemplateOrnament } from './ornaments.tsx'
import { InvitationPaper, ProgramSection, TableSection, isEmphasized } from './shared.tsx'
import type { TemplateProps } from './types.ts'

const PAPER = '#FFFFFF'
const INK = '#161616'
const SOFT = '#3A3A3A'
const CHAIN = '#C7A15A'
const PEN_RED = '#D3262E'

/** Monoline signature script, as on the reference board. */
const SIGNATURE = "'Ms Madi', 'Great Vibes', cursive"
/** Thin high-contrast serif for the monogram and the month. */
const DIDONE = "'Playfair Display', 'Bodoni Moda', Georgia, serif"
/** Condensed display capitals for the theme line. */
const CONDENSED = "'Oswald', 'Arial Narrow', sans-serif"
/** Humanist small capitals for the quote. */
const SANS = "'Montserrat', 'Inter', sans-serif"

/** The terracotta palette, sand to burnt orange, as on the board. */
const PALETTE = ['#C49A6C', '#FBE8CF', '#7E4535', '#5A3328', '#C47F45'] as const

const FRENCH_MONTHS = [
  'JANVIER', 'FÉVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN',
  'JUILLET', 'AOÛT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DÉCEMBRE',
] as const
const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] as const

function parseIso(iso: string): Date | null {
  const parts = iso.split('-').map(Number)
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return null
  return new Date(parts[0], parts[1] - 1, parts[2])
}

/* Black line-art roses climbing the ring: one spray up the left side, one
   across the lower right, like the reference monogram. */
const WREATH_LEFT: EngravedItem[] = [
  { k: 'stem', d: 'M 40 190 C 20 150, 20 90, 50 40' },
  { k: 'leaf', x: 30, y: 150, s: 0.55, r: -50 },
  { k: 'leaf', x: 26, y: 112, s: 0.5, r: -30 },
  { k: 'leaf', x: 40, y: 64, s: 0.45, r: 20 },
  { k: 'rose', x: 30, y: 96, s: 0.55, r: -20 },
  { k: 'rose', x: 52, y: 38, s: 0.6, r: 10 },
]
const WREATH_RIGHT: EngravedItem[] = [
  { k: 'stem', d: 'M 196 70 C 200 120, 180 170, 120 200' },
  { k: 'leaf', x: 196, y: 100, s: 0.5, r: 20 },
  { k: 'leaf', x: 186, y: 150, s: 0.5, r: 60 },
  { k: 'leaf', x: 140, y: 196, s: 0.45, r: 110 },
  { k: 'rose', x: 166, y: 178, s: 0.6, r: 12 },
]

function Monogram({ initials }: { initials: [string, string] }) {
  return (
    <div className="relative flex h-[15em] w-[15em] items-center justify-center">
      <svg viewBox="0 0 220 220" className="absolute inset-0 h-full w-full" aria-hidden="true" fill="none">
        {/* Gold chain: a fine ring of linked ovals. */}
        <circle cx="110" cy="110" r="88" stroke={CHAIN} strokeWidth="1.1" />
        <circle cx="110" cy="110" r="88" stroke={CHAIN} strokeWidth="2.6" strokeDasharray="2.2 1.6" opacity="0.55" />
        {/* A few loose dots, the scattered seeds of the reference. */}
        {[[60, 168], [70, 176], [52, 158], [150, 52], [160, 60]].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.3" fill={INK} />
        ))}
      </svg>
      <EngravedBouquet items={WREATH_LEFT} viewBox="0 0 220 220" ink={INK} strokeWidth={1} className="absolute inset-0 h-full w-full" />
      <EngravedBouquet items={WREATH_RIGHT} viewBox="0 0 220 220" ink={INK} strokeWidth={1} className="absolute inset-0 h-full w-full" />
      <span className="relative whitespace-nowrap leading-none" style={{ fontFamily: DIDONE, fontWeight: 400, fontSize: '5.4em', color: INK }}>
        {initials[0]}
        <span style={{ fontSize: '0.5em', margin: '0 0.02em', verticalAlign: '0.25em' }}>&amp;</span>
        {initials[1]}
      </span>
    </div>
  )
}

/** The hand-drawn red pen ring around the event day. */
function PenCircle() {
  return (
    <svg viewBox="0 0 60 64" className="pointer-events-none absolute -inset-[0.55em] h-[calc(100%+1.1em)] w-[calc(100%+1.1em)]" aria-hidden="true" fill="none">
      <path
        d="M 12 10 C 4 18, 3 40, 12 52 C 22 64, 44 61, 52 48 C 60 34, 55 12, 40 6 C 30 2, 20 4, 14 9"
        stroke={PEN_RED}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Month in spaced serif capitals, then the event's week, Monday first. */
function WeekStrip({ iso }: { iso: string }) {
  const date = parseIso(iso)
  if (!date) return null
  const monday = new Date(date)
  monday.setDate(date.getDate() - ((date.getDay() + 6) % 7))
  const days = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday)
    day.setDate(monday.getDate() + index)
    return day
  })
  return (
    <div className="mt-[2.2em] w-full max-w-[34em]">
      <p style={{ fontFamily: DIDONE, fontWeight: 700, fontSize: '1.9em', letterSpacing: '0.24em', color: INK }}>
        {FRENCH_MONTHS[date.getMonth()]}
      </p>
      <div className="mt-[1.1em] grid grid-cols-7 text-center" style={{ fontFamily: DIDONE, color: INK }}>
        {WEEKDAYS.map((name, index) => (
          <span key={name} className={index === 5 ? '' : 'italic'} style={{ fontSize: '1.4em' }}>
            {name}
          </span>
        ))}
        {days.map((day) => {
          const isEvent = day.getTime() === date.getTime()
          return (
            <span key={day.toISOString()} className="mt-[0.5em] flex justify-center">
              <span className="relative inline-block leading-none" style={{ fontSize: '1.75em' }}>
                {day.getDate()}
                {isEvent ? <PenCircle /> : null}
              </span>
            </span>
          )
        })}
      </div>
    </div>
  )
}

/** Little curling hand-drawn arrow hanging off a script label. */
function CurlArrow() {
  return (
    <svg viewBox="0 0 30 46" className="h-[3.4em] w-[2.2em]" aria-hidden="true" fill="none">
      <path
        d="M 4 4 C 18 6, 26 14, 20 22 C 15 28, 8 24, 12 19 C 16 14, 24 20, 22 30 C 21 35, 19 38, 17 41"
        stroke="#5D6B86"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path d="M 13 37 L 17 42 L 21 37" stroke="#5D6B86" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Script heading with the arrow tucked under its last letter. */
function BoardLabel({ children, size = '5em' }: { children: ReactNode; size?: string }) {
  return (
    <div className="relative inline-flex items-end">
      <p className="leading-none" style={{ fontFamily: SIGNATURE, fontSize: size, color: INK }}>
        {children}
      </p>
      <span className="-ml-[0.1em] translate-y-[2.4em]">
        <CurlArrow />
      </span>
    </div>
  )
}

/** Three photos running to the paper edges, the middle one smaller and set lower. */
function OutfitRow({ images }: { images: TemplateProps['draft']['dressCode'] }) {
  return (
    <div className="-mx-[2.6em] mt-[1.6em] grid w-[calc(100%+5.2em)] grid-cols-3 items-start gap-[0.8em]">
      {images.map((image, index) => {
        const middle = images.length === 3 && index === 1
        return (
          <figure key={`${image.url}-${index}`} className={middle ? 'mt-[1.4em] px-[0.4em]' : ''}>
            <img
              src={image.url}
              alt=""
              className="w-full object-cover"
              style={{ aspectRatio: middle ? '3 / 4.3' : '3 / 5' }}
            />
            {image.caption ? (
              <figcaption className="mt-[0.5em] text-[0.95em] leading-[1.4]" style={{ fontFamily: SANS, color: SOFT }}>
                {image.caption}
              </figcaption>
            ) : null}
          </figure>
        )
      })}
    </div>
  )
}

/** Wedding rings between two laurel sprigs, in black line. */
function RingsFlourish() {
  const sprig = (
    <g>
      <path d="M 4 30 C 30 22, 56 22, 78 30" />
      {[12, 26, 40, 54, 66].map((x, index) => (
        <g key={x}>
          <path d={`M ${x} ${27 - index * 0.4} c -3 -6, -1 -10, 3 -12 c 2 4, 1 9, -3 12 z`} />
          <path d={`M ${x + 2} ${28 - index * 0.4} c -2 6, 0 10, 5 11 c 1 -5, -1 -9, -5 -11 z`} />
        </g>
      ))}
    </g>
  )
  return (
    <svg viewBox="0 0 260 60" className="w-[19em]" aria-hidden="true" fill="none" stroke={INK} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
      {sprig}
      <g transform="translate(260 0) scale(-1 1)">{sprig}</g>
      <circle cx="120" cy="34" r="14" />
      <circle cx="120" cy="34" r="11" />
      <circle cx="140" cy="34" r="14" />
      <circle cx="140" cy="34" r="11" />
      <path d="M 124 12 l 6 -6 l 6 6 l -6 6 z M 130 6 v -4 M 122 8 l -3 -3 M 138 8 l 3 -3" />
    </svg>
  )
}

/** Torn paper edge laid over the closing photo. */
function TornEdge() {
  return (
    <svg viewBox="0 0 400 40" preserveAspectRatio="none" className="absolute inset-x-0 top-0 h-[3.2em] w-full" aria-hidden="true">
      <path
        d="M0 0 H400 V14 L388 22 L376 12 L362 26 L350 16 L336 30 L322 18 L310 24 L296 10 L282 22 L270 14 L256 28 L242 16 L228 22 L214 12 L200 26 L186 18 L172 30 L158 14 L146 22 L132 12 L118 26 L104 16 L90 24 L76 10 L62 22 L48 14 L34 28 L20 16 L8 22 L0 14 Z"
        fill={PAPER}
      />
    </svg>
  )
}

/** Splits « quote — author » so the author can sit on its own bold line. */
function splitQuote(note: string): [string, string | null] {
  // Spaced dashes only: hyphenated names (Saint-Exupéry) stay whole.
  const match = note.match(/^(.*)\s[—–]\s(.+)$/s)
  return match ? [match[1].trim(), match[2].trim()] : [note.trim(), null]
}

/* ================================================================== */
export function MoodBoard({ draft }: TemplateProps) {
  const titleEm = isEmphasized(draft, 'title')
  const venueEm = isEmphasized(draft, 'venue')
  const initials = monogramFrom(draft.title)
  const dressCode = draft.dressCode
  const mid = Math.ceil(dressCode.length / 2)
  const women = dressCode.slice(0, mid)
  const men = dressCode.slice(mid)
  const [quote, author] = draft.note ? splitQuote(draft.note) : ['', null]

  return (
    <InvitationPaper style={{ backgroundColor: PAPER, color: INK }}>
      {/* Cover: full-bleed photo, huge « Save the date », melting to white. */}
      {draft.cover_url ? (
        <div data-export-skip="cover" className="relative z-20 w-full shrink-0 overflow-hidden" style={{ aspectRatio: '4 / 5.4' }}>
          <img src={draft.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div
            className="pointer-events-none absolute inset-x-0 -bottom-px h-[46%]"
            style={{ background: `linear-gradient(to bottom, transparent, rgba(255,255,255,0.7) 45%, ${PAPER} 82%)` }}
            aria-hidden="true"
          />
          <p
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-[3%] whitespace-nowrap text-center leading-none"
            style={{ fontFamily: SIGNATURE, fontSize: '7.2em', color: '#FFFFFF', textShadow: '0 0.04em 0.25em rgba(0,0,0,0.35)' }}
          >
            Save the date
          </p>
        </div>
      ) : (
        <p aria-hidden="true" className="mt-[0.4em] whitespace-nowrap text-center leading-none" style={{ fontFamily: SIGNATURE, fontSize: '7.2em', color: INK }}>
          Save the date
        </p>
      )}

      <div className="relative z-30 flex flex-1 flex-col items-center px-[2.6em] pb-[0] text-center">
        {initials ? (
          <div className={draft.cover_url ? '-mt-[12.5em]' : 'mt-[1em]'}>
            <Monogram initials={initials} />
          </div>
        ) : null}

        <h1
          className="mt-[0.6em] break-words text-balance uppercase leading-[1.3]"
          style={{ fontFamily: DIDONE, fontWeight: 600, fontSize: titleEm ? '1.9em' : '1.6em', letterSpacing: '0.32em', color: INK }}
        >
          {draft.title}
        </h1>

        {draft.message ? (
          <p
            className="mt-[0.15em] break-words leading-[1.05]"
            style={{ fontFamily: messageFontCss(draft.messageFont) ?? SIGNATURE, fontSize: '5.4em', color: INK }}
          >
            {draft.message}
          </p>
        ) : null}

        {draft.guestName?.trim() ? (
          <p className="mt-[0.6em] italic" style={{ fontFamily: DIDONE, fontSize: '1.25em', color: SOFT }}>
            {draft.guestName}
          </p>
        ) : null}

        {quote ? (
          <div className="mt-[1.4em] max-w-[34em]" style={{ fontFamily: SANS, color: SOFT }}>
            <p className="leading-[1.9]" style={{ fontSize: '1.22em', fontVariant: 'small-caps', letterSpacing: '0.02em' }}>
              {quote}
            </p>
            {author ? (
              <p className="mt-[0.2em] font-semibold" style={{ fontSize: '1.22em', fontVariant: 'small-caps', color: INK }}>
                {author}
              </p>
            ) : null}
          </div>
        ) : null}

        <WeekStrip iso={draft.event_date} />

        {draft.event_time ? (
          <p className="mt-[1.4em] uppercase" style={{ fontFamily: SANS, fontSize: '1em', letterSpacing: '0.32em', color: SOFT }}>
            à {draft.event_time.slice(0, 5).replace(':', 'h')}
          </p>
        ) : null}
        {draft.venue_name || draft.venue_address ? (
          <div className="mt-[0.9em]" style={{ fontFamily: DIDONE, fontSize: venueEm ? '1.45em' : '1.3em', lineHeight: 1.55, color: INK }}>
            {draft.venue_name ? <p className="font-semibold">{draft.venue_name}</p> : null}
            {draft.venue_address ? <p style={{ color: SOFT }}>{draft.venue_address}</p> : null}
            {draft.venue_details ? <p className="italic" style={{ color: SOFT }}>{draft.venue_details}</p> : null}
          </div>
        ) : null}

        {/* The board. */}
        <p className="mt-[1.4em] leading-none" style={{ fontFamily: SIGNATURE, fontSize: '5.6em', color: INK }}>
          MoodBoard
        </p>
        <p className="mt-[0.35em] uppercase" style={{ fontFamily: CONDENSED, fontWeight: 600, fontSize: '3em', letterSpacing: '0.01em', color: INK }}>
          Thème :{' '}<span style={{ fontWeight: 400 }}>Terracotta</span>
        </p>

        <div className="mt-[1.4em]">
          <BoardLabel size="4.4em">Palette de couleurs</BoardLabel>
        </div>
        <div className="mt-[2.2em] flex w-full max-w-[32em] justify-between gap-[1.4em]" aria-hidden="true">
          {PALETTE.map((color) => (
            <span key={color} className="h-[15em] flex-1 rounded-full" style={{ backgroundColor: color }} />
          ))}
        </div>

        {women.length ? (
          <div className="mt-[3em] flex w-full flex-col items-center">
            <BoardLabel>Outfit Women&rsquo;s</BoardLabel>
            <OutfitRow images={women} />
          </div>
        ) : null}
        {men.length ? (
          <div className="mt-[2.6em] flex w-full flex-col items-center">
            <BoardLabel>Outfit men&rsquo;s</BoardLabel>
            <OutfitRow images={men} />
          </div>
        ) : null}

        <ProgramSection draft={draft} accent={INK} ink={INK} ornament={<TemplateOrnament templateKey="mood-board" color={INK} />} />
        <TableSection draft={draft} accent={INK} ink={INK} ornament={<TemplateOrnament templateKey="mood-board" color={INK} />} />

        <div className="mt-[3em] flex w-full flex-col items-center">
          <RingsFlourish />
          <p className="mt-[1.2em] max-w-[34em] text-pretty leading-[1.45]" style={{ fontFamily: SANS, fontSize: '1.08em', color: INK, letterSpacing: '-0.01em' }}>
            Nous sommes ravis de vous convier à notre mariage et vous remercions chaleureusement de votre présence. Votre
            soutien et votre amour sont essentiels pour nous.
          </p>
          <p className="mt-[1em]" style={{ fontFamily: SANS, fontSize: '1.08em', color: INK }}>
            Merci d&rsquo;avance de partager ce moment de bonheur avec nous&nbsp;!
          </p>
        </div>

        {/* Closing photo behind a torn-paper edge (bleeds to the frame). */}
        {draft.cover_url ? (
          <div className="relative -mx-[2.6em] mt-[2.4em] w-[calc(100%+5.2em)] overflow-hidden" style={{ aspectRatio: '16 / 10' }}>
            <img src={draft.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover object-top" />
            <TornEdge />
          </div>
        ) : (
          <div className="pb-[3em]" />
        )}
      </div>
    </InvitationPaper>
  )
}
