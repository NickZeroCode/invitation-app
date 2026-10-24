/**
 * « Floraison » — matched to `very_beautiful template/Screenshot 2026-10-08 021457.png`.
 *
 * White paper misted with blue watercolour at the edges, a gold double
 * frame with baroque filigree corners, painted pansy-and-forget-me-not
 * clusters in all four corners (the lower ones climbing the sides), the
 * couple's photo in a gold oval wrapped in blooms, stacked script names
 * around a gold serif ampersand with flourishes, and the date set as
 * MONTH | WEEKDAY + DAY | TIME between gold rules.
 */
import { FiligreeCorner } from './FiligreeCorner.tsx'
import { FlourishRule } from './florals.tsx'
import { messageFontCss } from './messageFonts.ts'
import { TemplateOrnament } from './ornaments.tsx'
import { Bouquet } from './paintedFlora.tsx'
import type { FloraItem } from './paintedFlora.tsx'
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
import { SCRIPT_FONT, TinyHeart, formatMonthOnly, splitNames } from './referenceMotifs.tsx'
import { FoilFrame } from './luxeMotifs.tsx'
import type { TemplateProps } from './types.ts'

const PAPER = '#FCFDFF'
const INK = '#23336E'
const GOLD = '#B08A45'
const GOLD_FRAME = 'linear-gradient(135deg, #9C7631, #E7CD8A 30%, #A98236 55%, #EBD495 80%, #9C7631)'
const SERIF = "'Playfair Display', Georgia, serif"
const CAPS = "'Cormorant Garamond', 'Playfair Display', Georgia, serif"

/* Corner clusters, drawn in a 200×200 box anchored at the top-left corner
 * (other corners mirror it). Foliage first, blooms, then fillers on top. */
const TOP_CLUSTER: FloraItem[] = [
  { k: 'spray', x: 70, y: 40, s: 0.75, r: 120, p: 'blueLeaf', len: 90, n: 7 },
  { k: 'spray', x: 30, y: 70, s: 0.7, r: 160, p: 'gold', len: 70, n: 6 },
  { k: 'spray', x: 120, y: 18, s: 0.55, r: 95, p: 'gold', len: 70, n: 6 },
  { k: 'pansy', x: 34, y: 36, s: 0.95, r: -12, p: 'royalBlue' },
  { k: 'pansy', x: 86, y: 26, s: 0.66, r: 18, p: 'iceBlue' },
  { k: 'pansy', x: 24, y: 96, s: 0.62, r: 8, p: 'iceBlue' },
  { k: 'forget', x: 120, y: 44, s: 0.9, p: 'royalBlue' },
  { k: 'forget', x: 136, y: 28, s: 0.7, p: 'powderBlue' },
  { k: 'forget', x: 62, y: 70, s: 0.8, p: 'royalBlue' },
  { k: 'forget', x: 46, y: 128, s: 0.7, p: 'powderBlue' },
  { k: 'forget', x: 150, y: 12, s: 0.6, p: 'royalBlue' },
]

const BOTTOM_CLUSTER: FloraItem[] = [
  { k: 'spray', x: 40, y: 190, s: 0.95, r: 8, p: 'blueLeaf', len: 120, n: 9 },
  { k: 'spray', x: 80, y: 196, s: 0.8, r: 30, p: 'gold', len: 100, n: 7 },
  { k: 'spray', x: 18, y: 120, s: 0.6, r: -10, p: 'gold', len: 80, n: 6 },
  { k: 'pansy', x: 44, y: 150, s: 1.15, r: -8, p: 'iceBlue' },
  { k: 'pansy', x: 108, y: 176, s: 1.05, r: 14, p: 'royalBlue' },
  { k: 'pansy', x: 30, y: 92, s: 0.72, r: 10, p: 'royalBlue' },
  { k: 'pansy', x: 156, y: 188, s: 0.7, r: -6, p: 'iceBlue' },
  { k: 'forget', x: 78, y: 120, s: 0.9, p: 'royalBlue' },
  { k: 'forget', x: 20, y: 60, s: 0.75, p: 'powderBlue' },
  { k: 'forget', x: 140, y: 150, s: 0.8, p: 'royalBlue' },
  { k: 'forget', x: 64, y: 196, s: 0.7, p: 'powderBlue' },
]

const MEDALLION_LEFT: FloraItem[] = [
  { k: 'spray', x: 60, y: 110, s: 0.7, r: -150, p: 'blueLeaf', len: 80, n: 6 },
  { k: 'spray', x: 40, y: 30, s: 0.5, r: -60, p: 'gold', len: 70, n: 6 },
  { k: 'pansy', x: 50, y: 52, s: 0.62, r: -10, p: 'royalBlue' },
  { k: 'pansy', x: 36, y: 92, s: 0.5, r: 12, p: 'iceBlue' },
  { k: 'forget', x: 70, y: 82, s: 0.7, p: 'royalBlue' },
  { k: 'forget', x: 26, y: 28, s: 0.6, p: 'powderBlue' },
]

const MEDALLION_RIGHT: FloraItem[] = [
  { k: 'spray', x: 40, y: 20, s: 0.6, r: 40, p: 'gold', len: 70, n: 6 },
  { k: 'pansy', x: 50, y: 70, s: 0.68, r: 8, p: 'royalBlue' },
  { k: 'pansy', x: 74, y: 40, s: 0.46, r: -14, p: 'iceBlue' },
  { k: 'forget', x: 28, y: 100, s: 0.7, p: 'royalBlue' },
  { k: 'forget', x: 80, y: 92, s: 0.6, p: 'powderBlue' },
]

/** MONTH | WEEKDAY over DAY | TIME, between gold hairlines. */
function OpenDateRow({ draft, emphasize }: { draft: TemplateProps['draft']; emphasize: boolean }) {
  const cell = 'flex items-center justify-center self-stretch whitespace-nowrap px-[0.9em]'
  const rule = { borderTop: `1px solid ${GOLD}`, borderBottom: `1px solid ${GOLD}` }
  return (
    <div className="grid w-full max-w-[28em] grid-cols-[1fr_auto_1fr] items-center">
      <div className={cell} style={rule}>
        <span className="uppercase" style={{ fontFamily: CAPS, fontWeight: 600, fontSize: '1.08em', letterSpacing: '0.04em', paddingBlock: '0.35em' }}>
          {formatMonthOnly(draft.event_date)}
        </span>
      </div>
      <div className="flex flex-col items-center px-[1.1em]" style={{ borderLeft: `1px solid ${GOLD}`, borderRight: `1px solid ${GOLD}` }}>
        <span className="uppercase" style={{ fontFamily: CAPS, fontWeight: 600, fontSize: '0.95em', letterSpacing: '0.08em' }}>
          {formatWeekday(draft.event_date)}
        </span>
        <span className="leading-none" style={{ fontFamily: SERIF, fontSize: emphasize ? '3.3em' : '2.8em', color: GOLD }}>
          {formatDayNumber(draft.event_date)}
        </span>
      </div>
      <div className={cell} style={rule}>
        <span style={{ fontFamily: CAPS, fontWeight: 600, fontSize: '1.2em', letterSpacing: '0.04em', paddingBlock: '0.35em' }}>
          {formatEventTime(draft.event_time)}
        </span>
      </div>
    </div>
  )
}

/** The card’s decoration layer — also dresses its PDF pages (see pageDecor). */
export function FloraisonDecor() {
  return (
    <>
      {/* Gold double frame: a foil band and an inner hairline. */}
      <FoilFrame inset="1em" width="0.32em" gradient={GOLD_FRAME} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-[1.75em]" style={{ border: `1px solid ${GOLD}` }} />
      <FiligreeCorner corner="tl" color={GOLD} opacity={0.95} />
      <FiligreeCorner corner="tr" color={GOLD} opacity={0.95} />
      <FiligreeCorner corner="br" color={GOLD} opacity={0.95} />
      <FiligreeCorner corner="bl" color={GOLD} opacity={0.95} />

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <Bouquet items={TOP_CLUSTER} viewBox="0 0 200 200" className="absolute -left-[1.2em] -top-[1.4em] h-[15.5em] w-[15.5em]" />
        <Bouquet items={TOP_CLUSTER} viewBox="0 0 200 200" className="absolute -right-[1.2em] -top-[1.4em] h-[16.5em] w-[16.5em]" style={{ transform: 'scaleX(-1)' }} />
        <Bouquet items={BOTTOM_CLUSTER} viewBox="0 0 200 200" className="absolute -bottom-[1.4em] -left-[1.4em] h-[25em] w-[25em]" />
        <Bouquet items={BOTTOM_CLUSTER} viewBox="0 0 200 200" className="absolute -bottom-[1.4em] -right-[1.4em] h-[26em] w-[26em]" style={{ transform: 'scaleX(-1)' }} />
      </div>
    </>
  )
}

export function Floraison({ draft }: TemplateProps) {
  const titleEm = isEmphasized(draft, 'title')
  const dateEm = isEmphasized(draft, 'date')
  const venueEm = isEmphasized(draft, 'venue')
  const names = splitNames(draft.title)
  const nameSize = titleEm ? '5em' : '4.3em'
  return (
    <InvitationPaper
      style={{
        backgroundColor: PAPER,
        // Blue watercolour mist pooling at the edges, white at the heart.
        backgroundImage: [
          'radial-gradient(ellipse 60% 40% at 0% 0%, rgba(120,150,215,0.22), transparent 70%)',
          'radial-gradient(ellipse 60% 40% at 100% 0%, rgba(120,150,215,0.18), transparent 70%)',
          'radial-gradient(ellipse 60% 45% at 0% 100%, rgba(120,150,215,0.24), transparent 70%)',
          'radial-gradient(ellipse 60% 45% at 100% 100%, rgba(120,150,215,0.2), transparent 70%)',
        ].join(', '),
        color: INK,
      }}
    >
      <FloraisonDecor />

      <div className="relative flex flex-1 flex-col items-center px-[7.5em] pb-[13em] pt-[7.2em] text-center">
        <p className="uppercase" style={{ fontFamily: CAPS, fontWeight: 600, fontSize: '1.85em', letterSpacing: '0.07em', color: GOLD }}>
          Réservez la date
        </p>
        <TinyHeart className="mt-[0.5em] h-[1.1em] w-[12em]" />

        {draft.cover_url ? (
          <div className="relative mt-[1.6em] w-[17em]">
            <div
              className="overflow-hidden"
              style={{ aspectRatio: '1.08 / 1', borderRadius: '50%', border: `0.18em solid ${GOLD}`, boxShadow: '0 0.3em 1em rgba(35,51,110,0.12)' }}
            >
              <img src={draft.cover_url} alt="" className="h-full w-full object-cover" />
            </div>
            <Bouquet items={MEDALLION_LEFT} viewBox="0 0 100 130" className="absolute -left-[3.6em] -top-[1em] h-[11em] w-[8.5em]" />
            <Bouquet items={MEDALLION_RIGHT} viewBox="0 0 100 130" className="absolute -bottom-[2.4em] -right-[3.2em] h-[10em] w-[7.7em]" />
          </div>
        ) : null}

        <h1 className="mt-[1.4em] break-words text-balance leading-[1.05]" style={{ color: INK }}>
          <span className="sr-only">{draft.title}</span>
          {names ? (
            <span aria-hidden="true" className="flex flex-col items-center">
              <span style={{ fontFamily: SCRIPT_FONT, fontSize: nameSize }}>{names[0]}</span>
              <span className="flex items-center gap-[0.6em]">
                <FlourishRule color={GOLD} className="h-[1.2em] w-[6em]" />
                <span style={{ fontFamily: SERIF, fontSize: '2.6em', color: GOLD, lineHeight: 1 }}>&amp;</span>
                <FlourishRule color={GOLD} className="h-[1.2em] w-[6em]" />
              </span>
              <span style={{ fontFamily: SCRIPT_FONT, fontSize: nameSize }}>{names[1]}</span>
            </span>
          ) : (
            <span style={{ fontFamily: SCRIPT_FONT, fontSize: nameSize }}>{draft.title}</span>
          )}
        </h1>
        <FlourishRule color={GOLD} className="mt-[0.4em] h-[1.3em] w-[13em]" />

        {draft.guestName?.trim() ? (
          <p className="mt-[0.8em] italic" style={{ fontFamily: SERIF, fontSize: '1.15em', opacity: 0.85 }}>
            {draft.guestName}
          </p>
        ) : null}

        {draft.message ? (
          <p
            className="mt-[0.9em] max-w-[24em] text-pretty leading-[1.45] break-words"
            style={{ fontSize: '1.3em', fontFamily: messageFontCss(draft.messageFont) ?? SERIF }}
          >
            {draft.message}
          </p>
        ) : null}

        <div className="mt-[1.6em] w-full flex justify-center">
          <OpenDateRow draft={draft} emphasize={dateEm} />
        </div>
        <FlourishRule color={GOLD} className="mt-[0.9em] h-[1.3em] w-[11em]" />

        {draft.venue_name || draft.venue_address ? (
          <div className="mt-[0.6em] leading-[1.45]" style={{ fontFamily: SERIF, fontSize: venueEm ? '1.35em' : '1.2em' }}>
            {draft.venue_name ? <p>{draft.venue_name}</p> : null}
            {draft.venue_address ? <p>{draft.venue_address}</p> : null}
            {draft.venue_details ? <p className="mt-[0.25em] text-[0.85em] italic opacity-80">{draft.venue_details}</p> : null}
          </div>
        ) : null}

        <NoteSection draft={draft} ink={INK} />
        <ProgramSection draft={draft} accent={GOLD} ink={INK} ornament={<TemplateOrnament templateKey="floraison" color={GOLD} />} />
        <TableSection draft={draft} accent={GOLD} ink={INK} ornament={<TemplateOrnament templateKey="floraison" color={GOLD} />} />
        <DressCodeSection draft={draft} accent={GOLD} ink={INK} ornament={<TemplateOrnament templateKey="floraison" color={GOLD} />} />
      </div>
    </InvitationPaper>
  )
}
