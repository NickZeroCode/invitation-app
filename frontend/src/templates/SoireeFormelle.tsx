/**
 * « Soirée » — formal evening reception: deep emerald paper, champagne
 * text, spaced uppercase titling and a vignetted cover.
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

const EMERALD = '#0E2A22'
const CHAMPAGNE = '#E8D8B0'

export function SoireeFormelle({ draft }: TemplateProps) {
  const titleEm = isEmphasized(draft, 'title')
  const dateEm = isEmphasized(draft, 'date')
  const venueEm = isEmphasized(draft, 'venue')
  return (
    <InvitationPaper style={{ backgroundColor: EMERALD, color: CHAMPAGNE }}>
      <div className="flex flex-1 flex-col items-center px-[6em] py-[4.5em] text-center">
        <p
          className="font-display text-[1.2em] italic"
          style={{ color: '#C7A96B', letterSpacing: '0.16em' }}
        >
          Le plaisir de votre présence serait un honneur
        </p>

        <h1
          className="mt-[1.4em] break-words text-balance uppercase leading-[1.25]"
          style={{
            fontSize: titleEm ? '3em' : '2.2em',
            fontWeight: 600,
            letterSpacing: '0.18em',
            color: '#F5EBD2',
          }}
        >
          {draft.title}
        </h1>

        <div className="mt-[1.6em] flex w-full items-center justify-center gap-[1em]" aria-hidden="true">
          <span className="h-px flex-1" style={{ backgroundColor: '#C7A96B66' }} />
          <svg viewBox="0 0 24 24" className="h-[1.1em] w-[1.1em]" fill="#C7A96B">
            <path d="M12 2c2.2 4.6 5.2 6.4 10 8-4.8 1.6-7.8 3.4-10 8-2.2-4.6-5.2-6.4-10-8 4.8-1.6 7.8-3.4 10-8z" />
          </svg>
          <span className="h-px flex-1" style={{ backgroundColor: '#C7A96B66' }} />
        </div>

        {draft.cover_url ? (
          <div data-export-skip="" className="relative mt-[1.8em] w-full max-w-[24em]">
            <img
              src={draft.cover_url}
              alt=""
              className="w-full"
              style={{ filter: 'brightness(0.85)' }}
            />
            <div
              className="absolute inset-0"
              style={{ boxShadow: 'inset 0 0 3em 1em rgba(14,42,34,0.85)' }}
              aria-hidden="true"
            />
          </div>
        ) : null}

        <p className="mt-[1.8em] font-display text-[1.15em] italic" style={{ color: '#C7A96B' }}>
          {guestLabel(draft)}
        </p>
        {draft.message ? (
          <p className="mt-[1em] max-w-[29em] text-pretty text-[1.14em] leading-[1.85] break-words opacity-95" style={{ fontFamily: messageFontCss(draft.messageFont) }}>
            {draft.message}
          </p>
        ) : null}

        <div className="mt-[2em]">
          <p
            className="uppercase"
            style={{ fontSize: dateEm ? '1.6em' : '1.2em', letterSpacing: '0.22em', color: '#F5EBD2' }}
          >
            {formatEventDate(draft.event_date)}
          </p>
          <p className="mt-[0.5em] text-[1.2em]" style={{ letterSpacing: '0.42em' }}>
            {formatEventTime(draft.event_time)}
          </p>
        </div>

        {draft.venue_name || draft.venue_address ? (
          <div className="mt-[1.8em]">
            <p
              className="text-[1.05em] font-semibold uppercase"
              style={{ letterSpacing: '0.24em', color: venueEm ? '#C7A96B' : '#F5EBD2' }}
            >
              {draft.venue_name}
            </p>
            <p className="mt-[0.3em] text-[1.08em] opacity-88">{draft.venue_address}</p>
            {draft.venue_details ? (
              <p className="mt-[0.5em] text-[0.96em] italic opacity-80">{draft.venue_details}</p>
            ) : null}
          </div>
        ) : null}

        <p className="mt-auto pt-[2em] text-[1.02em] uppercase" style={{ letterSpacing: '0.42em', opacity: 0.7 }}>
          Tenue de soirée exigée
        </p>
      </div>
    </InvitationPaper>
  )
}
