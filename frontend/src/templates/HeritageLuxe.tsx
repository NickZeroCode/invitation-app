/**
 * « Héritage » — classic wedding elegance: centered serif composition,
 * cream paper, thin gold rules and an arch-topped cover photograph.
 */
import {
  InvitationPaper,
  formatEventDate,
  formatEventTime,
  guestLabel,
  isEmphasized,
} from './shared.tsx'
import type { TemplateProps } from './types.ts'

const GOLD = '#A67C3D'
const INK = '#2B2620'

function GoldRule() {
  return (
    <div className="flex w-full items-center justify-center gap-[1em]" aria-hidden="true">
      <span className="h-px flex-1" style={{ backgroundColor: GOLD }} />
      <svg viewBox="0 0 24 24" className="h-[1.1em] w-[1.1em]" fill={GOLD}>
        <path d="M12 2l3.2 8.8L12 22l-3.2-11.2z" />
      </svg>
      <span className="h-px flex-1" style={{ backgroundColor: GOLD }} />
    </div>
  )
}

export function HeritageLuxe({ draft }: TemplateProps) {
  const titleEm = isEmphasized(draft, 'title')
  const dateEm = isEmphasized(draft, 'date')
  const venueEm = isEmphasized(draft, 'venue')
  return (
    <InvitationPaper style={{ backgroundColor: '#FBF6EC', color: INK }}>
      <div className="flex flex-1 flex-col items-center px-[7em] py-[4.5em] text-center">
        <GoldRule />
        <p
          className="mt-[2em] text-[0.85em] uppercase"
          style={{ color: GOLD, letterSpacing: '0.55em' }}
        >
          Vous êtes invités
        </p>

        {draft.cover_url ? (
          <img
            src={draft.cover_url}
            alt=""
            className="mt-[2em] w-full max-w-[24em] rounded-t-[12em] rounded-b-[0.6em] object-cover"
            style={{ height: '17em' }}
          />
        ) : null}

        <p className="mt-[2.2em] font-display text-[1.15em] italic" style={{ color: GOLD }}>
          {guestLabel(draft)}
        </p>
        <h1
          className="mt-[0.7em] break-words text-balance font-display leading-[1.15]"
          style={{ fontSize: titleEm ? '3.6em' : '2.6em', color: INK }}
        >
          {draft.title}
        </h1>

        {draft.message ? (
          <p className="mt-[1.6em] max-w-[30em] text-pretty text-[1em] leading-[1.7] break-words opacity-80">
            {draft.message}
          </p>
        ) : null}

        <div className="mt-[2.4em] w-full">
          <GoldRule />
          <p
            className="mt-[1.6em] font-display"
            style={{ fontSize: dateEm ? '1.7em' : '1.3em', letterSpacing: '0.06em' }}
          >
            {formatEventDate(draft.event_date)}
          </p>
          <p className="mt-[0.5em] text-[1em] uppercase" style={{ letterSpacing: '0.35em' }}>
            à {formatEventTime(draft.event_time)}
          </p>
        </div>

        {draft.venue_name || draft.venue_address ? (
          <div className="mt-[2em]">
            <p
              className="font-display text-[1.25em]"
              style={{ color: venueEm ? GOLD : INK, fontWeight: venueEm ? 600 : 400 }}
            >
              {draft.venue_name}
            </p>
            <p className="mt-[0.35em] text-[0.95em] opacity-75">{draft.venue_address}</p>
            {draft.venue_details ? (
              <p className="mt-[0.6em] text-[0.85em] italic opacity-65">{draft.venue_details}</p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-auto pt-[2.5em]">
          <GoldRule />
        </div>
      </div>
    </InvitationPaper>
  )
}
