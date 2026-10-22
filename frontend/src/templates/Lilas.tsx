/**
 * « Lilas » — reproduction of `very_beautiful template/Screenshot 2026-10-08 022420.png`.
 *
 * White textured paper wreathed by purple clematis blooms at the top-left and
 * bottom-right, a single name in huge charcoal calligraphy trailing a long
 * flourish, letterspaced caps chrome, the month above a rule-flanked
 * « SAMEDI —— 29 —— » date row and caps venue lines.
 */
import { Bouquet } from './paintedFlora.tsx'
import type { FloraItem } from './paintedFlora.tsx'
import { messageFontCss } from './messageFonts.ts'
import { TemplateOrnament } from './ornaments.tsx'
import {
  CoverHero,
  DressCodeSection,
  InvitationPaper,
  NoteSection,
  ProgramSection,
  TableSection,
  formatDayNumber,
  formatEventTime,
  formatWeekday,
  isEmphasized,
} from './shared.tsx'
import {
  SCRIPT_FONT,
  formatMonthOnly,
} from './referenceMotifs.tsx'
import type { TemplateProps } from './types.ts'

const SERIF = "'Cormorant Garamond', 'Playfair Display', Georgia, serif"
const PAPER = '#FCFBF9'
const INK = '#2E3B33'
const PLUM = '#7C6AA8'

/**
 * The open floral ring of the reference: one arc over the top-left, one
 * under the bottom-right, each a run of clematis, violet roses, buds and
 * leaves following the circle (center 100,100 · radius 72 in a 200 box).
 */
function arcItems(from: number, to: number): FloraItem[] {
  const leaves: FloraItem[] = []
  const blooms: FloraItem[] = []
  const steps = 9
  for (let i = 0; i <= steps; i += 1) {
    const deg = from + ((to - from) * i) / steps
    const rad = (deg * Math.PI) / 180
    const x = 100 + Math.cos(rad) * 72
    const y = 100 + Math.sin(rad) * 72
    const tangent = deg + 90
    leaves.push({ k: 'leaf', x, y, s: 0.42, r: tangent + (i % 2 === 0 ? 40 : -140), p: 'olive' })
    const kind = i % 3
    if (kind === 0) blooms.push({ k: 'clematis', x, y, s: 0.36 - (i % 2) * 0.05, r: deg, p: i % 2 ? 'lilac' : 'violet' })
    else if (kind === 1) blooms.push({ k: 'rose', x, y, s: 0.3, r: deg, p: 'lilac' })
    else blooms.push({ k: 'forget', x, y, s: 0.9, p: 'violet' })
  }
  return [...leaves, ...blooms]
}

const WREATH: FloraItem[] = [...arcItems(160, 290), ...arcItems(-20, 110)]

export function Lilas({ draft }: TemplateProps) {
  const titleEm = isEmphasized(draft, 'title')
  const dateEm = isEmphasized(draft, 'date')
  const venueEm = isEmphasized(draft, 'venue')
  return (
    <InvitationPaper style={{ backgroundColor: PAPER, color: INK }}>

      <CoverHero
        draft={draft}
        bandColor="rgba(38,34,48,0.6)"
        edgeColor="rgba(201,180,228,0.9)"
        eyebrow="Joyeux anniversaire"
        paperColor={PAPER}
        titleStyle={{
          fontFamily: SCRIPT_FONT,
          fontSize: titleEm ? '4.8em' : '3.9em',
          color: '#F6F2FB',
          textShadow: '0 0.05em 0.3em rgba(28,24,40,0.55)',
        }}
      />

      <div className="relative flex flex-1 flex-col items-center px-[6em] pb-[4em] pt-[3.5em] text-center">
        {/* The name cuts diagonally across the open floral ring. */}
        <div className="relative flex h-[24em] w-[24em] items-center justify-center">
          <Bouquet items={WREATH} viewBox="0 0 200 200" className="absolute inset-0 h-full w-full" />
          <h1
            className="relative break-words leading-[1.05]"
            style={{
              fontFamily: SCRIPT_FONT,
              fontSize: titleEm ? '7em' : '6.2em',
              color: INK,
              transform: 'rotate(-12deg)',
            }}
          >
            {draft.title}
          </h1>
        </div>

        {draft.guestName?.trim() ? (
          <p className="mt-[0.6em] font-display italic" style={{ fontSize: '1.12em', color: PLUM }}>
            {draft.guestName}
          </p>
        ) : null}

        <p
          className="mt-[0.6em] uppercase"
          style={{ fontFamily: SERIF, fontWeight: 500, fontSize: '1.3em', letterSpacing: '0.1em', lineHeight: 1.7 }}
        >
          Célébration d'anniversaire
          <br />
          Rejoignez-nous pour une fête au jardin
        </p>

        {draft.message ? (
          <p
            className="mt-[1.1em] max-w-[25em] text-pretty leading-[1.7] break-words"
            style={{ fontSize: '1.1em', fontFamily: messageFontCss(draft.messageFont) }}
          >
            {draft.message}
          </p>
        ) : null}

        <p
          className="mt-[1.4em] uppercase"
          style={{ fontFamily: SERIF, fontWeight: 500, letterSpacing: '0.1em', fontSize: '1.35em' }}
        >
          {formatMonthOnly(draft.event_date)}
        </p>

        {/* WEEKDAY | DAY | TIME — rules frame the side words, as in the reference. */}
        <div
          className="mt-[0.6em] grid w-full max-w-[24em] grid-cols-[1fr_auto_1fr] items-center gap-[0.8em]"
          style={{ transform: dateEm ? 'scale(1.12)' : undefined, fontFamily: SERIF, fontWeight: 500, fontSize: '1.25em' }}
        >
          <p className="whitespace-nowrap py-[0.3em] text-center uppercase" style={{ borderTop: `1px solid ${INK}`, borderBottom: `1px solid ${INK}`, letterSpacing: '0.1em' }}>
            {formatWeekday(draft.event_date)}
          </p>
          <p className="leading-none" style={{ fontFamily: SERIF, fontSize: '2.6em', fontWeight: 600 }}>
            {formatDayNumber(draft.event_date)}
          </p>
          <p className="whitespace-nowrap py-[0.3em] text-center uppercase" style={{ borderTop: `1px solid ${INK}`, borderBottom: `1px solid ${INK}`, letterSpacing: '0.1em' }}>
            {formatEventTime(draft.event_time)}
          </p>
        </div>

        {draft.venue_name || draft.venue_address ? (
          <div
            className="mt-[1.6em] uppercase"
            style={{ fontFamily: SERIF, fontWeight: 500, fontSize: venueEm ? '1.4em' : '1.25em', letterSpacing: '0.1em', lineHeight: 1.6 }}
          >
            {draft.venue_name ? <p>{draft.venue_name}</p> : null}
            {draft.venue_address ? <p>{draft.venue_address}</p> : null}
            {draft.venue_details ? (
              <p className="text-[0.92em] italic opacity-80" style={{ letterSpacing: '0.08em' }}>
                {draft.venue_details}
              </p>
            ) : null}
          </div>
        ) : null}

        <NoteSection draft={draft} ink={INK} />
        <ProgramSection
          draft={draft}
          accent={PLUM}
          ink={INK}
          ornament={<TemplateOrnament templateKey="lilas" color={PLUM} />}
        />
        <TableSection
          draft={draft}
          accent={PLUM}
          ink={INK}
          ornament={<TemplateOrnament templateKey="lilas" color={PLUM} />}
        />
        <DressCodeSection
          draft={draft}
          accent={PLUM}
          ink={INK}
          ornament={<TemplateOrnament templateKey="lilas" color={PLUM} />}
        />
      </div>
    </InvitationPaper>
  )
}
