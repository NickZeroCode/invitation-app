/**
 * « Confetti » — a birthday card, not a wedding card with a new title.
 *
 * Art direction: a two-colour risograph print on warm uncoated stock. The
 * focal point is the age itself — an oversized numeral pulled from the title
 * (« Les 30 ans de Sarah » → 30), printed twice in slight misregistration —
 * with hand-cut paper confetti resting on the sheet (each piece casts its own
 * tiny shadow) and the date set on a perforated ticket stub. When the title
 * carries no number, the composition leads with the name in italic display.
 */
import { useId } from 'react'
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
  titleNumber,
} from './shared.tsx'
import type { TemplateProps } from './types.ts'
import { messageFontCss } from './messageFonts.ts'
import { TemplateOrnament } from './ornaments.tsx'

const PAPER = '#FBF4E6'
const INK = '#1E2740'
const TOMATO = '#E2553F'
const COBALT = '#2D55C8'
const MARIGOLD = '#F0B23A'
const BLUSH = '#F2B8AE'

type Piece =
  | { kind: 'dot'; x: number; y: number; r: number; color: string }
  | { kind: 'strip'; x: number; y: number; w: number; rot: number; color: string }
  | { kind: 'tri'; x: number; y: number; s: number; rot: number; color: string }
  | { kind: 'curl'; x: number; y: number; rot: number; color: string }

/* Hand-placed, not random: clusters gather at two opposite corners and thin
 * out toward the text, the way confetti settles when tossed on a card. */
const TOP_PIECES: Piece[] = [
  { kind: 'dot', x: 286, y: 18, r: 6.5, color: MARIGOLD },
  { kind: 'strip', x: 254, y: 28, w: 20, rot: -28, color: TOMATO },
  { kind: 'curl', x: 302, y: 44, rot: 20, color: COBALT },
  { kind: 'tri', x: 226, y: 14, s: 11, rot: 18, color: COBALT },
  { kind: 'dot', x: 204, y: 30, r: 3.4, color: BLUSH },
  { kind: 'strip', x: 306, y: 70, w: 13, rot: 52, color: MARIGOLD },
  { kind: 'dot', x: 186, y: 22, r: 2.8, color: TOMATO },
  { kind: 'dot', x: 290, y: 78, r: 2.6, color: TOMATO },
  { kind: 'tri', x: 262, y: 52, s: 7, rot: -40, color: BLUSH },
  { kind: 'strip', x: 30, y: 26, w: 14, rot: 34, color: COBALT },
  { kind: 'dot', x: 14, y: 52, r: 3, color: MARIGOLD },
]

const BOTTOM_PIECES: Piece[] = [
  { kind: 'dot', x: 22, y: 70, r: 6, color: COBALT },
  { kind: 'strip', x: 52, y: 52, w: 19, rot: 24, color: MARIGOLD },
  { kind: 'curl', x: 18, y: 30, rot: -30, color: TOMATO },
  { kind: 'tri', x: 88, y: 78, s: 10, rot: -12, color: TOMATO },
  { kind: 'dot', x: 104, y: 50, r: 3.2, color: BLUSH },
  { kind: 'dot', x: 64, y: 90, r: 2.6, color: COBALT },
  { kind: 'strip', x: 292, y: 72, w: 13, rot: -36, color: TOMATO },
  { kind: 'dot', x: 306, y: 50, r: 3, color: MARIGOLD },
]

function PieceShape({ piece }: { piece: Piece }) {
  switch (piece.kind) {
    case 'dot':
      return <circle cx={piece.x} cy={piece.y} r={piece.r} fill={piece.color} />
    case 'strip':
      return (
        <rect
          x={piece.x - piece.w / 2}
          y={piece.y - 2.2}
          width={piece.w}
          height={4.4}
          rx={0.8}
          fill={piece.color}
          transform={`rotate(${piece.rot} ${piece.x} ${piece.y})`}
        />
      )
    case 'tri': {
      const h = piece.s * 0.87
      return (
        <path
          d={`M ${piece.x} ${piece.y - h / 2} L ${piece.x + piece.s / 2} ${piece.y + h / 2} L ${piece.x - piece.s / 2} ${piece.y + h / 2} Z`}
          fill={piece.color}
          transform={`rotate(${piece.rot} ${piece.x} ${piece.y})`}
        />
      )
    }
    case 'curl':
      return (
        <path
          d={`M ${piece.x - 10} ${piece.y} q 5 -7 10 0 t 10 0`}
          fill="none"
          stroke={piece.color}
          strokeWidth={3.4}
          strokeLinecap="round"
          transform={`rotate(${piece.rot} ${piece.x} ${piece.y})`}
        />
      )
  }
}

/** A field of paper confetti lying on the card — each piece lifts off the
 * sheet with a soft contact shadow, which is what sells it as paper. */
function ConfettiField({
  pieces,
  className,
  style,
}: {
  pieces: Piece[]
  className?: string
  style?: CSSProperties
}) {
  const liftId = useId()
  return (
    <svg viewBox="0 0 320 110" className={className} style={style} aria-hidden="true">
      <defs>
        <filter id={liftId} x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0.6" dy="1.4" stdDeviation="0.9" floodColor="#5A3A1A" floodOpacity="0.22" />
        </filter>
      </defs>
      <g filter={`url(#${liftId})`}>
        {pieces.map((piece, index) => (
          <PieceShape key={index} piece={piece} />
        ))}
      </g>
    </svg>
  )
}

/** The age, printed twice in two inks a hair out of register — the honest
 * charm of a riso print, and the single loud gesture on the card. */
function RisoNumeral({ value, emphasize }: { value: string; emphasize: boolean }) {
  const size = value.length > 2 ? (emphasize ? '10.5em' : '9em') : emphasize ? '13em' : '11em'
  const common: CSSProperties = {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontWeight: 700,
    fontStyle: 'italic',
    fontSize: size,
    lineHeight: 0.86,
    letterSpacing: '-0.04em',
  }
  return (
    <div className="relative select-none" aria-hidden="true">
      <span className="block" style={{ ...common, color: COBALT, opacity: 0.9 }}>
        {value}
      </span>
      <span
        className="absolute inset-0 block"
        style={{
          ...common,
          color: TOMATO,
          mixBlendMode: 'multiply',
          transform: 'translate(-0.035em, -0.025em)',
          opacity: 0.92,
        }}
      >
        {value}
      </span>
    </div>
  )
}

/** Date on a perforated ticket stub: two notches, a dotted tear line. */
function TicketStub({ draft, emphasize }: { draft: TemplateProps['draft']; emphasize: boolean }) {
  const notch: CSSProperties = {
    position: 'absolute',
    top: '50%',
    width: '1.5em',
    height: '1.5em',
    borderRadius: '999px',
    backgroundColor: PAPER,
    transform: 'translateY(-50%)',
    boxShadow: `inset 0 0 0 1.5px ${INK}`,
  }
  return (
    <div
      className="relative mt-[2.4em] grid w-full max-w-[27em] grid-cols-[1fr_auto_1fr] items-center"
      style={{ border: `1.5px solid ${INK}`, borderRadius: '0.35em', padding: '1.3em 1.6em' }}
    >
      <span aria-hidden="true" style={{ ...notch, left: '-0.8em', clipPath: 'inset(0 0 0 50%)' }} />
      <span aria-hidden="true" style={{ ...notch, right: '-0.8em', clipPath: 'inset(0 50% 0 0)' }} />
      <div className="text-left">
        <p className="text-[0.82em] font-semibold uppercase" style={{ letterSpacing: '0.32em', color: TOMATO }}>
          {formatWeekday(draft.event_date)}
        </p>
        <p className="mt-[0.35em] text-[0.92em] uppercase" style={{ letterSpacing: '0.2em' }}>
          {formatMonthYear(draft.event_date)}
        </p>
      </div>
      <p
        className="px-[0.7em] leading-none"
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontWeight: 700,
          fontSize: emphasize ? '3.7em' : '3.1em',
          color: INK,
          borderLeft: `1.5px dotted ${INK}`,
          borderRight: `1.5px dotted ${INK}`,
          paddingBlock: '0.05em',
        }}
      >
        {formatDayNumber(draft.event_date)}
      </p>
      <div className="text-right">
        <p className="text-[0.82em] font-semibold uppercase" style={{ letterSpacing: '0.32em', color: TOMATO }}>
          Dès
        </p>
        <p className="mt-[0.35em] text-[1.15em] font-semibold" style={{ letterSpacing: '0.06em' }}>
          {formatEventTime(draft.event_time).replace(':', 'h')}
        </p>
      </div>
    </div>
  )
}

/** The card’s decoration layer — also dresses its PDF pages (see pageDecor). */
export function ConfettiDecor() {
  return (
    <>
      <ConfettiField pieces={TOP_PIECES} className="absolute inset-x-0 top-0 h-auto w-full" />
      <ConfettiField
        pieces={BOTTOM_PIECES}
        className="absolute inset-x-0 bottom-0 h-auto w-full"
      />
    </>
  )
}

export function Confetti({ draft }: TemplateProps) {
  const titleEm = isEmphasized(draft, 'title')
  const dateEm = isEmphasized(draft, 'date')
  const venueEm = isEmphasized(draft, 'venue')
  const age = titleNumber(draft.title)
  const sectionOrnament = (
    <TemplateOrnament templateKey="confetti" color={TOMATO} className="block h-auto w-full" />
  )

  return (
    <InvitationPaper style={{ backgroundColor: PAPER, color: INK, fontFamily: "'Montserrat', 'Inter', sans-serif" }}>
      <CoverHero
        draft={draft}
        bandColor="rgba(30,39,64,0.55)"
        paperColor={PAPER}
        edgeColor={MARIGOLD}
        eyebrow="Joyeux anniversaire"
        titleClassName="italic"
        titleStyle={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontWeight: 700,
          fontSize: titleEm ? '2.9em' : '2.3em',
          color: PAPER,
        }}
      />

      <div className="relative flex flex-1 flex-col">
        <ConfettiDecor />

        <div className="relative flex flex-1 flex-col items-center px-[5.5em] pb-[8em] pt-[7em] text-center">
          <p className="text-[0.92em] font-semibold uppercase" style={{ letterSpacing: '0.42em', color: TOMATO }}>
            Vous êtes convié(e) à fêter
          </p>

          {age ? (
            <div className="mt-[1em]">
              <RisoNumeral value={age} emphasize={titleEm} />
            </div>
          ) : null}

          <h1
            className={`${age ? 'mt-[0.75em]' : 'mt-[1em]'} max-w-[22em] break-words text-balance italic leading-[1.12]`}
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontWeight: 600,
              fontSize: age ? (titleEm ? '2.6em' : '2.15em') : titleEm ? '3.8em' : '3.1em',
              color: INK,
            }}
          >
            {draft.title}
          </h1>

          <p className="mt-[1.9em] text-[0.86em] uppercase" style={{ letterSpacing: '0.34em', opacity: 0.7 }}>
            Pour
          </p>
          <p
            className="mt-[0.4em] text-[1.3em] italic"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: COBALT }}
          >
            {guestLabel(draft)}
          </p>

          {draft.message ? (
            <p
              className="mt-[1.5em] max-w-[27em] text-pretty text-[1.12em] leading-[1.75] break-words"
              style={{ fontFamily: messageFontCss(draft.messageFont) }}
            >
              {draft.message}
            </p>
          ) : null}

          {draft.event_date ? <TicketStub draft={draft} emphasize={dateEm} /> : null}

          {draft.venue_name || draft.venue_address ? (
            <div className="mt-[2em] max-w-[26em]">
              {draft.venue_name ? (
                <p
                  className="font-semibold uppercase"
                  style={{ fontSize: venueEm ? '1.3em' : '1.08em', letterSpacing: '0.2em' }}
                >
                  {draft.venue_name}
                </p>
              ) : null}
              {draft.venue_address ? (
                <p className="mt-[0.45em] text-[1em] leading-[1.55]" style={{ opacity: 0.82 }}>
                  {draft.venue_address}
                </p>
              ) : null}
              {draft.venue_details ? (
                <p
                  className="mt-[0.45em] text-[1em] italic"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", color: TOMATO }}
                >
                  {draft.venue_details}
                </p>
              ) : null}
            </div>
          ) : null}

          <NoteSection draft={draft} ink={INK} />
          <ProgramSection
            draft={draft}
            accent={TOMATO}
            ink={INK}
            ornament={sectionOrnament}
            titleClassName="font-semibold"
          />
          <TableSection
            draft={draft}
            accent={TOMATO}
            ink={INK}
            ornament={sectionOrnament}
            titleClassName="font-semibold"
          />
          <DressCodeSection
            draft={draft}
            accent={TOMATO}
            ink={INK}
            ornament={sectionOrnament}
            titleClassName="font-semibold"
          />

          <p
            className="mt-auto pt-[2.4em] text-[1.25em] italic"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: COBALT }}
          >
            On compte sur vous !
          </p>
        </div>
      </div>
    </InvitationPaper>
  )
}
