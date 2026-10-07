/**
 * « Arche Soleil » — boho-luxe terracotta wedding. Sand paper, a grand arch
 * motif with a rising sun over the title, hand-drawn wavy rules and a dotted
 * festival band: warm, confident and expensive-looking.
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

const TERRA = '#BE5330'
const OCHRE = '#D89A52'
const PLUM = '#47282B'
const PAPER_BG = 'radial-gradient(115% 95% at 50% -8%, #F7EAD8 0%, #F2E4D0 55%, #EAD6BD 100%)'

/** Sun disc with rounded rays. */
function Sun({ size = '5.2em' }: { size?: string }) {
  const rays = Array.from({ length: 12 }, (_, i) => i * 30)
  return (
    <svg
      viewBox="0 0 120 120"
      style={{ width: size, height: size }}
      aria-hidden="true"
      fill="none"
    >
      <circle cx="60" cy="60" r="21" fill={OCHRE} />
      <circle cx="60" cy="60" r="27" stroke={TERRA} strokeWidth="1.2" strokeOpacity="0.55" />
      <g stroke={TERRA} strokeWidth="3.2" strokeLinecap="round" strokeOpacity="0.85">
        {rays.map((deg) => (
          <line
            key={deg}
            x1={60 + 33 * Math.cos((deg * Math.PI) / 180)}
            y1={60 + 33 * Math.sin((deg * Math.PI) / 180)}
            x2={60 + 44 * Math.cos((deg * Math.PI) / 180)}
            y2={60 + 44 * Math.sin((deg * Math.PI) / 180)}
          />
        ))}
      </g>
    </svg>
  )
}

/** Hand-drawn wavy rule. */
function Wave({ tone = TERRA }: { tone?: string }) {
  return (
    <svg viewBox="0 0 220 18" className="h-[1.1em] w-[13em]" aria-hidden="true" fill="none">
      <path
        d="M4 9 Q 22 -2 40 9 T 76 9 T 112 9 T 148 9 T 184 9 T 216 9"
        stroke={tone}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.8"
      />
    </svg>
  )
}

/** Row of alternating terracotta / ochre dots. */
function DotBand() {
  return (
    <div className="flex items-center justify-center gap-[0.75em]" aria-hidden="true">
      {Array.from({ length: 9 }, (_, i) => (
        <span
          key={i}
          className="block h-[0.42em] w-[0.42em] rounded-full"
          style={{ backgroundColor: i % 2 ? OCHRE : TERRA, opacity: 0.85 }}
        />
      ))}
    </div>
  )
}

export function ArcheSoleil({ draft }: TemplateProps) {
  const titleEm = isEmphasized(draft, 'title')
  const dateEm = isEmphasized(draft, 'date')
  const venueEm = isEmphasized(draft, 'venue')
  return (
    <InvitationPaper style={{ backgroundImage: PAPER_BG, color: PLUM }}>
      {/* Grand arch motif behind the header. */}
      <svg
        viewBox="0 0 300 240"
        className="pointer-events-none absolute left-1/2 top-0 h-[30em] w-[26em] -translate-x-1/2"
        aria-hidden="true"
        fill="none"
      >
        <path
          d="M22 240 V150 A128 128 0 0 1 278 150 V240"
          stroke={TERRA}
          strokeWidth="1.6"
          strokeOpacity="0.32"
        />
        <path
          d="M36 240 V152 A114 114 0 0 1 264 152 V240"
          stroke={OCHRE}
          strokeWidth="1.2"
          strokeOpacity="0.3"
        />
      </svg>

      <div className="relative flex flex-1 flex-col items-center px-[5.5em] pt-[4.6em] pb-[4.2em] text-center">
        <div className="flex flex-col items-center">
          <Sun />
          <p
            className="mt-[1.2em] rounded-full px-[1.5em] py-[0.55em] text-[1.02em] font-semibold uppercase"
            style={{ backgroundColor: TERRA, color: '#FBF3E7', letterSpacing: '0.34em' }}
          >
            Réservez la date
          </p>
        </div>

        <p className="mt-[1.8em] font-display text-[1.25em] italic" style={{ color: TERRA }}>
          {guestLabel(draft)}
        </p>

        <h1
          className="mt-[0.6em] break-words text-balance font-display leading-[1.12]"
          style={{ fontSize: titleEm ? '3.4em' : '2.5em', color: PLUM }}
        >
          {draft.title}
        </h1>

        <div className="mt-[1.6em]">
          <Wave />
        </div>

        {draft.message ? (
          <p className="mt-[1.3em] max-w-[29em] text-pretty text-[1.2em] leading-[1.75] break-words opacity-92" style={{ fontFamily: messageFontCss(draft.messageFont) }}>
            {draft.message}
          </p>
        ) : null}

        {draft.cover_url ? (
          <div
            className="mt-[2.2em] w-full max-w-[25em] rounded-t-[10em] p-[0.45em]"
            style={{ backgroundColor: 'rgba(216,154,82,0.22)', border: '1px solid rgba(190,83,48,0.4)' }}
          >
            <img
              src={draft.cover_url}
              alt=""
              className="h-[17em] w-full rounded-t-[9.4em] object-cover"
            />
          </div>
        ) : null}

        <div
          className="mt-[2em] w-full max-w-[24em] rounded-[1.4em] px-[1.6em] py-[1.2em]"
          style={{ backgroundColor: 'rgba(255,252,246,0.72)', border: '1px dashed rgba(190,83,48,0.55)' }}
        >
          <p
            className="font-display"
            style={{ fontSize: dateEm ? '1.95em' : '1.5em', color: TERRA, letterSpacing: '0.03em' }}
          >
            {formatEventDate(draft.event_date)}
          </p>
          <p className="mt-[0.5em] text-[1.08em] uppercase" style={{ letterSpacing: '0.32em', opacity: 0.8 }}>
            à {formatEventTime(draft.event_time)}
          </p>
        </div>

        {draft.venue_name || draft.venue_address ? (
          <div className="mt-[2em]">
            <p
              className="font-display text-[1.35em]"
              style={{ color: venueEm ? TERRA : PLUM, fontWeight: venueEm ? 600 : 500 }}
            >
              {draft.venue_name}
            </p>
            <p className="mt-[0.4em] text-[1.14em] opacity-85">{draft.venue_address}</p>
            {draft.venue_details ? (
              <p className="mt-[0.6em] text-[1.02em] italic opacity-78">{draft.venue_details}</p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-auto w-full pt-[1.8em]">
          <DotBand />
        </div>
      </div>
    </InvitationPaper>
  )
}
