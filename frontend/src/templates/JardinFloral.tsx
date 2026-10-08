/**
 * « Jardin » — romantic botanical: blush paper, hand-drawn floral corners,
 * soft rose accents and an oval portrait cover.
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

const ROSE = '#B4636F'
const SAGE = '#7C8B6B'

function FloralCorner({ flipX = false }: { flipX?: boolean }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className="absolute h-[16em] w-[16em] opacity-92"
      style={{
        top: 0,
        left: flipX ? undefined : 0,
        right: flipX ? 0 : undefined,
        transform: flipX ? 'scaleX(-1)' : undefined,
      }}
      aria-hidden="true"
    >
      <g fill="none" stroke={SAGE} strokeWidth="2.4" strokeLinecap="round">
        <path d="M8 8 C 42 14, 66 34, 78 62" />
        <path d="M8 8 C 12 42, 30 68, 58 82" />
      </g>
      <g fill={ROSE} opacity="0.85">
        <circle cx="30" cy="18" r="5.5" />
        <circle cx="52" cy="34" r="4.5" />
        <circle cx="18" cy="40" r="4" />
        <circle cx="72" cy="58" r="5" />
      </g>
      <g fill={SAGE} opacity="0.9">
        <ellipse cx="42" cy="24" rx="7" ry="3" transform="rotate(38 42 24)" />
        <ellipse cx="22" cy="58" rx="7" ry="3" transform="rotate(-58 22 58)" />
        <ellipse cx="58" cy="52" rx="7" ry="3" transform="rotate(20 58 52)" />
      </g>
    </svg>
  )
}

export function JardinFloral({ draft }: TemplateProps) {
  const titleEm = isEmphasized(draft, 'title')
  const dateEm = isEmphasized(draft, 'date')
  const venueEm = isEmphasized(draft, 'venue')
  return (
    <InvitationPaper style={{ backgroundColor: '#FCF3F1', color: '#4A3238' }}>
      <CoverHero
        draft={draft}
        bandColor="rgba(252,243,241,0.82)"
        edgeColor="rgba(180,99,111,0.7)"
        titleClassName="font-display italic"
        titleStyle={{
          fontSize: titleEm ? '3em' : '2.3em',
          color: '#5C3A43',
        }}
      />

      {/* Decorations frame the text zone (below the cover photo). */}
      <div className="relative flex flex-1 flex-col">
        <FloralCorner />
        <FloralCorner flipX />
        <div className="relative flex flex-1 flex-col items-center px-[6.5em] py-[4em] text-center">
        <p
          className="font-display text-[1.2em] italic"
          style={{ color: ROSE, letterSpacing: '0.22em' }}
        >
          C'est avec joie que nous vous convions
        </p>

        <h1
          className="mt-[1em] break-words text-balance font-display italic leading-[1.2]"
          style={{ fontSize: titleEm ? '3.4em' : '2.5em', color: '#5C3A43' }}
        >
          {draft.title}
        </h1>

        <p className="mt-[1.8em] font-display text-[1.1em] italic" style={{ color: ROSE }}>
          {guestLabel(draft)}
        </p>
        {draft.message ? (
          <p className="mt-[1em] max-w-[28em] text-pretty text-[1.14em] leading-[1.75] break-words opacity-92" style={{ fontFamily: messageFontCss(draft.messageFont) }}>
            {draft.message}
          </p>
        ) : null}

        <div
          className="mt-[2.2em] rounded-[1.2em] px-[2.2em] py-[1.4em]"
          style={{ backgroundColor: '#FFFFFFB8' }}
        >
          <p
            className="font-display"
            style={{ fontSize: dateEm ? '1.6em' : '1.25em', color: '#5C3A43' }}
          >
            {formatEventDate(draft.event_date)}
          </p>
          <p className="mt-[0.35em] text-[1.08em]" style={{ letterSpacing: '0.3em', color: ROSE }}>
            {formatEventTime(draft.event_time)}
          </p>
        </div>

        {draft.venue_name || draft.venue_address ? (
          <div className="mt-[1.8em]">
            <p
              className="font-display text-[1.15em] italic"
              style={{ color: venueEm ? ROSE : '#5C3A43' }}
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
          accent={ROSE}
          ink="#5C3A43"
          ornament={
            <TemplateOrnament templateKey="jardin-floral" color={ROSE} className="block h-auto w-full" />
          }
          titleClassName="font-display italic"
          titleStyle={{ letterSpacing: '0.18em', textTransform: 'none' }}
        />
        <DressCodeSection
          draft={draft}
          accent={ROSE}
          ink="#5C3A43"
          ornament={
            <TemplateOrnament templateKey="jardin-floral" color={ROSE} className="block h-auto w-full" />
          }
          titleClassName="font-display italic"
          titleStyle={{ letterSpacing: '0.18em', textTransform: 'none' }}
        />

        <p className="mt-auto pt-[2em] text-[0.96em] italic opacity-78">
          Au plaisir de vous y retrouver
        </p>
        </div>
      </div>
    </InvitationPaper>
  )
}
