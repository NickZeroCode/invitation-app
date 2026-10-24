/**
 * « Mood Board » — the editorial board of `Downloads/IMG_9952.png`,
 * `IMG_9953.png` and `IMG_9954.png`, reproduced to its measurements.
 *
 * Every size below was taken from the reference as a fraction of the sheet
 * width W and converted to the paper's em (1em = 0.026W), using the faces
 * the board is set in: a tall upright signature script (Allison, with the
 * plainer Ms Madi ampersand of the reference), Didot capitals
 * for the monogram (Bodoni Moda), spaced old-style capitals for the names
 * (Cormorant Garamond), Gill Sans small capitals for the quote and the thanks
 * (Cabin), Times for the calendar (Tinos) and condensed gothic capitals for
 * the theme line (Antonio).
 *
 * Top to bottom: a 1.6W couple photo under a white veil carrying « Save the
 * date » (0.80W), the chain-ring monogram (ring 0.38W) at 78 % of the photo,
 * the names (0.345W) on the veil — both from the cover text —; then on white
 * the event title in the script (0.83W), the message as plain text, the
 * the month and the event week with the day circled in red pen,
 * « MoodBoard », the theme line (0.52W) and the palette (0.086W × 0.345W
 * pills) — both editable, kept in display_config.board —, the outfit
 * categories, each one photo row (up to four) running edge to edge under
 * script labels with a hand-drawn arrow, the rings, the thanks and the
 * couple again behind a torn-paper edge.
 */
import type { ReactNode } from 'react'

import { monogramFrom } from './luxeMotifs.tsx'
import { messageFontCss } from './messageFonts.ts'
import { TemplateOrnament } from './ornaments.tsx'
import { MOOD_BOARD_DEFAULTS } from './moodBoardDefaults.ts'
import { InvitationPaper, ProgramSection, TableSection, groupDressCode, isEmphasized } from './shared.tsx'
import type { TemplateProps } from './types.ts'

const PAPER = '#FFFFFF'
const INK = '#111111'
const CHAIN = '#8E6A3C'
const PEN_RED = '#D52A2F'

/**
 * The text-size setting (`--invitation-scale`) enlarges reading text; the
 * board's display pieces — « Save the date » and the palette — keep their
 * proportions on the sheet whatever the setting, so they never crowd it.
 */
const UNSCALED = 'calc(1em / var(--invitation-scale, 1))'
const SAVE_THE_DATE_SIZE = 'calc(8.6em / var(--invitation-scale, 1))'
const ARROW_BLUE = '#5B79A6'

const SIGNATURE = "'Allison', 'Ms Madi', 'Great Vibes', cursive"
/** The reference's ampersand is plain and small; Allison's is a raised swash. */
const AMPERSAND = "'Ms Madi', 'Great Vibes', cursive"
const DIDOT = "'Bodoni Moda', 'Didot', 'Playfair Display', serif"
const CAPS = "'Cormorant Garamond', 'Cormorant', Georgia, serif"
const GILL = "'Gill Sans', 'Gill Sans MT', 'Cabin', 'Lato', sans-serif"
const TIMES = "'Tinos', 'Times New Roman', Times, serif"
const GOTHIC = "'Antonio', 'League Gothic', 'Oswald', 'Arial Narrow', sans-serif"

const FRENCH_MONTHS = [
  'JANVIER', 'FÉVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN',
  'JUILLET', 'AOÛT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DÉCEMBRE',
] as const
/** As set on the board: Lun, Mar, Mer and Ven in italic; Jeu, Sam, Dim upright. */
const WEEKDAYS = [
  ['Lun', true], ['Mar', true], ['Mer', true], ['Jeu', false], ['Ven', true], ['Sam', false], ['Dim', false],
] as const

function parseIso(iso: string): Date | null {
  const parts = iso.split('-').map(Number)
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return null
  return new Date(parts[0], parts[1] - 1, parts[2])
}

/* ------------------------------------------------------------ monogram */

/** Chain ring: small links set along the circle, alternately face-on and edge-on. */
function ChainRing() {
  const links: ReactNode[] = []
  const count = 96
  for (let i = 0; i < count; i += 1) {
    const angle = (360 / count) * i
    // Links overlap their neighbours: face-on ovals alternating with
    // edge-on bars, the rope-like chain of the reference.
    links.push(
      <ellipse
        key={i}
        cx="0"
        cy="-88"
        rx={i % 2 ? 1 : 3.4}
        ry={i % 2 ? 2 : 1.6}
        transform={`rotate(${angle})`}
        stroke={CHAIN}
        strokeWidth="0.85"
        fill="none"
      />,
    )
  }
  return <g transform="translate(110 110)">{links}</g>
}

/** Black line flora of the reference: two rose silhouettes and buds climbing
 * the left of the ring, a berry branch, an open flower and a leaf at the
 * lower right, a scatter of seeds at the bottom. */
function RingFlora() {
  return (
    <g stroke={INK} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" fill="none">
      {/* left spray, riding the ring from ten o'clock down to seven */}
      <g transform="translate(-26 8)">
      <path d="M 66 182 C 46 150, 44 104, 56 70 C 62 52, 70 40, 76 30" />
      <path d="M 54 92 C 44 86, 40 78, 41 70" />
      <path d="M 50 128 C 40 124, 35 116, 36 108" />
      <path d="M 52 150 C 44 150, 38 146, 36 140" />
      {/* top rose: filled silhouette, white folds */}
      <path d="M 66 30 C 58 24, 58 12, 63 5 L 70 12 L 77 2 L 84 12 L 91 5 C 96 12, 96 24, 88 30 C 84 35, 70 35, 66 30 Z" fill={INK} />
      <path d="M 70 15 C 70 22, 73 27, 77 30 C 81 27, 84 22, 84 15" stroke="#FFFFFF" strokeWidth="0.9" />
      <path d="M 66 30 C 58 30, 54 26, 54 20 M 88 30 C 96 31, 100 27, 100 21" />
      {/* second rose, outlined, half way down */}
      <path d="M 60 72 C 54 66, 55 56, 63 52 C 66 57, 70 57, 73 52 C 81 56, 82 66, 76 72 C 72 76, 64 76, 60 72 Z" />
      <path d="M 63 58 C 61 64, 64 70, 68 72 M 73 58 C 75 64, 72 70, 68 72" />
      {/* buds and leaf outlines */}
      <path d="M 41 70 C 37 64, 38 58, 42 55 C 46 58, 46 64, 41 70 Z" />
      <path d="M 36 108 C 32 102, 33 96, 37 93 C 41 96, 41 102, 36 108 Z" />
      <path d="M 36 140 C 31 136, 30 130, 33 126 C 38 128, 39 134, 36 140 Z" />
      <path d="M 56 112 C 64 104, 74 104, 78 108 C 72 116, 62 118, 56 112 Z" />
      <path d="M 56 112 L 76 108" strokeWidth="0.6" />
      </g>
      {/* lower-right berry branch */}
      <path d="M 150 196 C 170 186, 186 166, 194 140 C 198 126, 198 112, 196 100" />
      {[
        [196, 104, -30], [192, 118, 40], [198, 128, -40], [190, 140, 50], [196, 150, -50], [182, 156, 40], [186, 168, -60],
      ].map(([x, y, r]) => (
        <path key={`${x}-${y}`} d="M 0 0 C -3 -4, -3 -9, 0 -12 C 3 -9, 3 -4, 0 0 Z" fill={INK} transform={`translate(${x} ${y}) rotate(${r})`} />
      ))}
      {[[202, 100], [204, 112], [200, 92]].map(([x, y]) => (
        <circle key={`b-${x}-${y}`} cx={x} cy={y} r="2.2" fill={INK} stroke="none" />
      ))}
      {/* open five-petal flower */}
      <g transform="translate(168 182)">
        {[0, 72, 144, 216, 288].map((a) => (
          <path key={a} d="M 0 0 C -7 -4, -8 -14, 0 -17 C 8 -14, 7 -4, 0 0 Z" transform={`rotate(${a})`} fill="#FFFFFF" />
        ))}
        <circle r="3" fill="#FFFFFF" />
        <path d="M -1.5 -1 l 3 2 M 1.5 -1 l -3 2" strokeWidth="0.7" />
      </g>
      {/* single leaf */}
      <path d="M 138 200 C 134 190, 136 180, 142 174 C 148 182, 146 194, 138 200 Z" fill="#FFFFFF" />
      <path d="M 138 200 C 139 190, 140 182, 142 175" strokeWidth="0.6" />
      {/* seeds */}
      {[[60, 160], [70, 166], [56, 170], [80, 176], [92, 190], [102, 196], [120, 198], [112, 200]].map(([x, y]) => (
        <circle key={`s-${x}-${y}`} cx={x} cy={y} r="1.4" fill={INK} stroke="none" />
      ))}
    </g>
  )
}

/** Ring 0.38W across; the monogram cap height is 0.198W (7.6em). */
function Monogram({ initials }: { initials: [string, string] }) {
  return (
    <div className="relative flex h-[18.3em] w-[18.3em] items-center justify-center">
      <svg viewBox="0 0 220 220" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <ChainRing />
        <RingFlora />
      </svg>
      <span
        className="relative flex items-end leading-none"
        style={{ fontFamily: DIDOT, fontWeight: 400, fontSize: '10.15em', color: INK }}
      >
        <span>{initials[0]}</span>
        <span className="relative -mx-[0.06em] mb-[0.12em]" style={{ fontSize: '0.34em' }}>
          &amp;
        </span>
        <span className="translate-y-[0.08em]">{initials[1]}</span>
      </span>
    </div>
  )
}

/* ------------------------------------------------------------ calendar */

/** Red pen ring around the event day: taller than wide, open at the top
 * left where the pen started. */
function PenCircle() {
  return (
    <svg
      viewBox="0 0 80 130"
      className="pointer-events-none absolute left-1/2 top-1/2 h-[2.6em] w-[1.6em] -translate-x-1/2 -translate-y-1/2"
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M 22 10 C 6 24, 2 66, 10 94 C 18 122, 52 128, 66 104 C 80 80, 78 34, 62 14 C 52 2, 32 2, 20 12 M 12 20 C 8 32, 8 46, 10 56"
        stroke={PEN_RED}
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Month in bold spaced Times capitals, then the event's week, Monday first. */
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
    <div className="mt-[2.4em] flex w-full flex-col items-center" style={{ fontFamily: TIMES, color: INK }}>
      <p style={{ fontWeight: 700, fontSize: '1.45em', letterSpacing: '0.25em', lineHeight: 1 }}>
        {FRENCH_MONTHS[date.getMonth()]}
      </p>
      <div className="mt-[1.9em] grid w-[29.2em] grid-cols-7 text-center leading-none">
        {WEEKDAYS.map(([name, italic]) => (
          <span key={name} className={italic ? 'italic' : ''} style={{ fontSize: '1.22em' }}>
            {name}
          </span>
        ))}
        {days.map((day) => {
          const isEvent = day.getTime() === date.getTime()
          return (
            <span key={day.toISOString()} className="mt-[1.45em] flex justify-center">
              <span className="relative inline-block" style={{ fontSize: '1.63em' }}>
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

/* ---------------------------------------------------------- the board */

/** The little looping blue arrow hanging from the end of a script label. */
function CurlArrow({ up = false }: { up?: boolean }) {
  return (
    <svg
      viewBox="0 0 34 64"
      className="h-[2.9em] w-[1.55em]"
      aria-hidden="true"
      fill="none"
      style={up ? { transform: 'scaleY(-1)' } : undefined}
    >
      <path
        d="M 2 4 C 14 4, 26 10, 28 20 C 30 30, 18 34, 14 28 C 10 22, 20 16, 26 24 C 30 30, 26 42, 22 54"
        stroke={ARROW_BLUE}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path d="M 17 49 L 22 56 L 28 50" stroke={ARROW_BLUE} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Signature-script text whose ampersands use the reference's plain form. */
function ScriptText({ text }: { text: string }) {
  const parts = text.split('&')
  return (
    <>
      {parts.map((part, index) => (
        <span key={index}>
          {index > 0 ? <span style={{ fontFamily: AMPERSAND, fontSize: '0.8em' }}>&amp;</span> : null}
          {part}
        </span>
      ))}
    </>
  )
}

/** Script heading with the arrow tucked under its last letter. */
function BoardLabel({ children, size, arrow = 'down' }: { children: ReactNode; size: string; arrow?: 'down' | 'up' }) {
  return (
    <div className="relative inline-block">
      <p className="whitespace-nowrap leading-[1.1]" style={{ fontFamily: SIGNATURE, fontSize: size, color: INK }}>
        {typeof children === 'string' ? <ScriptText text={children} /> : children}
      </p>
      {/* Down under a heading; up when the label sits under its photos. */}
      <span className={`absolute -right-[1.2em] ${arrow === 'up' ? 'bottom-[45%]' : 'top-[55%]'}`}>
        <CurlArrow up={arrow === 'up'} />
      </span>
    </div>
  )
}

/** One outfit category = one row (up to four photos) running to the sheet
 * edges, 0.009W apart. Photos keep the reference's width (0.33W) until more
 * than three share the row; every second photo is shorter and set lower,
 * as the middle one of the reference's three. */
function OutfitRow({ images, first }: { images: TemplateProps['draft']['dressCode']; first: boolean }) {
  const slots = Math.max(images.length, 3)
  return (
    <div
      className={`-mx-[2.6em] ${first ? 'mt-[0.4em]' : 'mt-[0.35em]'} flex w-[calc(100%+5.2em)] items-start justify-center gap-[0.35em] px-[0.3em]`}
    >
      {images.map((image, index) => {
        const inset = index % 2 === 1
        return (
          <img
            key={`${image.url}-${index}`}
            src={image.url}
            alt={image.caption || ''}
            className="min-w-0 object-cover"
            style={{
              width: `calc((100% - ${(slots - 1) * 0.35}em) / ${slots})`,
              aspectRatio: inset ? '294 / 408' : '302 / 480',
              marginTop: inset ? '1.35em' : undefined,
            }}
          />
        )
      })}
    </div>
  )
}

/** Wedding rings with a sparkle, between two leafy sprigs (0.38W). */
function RingsFlourish() {
  const sprig = (
    <g>
      <path d="M 6 32 C 30 24, 58 24, 84 32" />
      {[14, 28, 42, 56, 70].map((x) => (
        <g key={x}>
          <path d={`M ${x} 29 c -2 -6, 0 -11, 5 -12 c 1 5, -1 10, -5 12 z`} />
          <path d={`M ${x + 3} 30 c -1 6, 2 10, 7 10 c 0 -5, -3 -9, -7 -10 z`} />
          <path d={`M ${x + 2} 29 c 2 -2, 4 -2, 6 -1`} />
        </g>
      ))}
    </g>
  )
  return (
    <svg viewBox="0 0 280 64" className="w-[14.6em]" aria-hidden="true" fill="none" stroke={INK} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      {sprig}
      <g transform="translate(280 0) scale(-1 1)">{sprig}</g>
      <circle cx="130" cy="36" r="15" />
      <circle cx="130" cy="36" r="12" />
      <circle cx="150" cy="36" r="15" />
      <circle cx="150" cy="36" r="12" />
      <path d="M 134 14 l 6 -6 l 6 6 l -6 6 z" />
      <path d="M 140 4 v -3 M 131 7 l -3 -3 M 149 7 l 3 -3" strokeWidth="0.9" />
    </svg>
  )
}

/** Torn white paper over the closing photo: ragged ridges, a soft shadow. */
function TornEdge() {
  const ridge =
    'M0 0 H400 V30 L392 34 L384 26 L373 31 L366 22 L356 27 L345 16 L336 24 L326 19 L314 29 L305 24 L296 33 L286 27 L276 31 ' +
    'L266 20 L256 26 L247 14 L238 21 L228 18 L219 27 L208 23 L198 32 L189 26 L178 30 L168 21 L160 25 L150 15 L140 22 ' +
    'L131 19 L121 28 L110 24 L101 32 L92 27 L82 30 L72 20 L63 24 L53 13 L44 21 L35 18 L26 28 L16 24 L8 31 L0 27 Z'
  return (
    <svg viewBox="0 0 400 40" preserveAspectRatio="none" className="absolute inset-x-0 top-0 h-[3.6em] w-full" aria-hidden="true">
      <path d={ridge} fill="rgba(0,0,0,0.18)" transform="translate(0 2)" />
      <path d={ridge} fill={PAPER} />
    </svg>
  )
}

/** Splits « quote — author » so the author can sit on its own bold line.
 * Spaced dashes only: hyphenated names (Saint-Exupéry) stay whole. */
function splitQuote(note: string): [string, string | null] {
  const match = note.match(/^(.*)\s[—–]\s(.+)$/s)
  return match ? [match[1].trim(), match[2].trim()] : [note.trim(), null]
}

/* ================================================================== */
export function MoodBoard({ draft }: TemplateProps) {
  const titleEm = isEmphasized(draft, 'title')
  const venueEm = isEmphasized(draft, 'venue')
  // The ring and the names under it come from the cover text (« Texte sur
  // l'image de couverture »); the event title takes the script line.
  const coverNames = draft.coverTitle.trim()
  const initials = coverNames ? monogramFrom(coverNames) : null
  const board = draft.board ?? MOOD_BOARD_DEFAULTS
  const theme = board.theme.trim()
  const [quote, author] = draft.note ? splitQuote(draft.note) : ['', null]

  // Outfit categories: the organizer's captions become the script labels.
  // Photos filed without any caption keep the board's two default rows.
  // One category = one row, exactly as filed by the organizer; a category
  // without a caption keeps the board's script label « Outfit ».
  const outfits = groupDressCode(draft.dressCode).map((group) => ({ ...group, caption: group.caption || 'Outfit' }))

  return (
    <InvitationPaper style={{ backgroundColor: PAPER, color: INK }}>
      {/* Cover: the couple, 1.6W tall, under a white veil that thickens
          toward a hard bottom edge — the board's look, not a soft fade. */}
      {draft.cover_url ? (
        <div data-export-skip="cover" className="relative z-20 w-full shrink-0 overflow-hidden" style={{ aspectRatio: '1 / 1.6' }}>
          <img src={draft.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, transparent 58%, rgba(255,255,255,0.35) 76%, rgba(255,255,255,0.62) 100%)' }}
            aria-hidden="true"
          />
          <p
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-[1.2%] whitespace-nowrap text-center leading-none"
            style={{ fontFamily: SIGNATURE, fontSize: SAVE_THE_DATE_SIZE, color: '#FFFFFF' }}
          >
            Save the date
          </p>
        </div>
      ) : (
        <p aria-hidden="true" className="mt-[0.5em] whitespace-nowrap text-center leading-none" style={{ fontFamily: SIGNATURE, fontSize: SAVE_THE_DATE_SIZE, color: INK }}>
          Save the date
        </p>
      )}

      <div className="relative z-30 flex flex-1 flex-col items-center px-[2.6em] text-center">
        {/* Monogram centred at 78 % of the photo; the names sit on the veil. */}
        {initials ? (
          <div className={draft.cover_url ? '-mt-[22.6em]' : 'mt-[0.6em]'}>
            <Monogram initials={initials} />
          </div>
        ) : null}
        {coverNames ? (
          <p
            className="mt-[0.4em] break-words text-balance uppercase leading-[1.2]"
            style={{ fontFamily: CAPS, fontWeight: 600, fontSize: '1.2em', letterSpacing: '0.35em', color: INK }}
          >
            {coverNames}
          </p>
        ) : null}

        <h1
          className={`${coverNames ? 'mt-[0.2em]' : 'mt-[0.6em]'} break-words text-balance leading-[1.1]`}
          style={{ fontFamily: SIGNATURE, fontWeight: 400, fontSize: titleEm ? '5.4em' : '4.84em', color: INK }}
        >
          <span className="sr-only">{draft.title}</span>
          <span aria-hidden="true">
            <ScriptText text={draft.title} />
          </span>
        </h1>

        {/* The guest is addressed first, then the organizer's message. */}
        {draft.guestName?.trim() ? (
          <p className="mt-[0.8em] italic" style={{ fontFamily: TIMES, fontSize: '1.2em' }}>
            {draft.guestName}
          </p>
        ) : null}

        {draft.message ? (
          <p
            className={`${draft.guestName?.trim() ? 'mt-[0.6em]' : 'mt-[0.9em]'} max-w-[30em] whitespace-pre-line text-pretty break-words leading-[1.6]`}
            style={{ fontFamily: messageFontCss(draft.messageFont) ?? GILL, fontSize: '1.15em', color: INK }}
          >
            {draft.message}
          </p>
        ) : null}

        <WeekStrip iso={draft.event_date} />

        {/* The board. */}
        <p className="mt-[0.7em] whitespace-nowrap leading-[1.2]" style={{ fontFamily: SIGNATURE, fontSize: '4.4em', color: INK }}>
          MoodBoard
        </p>
        {theme ? (
          <p className="mt-[0.93em] break-words uppercase leading-none" style={{ fontFamily: GOTHIC, fontSize: '2.86em', color: INK }}>
            <span style={{ fontWeight: 700 }}>Thème :</span> <span style={{ fontWeight: 400 }}>{theme}</span>
          </p>
        ) : null}
        {board.palette.length ? (
          <div className="flex flex-col items-center" style={{ fontSize: UNSCALED }}>
            <div className="mt-[1.3em]">
              <BoardLabel size="3.1em">Palette de couleurs</BoardLabel>
            </div>
            <div className="mt-[3.4em] flex gap-[1.8em]" role="list" aria-label="Palette de couleurs">
              {board.palette.map((color, index) => (
                <span
                  key={`${color}-${index}`}
                  role="listitem"
                  aria-label={color}
                  className="block h-[11.2em] w-[2.8em] rounded-full"
                  style={{ backgroundColor: color, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)' }}
                />
              ))}
            </div>
          </div>
        ) : null}

        {outfits.map((group, index) => (
          <div key={`${group.caption}-${index}`} className={`flex w-full flex-col items-center ${index === 0 ? 'mt-[3.2em]' : group.first ? 'mt-[1.6em]' : ''}`}>
            <OutfitRow images={group.images} first={group.first} />
            {group.caption && group.last ? (
              <div className="mt-[0.35em]">
                <BoardLabel size="4.7em" arrow="up">
                  {group.caption}
                </BoardLabel>
              </div>
            ) : null}
          </div>
        ))}

        {/* Time and place: the board carries none up top, so they close it. */}
        {draft.event_time || draft.venue_name || draft.venue_address ? (
          <div className="mt-[2.2em]" style={{ fontFamily: TIMES, fontSize: venueEm ? '1.35em' : '1.22em', lineHeight: 1.5, color: INK }}>
            {draft.event_time ? <p>à {draft.event_time.slice(0, 5).replace(':', 'h')}</p> : null}
            {draft.venue_name ? <p style={{ fontWeight: 700 }}>{draft.venue_name}</p> : null}
            {draft.venue_address ? <p>{draft.venue_address}</p> : null}
            {draft.venue_details ? <p className="italic">{draft.venue_details}</p> : null}
          </div>
        ) : null}

        <ProgramSection draft={draft} accent={INK} ink={INK} ornament={<TemplateOrnament templateKey="mood-board" color={INK} />} />
        <TableSection draft={draft} accent={INK} ink={INK} ornament={<TemplateOrnament templateKey="mood-board" color={INK} />} />

        <div className="mt-[1.4em] flex w-full flex-col items-center" style={{ fontFamily: GILL, color: INK }}>
          <RingsFlourish />
          <p className="mt-[0.9em] max-w-[33.8em] text-pretty leading-[1.3]" style={{ fontSize: '1.08em', letterSpacing: '-0.015em' }}>
            Nous sommes ravis de vous convier à notre mariage et vous remercions chaleureusement de votre présence. Votre
            soutien et votre amour sont essentiels pour nous.
          </p>
          <p className="mt-[1.1em]" style={{ fontSize: '1.08em', letterSpacing: '-0.015em' }}>
            Merci d&rsquo;avance de partager ce moment de bonheur avec nous&nbsp;!
          </p>
        </div>

        {/* The organizer's note closes the sheet. */}
        {quote ? (
          <div className="mt-[1.6em] max-w-[19.8em]" style={{ fontFamily: GILL, fontSize: '1.13em', fontVariant: 'small-caps', lineHeight: 1.75, color: INK }}>
            <p>{quote}</p>
            {author ? <p style={{ fontWeight: 600 }}>{author}</p> : null}
          </div>
        ) : null}

        {/* Closing photo behind a torn-paper edge, full bleed. */}
        {draft.cover_url ? (
          <div className="relative -mx-[2.6em] mt-[1.6em] w-[calc(100%+5.2em)] overflow-hidden" style={{ aspectRatio: '1160 / 700' }}>
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
