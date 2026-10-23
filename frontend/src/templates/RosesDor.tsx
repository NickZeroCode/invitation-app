/**
 * « Roses d'Or » — reproduction of `very_beautiful template/Screenshot 2026-10-08 022102.png`.
 *
 * Ivory linen paper with engraved gold rose clusters in three corners and an
 * ornate filigree corner with hanging charm, gold-gradient calligraphy names
 * stacked behind a giant ghost ampersand, a fleuron divider, dark script
 * occasion line and a three-cell date row divided by thin rules.
 */
import { EngravedBouquet } from './engravedFlora.tsx'
import type { EngravedItem } from './engravedFlora.tsx'
import { FiligreeCorner } from './FiligreeCorner.tsx'
import { messageFontCss } from './messageFonts.ts'
import { TemplateOrnament } from './ornaments.tsx'
import {
  CoverHero,
  FoilText,
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
  FleuronDivider,
  GOLD,
  SCRIPT_FONT,
  formatMonthShort,
  formatYearOnly,
  splitNames,
} from './referenceMotifs.tsx'
import type { TemplateProps } from './types.ts'

const PAPER = '#F2F1EE'
const INK = '#7A6A55'
const DARK = '#4E4234'

const NAME_GOLD = 'linear-gradient(155deg, #8C6A2C 0%, #C99E52 34%, #9C7634 58%, #D2AE6A 78%, #84622A 100%)'
const SERIF = "'Playfair Display', Georgia, serif"
const SANS = "'Montserrat', 'Inter', sans-serif"

const TOP_LEFT: EngravedItem[] = [
  { k: 'stem', d: 'M 10 150 C 30 120, 60 90, 90 40' },
  { k: 'leaf', x: 60, y: 96, s: 1.1, r: 60 },
  { k: 'leaf', x: 30, y: 130, s: 1, r: -20 },
  { k: 'leaf', x: 140, y: 40, s: 0.9, r: 110 },
  { k: 'rose', x: 50, y: 44, s: 1.05, r: -10 },
  { k: 'rose', x: 122, y: 30, s: 0.9, r: 20 },
  { k: 'rose', x: 40, y: 112, s: 0.55, r: 30 },
  { k: 'lavender', x: 6, y: 210, s: 1, r: 4, len: 70 },
  { k: 'lavender', x: 16, y: 200, s: 0.8, r: 14, len: 60 },
]

const BOTTOM_LEFT: EngravedItem[] = [
  { k: 'stem', d: 'M 0 100 C 40 110, 90 130, 160 200' },
  { k: 'leaf', x: 60, y: 120, s: 1.2, r: 120 },
  { k: 'leaf', x: 30, y: 160, s: 1.1, r: 70 },
  { k: 'lily', x: 64, y: 176, s: 1.2, r: -30 },
  { k: 'lavender', x: 100, y: 200, s: 1, r: 30, len: 80 },
  { k: 'lavender', x: 120, y: 200, s: 0.9, r: 44, len: 70 },
  { k: 'lavender', x: 6, y: 90, s: 0.8, r: -6, len: 60 },
]

const BOTTOM_RIGHT: EngravedItem[] = [
  { k: 'stem', d: 'M 160 60 C 140 100, 120 140, 70 190' },
  { k: 'leaf', x: 120, y: 120, s: 1.2, r: -120 },
  { k: 'leaf', x: 70, y: 170, s: 1, r: -60 },
  { k: 'rose', x: 104, y: 160, s: 1.3, r: 10 },
  { k: 'rose', x: 150, y: 96, s: 0.6, r: -20 },
  { k: 'lavender', x: 170, y: 40, s: 0.8, r: -14, len: 60 },
]

export function RosesDor({ draft }: TemplateProps) {
  const titleEm = isEmphasized(draft, 'title')
  const dateEm = isEmphasized(draft, 'date')
  const venueEm = isEmphasized(draft, 'venue')
  const names = splitNames(draft.title)
  return (
    <InvitationPaper style={{ backgroundColor: PAPER, color: INK }}>

      <CoverHero
        draft={draft}
        bandColor="rgba(52,42,32,0.6)"
        edgeColor="rgba(226,194,124,0.85)"
        eyebrow="Réservez la date"
        paperColor={PAPER}
        titleStyle={{
          fontFamily: SCRIPT_FONT,
          fontSize: titleEm ? '4.6em' : '3.7em',
          color: '#F8EFDD',
          textShadow: '0 0.05em 0.3em rgba(40,30,20,0.55)',
        }}
      />

      {/* Everything below the cover lives in its own frame, so the
          ornaments start under the photo instead of hiding behind it. */}
      <div className="relative flex flex-1 flex-col">
        {/* Engraved gold rose clusters (top-left, bottom-left, bottom-right) and
            a fine gold corner frame top-right, as in the reference. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <EngravedBouquet items={TOP_LEFT} viewBox="0 0 180 220" className="absolute -left-[0.4em] -top-[0.4em] h-[27em] w-[22em]" />
          <EngravedBouquet items={BOTTOM_LEFT} viewBox="0 0 180 210" className="absolute -bottom-[0.4em] -left-[0.4em] h-[24em] w-[20.5em]" />
          <EngravedBouquet items={BOTTOM_RIGHT} viewBox="0 0 190 200" className="absolute -bottom-[0.4em] -right-[0.4em] h-[23em] w-[22em]" />
          <div className="absolute right-[1.4em] top-[1.4em] h-[45%] w-[55%]" style={{ borderTop: `1px solid ${GOLD}`, borderRight: `1px solid ${GOLD}` }} />
        </div>
        <FiligreeCorner corner="tr" color={GOLD} opacity={0.9} />

        <div className="relative flex flex-1 flex-col items-center px-[6.4em] pb-[12em] pt-[7em] text-center">
          <p style={{ fontFamily: SERIF, fontSize: '1.2em', color: INK }}>Nous vous invitons à célébrer</p>

          <p className="mt-[0.3em] uppercase" style={{ fontFamily: SERIF, fontSize: titleEm ? '2.4em' : '2.1em', letterSpacing: '0.04em', color: DARK }}>
            Réservez la date
          </p>

          <div className="relative mt-[1.5em] flex w-full flex-col items-center">
            {/* Giant ghost ampersand behind the names */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none"
              style={{
                fontFamily: SCRIPT_FONT,
                fontSize: '15em',
                lineHeight: 1,
                color: '#B9A88C',
                opacity: 0.28,
              }}
            >
              &amp;
            </span>
            <h1 className="relative break-words text-balance leading-[1.14]">
              <span className="sr-only">{draft.title}</span>
              {names ? (
                <span aria-hidden="true" className="flex flex-col items-center">
                  <span className="-translate-x-[0.9em]" style={{ fontFamily: SCRIPT_FONT, fontSize: titleEm ? '6em' : '5.2em', filter: 'drop-shadow(0 0.04em 0.04em rgba(60,40,10,0.35))' }}>
                    <FoilText gradient={NAME_GOLD}>{names[0]}</FoilText>
                  </span>
                  <span className="-mt-[0.35em] translate-x-[0.9em]" style={{ fontFamily: SCRIPT_FONT, fontSize: titleEm ? '6em' : '5.2em', filter: 'drop-shadow(0 0.04em 0.04em rgba(60,40,10,0.35))' }}>
                    <FoilText gradient={NAME_GOLD}>{names[1]}</FoilText>
                  </span>
                </span>
              ) : (
                <span style={{ fontFamily: SCRIPT_FONT, fontSize: titleEm ? '5.4em' : '4.5em' }}>
                  <FoilText gradient={NAME_GOLD}>{draft.title}</FoilText>
                </span>
              )}
            </h1>
          </div>

          {draft.guestName?.trim() ? (
            <p className="mt-[1em] font-display italic" style={{ fontSize: '1.12em' }}>
              {draft.guestName}
            </p>
          ) : null}

          <FleuronDivider className="mt-[1.6em] h-[1.3em] w-[13em]" color={GOLD} />

          <p
            className="mt-[1.1em]"
            style={{ fontFamily: SCRIPT_FONT, fontSize: '2.9em', color: DARK }}
          >
            Cérémonie de mariage
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
            className="mt-[1.7em] flex items-stretch justify-center"
            style={{ transform: dateEm ? 'scale(1.12)' : undefined, color: DARK }}
          >
            <p className="flex items-end px-[0.8em] pb-[0.15em]" style={{ fontFamily: SANS, fontSize: '1.5em', fontWeight: 600 }}>
              <span className="mr-[0.2em] self-start text-[0.45em] font-normal">à</span>
              {formatEventTime(draft.event_time).replace(':', '.')}
            </p>
            <span style={{ width: 1, backgroundColor: DARK, opacity: 0.5 }} />
            <div className="flex flex-col items-center px-[1.1em]">
              <p className="leading-none" style={{ fontFamily: SANS, fontSize: '1.9em', fontWeight: 700 }}>
                {formatDayNumber(draft.event_date)}
              </p>
              <p className="lowercase" style={{ fontFamily: SANS, fontSize: '1.3em', fontWeight: 600, lineHeight: 1.1 }}>
                {formatMonthShort(draft.event_date)}
              </p>
            </div>
            <span style={{ width: 1, backgroundColor: DARK, opacity: 0.5 }} />
            <p className="flex items-end px-[0.8em] pb-[0.15em]" style={{ fontFamily: SANS, fontSize: '1.5em' }}>
              <span>{formatYearOnly(draft.event_date).slice(0, 2)}</span>
              <span style={{ fontWeight: 700 }}>{formatYearOnly(draft.event_date).slice(2)}</span>
            </p>
          </div>

          {draft.venue_name || draft.venue_address ? (
            <div
              className="mt-[1.5em] uppercase"
              style={{ fontFamily: SERIF, fontSize: venueEm ? '1.25em' : '1.1em', color: DARK, lineHeight: 1.5 }}
            >
              {draft.venue_name ? (
                <p style={{ letterSpacing: '0.04em', fontWeight: 700 }}>{draft.venue_name}</p>
              ) : null}
              {draft.venue_address ? (
                <p style={{ letterSpacing: '0.04em', color: INK }}>
                  {draft.venue_address}
                </p>
              ) : null}
              {draft.venue_details ? (
                <p className="italic opacity-80" style={{ letterSpacing: '0.08em', fontSize: '0.86em' }}>
                  {draft.venue_details}
                </p>
              ) : null}
            </div>
          ) : null}

          <NoteSection draft={draft} ink={DARK} />
          <ProgramSection
            draft={draft}
            accent={GOLD}
            ink={DARK}
            ornament={<TemplateOrnament templateKey="roses-dor" color={GOLD} />}
          />
          <TableSection
            draft={draft}
            accent={GOLD}
            ink={DARK}
            ornament={<TemplateOrnament templateKey="roses-dor" color={GOLD} />}
          />
          <DressCodeSection
            draft={draft}
            accent={GOLD}
            ink={DARK}
            ornament={<TemplateOrnament templateKey="roses-dor" color={GOLD} />}
          />
        </div>
      </div>
    </InvitationPaper>
  )
}
