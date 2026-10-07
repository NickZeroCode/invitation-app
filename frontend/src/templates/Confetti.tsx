/**
 * « Confetti » — joyful birthday: candy palette, playful dots and a tilted
 * cover card, bold display typography.
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

const INDIGO = '#4338CA'
const AMBER = '#F59E0B'
const PINK = '#EC4899'

function ConfettiDots() {
  return (
    <svg
      viewBox="0 0 320 60"
      className="absolute inset-x-0 top-0 h-[6em] w-full"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <rect x="0" y="0" width="320" height="60" fill={INDIGO} />
      <circle cx="28" cy="18" r="6" fill={AMBER} />
      <circle cx="70" cy="40" r="4.5" fill={PINK} />
      <rect x="118" y="12" width="9" height="9" fill="#FFFFFF" transform="rotate(18 122 16)" />
      <circle cx="176" cy="34" r="5.5" fill={AMBER} />
      <rect x="216" y="30" width="8" height="8" fill={PINK} transform="rotate(-14 220 34)" />
      <circle cx="268" cy="14" r="5" fill="#FFFFFF" />
      <circle cx="300" cy="38" r="4.5" fill={AMBER} />
    </svg>
  )
}

export function Confetti({ draft }: TemplateProps) {
  const titleEm = isEmphasized(draft, 'title')
  const dateEm = isEmphasized(draft, 'date')
  return (
    <InvitationPaper style={{ backgroundColor: '#FFF8E7', color: '#312E81' }}>
      <ConfettiDots />
      <div className="flex flex-1 flex-col items-center px-[5.5em] pb-[3.5em] pt-[9em] text-center">
        <p
          className="rounded-full px-[1.6em] py-[0.55em] text-[1.02em] font-bold uppercase"
          style={{ backgroundColor: AMBER, color: '#7C2D12', letterSpacing: '0.28em' }}
        >
          Vous êtes convié(e)
        </p>

        <h1
          className="mt-[1.1em] break-words text-balance font-extrabold leading-[1.1]"
          style={{ fontSize: titleEm ? '3.4em' : '2.5em', color: INDIGO }}
        >
          {draft.title}
        </h1>

        {draft.cover_url ? (
          <img
            src={draft.cover_url}
            alt=""
            className="mt-[1.8em] w-full max-w-[24em] rounded-[1.4em] object-cover shadow-[0.15em_0.25em_0_rgba(67,56,202,0.25)]"
            style={{ height: '14em', transform: 'rotate(-2deg)', border: '0.35em solid #FFFFFF' }}
          />
        ) : null}

        <p
          className="mt-[1.8em] rounded-full px-[1.4em] py-[0.5em] text-[1.14em] font-semibold"
          style={{ backgroundColor: '#FCE7F3', color: PINK }}
        >
          {guestLabel(draft)}
        </p>
        {draft.message ? (
          <p className="mt-[1.1em] max-w-[28em] text-pretty text-[1.2em] leading-[1.7] break-words opacity-95" style={{ fontFamily: messageFontCss(draft.messageFont) }}>{draft.message}</p>
        ) : null}

        <div
          className="mt-[1.8em] w-full max-w-[26em] rounded-[1.2em] px-[1.8em] py-[1.3em]"
          style={{ backgroundColor: INDIGO, color: '#FFFFFF' }}
        >
          <p
            className="font-extrabold"
            style={{ fontSize: dateEm ? '1.6em' : '1.25em', letterSpacing: '0.02em' }}
          >
            {formatEventDate(draft.event_date)}
          </p>
          <p className="mt-[0.4em] text-[1.2em]" style={{ color: AMBER, letterSpacing: '0.22em' }}>
            À {formatEventTime(draft.event_time)}
          </p>
          {draft.venue_name ? (
            <p className="mt-[0.7em] text-[1.14em] opacity-90">
              {draft.venue_name}
              {draft.venue_address ? ` — ${draft.venue_address}` : ''}
            </p>
          ) : null}
          {draft.venue_details ? (
            <p className="mt-[0.35em] text-[0.96em] italic opacity-88">{draft.venue_details}</p>
          ) : null}
        </div>

        <p className="mt-auto pt-[1.8em] text-[1.08em] font-semibold" style={{ color: PINK }}>
          Venez nombreux, la fête est pour vous !
        </p>
      </div>
    </InvitationPaper>
  )
}
