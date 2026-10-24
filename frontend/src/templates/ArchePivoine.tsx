/**
 * « Arche Pivoine » — matched to `very_beautiful template/Screenshot 2026-10-08 021701.png`.
 *
 * White paper, a closed double arch in polished gold foil (heavy outer
 * band, fine inner line), painted powder-blue peonies with silver foliage
 * breaking the arch at top-left and bottom-right, royal-blue script names
 * around a plus sign, grey sans captions (the first curving along the
 * crown), and the date row: month arched over a blue heart, double navy
 * rules ending in dots, the year arched under it.
 */
import { useId } from 'react'

import { messageFontCss } from './messageFonts.ts'
import { TemplateOrnament } from './ornaments.tsx'
import { Bouquet } from './paintedFlora.tsx'
import type { FloraItem } from './paintedFlora.tsx'
import {
  CoverHero,
  DressCodeSection,
  InvitationPaper,
  NoteSection,
  ProgramSection,
  TableSection,
  formatDayNumber,
  formatProgramTime,
  formatWeekday,
  isEmphasized,
} from './shared.tsx'
import { ArchText, HeartDay, SCRIPT_FONT, formatMonthOnly, formatYearOnly, splitNames } from './referenceMotifs.tsx'
import type { TemplateProps } from './types.ts'

const PAPER = '#FFFFFF'
const ROYAL = '#1F3C88'
const NAVY = '#2B3F6E'
const GREY = '#5B5F66'
const GOLD = '#C29A4E'
const SANS = "'Montserrat', 'Inter', sans-serif"
const SERIF = "'Cormorant Garamond', 'Playfair Display', Georgia, serif"

const PEONIES_TOP: FloraItem[] = [
  { k: 'spray', x: 60, y: 30, s: 0.85, r: 70, p: 'silver', len: 90, n: 7, round: true },
  { k: 'spray', x: 40, y: 120, s: 0.8, r: 170, p: 'silver', len: 80, n: 6 },
  { k: 'spray', x: 110, y: 20, s: 0.6, r: 100, p: 'eucalyptus', len: 70, n: 6, round: true },
  { k: 'peony', x: 46, y: 62, s: 1.15, r: -14, p: 'powderBlue' },
  { k: 'rose', x: 102, y: 30, s: 0.5, r: 20, p: 'dustyBlue' },
  { k: 'rose', x: 30, y: 128, s: 0.5, r: 10, p: 'dustyBlue' },
  { k: 'forget', x: 14, y: 100, s: 0.8, p: 'powderBlue' },
  { k: 'forget', x: 128, y: 14, s: 0.6, p: 'powderBlue' },
  { k: 'bud', x: 136, y: 40, s: 0.5, r: 70, p: 'dustyBlue' },
]

const PEONIES_BOTTOM: FloraItem[] = [
  { k: 'spray', x: 150, y: 140, s: 0.85, r: -110, p: 'silver', len: 90, n: 7, round: true },
  { k: 'spray', x: 110, y: 180, s: 0.75, r: -60, p: 'silver', len: 80, n: 6 },
  { k: 'spray', x: 160, y: 80, s: 0.6, r: 10, p: 'eucalyptus', len: 70, n: 6, round: true },
  { k: 'peony', x: 120, y: 140, s: 1.1, r: 12, p: 'powderBlue' },
  { k: 'rose', x: 160, y: 104, s: 0.46, r: -20, p: 'dustyBlue' },
  { k: 'forget', x: 74, y: 170, s: 0.7, p: 'powderBlue' },
  { k: 'bud', x: 66, y: 190, s: 0.5, r: -100, p: 'dustyBlue' },
]

/**
 * The closed double arch, drawn to the sheet's proportions in a 100×140 box
 * with non-scaling strokes so the gold keeps its weight on any width.
 */
function GoldArch() {
  const id = useId().replace(/:/g, '')
  const arch = (inset: number) => {
    const l = inset
    const r = 100 - inset
    const top = 4 + inset * 1.4
    const radius = (r - l) / 2
    return `M ${l} ${140 - inset} L ${l} ${top + radius} A ${radius} ${radius * 1.08} 0 0 1 ${r} ${top + radius} L ${r} ${140 - inset} Z`
  }
  return (
    // An absolutely positioned <svg> keeps its intrinsic ratio and ignores
    // `bottom`; the wrapper takes the insets, the svg fills it.
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-[2.6em] bottom-[2.6em] top-[2.2em]">
    <svg viewBox="0 0 100 140" preserveAspectRatio="none" className="h-full w-full">
      <defs>
        <linearGradient id={`${id}-foil`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#A9792B" />
          <stop offset="0.25" stopColor="#F2D98E" />
          <stop offset="0.5" stopColor="#B7862F" />
          <stop offset="0.75" stopColor="#F6E2A4" />
          <stop offset="1" stopColor="#9D6E22" />
        </linearGradient>
      </defs>
      <path d={arch(0)} fill="none" stroke={`url(#${id}-foil)`} strokeWidth="5" vectorEffect="non-scaling-stroke" />
      <path d={arch(2.6)} fill="none" stroke={`url(#${id}-foil)`} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
    </div>
  )
}

/** Double navy rule ending in a dot (the reference's date rails). */
function Rail({ side }: { side: 'left' | 'right' }) {
  const dot = <span className="h-[0.42em] w-[0.42em] rounded-full" style={{ backgroundColor: NAVY }} />
  const line = <span className="h-[2px] flex-1" style={{ backgroundColor: NAVY }} />
  return (
    <span className="flex w-full items-center">
      {side === 'left' ? dot : null}
      {line}
      {side === 'right' ? dot : null}
    </span>
  )
}

function DateCluster({ draft, emphasize }: { draft: TemplateProps['draft']; emphasize: boolean }) {
  const side = (label: string, which: 'left' | 'right', caps = true) => (
    <div className="flex flex-col items-stretch gap-[0.45em]">
      <Rail side={which} />
      <span className={`whitespace-nowrap px-[0.4em] text-center ${caps ? 'uppercase' : ''}`} style={{ fontFamily: SERIF, fontSize: '1.45em', fontWeight: 500, color: NAVY, letterSpacing: '0.04em' }}>
        {label}
      </span>
      <Rail side={which} />
    </div>
  )
  return (
    <div className="flex w-full max-w-[30em] flex-col items-center" style={{ transform: emphasize ? 'scale(1.1)' : undefined }}>
      <ArchText text={formatMonthOnly(draft.event_date).toUpperCase()} color={NAVY} fontSize={34} fontFamily={SERIF} letterSpacing={7} className="-mb-[2.9em] h-[5.4em] w-[13em]" />
      <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-[0.5em]">
        {side(formatWeekday(draft.event_date), 'left')}
        <HeartDay label={formatDayNumber(draft.event_date)} color={NAVY} fill="#AFC3E6" className="mt-[1.4em]" style={{ fontSize: '1.35em' }} />
        {side(formatProgramTime(draft.event_time), 'right', false)}
      </div>
      <span className="mt-[0.3em] uppercase" style={{ fontFamily: SERIF, fontSize: '1.3em', letterSpacing: '0.3em', color: NAVY }}>
        {formatYearOnly(draft.event_date)}
      </span>
    </div>
  )
}

/** The card’s decoration layer — also dresses its PDF pages (see pageDecor). */
export function ArchePivoineDecor() {
  return (
    <>
      <GoldArch />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <Bouquet items={PEONIES_TOP} viewBox="0 0 160 160" className="absolute left-0 top-[3.2em] h-[17em] w-[17em]" />
        <Bouquet items={PEONIES_BOTTOM} viewBox="0 0 200 200" className="absolute -right-[1.5em] bottom-0 h-[19em] w-[19em]" />
      </div>
    </>
  )
}

export function ArchePivoine({ draft }: TemplateProps) {
  const titleEm = isEmphasized(draft, 'title')
  const dateEm = isEmphasized(draft, 'date')
  const venueEm = isEmphasized(draft, 'venue')
  const names = splitNames(draft.title)
  const nameSize = titleEm ? '5.6em' : '4.8em'
  return (
    <InvitationPaper style={{ backgroundColor: PAPER, color: NAVY }}>
      <CoverHero
        draft={draft}
        bandColor="rgba(31,60,136,0.55)"
        edgeColor="rgba(194,154,78,0.9)"
        eyebrow="Avec leurs familles"
        paperColor={PAPER}
        titleStyle={{ fontFamily: SCRIPT_FONT, fontSize: titleEm ? '4.6em' : '3.7em', color: '#F4F1E8' }}
      />

      <div className="relative flex flex-1 flex-col">
        <ArchePivoineDecor />

        <div className="relative flex flex-1 flex-col items-center px-[7em] pb-[6em] pt-[6.4em] text-center">
          <ArchText text="AVEC LEURS FAMILLES" color={GREY} className="h-[5.2em] w-[17em] max-w-full" />

          <h1 className="-mt-[0.6em] break-words text-balance leading-[1.02]" style={{ color: ROYAL }}>
            <span className="sr-only">{draft.title}</span>
            {names ? (
              <span aria-hidden="true" className="flex flex-col items-center">
                <span style={{ fontFamily: SCRIPT_FONT, fontSize: nameSize }}>{names[0]}</span>
                <span className="-my-[0.15em] -translate-x-[1.4em]" style={{ fontFamily: SERIF, fontSize: '2.6em', lineHeight: 1 }}>+</span>
                <span className="translate-x-[0.6em]" style={{ fontFamily: SCRIPT_FONT, fontSize: nameSize }}>{names[1]}</span>
              </span>
            ) : (
              <span style={{ fontFamily: SCRIPT_FONT, fontSize: nameSize }}>{draft.title}</span>
            )}
          </h1>

          {draft.guestName?.trim() ? (
            <p className="mt-[0.9em] italic" style={{ fontFamily: SERIF, fontSize: '1.3em', color: GREY }}>
              {draft.guestName}
            </p>
          ) : null}

          <p className="mt-[1.4em] uppercase" style={{ fontFamily: SANS, fontWeight: 400, fontSize: '1.15em', letterSpacing: '0.18em', color: GREY, lineHeight: 1.55 }}>
            On vous invite à célébrer
            <br />
            leur jour de mariage
          </p>

          {draft.message ? (
            <p className="mt-[1em] max-w-[24em] text-pretty leading-[1.6] break-words" style={{ fontSize: '1.1em', color: GREY, fontFamily: messageFontCss(draft.messageFont) ?? SANS }}>
              {draft.message}
            </p>
          ) : null}

          <div className="mt-[1.4em] flex w-full justify-center">
            <DateCluster draft={draft} emphasize={dateEm} />
          </div>

          {draft.venue_name || draft.venue_address ? (
            <div className="mt-[1.3em] uppercase" style={{ fontFamily: SERIF, fontWeight: 500, fontSize: venueEm ? '1.5em' : '1.35em', letterSpacing: '0.06em', color: NAVY, lineHeight: 1.35 }}>
              {draft.venue_name ? <p>{draft.venue_name}</p> : null}
              {draft.venue_address ? <p>{draft.venue_address}</p> : null}
            </div>
          ) : null}

          <p className="mt-[1em] italic" style={{ fontFamily: SANS, fontWeight: 400, fontSize: '1.15em', color: GREY }}>
            {draft.venue_details || 'Réception à suivre'}
          </p>

          <NoteSection draft={draft} ink={NAVY} />
          <ProgramSection draft={draft} accent={GOLD} ink={NAVY} ornament={<TemplateOrnament templateKey="arche-pivoine" color={GOLD} />} />
          <TableSection draft={draft} accent={GOLD} ink={NAVY} ornament={<TemplateOrnament templateKey="arche-pivoine" color={GOLD} />} />
          <DressCodeSection draft={draft} accent={GOLD} ink={NAVY} ornament={<TemplateOrnament templateKey="arche-pivoine" color={GOLD} />} />
        </div>
      </div>
    </InvitationPaper>
  )
}
