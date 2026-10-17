/**
 * « Floraison » — reproduction of `very_beautiful template/Screenshot 2026-10-08 021457.png`.
 *
 * Ivory watercolour paper, gold double border with filigree corners, blue
 * watercolour blooms in all four corners, an arched photo ring wrapped in
 * florals, stacked calligraphy names around a gold ampersand with flourish
 * bars, gold-outlined date boxes (weekday above the day numeral) and tiny
 * heart dividers.
 */
import { PaperGrain, WatercolorSpray } from './florals.tsx'
import { FiligreeCorner } from './FiligreeCorner.tsx'
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
  GoldDateBoxes,
  GoldSprig,
  NAVY_INK,
  SCRIPT_FONT,
  TinyHeart,
  formatMonthOnly,
  splitNames,
} from './referenceMotifs.tsx'
import type { TemplateProps } from './types.ts'

const PAPER = '#F6F2EA'
const INK = NAVY_INK
const BORDER = '#C9A876'

export function Floraison({ draft }: TemplateProps) {
  const titleEm = isEmphasized(draft, 'title')
  const dateEm = isEmphasized(draft, 'date')
  const venueEm = isEmphasized(draft, 'venue')
  const names = splitNames(draft.title)
  return (
    <InvitationPaper style={{ backgroundColor: PAPER, color: INK }}>
      <PaperGrain opacity={0.045} />

      <CoverHero
        draft={draft}
        bandColor="rgba(58,48,34,0.62)"
        edgeColor="rgba(201,168,118,0.9)"
        eyebrow="Réservez la date"
        paperColor={PAPER}
        titleStyle={{
          fontFamily: SCRIPT_FONT,
          fontSize: titleEm ? '4.7em' : '3.8em',
          color: '#F6F2EA',
          textShadow: '0 0.05em 0.3em rgba(30,22,12,0.5)',
        }}
      />

      {/* Gold double border + filigree corners */}
      <div
        className="pointer-events-none absolute inset-[1.15em] border border-solid"
        style={{ borderColor: BORDER }}
      />
      <div
        className="pointer-events-none absolute inset-[1.55em] border border-solid"
        style={{ borderColor: BORDER, opacity: 0.65 }}
      />
      <FiligreeCorner corner="tl" color={GOLD} opacity={0.8} />
      <FiligreeCorner corner="tr" color={GOLD} opacity={0.8} />
      <FiligreeCorner corner="br" color={GOLD} opacity={0.8} />
      <FiligreeCorner corner="bl" color={GOLD} opacity={0.8} />

      {/* Blue watercolour blooms anchored in the four corners */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <WatercolorSpray
          palette={AZURE}
          className="absolute -left-[10em] -top-[9.8em] h-[22em] w-[25em]"
          style={{ transform: 'scaleY(-1)' }}
        />
        <GoldSprig className="absolute -left-[1em] top-[11em] h-[3em] w-[9em]" style={{ transform: 'rotate(42deg)' }} />
        <WatercolorSpray
          palette={AZURE}
          className="absolute -right-[10em] -top-[9.8em] h-[22em] w-[25em]"
          style={{ transform: 'rotate(180deg)' }}
        />
        <WatercolorSpray
          palette={AZURE}
          className="absolute -bottom-[8.6em] -left-[9.2em] h-[23em] w-[26em]"
        />
        <WatercolorSpray
          palette={AZURE}
          className="absolute -bottom-[8.6em] -right-[9.2em] h-[23em] w-[26em]"
          style={{ transform: 'scaleX(-1)' }}
        />
        <GoldSprig className="absolute -bottom-[1em] right-[2em] h-[3em] w-[9em]" style={{ transform: 'rotate(-38deg)' }} />
      </div>

      <div className="relative flex flex-1 flex-col items-center px-[7em] py-[4.6em] text-center">
        <p
          className="font-display uppercase"
          style={{ fontSize: titleEm ? '1.42em' : '1.12em', letterSpacing: '0.22em', color: GOLD }}
        >
          Réservez la date
        </p>
        <TinyHeart className="mt-[0.9em] h-[1.15em] w-[11em]" />

        {draft.cover_url ? (
          <div className="relative mt-[1.7em] w-[13.2em]">
            <div
              className="relative overflow-hidden bg-white"
              style={{
                aspectRatio: '3 / 4',
                borderRadius: '6.6em 6.6em 0.45em 0.45em',
                border: `0.13em solid ${GOLD}`,
              }}
            >
              <img
                src={draft.cover_url}
                alt=""
                className="h-full w-full object-cover"
              />
              {draft.coverTitle.trim() ? (
                <div
                  className="absolute inset-x-0 bottom-0 flex flex-col items-center px-[1.1em] pb-[1.1em] pt-[2.6em]"
                  style={{ background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.9))' }}
                >
                  <p
                    className="w-full break-words text-center font-display uppercase"
                    style={{ fontSize: '0.78em', letterSpacing: '0.14em', color: INK, lineHeight: 1.5 }}
                  >
                    {draft.coverTitle.trim()}
                  </p>
                </div>
              ) : null}
            </div>
            {/* Florals wrapping the arch sides */}
            <WatercolorSpray
              palette={AZURE}
              className="absolute -left-[6.4em] top-[3.4em] h-[10.5em] w-[12em]"
              style={{ transform: 'scaleY(-1)' }}
            />
            <WatercolorSpray
              palette={AZURE}
              className="absolute -right-[6.4em] top-[5.6em] h-[10.5em] w-[12em]"
              style={{ transform: 'rotate(180deg)' }}
            />
            <GoldSprig
              className="absolute -right-[2.6em] top-[1.4em] h-[2.2em] w-[7em]"
              style={{ transform: 'rotate(-24deg)' }}
            />
          </div>
        ) : null}

        <h1 className="mt-[1.7em] break-words text-balance leading-[1.1]" style={{ color: INK }}>
          <span className="sr-only">{draft.title}</span>
          {names ? (
            <span aria-hidden="true" className="flex flex-col items-center">
              <span style={{ fontFamily: SCRIPT_FONT, fontSize: titleEm ? '5em' : '4.1em' }}>
                {names[0]}
              </span>
              <span className="flex items-center gap-[0.9em]">
                <TinyHeart className="h-[1em] w-[8.4em]" />
                <span
                  className="font-display italic"
                  style={{ fontSize: '2em', color: GOLD, lineHeight: 1 }}
                >
                  &amp;
                </span>
                <TinyHeart className="h-[1em] w-[8.4em]" />
              </span>
              <span style={{ fontFamily: SCRIPT_FONT, fontSize: titleEm ? '5em' : '4.1em' }}>
                {names[1]}
              </span>
            </span>
          ) : (
            <span style={{ fontFamily: SCRIPT_FONT, fontSize: titleEm ? '5em' : '4.1em' }}>
              {draft.title}
            </span>
          )}
        </h1>

        {draft.guestName?.trim() ? (
          <p className="mt-[1.2em] font-display italic" style={{ fontSize: '1.18em', opacity: 0.85 }}>
            {draft.guestName}
          </p>
        ) : null}

        {draft.message ? (
          <p
            className="mt-[1.5em] max-w-[26em] text-pretty leading-[1.7] break-words"
            style={{ fontSize: '1.14em', fontFamily: messageFontCss(draft.messageFont) }}
          >
            {draft.message}
          </p>
        ) : null}

        <div className="mt-[1.9em]" style={{ transform: dateEm ? 'scale(1.12)' : undefined }}>
          <GoldDateBoxes
            month={formatMonthOnly(draft.event_date)}
            weekday={formatWeekday(draft.event_date)}
            day={formatDayNumber(draft.event_date)}
            time={formatEventTime(draft.event_time)}
            color={GOLD}
            ink={INK}
          />
        </div>
        <TinyHeart className="mt-[1.2em] h-[1.1em] w-[10em]" />

        {draft.venue_name || draft.venue_address ? (
          <div className="mt-[1.1em] font-display" style={{ fontSize: venueEm ? '1.22em' : '1.02em' }}>
            {draft.venue_name ? <p>{draft.venue_name}</p> : null}
            {draft.venue_address ? <p className="opacity-90">{draft.venue_address}</p> : null}
            {draft.venue_details ? (
              <p className="mt-[0.25em] text-[0.92em] italic opacity-80">{draft.venue_details}</p>
            ) : null}
          </div>
        ) : null}

        <NoteSection draft={draft} ink={INK} />
        <ProgramSection
          draft={draft}
          accent={GOLD}
          ink={INK}
          ornament={<TemplateOrnament templateKey="floraison" color={GOLD} />}
        />
        <TableSection
          draft={draft}
          accent={GOLD}
          ink={INK}
          ornament={<TemplateOrnament templateKey="floraison" color={GOLD} />}
        />
        <DressCodeSection
          draft={draft}
          accent={GOLD}
          ink={INK}
          ornament={<TemplateOrnament templateKey="floraison" color={GOLD} />}
        />
      </div>
    </InvitationPaper>
  )
}
