/**
 * « Éternité » — art-deco black-tie luxury. Near-black paper with a warm
 * vignette, an inset double gold frame, geometric sunburst fans in the four
 * corners and champagne serif titling: the most formal, "old-money" card of
 * the wedding set.
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

const GOLD = '#D8B36A'
const GOLD_SOFT = '#EBD3A0'
const IVORY = '#F3E9D7'
const PAPER_BG = 'radial-gradient(120% 90% at 50% 0%, #251C11 0%, #17120D 55%, #0F0B07 100%)'

/** Quarter sunburst fan for a corner (rays + two arcs). */
function DecoFan({ rotate }: { rotate: number }) {
  const rays = Array.from({ length: 7 }, (_, i) => 6 + i * 13)
  return (
    <svg
      viewBox="0 0 120 120"
      className="absolute h-[4.8em] w-[4.8em]"
      style={{ top: '2em', left: '2em', transform: `rotate(${rotate}deg)` }}
      aria-hidden="true"
      fill="none"
    >
      <g stroke={GOLD} strokeOpacity="0.55" strokeWidth="1.1" strokeLinecap="round">
        {rays.map((deg) => (
          <line
            key={deg}
            x1="6"
            y1="6"
            x2={6 + 74 * Math.cos((deg * Math.PI) / 180)}
            y2={6 + 74 * Math.sin((deg * Math.PI) / 180)}
          />
        ))}
        <path d="M6 52 A46 46 0 0 0 52 6" strokeOpacity="0.7" />
        <path d="M6 78 A72 72 0 0 0 78 6" />
      </g>
    </svg>
  )
}

/** Diamond held between two hairline rules. */
function DecoRule({ tone = GOLD }: { tone?: string }) {
  return (
    <div className="flex w-full items-center justify-center gap-[1.2em]" aria-hidden="true">
      <span className="h-px flex-1" style={{ backgroundColor: tone, opacity: 0.55 }} />
      <svg viewBox="0 0 24 24" className="h-[1em] w-[1em]" fill={tone}>
        <path d="M12 2l4.2 10L12 22l-4.2-10z" />
      </svg>
      <span className="h-px flex-1" style={{ backgroundColor: tone, opacity: 0.55 }} />
    </div>
  )
}

export function EterniteOr({ draft }: TemplateProps) {
  const titleEm = isEmphasized(draft, 'title')
  const dateEm = isEmphasized(draft, 'date')
  const venueEm = isEmphasized(draft, 'venue')
  return (
    <InvitationPaper style={{ backgroundImage: PAPER_BG, color: IVORY }}>
      <DecoFan rotate={0} />
      <DecoFan rotate={90} />
      <DecoFan rotate={180} />
      <DecoFan rotate={270} />

      {/* Inset double frame. */}
      <div className="pointer-events-none absolute inset-[1.6em]" aria-hidden="true">
        <div className="absolute inset-0 border" style={{ borderColor: 'rgba(216,179,106,0.45)' }} />
        <div
          className="absolute inset-[0.55em] border"
          style={{ borderColor: 'rgba(216,179,106,0.22)' }}
        />
      </div>

      <div className="relative flex flex-1 flex-col items-center px-[6em] py-[5.5em] text-center">
        <p className="text-[1.02em] uppercase" style={{ color: GOLD, letterSpacing: '0.42em' }}>
          Cérémonie de mariage
        </p>

        <p className="mt-[2em] font-display text-[1.25em] italic" style={{ color: GOLD_SOFT }}>
          {guestLabel(draft)}
        </p>

        <h1
          className="mt-[0.7em] break-words text-balance font-display leading-[1.12]"
          style={{ fontSize: titleEm ? '3.4em' : '2.5em', color: IVORY, letterSpacing: '0.02em' }}
        >
          {draft.title}
        </h1>

        {draft.message ? (
          <p className="mt-[1.8em] max-w-[30em] text-pretty text-[1.2em] leading-[1.75] break-words opacity-90" style={{ fontFamily: messageFontCss(draft.messageFont) }}>
            {draft.message}
          </p>
        ) : null}

        {draft.cover_url ? (
          <div
            data-export-skip=""
            className="mt-[2.4em] w-full max-w-[26em] p-[0.55em]"
            style={{ border: '1px solid rgba(216,179,106,0.55)' }}
          >
            <img
              src={draft.cover_url}
              alt=""
              className="w-full"
              style={{ border: '1px solid rgba(216,179,106,0.3)' }}
            />
          </div>
        ) : null}

        <div className="mt-[2.6em] w-full">
          <DecoRule />
          <p
            className="mt-[1.8em] font-display"
            style={{ fontSize: dateEm ? '1.95em' : '1.55em', color: GOLD_SOFT, letterSpacing: '0.05em' }}
          >
            {formatEventDate(draft.event_date)}
          </p>
          <p className="mt-[0.6em] text-[1.05em] uppercase" style={{ letterSpacing: '0.4em', opacity: 0.8 }}>
            à {formatEventTime(draft.event_time)}
          </p>
          <DecoRule />
        </div>

        {draft.venue_name || draft.venue_address ? (
          <div className="mt-[2.2em]">
            <p
              className="font-display text-[1.35em]"
              style={{ color: venueEm ? GOLD : IVORY, fontWeight: venueEm ? 600 : 400 }}
            >
              {draft.venue_name}
            </p>
            <p className="mt-[0.4em] text-[1.14em] opacity-85">{draft.venue_address}</p>
            {draft.venue_details ? (
              <p className="mt-[0.7em] text-[1.02em] italic opacity-75">{draft.venue_details}</p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-auto w-full pt-[2.6em]">
          <DecoRule tone={GOLD_SOFT} />
        </div>
      </div>
    </InvitationPaper>
  )
}
