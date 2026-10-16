/**
 * « Hexagone » — reproduction of `very_beautiful template/Screenshot 2026-10-08 022004.png`.
 *
 * Cream watercolour paper crossed by an open gold hexagon (its lines
 * intersecting above and below), muted rose/taupe floral corners with red
 * berries, stacked brown calligraphy names and a rule-framed
 * « NOVEMBRE | 14 | 18:00 » date row.
 */
import { WatercolorSpray } from './florals.tsx'
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
  isEmphasized,
} from './shared.tsx'
import {
  SCRIPT_FONT,
  TAUPE,
  formatMonthOnly,
  splitNames,
} from './referenceMotifs.tsx'
import type { SprayPalette } from './florals.tsx'
import type { TemplateProps } from './types.ts'

const PAPER = '#F2EAE0'
const INK = '#5F4636'
const GOLD = '#B4924F'

const BERRIED: SprayPalette = {
  ...TAUPE,
  petal: '#C7AC97',
  petalDeep: '#9A7B62',
  petalLight: '#EFE6DA',
  leaf: '#A9AE93',
  leafDeep: '#767C61',
  accent: '#A8433B',
}

/** Open hexagon whose edges cross at the top and bottom, as in the reference. */
function HexOutline({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 200 280"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <path
        d="M 150 -12 L 12 78 L 12 202 L 150 292"
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M 50 -12 L 188 78 L 188 202 L 50 292"
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

export function Hexagone({ draft }: TemplateProps) {
  const titleEm = isEmphasized(draft, 'title')
  const dateEm = isEmphasized(draft, 'date')
  const venueEm = isEmphasized(draft, 'venue')
  const names = splitNames(draft.title)
  return (
    <InvitationPaper style={{ backgroundColor: PAPER, color: INK }}>
      <LuxePattern templateKey="hexagone" />
      <VellumHalo color={PAPER} />

      <CoverHero
        draft={draft}
        bandColor="rgba(43,32,24,0.6)"
        edgeColor="rgba(216,178,106,0.85)"
        eyebrow="Célébrons ensemble"
        titleStyle={{
          fontFamily: SCRIPT_FONT,
          fontSize: titleEm ? '4.4em' : '3.5em',
          color: '#F7EEDD',
          textShadow: '0 0.05em 0.3em rgba(30,20,12,0.5)',
        }}
      />

      <HexOutline color={GOLD} />

      {/* Muted floral corners with red berries */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <WatercolorSpray
          palette={BERRIED}
          className="absolute -left-[10.5em] -top-[7em] h-[24em] w-[27em]"
          style={{ transform: 'scaleY(-1)' }}
        />
        <WatercolorSpray
          palette={BERRIED}
          className="absolute -right-[10.5em] -top-[7em] h-[24em] w-[27em]"
          style={{ transform: 'rotate(180deg)' }}
        />
        <WatercolorSpray
          palette={BERRIED}
          className="absolute -bottom-[9em] -left-[11.5em] h-[24em] w-[27em]"
        />
        <WatercolorSpray
          palette={BERRIED}
          className="absolute -bottom-[9em] -right-[11.5em] h-[24em] w-[27em]"
          style={{ transform: 'scaleX(-1)' }}
        />
      </div>

      <div className="relative flex flex-1 flex-col items-center px-[6.8em] pb-[3.8em] pt-[4.8em] text-center">
        <p className="font-display" style={{ fontSize: '1.32em', lineHeight: 1.5 }}>
          Rejoignez-nous pour
          <br />
          le mariage de
        </p>

        <h1 className="mt-[1.1em] break-words text-balance leading-[1.12]" style={{ color: '#6B4A3A' }}>
          <span className="sr-only">{draft.title}</span>
          {names ? (
            <span aria-hidden="true" className="flex flex-col items-center">
              <span style={{ fontFamily: SCRIPT_FONT, fontSize: titleEm ? '4.8em' : '3.8em' }}>
                {names[0]}
              </span>
              <span
                style={{
                  fontFamily: SCRIPT_FONT,
                  fontSize: titleEm ? '3.5em' : '2.9em',
                  lineHeight: 1,
                  margin: '0.05em 0',
                }}
              >
                &amp;
              </span>
              <span style={{ fontFamily: SCRIPT_FONT, fontSize: titleEm ? '4.8em' : '3.8em' }}>
                {names[1]}
              </span>
            </span>
          ) : (
            <span style={{ fontFamily: SCRIPT_FONT, fontSize: titleEm ? '4.8em' : '3.8em' }}>
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
            style={{ fontSize: '1.12em', fontFamily: messageFontCss(draft.messageFont) }}
          >
            {draft.message}
          </p>
        ) : null}

        <div
          className="mt-[1.9em] w-full max-w-[23em]"
          style={{ transform: dateEm ? 'scale(1.12)' : undefined }}
        >
          <div style={{ height: 1, backgroundColor: INK, opacity: 0.55 }} />
          <div className="flex items-center justify-between py-[0.42em]">
            <p className="uppercase" style={{ letterSpacing: '0.24em' }}>
              {formatMonthOnly(draft.event_date)}
            </p>
            <p className="font-display leading-none" style={{ fontSize: '2.5em', fontWeight: 700 }}>
              {formatDayNumber(draft.event_date)}
            </p>
            <p className="uppercase" style={{ letterSpacing: '0.24em' }}>
              {formatEventTime(draft.event_time)}
            </p>
          </div>
          <div style={{ height: 1, backgroundColor: INK, opacity: 0.55 }} />
        </div>

        {draft.venue_name || draft.venue_address ? (
          <div
            className="mt-[1.5em] uppercase"
            style={{ fontSize: venueEm ? '1.12em' : '0.98em', letterSpacing: '0.24em', lineHeight: 1.9 }}
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

        <NoteSection draft={draft} ink={INK} />
        <ProgramSection
          draft={draft}
          accent={GOLD}
          ink={INK}
          ornament={<TemplateOrnament templateKey="hexagone" color={GOLD} />}
        />
        <TableSection
          draft={draft}
          accent={GOLD}
          ink={INK}
          ornament={<TemplateOrnament templateKey="hexagone" color={GOLD} />}
        />
        <DressCodeSection
          draft={draft}
          accent={GOLD}
          ink={INK}
          ornament={<TemplateOrnament templateKey="hexagone" color={GOLD} />}
        />
      </div>
    </InvitationPaper>
  )
}
