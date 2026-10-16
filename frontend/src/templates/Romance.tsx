/**
 * « Romance » — reproduction of `very_beautiful template/qmy1.webp`.
 *
 * White paper with blue watercolour clusters and gold sprigs at top-right and
 * bottom-right, a naive flat groom-and-bride illustration at the bottom-left,
 * stacked navy calligraphy names around a gold ampersand and a rule-flanked
 * « MAR | 10 | À 09:00 » date row with the year beneath.
 */
import { WatercolorSpray } from './florals.tsx'
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
  AZURE,
  CoupleIllustration,
  GoldSprig,
  SCRIPT_FONT,
  formatMonthOnly,
  formatYearOnly,
  splitNames,
} from './referenceMotifs.tsx'
import type { TemplateProps } from './types.ts'

const PAPER = '#FFFFFF'
const INK = '#2C3E63'
const GOLD = '#C29A4E'

export function Romance({ draft }: TemplateProps) {
  const titleEm = isEmphasized(draft, 'title')
  const dateEm = isEmphasized(draft, 'date')
  const venueEm = isEmphasized(draft, 'venue')
  const names = splitNames(draft.title)
  return (
    <InvitationPaper style={{ backgroundColor: PAPER, color: INK }}>
      {/* Blue clusters + gold sprigs: top-left (largest), top-right and bottom-right */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <WatercolorSpray
          palette={AZURE}
          className="absolute -left-[9em] -top-[7em] h-[20em] w-[22em]"
          style={{ transform: 'scaleY(-1)' }}
        />
        <WatercolorSpray
          palette={AZURE}
          className="absolute -right-[5em] -top-[3.8em] h-[16em] w-[18em]"
          style={{ transform: 'rotate(180deg)' }}
        />
        <GoldSprig
          className="absolute right-[12em] top-[1em] h-[3.2em] w-[9.5em]"
          style={{ transform: 'rotate(14deg)' }}
        />
        <WatercolorSpray
          palette={AZURE}
          className="absolute -bottom-[5em] -right-[6.5em] h-[16em] w-[18em]"
          style={{ transform: 'scaleX(-1)' }}
        />
        <GoldSprig
          className="absolute -left-[2em] top-[16em] h-[3em] w-[9em]"
          style={{ transform: 'rotate(-24deg)' }}
        />
        {/* flat couple illustration, bottom-left */}
        <CoupleIllustration className="absolute -bottom-[0.5em] left-[1.6em] h-[14.5em] w-[12.3em]" />
      </div>

      <div className="relative flex flex-1 flex-col items-center px-[6.2em] pb-[3.6em] pt-[5.2em] text-center">
        <p
          className="uppercase"
          style={{ fontSize: '1.02em', letterSpacing: '0.36em', lineHeight: 2.1 }}
        >
          Vous êtes invités au mariage de
        </p>

        <h1 className="mt-[1.2em] break-words text-balance leading-[1.14]" style={{ color: INK }}>
          <span className="sr-only">{draft.title}</span>
          {names ? (
            <span aria-hidden="true" className="flex flex-col items-center">
              <span style={{ fontFamily: SCRIPT_FONT, fontSize: titleEm ? '4.3em' : '3.5em' }}>
                {names[0]}
              </span>
              <span
                className="italic"
                style={{
                  fontFamily: "'Cormorant Garamond', ui-serif, Georgia, serif",
                  fontSize: titleEm ? '2.6em' : '2.2em',
                  color: GOLD,
                  lineHeight: 1,
                  margin: '0.08em 0',
                }}
              >
                &amp;
              </span>
              <span style={{ fontFamily: SCRIPT_FONT, fontSize: titleEm ? '4.3em' : '3.5em' }}>
                {names[1]}
              </span>
            </span>
          ) : (
            <span style={{ fontFamily: SCRIPT_FONT, fontSize: titleEm ? '4.3em' : '3.5em' }}>
              {draft.title}
            </span>
          )}
        </h1>

        {draft.guestName?.trim() ? (
          <p className="mt-[1em] font-display italic" style={{ fontSize: '1.12em', opacity: 0.85 }}>
            {draft.guestName}
          </p>
        ) : null}

        {draft.message ? (
          <p
            className="mt-[1.1em] max-w-[25em] text-pretty leading-[1.7] break-words"
            style={{ fontSize: '1.1em', fontFamily: messageFontCss(draft.messageFont) }}
          >
            {draft.message}
          </p>
        ) : null}

        <p
          className="mt-[1.8em] uppercase"
          style={{ letterSpacing: '0.42em', fontSize: '1.15em' }}
        >
          {formatMonthOnly(draft.event_date)}
        </p>

        <div
          className="mt-[1.1em] flex w-full max-w-[22em] items-center gap-[1em]"
          style={{ transform: dateEm ? 'scale(1.12)' : undefined }}
        >
          <p className="uppercase" style={{ letterSpacing: '0.22em' }}>
            {formatWeekday(draft.event_date).slice(0, 3)}
          </p>
          <div className="h-[1px] flex-1" style={{ backgroundColor: INK, opacity: 0.5 }} />
          <p className="font-display leading-none" style={{ fontSize: '2.5em', fontWeight: 600 }}>
            {formatDayNumber(draft.event_date)}
          </p>
          <div className="h-[1px] flex-1" style={{ backgroundColor: INK, opacity: 0.5 }} />
          <p className="uppercase" style={{ letterSpacing: '0.22em' }}>
            à {formatEventTime(draft.event_time)}
          </p>
        </div>

        <p className="mt-[0.9em] uppercase" style={{ letterSpacing: '0.42em' }}>
          {formatYearOnly(draft.event_date)}
        </p>

        {draft.venue_name || draft.venue_address ? (
          <div
            className="mt-[1.4em] font-display"
            style={{ fontSize: venueEm ? '1.15em' : '1em', lineHeight: 1.7 }}
          >
            {draft.venue_name ? <p>{draft.venue_name}</p> : null}
            {draft.venue_address ? <p className="opacity-85">{draft.venue_address}</p> : null}
            {draft.venue_details ? <p className="italic opacity-75">{draft.venue_details}</p> : null}
          </div>
        ) : null}

        <NoteSection draft={draft} ink={INK} />
        <ProgramSection
          draft={draft}
          accent={GOLD}
          ink={INK}
          ornament={<TemplateOrnament templateKey="romance" color={GOLD} />}
        />
        <TableSection
          draft={draft}
          accent={GOLD}
          ink={INK}
          ornament={<TemplateOrnament templateKey="romance" color={GOLD} />}
        />
        <DressCodeSection
          draft={draft}
          accent={GOLD}
          ink={INK}
          ornament={<TemplateOrnament templateKey="romance" color={GOLD} />}
        />
      </div>
    </InvitationPaper>
  )
}
