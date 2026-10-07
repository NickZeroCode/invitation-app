/**
 * « Nuit Céleste » — celestial midnight wedding. Deep navy gradient, a scatter
 * of four-point gold stars, a crescent moon over the title and a hairline gold
 * frame with star corners. Midnight romance, quietly opulent.
 */
import {
  InvitationPaper,
  formatEventDate,
  formatEventTime,
  guestLabel,
  isEmphasized,
} from './shared.tsx'
import type { TemplateProps } from './types.ts'
import { messageFontCss } from './messageFonts.ts'

const GOLD = '#E2C27C'
const STAR = '#F2ECDC'
const PAPER_BG = 'linear-gradient(180deg, #0D1530 0%, #17234C 48%, #101A3A 78%, #0B1228 100%)'

const STAR_PATH = 'M12 0 L14.3 9.7 L24 12 L14.3 14.3 L12 24 L9.7 14.3 L0 12 L9.7 9.7 Z'

/** Deterministic scatter of stars and dots across the paper. */
function StarField() {
  const stars: Array<[number, number, number, number]> = [
    [6, 8, 1.15, 0.55],
    [18, 4, 0.7, 0.4],
    [88, 6, 1, 0.5],
    [95, 16, 0.62, 0.35],
    [4, 26, 0.72, 0.38],
    [92, 34, 0.85, 0.45],
    [10, 52, 0.55, 0.3],
    [90, 58, 0.75, 0.4],
    [6, 74, 0.9, 0.42],
    [94, 80, 0.6, 0.32],
    [16, 92, 0.8, 0.4],
    [84, 94, 1.05, 0.5],
    [46, 97, 0.6, 0.3],
    [54, 3, 0.68, 0.35],
  ]
  const dots: Array<[number, number, number]> = [
    [12, 16, 0.16],
    [26, 10, 0.12],
    [78, 12, 0.14],
    [30, 88, 0.12],
    [72, 90, 0.15],
    [8, 44, 0.12],
    [93, 68, 0.13],
  ]
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {stars.map(([x, y, size, opacity], i) => (
        <svg
          key={`s${i}`}
          viewBox="0 0 24 24"
          className="absolute"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            width: `${size}em`,
            height: `${size}em`,
            transform: `rotate(${(i * 37) % 40}deg)`,
            opacity,
          }}
          fill={i % 3 === 0 ? GOLD : STAR}
        >
          <path d={STAR_PATH} />
        </svg>
      ))}
      {dots.map(([x, y, r], i) => (
        <span
          key={`d${i}`}
          className="absolute rounded-full"
          style={{ left: `${x}%`, top: `${y}%`, width: `${r}em`, height: `${r}em`, backgroundColor: GOLD, opacity: 0.5 }}
        />
      ))}
    </div>
  )
}

/** Crescent moon. */
function Moon({ size = '4.6em' }: { size?: string }) {
  return (
    <svg viewBox="0 0 64 64" style={{ width: size, height: size }} aria-hidden="true">
      <path
        d="M42 6 A26 26 0 1 0 42 58 A21 21 0 1 1 42 6 Z"
        fill="none"
        stroke={GOLD}
        strokeWidth="2.2"
      />
      <circle cx="20" cy="16" r="1.6" fill={GOLD} />
    </svg>
  )
}

/** Hairline rule with a small star at its centre. */
function StarRule() {
  return (
    <div className="flex w-full items-center justify-center gap-[1.1em]" aria-hidden="true">
      <span className="h-px flex-1" style={{ backgroundColor: GOLD, opacity: 0.5 }} />
      <svg viewBox="0 0 24 24" className="h-[1em] w-[1em]" fill={GOLD}>
        <path d={STAR_PATH} />
      </svg>
      <span className="h-px flex-1" style={{ backgroundColor: GOLD, opacity: 0.5 }} />
    </div>
  )
}

export function NuitCeleste({ draft }: TemplateProps) {
  const titleEm = isEmphasized(draft, 'title')
  const dateEm = isEmphasized(draft, 'date')
  const venueEm = isEmphasized(draft, 'venue')
  return (
    <InvitationPaper style={{ backgroundImage: PAPER_BG, color: STAR }}>
      <StarField />

      {/* Hairline gold frame with star corners. */}
      <div className="pointer-events-none absolute inset-[1.8em]" aria-hidden="true">
        <div className="absolute inset-0 border" style={{ borderColor: 'rgba(226,194,124,0.38)' }} />
        {[
          { top: '-0.5em', left: '-0.5em' },
          { top: '-0.5em', right: '-0.5em' },
          { bottom: '-0.5em', left: '-0.5em' },
          { bottom: '-0.5em', right: '-0.5em' },
        ].map((pos, i) => (
          <svg
            key={i}
            viewBox="0 0 24 24"
            className="absolute h-[1em] w-[1em]"
            style={{ ...pos, backgroundColor: '#101A3A' }}
            fill={GOLD}
          >
            <path d={STAR_PATH} />
          </svg>
        ))}
      </div>

      <div className="relative flex flex-1 flex-col items-center px-[6em] py-[5.5em] text-center">
        <Moon />

        <p className="mt-[1.4em] text-[1.02em] uppercase" style={{ color: GOLD, letterSpacing: '0.52em' }}>
          Invitation
        </p>

        <p className="mt-[2em] font-display text-[1.25em] italic opacity-92">{guestLabel(draft)}</p>

        <h1
          className="mt-[0.6em] break-words text-balance font-display leading-[1.12]"
          style={{ fontSize: titleEm ? '3.4em' : '2.5em', color: STAR, textShadow: '0 0.06em 0.35em rgba(8,12,30,0.45)' }}
        >
          {draft.title}
        </h1>

        {draft.message ? (
          <p className="mt-[1.7em] max-w-[29em] text-pretty text-[1.2em] leading-[1.8] break-words opacity-90" style={{ fontFamily: messageFontCss(draft.messageFont) }}>
            {draft.message}
          </p>
        ) : null}

        {draft.cover_url ? (
          <div className="mt-[2.2em] w-full max-w-[24em]">
            <img
              src={draft.cover_url}
              alt=""
              className="h-[16em] w-full rounded-t-[10em] object-cover"
              style={{ border: '1px solid rgba(226,194,124,0.55)' }}
            />
          </div>
        ) : null}

        <div className="mt-[2.4em] w-full">
          <StarRule />
          <p
            className="mt-[1.8em] font-display"
            style={{ fontSize: dateEm ? '1.95em' : '1.55em', color: GOLD, letterSpacing: '0.04em' }}
          >
            {formatEventDate(draft.event_date)}
          </p>
          <p className="mt-[0.55em] text-[1.05em] uppercase" style={{ letterSpacing: '0.4em', opacity: 0.82 }}>
            à {formatEventTime(draft.event_time)}
          </p>
          <StarRule />
        </div>

        {draft.venue_name || draft.venue_address ? (
          <div className="mt-[2.2em]">
            <p
              className="font-display text-[1.35em]"
              style={{ color: venueEm ? GOLD : STAR, fontWeight: venueEm ? 600 : 400 }}
            >
              {draft.venue_name}
            </p>
            <p className="mt-[0.4em] text-[1.14em] opacity-88">{draft.venue_address}</p>
            {draft.venue_details ? (
              <p className="mt-[0.6em] text-[1.02em] italic opacity-78">{draft.venue_details}</p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-auto pt-[2.4em]">
          <p className="text-[1.02em] uppercase opacity-72" style={{ letterSpacing: '0.38em', color: GOLD }}>
            Sous les étoiles
          </p>
        </div>
      </div>
    </InvitationPaper>
  )
}
