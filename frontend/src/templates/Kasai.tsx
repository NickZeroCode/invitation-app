/**
 * « Kasaï » — an original reading of Kuba raffia textiles from the Kasaï
 * (DRC): interlaced chevron bands, stepped lozenges and pocketed diamonds in
 * earth pigments on a woven raffia ground.
 *
 * The geometry is drawn for NickEvents (no textile is reproduced): a woven
 * ribbon zig-zags between two rules, each pocket holding a lozenge in
 * alternating ochre and rust, the way Kuba weavers break a repeat on purpose.
 * Ornament stays at the edges — a header band, a crest, a closing band — so
 * the names and the practical details keep a calm, generous field.
 */
import type { CSSProperties } from 'react'

import {
  CoverHero,
  DressCodeSection,
  InvitationPaper,
  NoteSection,
  ProgramSection,
  TableSection,
  formatDayNumber,
  formatEventTime,
  formatMonthYear,
  formatWeekday,
  guestLabel,
  isEmphasized,
  monogramInitials,
} from './shared.tsx'
import type { TemplateProps } from './types.ts'
import { messageFontCss } from './messageFonts.ts'
import { TemplateOrnament } from './ornaments.tsx'

export const KASAI_PAPER = '#EFE3CB'
export const KASAI_INK = '#2B1E14'
export const KASAI_OCHRE = '#B5702A'
export const KASAI_RUST = '#8C3A21'
const EARTH = '#4A3626'

const SERIF = "'Cormorant Garamond', 'Playfair Display', Georgia, serif"
const SANS = "'Montserrat', 'Inter', sans-serif"

/**
 * One 48×28 repeat of the interlace band: rules top and bottom, a woven
 * ribbon (ochre body, earth core line) zig-zagging between them, lozenges in
 * the pockets. Two units per tile so the ochre/rust alternation reads as a
 * deliberate break rather than a mechanical repeat.
 */
const BAND_SVG = [
  '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="28" viewBox="0 0 96 28">',
  `<g fill="none" stroke="${EARTH}" stroke-width="1.3">`,
  '<path d="M0 1.2H96M0 26.8H96"/><path d="M0 3.6H96M0 24.4H96" stroke-width="0.6"/></g>',
  `<path d="M0 21L12 7L24 21L36 7L48 21L60 7L72 21L84 7L96 21" fill="none" stroke="${KASAI_OCHRE}" stroke-width="5" stroke-linejoin="miter"/>`,
  `<path d="M0 21L12 7L24 21L36 7L48 21L60 7L72 21L84 7L96 21" fill="none" stroke="${EARTH}" stroke-width="0.9"/>`,
  `<g fill="${EARTH}"><path d="M12 15.5l2.6 3.2-2.6 3.2-2.6-3.2z"/><path d="M60 15.5l2.6 3.2-2.6 3.2-2.6-3.2z"/></g>`,
  `<g fill="${KASAI_RUST}"><path d="M36 15.5l2.6 3.2-2.6 3.2-2.6-3.2z"/><path d="M84 15.5l2.6 3.2-2.6 3.2-2.6-3.2z"/></g>`,
  `<g fill="${KASAI_RUST}"><path d="M24 6.1l2.4 3-2.4 3-2.4-3z"/><path d="M72 6.1l2.4 3-2.4 3-2.4-3z"/></g>`,
  `<g fill="${EARTH}"><path d="M48 6.1l2.4 3-2.4 3-2.4-3z"/><path d="M0 6.1l2.4 3-2.4 3-2.4-3z"/><path d="M96 6.1l2.4 3-2.4 3-2.4-3z"/></g>`,
  '</svg>',
].join('')

const BAND_URL = `url("data:image/svg+xml,${encodeURIComponent(BAND_SVG)}")`

function InterlaceBand({ style }: { style?: CSSProperties }) {
  return (
    <div
      aria-hidden="true"
      className="w-full"
      style={{
        height: '2.8em',
        backgroundImage: BAND_URL,
        backgroundSize: '9.6em 2.8em',
        backgroundRepeat: 'repeat-x',
        backgroundPosition: 'center',
        ...style,
      }}
    />
  )
}

/**
 * The crest: two nested lozenges knotted at their four points, the inner one
 * stepped like a Kuba border, initials set in the heart. Falls back to a
 * single central lozenge when the title carries no names.
 */
function KnotCrest({ title }: { title: string }) {
  const initials = monogramInitials(title)
  return (
    <div className="relative h-[9.5em] w-[9.5em]" aria-hidden="true">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <g fill="none" strokeLinejoin="miter">
          <path d="M50 3L97 50L50 97L3 50Z" stroke={EARTH} strokeWidth="1.2" />
          <path d="M50 9L91 50L50 91L9 50Z" stroke={EARTH} strokeWidth="0.5" />
          {/* stepped inner lozenge */}
          <path
            d="M50 18L56 24L62 24L62 30L68 36L68 42L74 42L82 50L74 58L68 58L68 64L62 70L62 76L56 76L50 82L44 76L38 76L38 70L32 64L32 58L26 58L18 50L26 42L32 42L32 36L38 30L38 24L44 24Z"
            stroke={KASAI_OCHRE}
            strokeWidth="2.2"
          />
        </g>
        {/* knots at the four points */}
        <g fill={KASAI_PAPER} stroke={EARTH} strokeWidth="1">
          <circle cx="50" cy="3" r="2.6" />
          <circle cx="97" cy="50" r="2.6" />
          <circle cx="50" cy="97" r="2.6" />
          <circle cx="3" cy="50" r="2.6" />
        </g>
        <g fill={KASAI_RUST}>
          <path d="M50 12.5l2 2.5-2 2.5-2-2.5z" />
          <path d="M50 82.5l2 2.5-2 2.5-2-2.5z" />
          <path d="M12.5 50l2.5-2 2.5 2-2.5 2z" />
          <path d="M82.5 50l2.5-2 2.5 2-2.5 2z" />
        </g>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {initials.length ? (
          <span
            className="flex items-baseline leading-none"
            style={{ fontFamily: SERIF, fontWeight: 600, fontSize: '2.35em', color: KASAI_INK }}
          >
            {initials[0]}
            {initials[1] ? (
              <>
                <span className="mx-[0.12em] text-[0.55em] italic" style={{ color: KASAI_RUST }}>
                  &amp;
                </span>
                {initials[1]}
              </>
            ) : null}
          </span>
        ) : (
          <svg viewBox="0 0 20 20" className="h-[1.6em] w-[1.6em]">
            <path d="M10 1l9 9-9 9-9-9z" fill={KASAI_RUST} />
          </svg>
        )}
      </div>
    </div>
  )
}

/** « Grâce & Éric » → three parts so the ampersand can take the accent. */
function splitCouple(title: string): [string, string] | null {
  const match = /^(.+?)\s+(?:&|et)\s+(.+)$/iu.exec(title.trim())
  return match ? [match[1], match[2]] : null
}

/** A small stepped lozenge used as a typographic bullet. */
function Lozenge({ color = KASAI_OCHRE }: { color?: string }) {
  return (
    <svg viewBox="0 0 10 10" className="inline-block h-[0.55em] w-[0.55em]" aria-hidden="true">
      <path d="M5 0l5 5-5 5-5-5z" fill={color} />
    </svg>
  )
}

/** Kasaï's frame for its PDF pages: the woven band across the head of the
 * sheet and the fine side rules carrying it down, as on the card. */
export function KasaiDecor() {
  return (
    <>
      <div className="absolute inset-x-0 top-0 px-[2.2em] pt-[2.2em]">
        <InterlaceBand />
      </div>
      <div
        className="absolute inset-x-[2.2em] bottom-[2.2em] top-[2.2em]"
        style={{ borderLeft: `1px solid ${EARTH}55`, borderRight: `1px solid ${EARTH}55` }}
      />
    </>
  )
}

export function Kasai({ draft }: TemplateProps) {
  const titleEm = isEmphasized(draft, 'title')
  const dateEm = isEmphasized(draft, 'date')
  const venueEm = isEmphasized(draft, 'venue')
  const couple = splitCouple(draft.title)
  // Long double-barrelled names (common in Congolese families) step down a
  // size so the names stay the focal point without flooding the sheet.
  const longestName = Math.max(...(couple ?? [draft.title]).map((part) => part.length))
  const nameScale = longestName > 26 ? 0.68 : longestName > 16 ? 0.82 : 1
  const sectionOrnament = (
    <TemplateOrnament templateKey="kasai" color={KASAI_OCHRE} className="block h-auto w-full" />
  )
  const sectionTitle: CSSProperties = { fontFamily: SANS, fontWeight: 600, letterSpacing: '0.42em' }

  return (
    <InvitationPaper
      style={{ backgroundColor: KASAI_PAPER, color: KASAI_INK, fontFamily: SANS }}
    >
      <CoverHero
        draft={draft}
        bandColor="rgba(43,30,20,0.6)"
        paperColor={KASAI_PAPER}
        edgeColor="rgba(181,112,42,0.9)"
        eyebrow="Invitation"
        titleStyle={{ fontFamily: SERIF, fontWeight: 500, fontSize: titleEm ? '3em' : '2.5em', color: KASAI_PAPER }}
      />

      <div className="relative flex flex-1 flex-col">
        {/* Header band, inset from the deckle like a woven selvedge. */}
        <div className="px-[2.2em] pt-[2.2em]">
          <InterlaceBand />
        </div>
        {/* Fine side rules carry the frame down the sheet. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-[2.2em] bottom-[2.2em] top-[2.2em]"
          style={{ borderLeft: `1px solid ${EARTH}55`, borderRight: `1px solid ${EARTH}55` }}
        />

        <div className="relative flex flex-1 flex-col items-center px-[6em] pb-[3em] pt-[3.4em] text-center">
          <KnotCrest title={draft.title} />

          <p
            className="mt-[2em] text-[0.9em] uppercase"
            style={{ letterSpacing: '0.46em', color: KASAI_RUST, fontWeight: 600 }}
          >
            Vous êtes invité(e)
          </p>
          <p className="mt-[0.6em] text-[1.3em] italic" style={{ fontFamily: SERIF, color: EARTH }}>
            {guestLabel(draft)}
          </p>

          <h1
            className="mt-[1.1em] max-w-[18em] break-words text-balance"
            style={{
              fontFamily: SERIF,
              fontWeight: 500,
              fontSize: `${(titleEm ? 4.4 : 3.6) * nameScale}em`,
              lineHeight: 1.04,
              letterSpacing: '-0.005em',
              color: KASAI_INK,
            }}
          >
            {couple ? (
              <>
                {/* Read as one name line; the stacked setting is visual only. */}
                <span className="sr-only">{draft.title}</span>
                <span aria-hidden="true" className="block">{couple[0]}</span>
                <span
                  aria-hidden="true"
                  className="my-[0.08em] block italic"
                  style={{ fontSize: '0.62em', color: KASAI_OCHRE, fontWeight: 400 }}
                >
                  &amp;
                </span>
                <span aria-hidden="true" className="block">{couple[1]}</span>
              </>
            ) : (
              draft.title
            )}
          </h1>

          {draft.message ? (
            <p
              className="mt-[1.6em] max-w-[27em] text-pretty text-[1.14em] leading-[1.75] break-words"
              style={{ fontFamily: messageFontCss(draft.messageFont) ?? SERIF }}
            >
              {draft.message}
            </p>
          ) : null}

          <InterlaceBand style={{ marginTop: '2.4em', width: '14em', height: '1.6em', backgroundSize: '5.5em 1.6em' }} />

          {draft.event_date ? (
            <div className="mt-[2em] grid w-full max-w-[28em] grid-cols-[1fr_auto_1fr] items-center gap-[1.2em]">
              <p
                className="text-right text-[0.95em] uppercase"
                style={{ letterSpacing: '0.34em', color: EARTH, fontWeight: 600 }}
              >
                {formatWeekday(draft.event_date)}
              </p>
              <div className="relative flex h-[5.6em] w-[5.6em] items-center justify-center">
                <svg viewBox="0 0 60 60" className="absolute inset-0 h-full w-full" aria-hidden="true">
                  <path d="M30 2L58 30L30 58L2 30Z" fill="none" stroke={KASAI_OCHRE} strokeWidth="1.6" />
                  <path d="M30 7L53 30L30 53L7 30Z" fill="none" stroke={EARTH} strokeWidth="0.6" />
                </svg>
                <span
                  className="relative leading-none"
                  style={{ fontFamily: SERIF, fontWeight: 600, fontSize: dateEm ? '2.7em' : '2.3em' }}
                >
                  {formatDayNumber(draft.event_date)}
                </span>
              </div>
              <p
                className="text-left text-[0.95em] uppercase"
                style={{ letterSpacing: '0.34em', color: EARTH, fontWeight: 600 }}
              >
                {formatMonthYear(draft.event_date)}
              </p>
            </div>
          ) : null}
          {draft.event_time ? (
            <p className="mt-[1em] text-[1.25em] italic" style={{ fontFamily: SERIF }}>
              à {formatEventTime(draft.event_time).replace(':', 'h')}
            </p>
          ) : null}

          {draft.venue_name || draft.venue_address ? (
            <div className="mt-[1.8em] max-w-[26em]">
              {draft.venue_name ? (
                <p
                  className="uppercase"
                  style={{
                    fontSize: venueEm ? '1.25em' : '1.04em',
                    letterSpacing: '0.24em',
                    fontWeight: 600,
                    lineHeight: 1.5,
                  }}
                >
                  {draft.venue_name}
                </p>
              ) : null}
              {draft.venue_address ? (
                <p className="mt-[0.45em] text-[1em] leading-[1.55]" style={{ color: EARTH }}>
                  {draft.venue_address}
                </p>
              ) : null}
              {draft.venue_details ? (
                <p className="mt-[0.7em] flex items-center justify-center gap-[0.6em] text-[1.15em] italic" style={{ fontFamily: SERIF, color: KASAI_RUST }}>
                  <Lozenge color={KASAI_RUST} />
                  {draft.venue_details}
                  <Lozenge color={KASAI_RUST} />
                </p>
              ) : null}
            </div>
          ) : null}

          <NoteSection draft={draft} ink={EARTH} />
          <ProgramSection
            draft={draft}
            accent={KASAI_RUST}
            ink={KASAI_INK}
            ornament={sectionOrnament}
            titleStyle={sectionTitle}
          />
          <TableSection
            draft={draft}
            accent={KASAI_RUST}
            ink={KASAI_INK}
            ornament={sectionOrnament}
            titleStyle={sectionTitle}
          />
          <DressCodeSection
            draft={draft}
            accent={KASAI_RUST}
            ink={KASAI_INK}
            ornament={sectionOrnament}
            titleStyle={sectionTitle}
          />
        </div>

        <div className="px-[2.2em] pb-[2.2em]">
          <InterlaceBand style={{ transform: 'scaleY(-1)' }} />
        </div>
      </div>
    </InvitationPaper>
  )
}
