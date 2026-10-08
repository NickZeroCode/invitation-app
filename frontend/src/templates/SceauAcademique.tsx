/**
 * « Sceau académique » — graduation ceremony: deep navy, gold seal and
 * rules, solemn centered composition with a framed cover.
 */
import {
  CoverHero,
  DressCodeSection,
  InvitationPaper,
  ProgramSection,
  formatEventDate,
  formatEventTime,
  guestLabel,
  isEmphasized,
} from './shared.tsx'
import type { TemplateProps } from './types.ts'
import { messageFontCss } from './messageFonts.ts'
import { TemplateOrnament } from './ornaments.tsx'

const NAVY = '#14213D'
const GOLD = '#C9A227'

function Seal() {
  return (
    <svg viewBox="0 0 64 64" className="h-[5em] w-[5em]" aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="none" stroke={GOLD} strokeWidth="1.6" />
      <circle cx="32" cy="32" r="24" fill="none" stroke={GOLD} strokeWidth="0.9" />
      <path d="M32 16l4.2 8.6 9.5 1.4-6.9 6.7 1.6 9.4L32 37.8l-8.4 4.3 1.6-9.4-6.9-6.7 9.5-1.4z" fill={GOLD} />
      <path d="M20 46h24" stroke={GOLD} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function SceauAcademique({ draft }: TemplateProps) {
  const titleEm = isEmphasized(draft, 'title')
  const dateEm = isEmphasized(draft, 'date')
  const venueEm = isEmphasized(draft, 'venue')
  return (
    <InvitationPaper style={{ backgroundColor: NAVY, color: '#F4EFE4' }}>
      <CoverHero
        draft={draft}
        bandColor="rgba(13,23,41,0.62)"
        edgeColor="rgba(201,162,39,0.85)"
        titleClassName="font-display"
        titleStyle={{
          fontSize: titleEm ? '2.9em' : '2.2em',
          color: '#FFFFFF',
        }}
      />

      {/* Decorations frame the text zone (below the cover photo). */}
      <div className="relative flex flex-1 flex-col">
        <div
          className="absolute inset-[1.2em] rounded-[0.3em] border"
          style={{ borderColor: '#C9A22766' }}
          aria-hidden="true"
        />
        <div className="relative flex flex-1 flex-col items-center px-[6.5em] py-[4.5em] text-center">
        <Seal />
        <p
          className="mt-[1.4em] text-[1.02em] uppercase"
          style={{ color: GOLD, letterSpacing: '0.5em' }}
        >
          Remise des diplômes
        </p>

        <h1
          className="mt-[1.2em] break-words text-balance font-display leading-[1.2]"
          style={{ fontSize: titleEm ? '3.2em' : '2.4em', color: '#FFFFFF' }}
        >
          {draft.title}
        </h1>

        <div className="mt-[1.6em] flex w-full items-center justify-center gap-[1.2em]" aria-hidden="true">
          <span className="h-px flex-1" style={{ backgroundColor: `${GOLD}88` }} />
          <span className="h-[0.45em] w-[0.45em] rotate-45" style={{ backgroundColor: GOLD }} />
          <span className="h-px flex-1" style={{ backgroundColor: `${GOLD}88` }} />
        </div>

        <p className="mt-[1.4em] font-display text-[1.1em]" style={{ color: GOLD }}>
          {guestLabel(draft)}
        </p>
        {draft.message ? (
          <p className="mt-[1em] max-w-[29em] text-pretty text-[1.14em] leading-[1.8] break-words opacity-95" style={{ fontFamily: messageFontCss(draft.messageFont) }}>
            {draft.message}
          </p>
        ) : null}

        <div className="mt-[2em]">
          <p
            className="font-display"
            style={{ fontSize: dateEm ? '1.7em' : '1.3em', letterSpacing: '0.05em' }}
          >
            {formatEventDate(draft.event_date)}
          </p>
          <p className="mt-[0.45em] text-[1.14em]" style={{ letterSpacing: '0.32em', opacity: 0.92 }}>
            {formatEventTime(draft.event_time)}
          </p>
        </div>

        {draft.venue_name || draft.venue_address ? (
          <div className="mt-[1.6em]">
            <p
              className="text-[1.05em] font-semibold uppercase"
              style={{ letterSpacing: '0.18em', color: venueEm ? GOLD : '#FFFFFF' }}
            >
              {draft.venue_name}
            </p>
            <p className="mt-[0.3em] text-[1.08em] opacity-88">{draft.venue_address}</p>
            {draft.venue_details ? (
              <p className="mt-[0.5em] text-[0.96em] italic opacity-80">{draft.venue_details}</p>
            ) : null}
          </div>
        ) : null}

        <ProgramSection
          draft={draft}
          accent={GOLD}
          ink="#F4EFE4"
          ornament={
            <TemplateOrnament templateKey="sceau-academique" color={GOLD} className="block h-auto w-full" />
          }
          titleStyle={{ letterSpacing: '0.5em' }}
        />
        <DressCodeSection
          draft={draft}
          accent={GOLD}
          ink="#F4EFE4"
          ornament={
            <TemplateOrnament templateKey="sceau-academique" color={GOLD} className="block h-auto w-full" />
          }
          titleStyle={{ letterSpacing: '0.5em' }}
        />

        <p className="mt-auto pt-[2em] text-[1.02em] uppercase" style={{ letterSpacing: '0.35em', opacity: 0.72 }}>
          Honneur à la réussite
        </p>
        </div>
      </div>
    </InvitationPaper>
  )
}
