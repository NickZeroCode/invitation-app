/**
 * « Ligne moderne » — contemporary corporate grid: left-aligned typography,
 * strict rules, one accent colour and a large date block. No cover image.
 */
import {
  InvitationPaper,
  formatDayNumber,
  formatEventTime,
  formatMonthYear,
  guestLabel,
  isEmphasized,
} from './shared.tsx'
import type { TemplateProps } from './types.ts'

const ACCENT = '#C8102E'
const INK = '#16181D'

export function LigneModerne({ draft }: TemplateProps) {
  const titleEm = isEmphasized(draft, 'title')
  const dateEm = isEmphasized(draft, 'date')
  const venueEm = isEmphasized(draft, 'venue')
  const messageEm = isEmphasized(draft, 'message')
  return (
    <InvitationPaper style={{ backgroundColor: '#FFFFFF', color: INK }}>
      <div className="flex flex-1 flex-col px-[5.5em] py-[4em]">
        <div className="flex items-center justify-between">
          <p
            className="text-[0.85em] font-semibold uppercase"
            style={{ letterSpacing: '0.42em', color: ACCENT }}
          >
            NickEvents
          </p>
          <p className="text-[0.85em] uppercase" style={{ letterSpacing: '0.28em', opacity: 0.55 }}>
            Invitation
          </p>
        </div>
        <span className="mt-[1.2em] h-[0.35em] w-full" style={{ backgroundColor: INK }} />

        <h1
          className="mt-[1.6em] font-semibold uppercase leading-[1.12]"
          style={{ fontSize: titleEm ? '3.3em' : '2.35em', letterSpacing: '0.02em' }}
        >
          {draft.title}
        </h1>

        <p className="mt-[1.2em] text-[0.95em]" style={{ letterSpacing: '0.18em', opacity: 0.65 }}>
          {guestLabel(draft).toUpperCase()}
        </p>

        {draft.message ? (
          <p
            className="mt-[1.4em] max-w-[30em] leading-[1.75]"
            style={{
              fontSize: messageEm ? '1.25em' : '1em',
              fontWeight: messageEm ? 600 : 400,
              opacity: messageEm ? 1 : 0.8,
            }}
          >
            {draft.message}
          </p>
        ) : null}

        <div className="mt-[2.4em] grid grid-cols-[auto_1fr] gap-x-[2em]">
          <div
            className="flex flex-col items-center justify-center px-[1.6em] py-[1.2em]"
            style={{ backgroundColor: dateEm ? ACCENT : INK, color: '#FFFFFF' }}
          >
            <span
              className="font-semibold leading-none"
              style={{ fontSize: dateEm ? '3em' : '2.3em' }}
            >
              {formatDayNumber(draft.event_date)}
            </span>
            <span className="mt-[0.4em] text-[0.8em]" style={{ letterSpacing: '0.24em' }}>
              {formatMonthYear(draft.event_date)}
            </span>
          </div>
          <div className="flex flex-col justify-center">
            <p
              className="text-[0.85em] uppercase"
              style={{ letterSpacing: '0.32em', opacity: 0.55 }}
            >
              Heure
            </p>
            <p className="mt-[0.3em] text-[1.5em] font-semibold">{formatEventTime(draft.event_time)}</p>
            <p
              className="mt-[1em] text-[0.85em] uppercase"
              style={{ letterSpacing: '0.32em', opacity: 0.55 }}
            >
              Lieu
            </p>
            <p
              className="mt-[0.3em] text-[1.15em] font-semibold"
              style={{ color: venueEm ? ACCENT : INK }}
            >
              {draft.venue_name}
            </p>
            <p className="mt-[0.25em] text-[0.95em] opacity-75">{draft.venue_address}</p>
            {draft.venue_details ? (
              <p className="mt-[0.4em] text-[0.85em] opacity-60">{draft.venue_details}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-auto">
          <span className="mt-[2.4em] block h-px w-full" style={{ backgroundColor: INK, opacity: 0.2 }} />
          <p className="mt-[1em] text-[0.8em] uppercase" style={{ letterSpacing: '0.32em', opacity: 0.5 }}>
            Merci de confirmer votre présence
          </p>
        </div>
      </div>
    </InvitationPaper>
  )
}
