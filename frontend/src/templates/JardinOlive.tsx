/**
 * « Jardin d'Olive » — fine-art botanical wedding. Soft cream paper, hand-drawn
 * olive branches in the corners, a sprig motif as divider and an arched cover
 * photo. The quiet, organic-luxury palette: olive ink, sage and brushed gold.
 */
import {
  InvitationPaper,
  formatEventDate,
  formatEventTime,
  guestLabel,
  isEmphasized,
} from './shared.tsx'
import type { TemplateProps } from './types.ts'

const OLIVE = '#5B6B4B'
const INK = '#2C3526'
const GOLD = '#BFA05C'
const PAPER_BG = 'radial-gradient(120% 100% at 50% 0%, #F8F4EA 0%, #F4EFE3 52%, #EFE8D8 100%)'

const LEAF_PATH = 'M0 0 C4 -6.2 12.4 -8.4 17 -2.6 C12.4 3.6 4 5.8 0 0 Z'

/** Hand-drawn olive branch with leaves along a curved stem. */
function OliveBranch({ flip = false }: { flip?: boolean }) {
  const leaves: Array<[number, number, number, number]> = [
    [26, 100, -142, 1.25],
    [26, 100, -58, 1.02],
    [52, 84, -138, 1.3],
    [52, 84, -52, 1.06],
    [78, 66, -132, 1.25],
    [78, 66, -46, 1.02],
    [104, 46, -128, 1.14],
    [104, 46, -42, 0.96],
    [128, 28, -122, 1.02],
  ]
  const olives: Array<[number, number]> = [
    [38, 96],
    [64, 80],
    [90, 62],
    [116, 42],
  ]
  return (
    <svg
      viewBox="0 0 160 120"
      className="absolute h-[11em] w-[14.5em]"
      style={
        flip
          ? { top: '1.6em', right: '1.6em', transform: 'scaleX(-1)' }
          : { top: '1.6em', left: '1.6em' }
      }
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M12 114 C 48 98, 92 70, 138 20"
        stroke={OLIVE}
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.9"
      />
      {leaves.map(([x, y, rot, scale], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`}>
          <path d={LEAF_PATH} fill={OLIVE} opacity={i % 2 ? 0.62 : 0.8} />
        </g>
      ))}
      {olives.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.1" fill={GOLD} opacity="0.9" />
      ))}
      <circle cx="138" cy="20" r="3" fill={GOLD} />
    </svg>
  )
}

/** Olive divider: hairline rule, leaves and a gold diamond at centre. */
function Sprig() {
  return (
    <svg viewBox="0 0 120 24" className="h-[1.9em] w-[10em]" aria-hidden="true" fill="none">
      <path d="M4 12 H42" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" opacity="0.85" />
      <path d="M78 12 H116" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" opacity="0.85" />
      <g transform="translate(46 12) rotate(-24) scale(0.62)">
        <path d={LEAF_PATH} fill={OLIVE} opacity="0.85" />
      </g>
      <g transform="translate(74 12) rotate(204) scale(0.62)">
        <path d={LEAF_PATH} fill={OLIVE} opacity="0.85" />
      </g>
      <path d="M60 3 L67 12 L60 21 L53 12 Z" fill={GOLD} />
    </svg>
  )
}

export function JardinOlive({ draft }: TemplateProps) {
  const titleEm = isEmphasized(draft, 'title')
  const dateEm = isEmphasized(draft, 'date')
  const venueEm = isEmphasized(draft, 'venue')
  return (
    <InvitationPaper style={{ backgroundImage: PAPER_BG, color: INK }}>
      <OliveBranch />
      <OliveBranch flip />

      <div className="relative flex flex-1 flex-col items-center px-[6.5em] py-[6em] text-center">
        <p className="text-[1.02em] uppercase" style={{ color: OLIVE, letterSpacing: '0.52em' }}>
          Mariage
        </p>

        <p className="mt-[2em] max-w-[26em] font-display text-[1.25em] italic text-pretty" style={{ color: OLIVE }}>
          {guestLabel(draft)}
        </p>

        <h1
          className="mt-[0.6em] break-words text-balance font-display leading-[1.14]"
          style={{ fontSize: titleEm ? '3.3em' : '2.45em', color: INK }}
        >
          {draft.title}
        </h1>

        <div className="mt-[1.8em]">
          <Sprig />
        </div>

        {draft.message ? (
          <p className="mt-[1.4em] max-w-[29em] text-pretty text-[1.2em] leading-[1.8] break-words opacity-90">
            {draft.message}
          </p>
        ) : null}

        {draft.cover_url ? (
          <div className="mt-[2.2em] w-full max-w-[24em]">
            <img
              src={draft.cover_url}
              alt=""
              className="h-[17em] w-full rounded-t-[10em] object-cover"
              style={{ border: '1px solid rgba(91,107,75,0.35)' }}
            />
          </div>
        ) : null}

        <div className="mt-[2.2em]">
          <p
            className="font-display italic"
            style={{ fontSize: dateEm ? '1.95em' : '1.5em', color: OLIVE }}
          >
            {formatEventDate(draft.event_date)}
          </p>
          <p className="mt-[0.55em] text-[1.08em]" style={{ letterSpacing: '0.32em', opacity: 0.85 }}>
            à {formatEventTime(draft.event_time)}
          </p>
        </div>

        {draft.venue_name || draft.venue_address ? (
          <div className="mt-[2em]">
            <p
              className="font-display text-[1.35em]"
              style={{ color: venueEm ? OLIVE : INK, fontWeight: venueEm ? 600 : 500 }}
            >
              {draft.venue_name}
            </p>
            <p className="mt-[0.4em] text-[1.14em] opacity-85">{draft.venue_address}</p>
            {draft.venue_details ? (
              <p className="mt-[0.6em] text-[1.02em] italic opacity-78">{draft.venue_details}</p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-auto pt-[2.4em]">
          <Sprig />
          <p className="mt-[1em] text-[1.02em] italic opacity-75">
            Sous le signe de l'olivier, symbole de paix et d'amour.
          </p>
        </div>
      </div>
    </InvitationPaper>
  )
}
