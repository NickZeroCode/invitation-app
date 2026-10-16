/**
 * « Brume Bleue » — reproduction of `very_beautiful template/Screenshot 2026-10-08 021752.png`.
 *
 * White paper with dusty-blue watercolour eucalyptus cascades at the top and
 * bottom-left, letterspaced caps intro, calligraphy names on one line around
 * an ornamental ampersand, a rule-divided « SAM | 28 | AOÛT » date row and a
 * script « réception à suivre » sign-off.
 */
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
  FoliageCascade,
  ROMAN_FONT,
  SCRIPT_FONT,
  formatMonthShort,
  formatYearOnly,
  splitNames,
} from './referenceMotifs.tsx'
import type { TemplateProps } from './types.ts'

const PAPER = '#FBFCFD'
const INK = '#3D4E6B'
const SOFT = '#7A8FB4'

export function BrumeBleue({ draft }: TemplateProps) {
  const titleEm = isEmphasized(draft, 'title')
  const dateEm = isEmphasized(draft, 'date')
  const venueEm = isEmphasized(draft, 'venue')
  const names = splitNames(draft.title)
  return (
    <InvitationPaper style={{ backgroundColor: PAPER, color: INK }}>
      {/* Dusty-blue foliage: spill from the top, cluster at bottom-left */}
      <FoliageCascade
        className="pointer-events-none absolute -top-[5.4em] right-[0.5em] h-[19.5em] w-[15.5em]"
        style={{ transform: 'rotate(8deg)' }}
      />
      <FoliageCascade
        className="pointer-events-none absolute -top-[4em] left-[5em] h-[15em] w-[11em]"
        style={{ transform: 'rotate(-14deg)' }}
      />
      <FoliageCascade
        className="pointer-events-none absolute -bottom-[3em] -left-[2em] h-[21.5em] w-[16em]"
        style={{ transform: 'rotate(180deg)' }}
      />

      <div className="relative flex flex-1 flex-col items-center px-[6.2em] pb-[3.8em] pt-[9.5em] text-center">
        <p
          className="uppercase"
          style={{ fontSize: '1.02em', letterSpacing: '0.36em', color: INK }}
        >
          Avec leurs familles
        </p>

        <h1 className="mt-[1.5em] break-words text-balance leading-[1.2]" style={{ color: SOFT }}>
          <span className="sr-only">{draft.title}</span>
          {names ? (
            <span
              aria-hidden="true"
              className="inline-flex flex-wrap items-baseline justify-center gap-x-[0.45em]"
            >
              <span style={{ fontFamily: SCRIPT_FONT, fontSize: titleEm ? '3.9em' : '3.2em' }}>
                {names[0]}
              </span>
              <span
                className="italic"
                style={{
                  fontFamily: ROMAN_FONT,
                  fontSize: titleEm ? '2.6em' : '2.2em',
                  color: INK,
                }}
              >
                &amp;
              </span>
              <span style={{ fontFamily: SCRIPT_FONT, fontSize: titleEm ? '3.9em' : '3.2em' }}>
                {names[1]}
              </span>
            </span>
          ) : (
            <span style={{ fontFamily: SCRIPT_FONT, fontSize: titleEm ? '3.9em' : '3.2em' }}>
              {draft.title}
            </span>
          )}
        </h1>

        {draft.guestName?.trim() ? (
          <p className="mt-[1em] font-display italic" style={{ fontSize: '1.12em', color: SOFT }}>
            {draft.guestName}
          </p>
        ) : null}

        <p
          className="mt-[1.7em] uppercase"
          style={{ fontSize: '1.02em', letterSpacing: '0.34em', color: INK }}
        >
          On vous convie à nous rejoindre
        </p>
        <p className="mt-[0.6em] font-display" style={{ fontSize: '1.16em', color: INK }}>
          pour célébrer notre mariage
        </p>

        {draft.message ? (
          <p
            className="mt-[1.1em] max-w-[26em] text-pretty leading-[1.7] break-words"
            style={{ fontSize: '1.1em', fontFamily: messageFontCss(draft.messageFont) }}
          >
            {draft.message}
          </p>
        ) : null}

        <div
          className="mt-[1.8em] flex items-stretch justify-center"
          style={{ transform: dateEm ? 'scale(1.12)' : undefined, color: INK }}
        >
          <p className="flex items-center px-[0.85em] uppercase" style={{ letterSpacing: '0.22em' }}>
            {formatWeekday(draft.event_date).slice(0, 3)}
          </p>
          <span style={{ width: 1, backgroundColor: INK, opacity: 0.45 }} />
          <p
            className="flex items-center px-[0.9em] font-display leading-none"
            style={{ fontSize: '2.6em' }}
          >
            {formatDayNumber(draft.event_date)}
          </p>
          <span style={{ width: 1, backgroundColor: INK, opacity: 0.45 }} />
          <p className="flex items-center px-[0.85em] uppercase" style={{ letterSpacing: '0.22em' }}>
            {formatMonthShort(draft.event_date)}
          </p>
        </div>

        <p className="mt-[1em] uppercase" style={{ letterSpacing: '0.42em', color: INK }}>
          {formatYearOnly(draft.event_date)}
        </p>
        <p className="mt-[0.45em] font-display italic" style={{ fontSize: '1.14em', color: INK }}>
          à {formatEventTime(draft.event_time)}
        </p>

        {draft.venue_name || draft.venue_address ? (
          <div
            className="mt-[1.7em] uppercase"
            style={{ fontSize: venueEm ? '1.14em' : '1em', color: INK, lineHeight: 1.9 }}
          >
            {draft.venue_name ? (
              <p style={{ letterSpacing: '0.26em', fontWeight: 600 }}>{draft.venue_name}</p>
            ) : null}
            {draft.venue_address ? (
              <p style={{ letterSpacing: '0.22em', fontSize: '0.86em', opacity: 0.85 }}>
                {draft.venue_address}
              </p>
            ) : null}
            {draft.venue_details ? (
              <p className="text-[0.82em] italic opacity-75" style={{ letterSpacing: '0.06em' }}>
                {draft.venue_details}
              </p>
            ) : null}
          </div>
        ) : null}

        <p
          className="mt-[1.5em]"
          style={{ fontFamily: SCRIPT_FONT, fontSize: '1.9em', color: SOFT }}
        >
          réception à suivre
        </p>

        <NoteSection draft={draft} ink={INK} />
        <ProgramSection
          draft={draft}
          accent={SOFT}
          ink={INK}
          ornament={<TemplateOrnament templateKey="brume-bleue" color={SOFT} />}
        />
        <TableSection
          draft={draft}
          accent={SOFT}
          ink={INK}
          ornament={<TemplateOrnament templateKey="brume-bleue" color={SOFT} />}
        />
        <DressCodeSection
          draft={draft}
          accent={SOFT}
          ink={INK}
          ornament={<TemplateOrnament templateKey="brume-bleue" color={SOFT} />}
        />
      </div>
    </InvitationPaper>
  )
}
