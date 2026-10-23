/**
 * « Romance » — reproduction of `very_beautiful template/qmy1.webp`.
 *
 * White paper with blue watercolour clusters and gold sprigs at top-right and
 * bottom-right, a naive flat groom-and-bride illustration at the bottom-left,
 * stacked navy calligraphy names around a gold ampersand and a rule-flanked
 * « MAR | 10 | À 09:00 » date row with the year beneath.
 */
import { CoupleArt } from './coupleArt.tsx'
import { Bouquet } from './paintedFlora.tsx'
import type { FloraItem } from './paintedFlora.tsx'
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
  SCRIPT_FONT,
  formatMonthOnly,
  formatYearOnly,
  splitNames,
} from './referenceMotifs.tsx'
import type { TemplateProps } from './types.ts'

const PAPER = '#FFFFFF'
const INK = '#2C3E63'
const GOLD = '#C29A4E'
const SERIF = "'Cormorant Garamond', 'Playfair Display', Georgia, serif"
const TAN = '#C8A57A'

const BLUSH_TOP_LEFT: FloraItem[] = [
  { k: 'spray', x: 10, y: 20, s: 1.1, r: 150, p: 'dustyBlue', len: 130, n: 7 },
  { k: 'spray', x: 30, y: 0, s: 0.9, r: 120, p: 'blueLeaf', len: 120, n: 7 },
  { k: 'gildedLeaf', x: 70, y: 40, s: 1, r: 110, p: 'eucalyptus' },
  { k: 'gildedLeaf', x: 20, y: 100, s: 1.1, r: 190, p: 'dustyBlue' },
  { k: 'gildedLeaf', x: 90, y: 20, s: 0.8, r: 80, p: 'eucalyptus' },
  { k: 'peony', x: 30, y: 50, s: 0.95, r: -10, p: 'blush' },
  { k: 'rose', x: 76, y: 14, s: 0.5, r: 20, p: 'dustyBlue' },
  { k: 'spray', x: 12, y: 120, s: 0.8, r: 175, p: 'dustyBlue', len: 110, n: 6 },
]

const BLUSH_BOTTOM_RIGHT: FloraItem[] = [
  { k: 'spray', x: 150, y: 200, s: 1.1, r: -10, p: 'dustyBlue', len: 140, n: 8 },
  { k: 'spray', x: 120, y: 210, s: 0.9, r: -40, p: 'blueLeaf', len: 120, n: 7 },
  { k: 'gildedLeaf', x: 110, y: 160, s: 1.1, r: -60, p: 'eucalyptus' },
  { k: 'gildedLeaf', x: 150, y: 120, s: 1, r: 10, p: 'dustyBlue' },
  { k: 'gildedLeaf', x: 80, y: 190, s: 0.9, r: -90, p: 'eucalyptus' },
  { k: 'peony', x: 130, y: 170, s: 1, r: 10, p: 'blush' },
  { k: 'rose', x: 92, y: 200, s: 0.5, r: -10, p: 'dustyBlue' },
]

export function Romance({ draft }: TemplateProps) {
  const titleEm = isEmphasized(draft, 'title')
  const dateEm = isEmphasized(draft, 'date')
  const venueEm = isEmphasized(draft, 'venue')
  const names = splitNames(draft.title)
  return (
    <InvitationPaper style={{ backgroundColor: PAPER, color: INK }}>

      <CoverHero
        draft={draft}
        bandColor="rgba(30,42,66,0.6)"
        edgeColor="rgba(194,154,78,0.9)"
        eyebrow="Nous nous marions"
        paperColor={PAPER}
        titleStyle={{
          fontFamily: SCRIPT_FONT,
          fontSize: titleEm ? '4.4em' : '3.5em',
          color: '#F5F1E6',
          textShadow: '0 0.05em 0.3em rgba(20,28,46,0.55)',
        }}
      />

      {/* Everything below the cover lives in its own frame, so the
          ornaments start under the photo instead of hiding behind it. */}
      <div className="relative flex flex-1 flex-col">
        {/* Blush peonies with dusty-blue and gilded leaves at top-left and
            bottom-right, a blue watercolour mist top-right, the couple at
            bottom-left — the composition of the reference. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-[4em] -top-[4em] h-[18em] w-[22em] rounded-full" style={{ background: 'radial-gradient(closest-side, rgba(150,175,215,0.28), transparent)' }} />
          <Bouquet items={BLUSH_TOP_LEFT} viewBox="0 0 140 170" className="absolute -left-[0.5em] -top-[0.5em] h-[19em] w-[15.5em]" />
          <Bouquet items={BLUSH_BOTTOM_RIGHT} viewBox="0 0 170 220" className="absolute -bottom-[0.5em] -right-[0.5em] h-[22em] w-[17em]" />
          <CoupleArt className="absolute bottom-0 left-[0.8em] h-[19em] w-[12.4em]" />
        </div>

        <div className="relative flex flex-1 flex-col items-center px-[8em] pb-[16em] pt-[8.5em] text-center">
          <p className="uppercase" style={{ fontFamily: SERIF, fontWeight: 500, fontSize: '1.15em', letterSpacing: '0.08em', lineHeight: 1.6, color: '#6B6F7A' }}>
            Vous êtes invités à être nos hôtes
            <br />
            à notre cérémonie de mariage
          </p>

          <h1 className="mt-[1.2em] break-words text-balance leading-[1.14]" style={{ color: INK }}>
            <span className="sr-only">{draft.title}</span>
            {names ? (
              <span aria-hidden="true" className="flex flex-col items-center">
                <span style={{ fontFamily: SCRIPT_FONT, fontSize: titleEm ? '4.3em' : '3.5em' }}>
                  {names[0]}
                </span>
                <span
                  style={{
                    fontFamily: SCRIPT_FONT,
                    fontSize: titleEm ? '3.2em' : '2.8em',
                    color: INK,
                    lineHeight: 1,
                    margin: '0.02em 0',
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

          <p className="mt-[1.6em] uppercase" style={{ fontFamily: SERIF, fontWeight: 600, letterSpacing: '0.14em', fontSize: '1.35em' }}>
            {formatMonthOnly(draft.event_date)}
          </p>

          {/* WEEKDAY | gold DAY | TIME between double tan rules, year beneath. */}
          <div
            className="mt-[0.5em] grid w-full max-w-[26em] grid-cols-[1fr_auto_1fr] items-center gap-[1.2em]"
            style={{ transform: dateEm ? 'scale(1.12)' : undefined, fontFamily: SERIF, fontWeight: 600, fontSize: '1.25em' }}
          >
            <div className="flex flex-col gap-[0.2em]">
              <span className="h-[1.5px]" style={{ backgroundColor: TAN }} />
              <span className="whitespace-nowrap py-[0.2em] uppercase" style={{ letterSpacing: '0.1em' }}>{formatWeekday(draft.event_date).slice(0, 3)}</span>
              <span className="h-[1.5px]" style={{ backgroundColor: TAN }} />
            </div>
            <p className="leading-none" style={{ fontSize: '2.4em', color: GOLD }}>
              {formatDayNumber(draft.event_date)}
            </p>
            <div className="flex flex-col gap-[0.2em]">
              <span className="h-[1.5px]" style={{ backgroundColor: TAN }} />
              <span className="whitespace-nowrap py-[0.2em] uppercase" style={{ letterSpacing: '0.1em' }}>à {formatEventTime(draft.event_time)}</span>
              <span className="h-[1.5px]" style={{ backgroundColor: TAN }} />
            </div>
          </div>

          <p className="mt-[0.5em] uppercase" style={{ fontFamily: SERIF, fontWeight: 600, letterSpacing: '0.14em', fontSize: '1.2em' }}>
            {formatYearOnly(draft.event_date)}
          </p>

          {draft.venue_name || draft.venue_address ? (
            <div
              className="mt-[1.3em]"
              style={{ fontFamily: SERIF, fontSize: venueEm ? '1.4em' : '1.25em', lineHeight: 1.5, color: '#6B6F7A' }}
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
      </div>
    </InvitationPaper>
  )
}
