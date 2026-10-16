/**
 * « Arche Pivoine » — reproduction of `very_beautiful template/Screenshot 2026-10-08 021701.png`.
 *
 * Minimal white paper crossed by a double gold arch, header caps curving
 * along the crown, blue peony clusters at top-left and bottom-right, stacked
 * calligraphy names around a gold plus, and a heart-shaped day chip in the
 * date row.
 */
import { ArchFrame } from './florals.tsx'
import { LuxePattern, VellumHalo } from './luxeMotifs.tsx'
import { messageFontCss } from './messageFonts.ts'
import { TemplateOrnament } from './ornaments.tsx'
import {
  CoverHero,
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
  GOLD,
  ArchText,
  HeartDay,
  PeonyCluster,
  SCRIPT_FONT,
  formatMonthOnly,
  formatYearOnly,
  splitNames,
} from './referenceMotifs.tsx'
import type { TemplateProps } from './types.ts'

const PAPER = '#FFFFFF'
const INK = '#33456B'
const GREY = '#5A688A'

export function ArchePivoine({ draft }: TemplateProps) {
  const titleEm = isEmphasized(draft, 'title')
  const dateEm = isEmphasized(draft, 'date')
  const venueEm = isEmphasized(draft, 'venue')
  const names = splitNames(draft.title)
  return (
    <InvitationPaper style={{ backgroundColor: PAPER, color: INK }}>
      <LuxePattern templateKey="arche-pivoine" />
      <VellumHalo color={PAPER} />

      <CoverHero
        draft={draft}
        bandColor="rgba(38,50,80,0.6)"
        edgeColor="rgba(194,154,78,0.9)"
        eyebrow="Avec leurs familles"
        titleStyle={{
          fontFamily: SCRIPT_FONT,
          fontSize: titleEm ? '4.6em' : '3.7em',
          color: '#F4F1E8',
          textShadow: '0 0.05em 0.3em rgba(24,32,54,0.55)',
        }}
      />

      {/* Double gold arch, open at the bottom like the reference */}
      <ArchFrame
        color={GOLD}
        opacity={0.95}
        className="pointer-events-none absolute inset-x-[2.4em] inset-y-[1.6em] h-auto w-auto"
      />
      <ArchFrame
        color={GOLD}
        opacity={0.75}
        className="pointer-events-none absolute inset-x-[3.15em] inset-y-[2.3em] h-auto w-auto"
      />

      {/* Peony clusters breaking the arch, as in the reference */}
      <PeonyCluster
        palette={AZURE}
        className="pointer-events-none absolute -left-[11em] -top-[7.5em] h-[24em] w-[26em]"
      />
      <PeonyCluster
        palette={AZURE}
        className="pointer-events-none absolute -bottom-[5em] -right-[8em] h-[24em] w-[26em]"
        style={{ transform: 'rotate(180deg)' }}
      />

      <div className="relative flex flex-1 flex-col items-center px-[6.4em] pb-[3.6em] pt-[7.2em] text-center">
        <ArchText
          text="AVEC LEURS FAMILLES"
          color={GREY}
          className="mt-[0.6em] h-[5.6em] w-[16em] max-w-full"
        />

        <h1 className="mt-[1.1em] break-words text-balance leading-[1.14]">
          <span className="sr-only">{draft.title}</span>
          {names ? (
            <span aria-hidden="true" className="flex flex-col items-center">
              <span style={{ fontFamily: SCRIPT_FONT, fontSize: titleEm ? '5.2em' : '4.2em' }}>
                {names[0]}
              </span>
              <span
                style={{
                  fontSize: '2.2em',
                  lineHeight: 1,
                  margin: '0.12em 0',
                  color: INK,
                  fontFamily: "'Cormorant Garamond', ui-serif, Georgia, serif",
                }}
              >
                +
              </span>
              <span style={{ fontFamily: SCRIPT_FONT, fontSize: titleEm ? '5.2em' : '4.2em' }}>
                {names[1]}
              </span>
            </span>
          ) : (
            <span style={{ fontFamily: SCRIPT_FONT, fontSize: titleEm ? '5.2em' : '4.2em' }}>
              {draft.title}
            </span>
          )}
        </h1>

        {draft.guestName?.trim() ? (
          <p className="mt-[1em] font-display italic" style={{ fontSize: '1.15em', color: GREY }}>
            {draft.guestName}
          </p>
        ) : null}

        <p
          className="mt-[1.7em] uppercase"
          style={{ fontSize: '1.02em', letterSpacing: '0.32em', color: GREY, lineHeight: 1.9 }}
        >
          On vous invite à célébrer
          <br />
          leur jour de mariage
        </p>

        {draft.message ? (
          <p
            className="mt-[1.2em] max-w-[26em] text-pretty leading-[1.7] break-words"
            style={{ fontSize: '1.12em', color: INK, fontFamily: messageFontCss(draft.messageFont) }}
          >
            {draft.message}
          </p>
        ) : null}

        <div
          className="mt-[1.9em] flex flex-col items-center"
          style={{ transform: dateEm ? 'scale(1.12)' : undefined }}
        >
          <p
            className="uppercase"
            style={{ fontSize: '1.15em', letterSpacing: '0.42em', color: INK }}
          >
            {formatMonthOnly(draft.event_date)}
          </p>
          <div className="mt-[0.55em] flex items-center gap-[0.7em]">
            <span style={{ width: '3em', height: 1, backgroundColor: INK, opacity: 0.55 }} />
            <p className="whitespace-nowrap font-display" style={{ fontSize: '1.28em', letterSpacing: '0.14em' }}>
              {formatWeekday(draft.event_date)}
            </p>
            <HeartDay
              label={formatDayNumber(draft.event_date)}
              color={INK}
              fill="#C9D6EC"
              style={{ fontSize: '1.18em' }}
            />
            <p className="whitespace-nowrap font-display" style={{ fontSize: '1.28em', letterSpacing: '0.14em' }}>
              {formatEventTime(draft.event_time)}
            </p>
            <span style={{ width: '3em', height: 1, backgroundColor: INK, opacity: 0.55 }} />
          </div>
          <p className="mt-[0.5em]" style={{ letterSpacing: '0.52em', color: GREY }}>
            {formatYearOnly(draft.event_date)}
          </p>
        </div>

        {draft.venue_name || draft.venue_address ? (
          <div
            className="mt-[1.6em] uppercase"
            style={{ fontSize: venueEm ? '1.12em' : '0.98em', letterSpacing: '0.26em', color: INK, lineHeight: 1.9 }}
          >
            {draft.venue_name ? <p>{draft.venue_name}</p> : null}
            {draft.venue_address ? <p>{draft.venue_address}</p> : null}
          </div>
        ) : null}
        {draft.venue_details ? (
          <p className="mt-[0.5em] text-[0.95em] italic opacity-80" style={{ color: GREY }}>
            {draft.venue_details}
          </p>
        ) : null}

        <p className="mt-[1.3em] font-display italic" style={{ fontSize: '1.25em', color: INK }}>
          Réception à suivre
        </p>

        <NoteSection draft={draft} ink={INK} />
        <ProgramSection
          draft={draft}
          accent={GOLD}
          ink={INK}
          ornament={<TemplateOrnament templateKey="arche-pivoine" color={GOLD} />}
        />
        <TableSection
          draft={draft}
          accent={GOLD}
          ink={INK}
          ornament={<TemplateOrnament templateKey="arche-pivoine" color={GOLD} />}
        />
        <DressCodeSection
          draft={draft}
          accent={GOLD}
          ink={INK}
          ornament={<TemplateOrnament templateKey="arche-pivoine" color={GOLD} />}
        />
      </div>
    </InvitationPaper>
  )
}
