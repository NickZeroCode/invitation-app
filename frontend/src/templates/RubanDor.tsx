/**
 * « Ruban d'Or » — reproduction of `very_beautiful template/Screenshot 2026-10-08 021847.png`.
 *
 * Cream paper under flowing gold ribbon brushstrokes, blue watercolour
 * clusters at top-right and bottom-left, a small script intro over a huge
 * script occasion word, letterspaced caps lines, the honoured names in
 * script and a bold serif date line.
 */
import { PaperGrain, WatercolorSpray } from './florals.tsx'
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
  formatEventDate,
  formatEventTime,
  isEmphasized,
} from './shared.tsx'
import {
  AZURE,
  GOLD,
  RibbonField,
  SCRIPT_FONT,
  formatYearOnly,
} from './referenceMotifs.tsx'
import type { TemplateProps } from './types.ts'

const PAPER = '#F4EEE3'
const INK = '#2F4A73'

export function RubanDor({ draft }: TemplateProps) {
  const titleEm = isEmphasized(draft, 'title')
  const dateEm = isEmphasized(draft, 'date')
  const venueEm = isEmphasized(draft, 'venue')
  return (
    <InvitationPaper style={{ backgroundColor: PAPER, color: INK }}>
      <PaperGrain opacity={0.05} />
      <LuxePattern templateKey="ruban-dor" />
      <VellumHalo color={PAPER} />

      <CoverHero
        draft={draft}
        bandColor="rgba(46,38,26,0.6)"
        edgeColor="rgba(201,162,74,0.9)"
        eyebrow="Fiançailles"
        paperColor={PAPER}
        titleStyle={{
          fontFamily: SCRIPT_FONT,
          fontSize: titleEm ? '4.6em' : '3.7em',
          color: '#F8F1E2',
          textShadow: '0 0.05em 0.3em rgba(34,26,16,0.55)',
        }}
      />

      {/* Gold ribbon brushstrokes run down the centre of the sheet */}
      <RibbonField
        className="pointer-events-none absolute inset-0 h-full w-full"
        color={GOLD}
        light="#E3C98B"
      />

      {/* Blue watercolour clusters, top-right and bottom-left */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <WatercolorSpray
          palette={AZURE}
          className="absolute -right-[7em] -top-[5em] h-[23em] w-[26em]"
          style={{ transform: 'rotate(180deg)' }}
        />
        <WatercolorSpray
          palette={AZURE}
          className="absolute -bottom-[5.5em] -left-[7em] h-[23em] w-[26em]"
        />
      </div>

      <div className="relative flex flex-1 flex-col items-center px-[6.5em] pb-[3.8em] pt-[5.2em] text-center">
        <p className="uppercase" style={{ fontSize: '1.02em', letterSpacing: '0.36em', color: INK }}>
          Rejoignez-nous pour une
        </p>

        <p
          className="mt-[0.35em] break-words leading-[1.1]"
          style={{ fontFamily: SCRIPT_FONT, fontSize: titleEm ? '6.3em' : '5.4em', color: INK }}
        >
          Fiançailles
        </p>

        <p className="mt-[1.3em] uppercase" style={{ fontSize: '1.55em', letterSpacing: '0.42em' }}>
          Fête
        </p>
        <p className="mt-[0.7em] uppercase" style={{ fontSize: '1.12em', letterSpacing: '0.42em' }}>
          En l'honneur de
        </p>

        <h1
          className="mt-[0.7em] break-words text-balance leading-[1.18]"
          style={{ fontFamily: SCRIPT_FONT, fontSize: titleEm ? '5em' : '4em' }}
        >
          {draft.title}
        </h1>

        {draft.guestName?.trim() ? (
          <p className="mt-[1em] font-display italic" style={{ fontSize: '1.12em', opacity: 0.85 }}>
            {draft.guestName}
          </p>
        ) : null}

        {draft.message ? (
          <p
            className="mt-[1.1em] max-w-[26em] text-pretty leading-[1.7] break-words"
            style={{ fontSize: '1.12em', fontFamily: messageFontCss(draft.messageFont) }}
          >
            {draft.message}
          </p>
        ) : null}

        <p
          className="mt-[1.7em] font-display font-semibold break-words"
          style={{ fontSize: dateEm ? '1.55em' : '1.3em' }}
        >
          {formatEventDate(draft.event_date)} à {formatEventTime(draft.event_time)}
        </p>

        {draft.venue_name || draft.venue_address ? (
          <div
            className="mt-[0.9em] font-display"
            style={{ fontSize: venueEm ? '1.18em' : '1.02em', lineHeight: 1.7 }}
          >
            {draft.venue_name ? <p>{draft.venue_name}</p> : null}
            {draft.venue_address ? <p>{draft.venue_address}</p> : null}
            {draft.venue_details ? <p className="italic opacity-80">{draft.venue_details}</p> : null}
          </div>
        ) : null}

        <NoteSection draft={draft} ink={INK} />
        <ProgramSection
          draft={draft}
          accent={GOLD}
          ink={INK}
          ornament={<TemplateOrnament templateKey="ruban-dor" color={GOLD} />}
        />
        <TableSection
          draft={draft}
          accent={GOLD}
          ink={INK}
          ornament={<TemplateOrnament templateKey="ruban-dor" color={GOLD} />}
        />
        <DressCodeSection
          draft={draft}
          accent={GOLD}
          ink={INK}
          ornament={<TemplateOrnament templateKey="ruban-dor" color={GOLD} />}
        />
        <p className="mt-[1.1em] uppercase" style={{ letterSpacing: '0.42em', fontSize: '0.92em', opacity: 0.75 }}>
          {formatYearOnly(draft.event_date)}
        </p>
      </div>
    </InvitationPaper>
  )
}
