/**
 * « Grenat » — reproduction of `very_beautiful template/baz5.webp`.
 *
 * Blush-to-cream gradient paper inside a thin gold frame, burgundy rose
 * clusters with gold leaves and sparkles at the top corners, a row of gold
 * lotus petals along the bottom, burgundy italic serif intro, stacked
 * calligraphy names around a gold ampersand and a rule-divided date row.
 */
import { PaperGrain } from './florals.tsx'
import { messageFontCss } from './messageFonts.ts'
import { TemplateOrnament } from './ornaments.tsx'
import {
  DressCodeSection,
  InvitationPaper,
  NoteSection,
  ProgramSection,
  TableSection,
  formatDayNumber,
  formatEventTime,
  formatWeekday,
  isEmphasized,
} from './shared.tsx'
import {
  GOLD,
  GRENAT,
  RoseCluster,
  SCRIPT_FONT,
  Sparkles,
  formatMonthOnly,
  splitNames,
} from './referenceMotifs.tsx'
import type { TemplateProps } from './types.ts'

const PAPER = '#F7EDE4'
const PAPER_DEEP = '#EFDDD0'
const INK = '#8E2F45'
const DEEP = '#661B2E'

/** Row of outlined gold lotus petals rising from the bottom edge. */
function LotusRow({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 600 100"
      preserveAspectRatio="xMidYMax meet"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[6em] w-full"
      aria-hidden="true"
    >
      {[
        { x: 55, s: 0.85 },
        { x: 150, s: 1.1 },
        { x: 245, s: 0.9 },
        { x: 300, s: 1.3 },
        { x: 355, s: 0.9 },
        { x: 450, s: 1.1 },
        { x: 545, s: 0.85 },
      ].map(({ x, s }) => (
        <path
          key={x}
          transform={`translate(${x} 100) scale(${s})`}
          d="M 0 -86 C 26 -58 26 -22 0 -2 C -26 -22 -26 -58 0 -86 Z"
          fill="none"
          stroke={color}
          strokeWidth="1.6"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  )
}

export function Grenat({ draft }: TemplateProps) {
  const titleEm = isEmphasized(draft, 'title')
  const dateEm = isEmphasized(draft, 'date')
  const venueEm = isEmphasized(draft, 'venue')
  const names = splitNames(draft.title)
  return (
    <InvitationPaper
      style={{
        backgroundImage: `linear-gradient(160deg, ${PAPER} 0%, ${PAPER} 42%, ${PAPER_DEEP} 100%)`,
        color: INK,
      }}
    >
      <PaperGrain opacity={0.04} />
      {/* thin gold frame */}
      <div
        className="pointer-events-none absolute inset-[0.9em] rounded-[0.3em] border"
        style={{ borderColor: GOLD, opacity: 0.85 }}
      />

      {/* Burgundy roses + sparkles, top corners */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <RoseCluster
          palette={GRENAT}
          className="absolute -left-[2.6em] -top-[2.2em] h-[13.5em] w-[15.5em]"
          style={{ transform: 'rotate(8deg)' }}
        />
        <RoseCluster
          palette={GRENAT}
          className="absolute -right-[2.6em] -top-[2.2em] h-[13.5em] w-[15.5em]"
          style={{ transform: 'scaleX(-1) rotate(8deg)' }}
        />
        <Sparkles
          color="#D9B568"
          className="absolute left-[12.5em] top-[3em] h-[3.8em] w-[3.8em]"
        />
        <Sparkles
          color="#D9B568"
          className="absolute right-[12.5em] top-[3em] h-[3.8em] w-[3.8em]"
        />
      </div>
      <LotusRow color={GOLD} />

      <div className="relative flex flex-1 flex-col items-center px-[6.2em] pb-[6.6em] pt-[5.6em] text-center">
        <p className="font-display italic" style={{ fontSize: titleEm ? '1.75em' : '1.45em', color: INK }}>
          Réservez la date
        </p>

        <h1 className="mt-[1.3em] break-words text-balance leading-[1.16]" style={{ color: DEEP }}>
          <span className="sr-only">{draft.title}</span>
          {names ? (
            <span aria-hidden="true" className="flex flex-col items-center">
              <span style={{ fontFamily: SCRIPT_FONT, fontSize: titleEm ? '4em' : '3.3em' }}>
                {names[0]}
              </span>
              <span
                className="italic"
                style={{
                  fontFamily: "'Cormorant Garamond', ui-serif, Georgia, serif",
                  fontSize: titleEm ? '2.5em' : '2em',
                  color: GOLD,
                  lineHeight: 1,
                  margin: '0.08em 0',
                }}
              >
                &amp;
              </span>
              <span style={{ fontFamily: SCRIPT_FONT, fontSize: titleEm ? '4em' : '3.3em' }}>
                {names[1]}
              </span>
            </span>
          ) : (
            <span style={{ fontFamily: SCRIPT_FONT, fontSize: titleEm ? '4em' : '3.3em' }}>
              {draft.title}
            </span>
          )}
        </h1>

        {draft.guestName?.trim() ? (
          <p className="mt-[1em] font-display italic" style={{ fontSize: '1.1em', color: INK }}>
            {draft.guestName}
          </p>
        ) : null}

        {draft.message ? (
          <p
            className="mt-[1.1em] max-w-[24em] text-pretty leading-[1.75] break-words"
            style={{ fontSize: '1.02em', color: INK, fontFamily: messageFontCss(draft.messageFont) }}
          >
            {draft.message}
          </p>
        ) : null}

        <p
          className="mt-[1.8em] uppercase"
          style={{ letterSpacing: '0.42em', fontSize: '1.12em', color: DEEP }}
        >
          {formatMonthOnly(draft.event_date)}
        </p>

        <div className="relative mt-[1.1em]">
          <Sparkles
            color="#D9B568"
            className="pointer-events-none absolute -left-[4.8em] top-1/2 h-[2.6em] w-[2.6em] -translate-y-1/2"
          />
          <div
            className="flex items-stretch justify-center"
            style={{ transform: dateEm ? 'scale(1.12)' : undefined, color: DEEP }}
          >
            <p className="flex items-center px-[0.9em] uppercase" style={{ letterSpacing: '0.22em' }}>
              {formatWeekday(draft.event_date)}
            </p>
            <span style={{ width: 1, backgroundColor: DEEP, opacity: 0.45 }} />
            <p className="flex items-center px-[0.95em] font-display leading-none" style={{ fontSize: '2.5em' }}>
              {formatDayNumber(draft.event_date)}
            </p>
            <span style={{ width: 1, backgroundColor: DEEP, opacity: 0.45 }} />
            <p className="flex items-center px-[0.9em] uppercase" style={{ letterSpacing: '0.22em' }}>
              à {formatEventTime(draft.event_time)}
            </p>
          </div>
          <Sparkles
            color="#D9B568"
            className="pointer-events-none absolute -right-[4.8em] top-1/2 h-[2.6em] w-[2.6em] -translate-y-1/2"
          />
        </div>

        {draft.venue_name || draft.venue_address ? (
          <div
            className="mt-[1.5em] uppercase"
            style={{ fontSize: venueEm ? '1.1em' : '0.95em', letterSpacing: '0.26em', lineHeight: 2, color: DEEP }}
          >
            {draft.venue_name ? <p>{draft.venue_name}</p> : null}
            {draft.venue_address ? <p>{draft.venue_address}</p> : null}
            {draft.venue_details ? (
              <p className="text-[0.92em] italic opacity-80" style={{ letterSpacing: '0.08em' }}>
                {draft.venue_details}
              </p>
            ) : null}
          </div>
        ) : null}

        <NoteSection draft={draft} ink={DEEP} />
        <ProgramSection
          draft={draft}
          accent={GOLD}
          ink={DEEP}
          ornament={<TemplateOrnament templateKey="grenat" color={GOLD} />}
        />
        <TableSection
          draft={draft}
          accent={GOLD}
          ink={DEEP}
          ornament={<TemplateOrnament templateKey="grenat" color={GOLD} />}
        />
        <DressCodeSection
          draft={draft}
          accent={GOLD}
          ink={DEEP}
          ornament={<TemplateOrnament templateKey="grenat" color={GOLD} />}
        />
      </div>
    </InvitationPaper>
  )
}
