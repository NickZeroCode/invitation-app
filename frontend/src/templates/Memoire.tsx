/**
 * « Mémoire » — memorial homage: ivory paper, restrained serif typography,
 * a single quiet ornament and generous whitespace. No cover image.
 */
import {
  InvitationPaper,
  formatEventDate,
  formatEventTime,
  guestLabel,
  isEmphasized,
} from './shared.tsx'
import type { TemplateProps } from './types.ts'

const STONE = '#4B463F'
const SAGE = '#8A8377'

export function Memoire({ draft }: TemplateProps) {
  const titleEm = isEmphasized(draft, 'title')
  const dateEm = isEmphasized(draft, 'date')
  return (
    <InvitationPaper style={{ backgroundColor: '#F7F5F0', color: STONE }}>
      <div
        className="absolute inset-[1.6em] border"
        style={{ borderColor: '#D8D2C6' }}
        aria-hidden="true"
      />
      <div className="flex flex-1 flex-col items-center px-[7.5em] py-[5em] text-center">
        <div className="flex items-center gap-[1em]" aria-hidden="true">
          <span className="h-px w-[6em]" style={{ backgroundColor: '#C9C2B4' }} />
          <span className="h-[0.4em] w-[0.4em] rotate-45" style={{ backgroundColor: SAGE }} />
          <span className="h-px w-[6em]" style={{ backgroundColor: '#C9C2B4' }} />
        </div>

        <p
          className="mt-[2.4em] text-[0.85em] uppercase"
          style={{ color: SAGE, letterSpacing: '0.5em' }}
        >
          En souvenir
        </p>

        <h1
          className="mt-[1.6em] break-words text-balance font-display leading-[1.3]"
          style={{ fontSize: titleEm ? '2.9em' : '2.15em', color: '#3A352E' }}
        >
          {draft.title}
        </h1>

        {draft.message ? (
          <p className="mt-[2em] max-w-[27em] text-pretty font-display text-[1em] italic leading-[1.9] break-words opacity-80">
            {draft.message}
          </p>
        ) : null}

        <div className="mt-[2.6em]">
          <p
            className="font-display"
            style={{ fontSize: dateEm ? '1.55em' : '1.2em', color: '#3A352E' }}
          >
            {formatEventDate(draft.event_date)}
          </p>
          <p className="mt-[0.5em] text-[0.95em]" style={{ letterSpacing: '0.28em', opacity: 0.7 }}>
            {formatEventTime(draft.event_time)}
          </p>
        </div>

        {draft.venue_name || draft.venue_address ? (
          <div className="mt-[2em]">
            <p className="font-display text-[1.1em]">{draft.venue_name}</p>
            <p className="mt-[0.35em] text-[0.9em] opacity-70">{draft.venue_address}</p>
            {draft.venue_details ? (
              <p className="mt-[0.5em] text-[0.82em] italic opacity-60">{draft.venue_details}</p>
            ) : null}
          </div>
        ) : null}

        <p className="mt-auto pt-[2.4em] text-[0.9em] italic" style={{ color: SAGE }}>
          {guestLabel(draft)}
        </p>
      </div>
    </InvitationPaper>
  )
}
