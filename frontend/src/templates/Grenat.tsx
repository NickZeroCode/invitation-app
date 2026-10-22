/**
 * « Grenat » — reproduction of `very_beautiful template/baz5.webp`.
 *
 * Blush-to-cream gradient paper inside a thin gold frame, burgundy rose
 * clusters with gold leaves and sparkles at the top corners, a row of gold
 * lotus petals along the bottom, burgundy italic serif intro, stacked
 * calligraphy names around a gold ampersand and a rule-divided date row.
 */
import { useId } from 'react'

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
  GOLD,
  SCRIPT_FONT,
  Sparkles,
  formatMonthOnly,
  splitNames,
} from './referenceMotifs.tsx'
import type { TemplateProps } from './types.ts'

const PAPER = '#F5F2ED'
const INK = '#4A3A38'
const DEEP = '#4A2330'
const SERIF = "'Playfair Display', Georgia, serif"
const COPPER = 'linear-gradient(90deg, #6E4321, #B47A45 30%, #8A5A2E 55%, #C08A55 80%, #6E4321)'

const ROSES_TOP_LEFT: FloraItem[] = [
  { k: 'spray', x: 30, y: 10, s: 0.9, r: 140, p: 'gold', len: 100, n: 7 },
  { k: 'spray', x: 70, y: 0, s: 0.7, r: 100, p: 'gold', len: 80, n: 6 },
  { k: 'rose', x: 34, y: 30, s: 0.85, r: -10, p: 'burgundy' },
  { k: 'rose', x: 78, y: 18, s: 0.55, r: 20, p: 'burgundy' },
  { k: 'bud', x: 20, y: 80, s: 0.7, r: 190, p: 'burgundy' },
  { k: 'bud', x: 38, y: 92, s: 0.6, r: 170, p: 'burgundy' },
  { k: 'bud', x: 56, y: 70, s: 0.55, r: 150, p: 'burgundy' },
  { k: 'berries', x: 8, y: 60, s: 1.1, r: 200, p: 'burgundy' },
]

const ROSES_TOP_RIGHT: FloraItem[] = [
  { k: 'spray', x: 90, y: 10, s: 0.9, r: -140, p: 'gold', len: 100, n: 7 },
  { k: 'spray', x: 100, y: 60, s: 0.8, r: -170, p: 'gold', len: 90, n: 6 },
  { k: 'rose', x: 86, y: 18, s: 0.6, r: 10, p: 'burgundy' },
  { k: 'bud', x: 70, y: 40, s: 0.55, r: -160, p: 'burgundy' },
]

const ROSES_BOTTOM_RIGHT: FloraItem[] = [
  { k: 'spray', x: 100, y: 120, s: 0.9, r: -20, p: 'gold', len: 100, n: 7 },
  { k: 'spray', x: 60, y: 130, s: 0.7, r: -60, p: 'gold', len: 80, n: 6 },
  { k: 'rose', x: 80, y: 96, s: 0.75, r: 10, p: 'burgundy' },
  { k: 'rose', x: 52, y: 112, s: 0.55, r: -20, p: 'burgundy' },
  { k: 'bud', x: 66, y: 60, s: 0.6, r: -10, p: 'burgundy' },
  { k: 'bud', x: 92, y: 54, s: 0.55, r: 15, p: 'burgundy' },
  { k: 'berries', x: 110, y: 70, s: 1, r: 10, p: 'burgundy' },
]

const LEAVES_BOTTOM_LEFT: FloraItem[] = [
  { k: 'spray', x: 20, y: 120, s: 1, r: 20, p: 'gold', len: 110, n: 8 },
  { k: 'spray', x: 40, y: 125, s: 0.8, r: 50, p: 'gold', len: 90, n: 6 },
]

/** Sculpted copper lotus seen from the side: fanned pointed petals. */
function CopperLotus({ className }: { className?: string }) {
  const id = useId().replace(/:/g, '')
  const petal = 'M 0 0 C -16 -14, -18 -46, 0 -70 C 18 -46, 16 -14, 0 0 Z'
  const fan = [-62, -38, -16, 16, 38, 62]
  return (
    <svg viewBox="-80 -80 160 84" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-c`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#7A4A24" />
          <stop offset="0.5" stopColor="#B97D45" />
          <stop offset="1" stopColor="#E7B783" />
        </linearGradient>
      </defs>
      {fan.map((angle) => (
        <path key={angle} d={petal} transform={`rotate(${angle}) scale(0.92)`} fill={`url(#${id}-c)`} stroke="#6B3F1C" strokeWidth="0.8" strokeOpacity="0.5" />
      ))}
      <path d={petal} fill={`url(#${id}-c)`} stroke="#6B3F1C" strokeWidth="0.8" strokeOpacity="0.5" />
      <path d="M 0 -6 L 0 -60" stroke="#F1C995" strokeWidth="1" opacity="0.6" />
    </svg>
  )
}

export function Grenat({ draft }: TemplateProps) {
  const titleEm = isEmphasized(draft, 'title')
  const dateEm = isEmphasized(draft, 'date')
  const venueEm = isEmphasized(draft, 'venue')
  const names = splitNames(draft.title)
  return (
    <InvitationPaper
      style={{ backgroundColor: PAPER, color: INK }}
    >

      <CoverHero
        draft={draft}
        bandColor="rgba(70,18,32,0.6)"
        edgeColor="rgba(217,181,104,0.9)"
        eyebrow="Réservez la date"
        paperColor={PAPER}
        titleStyle={{
          fontFamily: SCRIPT_FONT,
          fontSize: titleEm ? '4.5em' : '3.6em',
          color: '#FBEFE4',
          textShadow: '0 0.05em 0.3em rgba(50,10,20,0.55)',
        }}
      />

      {/* Copper frame posts down both sides, as in the reference. */}
      <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-[1.3em] top-0 w-[0.7em]" style={{ backgroundImage: COPPER }} />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-[1.3em] top-0 w-[0.7em]" style={{ backgroundImage: COPPER }} />

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <Bouquet items={ROSES_TOP_LEFT} viewBox="0 0 120 110" className="absolute -left-[0.4em] -top-[0.4em] h-[12.5em] w-[13.5em]" />
        <Bouquet items={ROSES_TOP_RIGHT} viewBox="0 0 120 110" className="absolute -right-[0.4em] -top-[0.4em] h-[12em] w-[13em]" />
        <Bouquet items={ROSES_BOTTOM_RIGHT} viewBox="0 0 130 140" className="absolute -bottom-[0.4em] -right-[0.4em] h-[15em] w-[14em]" />
        <Bouquet items={LEAVES_BOTTOM_LEFT} viewBox="0 0 120 130" className="absolute -bottom-[0.4em] -left-[0.4em] h-[13em] w-[12em]" />
        <Sparkles color="#D4A88A" className="absolute left-[11em] top-[3.5em] h-[3.6em] w-[3.6em]" />
        <Sparkles color="#D4A88A" className="absolute right-[11em] top-[2.5em] h-[3.4em] w-[3.4em]" />
      </div>
      {/* Two copper lotus blooms rising from the bottom edge. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center gap-[8em]">
        <CopperLotus className="h-[5.5em] w-[10em]" />
        <CopperLotus className="h-[5.5em] w-[10em]" />
      </div>


      <div className="relative flex flex-1 flex-col items-center px-[7em] pb-[9em] pt-[4em] text-center">
        <p style={{ fontFamily: SERIF, fontWeight: 600, fontSize: titleEm ? '1.65em' : '1.45em', color: INK }}>
          Réservez la date
        </p>

        <h1 className="mt-[1.3em] break-words text-balance leading-[1.16]" style={{ color: DEEP }}>
          <span className="sr-only">{draft.title}</span>
          {names ? (
            <span aria-hidden="true" className="flex flex-col items-center">
              <span style={{ fontFamily: SCRIPT_FONT, fontSize: titleEm ? '4.2em' : '3.6em' }}>
                {names[0]}
              </span>
              <span
                style={{
                  fontFamily: SCRIPT_FONT,
                  fontSize: titleEm ? '3.2em' : '2.8em',
                  color: DEEP,
                  lineHeight: 1,
                  margin: '0.04em 0',
                }}
              >
                &amp;
              </span>
              <span style={{ fontFamily: SCRIPT_FONT, fontSize: titleEm ? '4.2em' : '3.6em' }}>
                {names[1]}
              </span>
            </span>
          ) : (
            <span style={{ fontFamily: SCRIPT_FONT, fontSize: titleEm ? '4.2em' : '3.6em' }}>
              {draft.title}
            </span>
          )}
        </h1>

        {draft.guestName?.trim() ? (
          <p className="mt-[1em] font-display italic" style={{ fontSize: '1.1em', color: INK }}>
            {draft.guestName}
          </p>
        ) : null}

        {draft.message ? (
          <p
            className="mt-[1.1em] max-w-[24em] text-pretty leading-[1.75] break-words"
            style={{ fontSize: '1.2em', color: INK, fontFamily: messageFontCss(draft.messageFont) ?? SERIF }}
          >
            {draft.message}
          </p>
        ) : null}

        <p
          className="mt-[1.8em] uppercase"
          style={{ fontFamily: SERIF, fontWeight: 600, letterSpacing: '0.04em', fontSize: '1.3em', color: INK }}
        >
          {formatMonthOnly(draft.event_date)}
        </p>

        <div className="relative mt-[1.1em]">
          <Sparkles
            color="#D9B568"
            className="pointer-events-none absolute -left-[4.8em] top-1/2 h-[2.6em] w-[2.6em] -translate-y-1/2"
          />
          <div
            className="flex items-center justify-center gap-[1.6em]"
            style={{ transform: dateEm ? 'scale(1.12)' : undefined, color: INK, fontFamily: SERIF, fontWeight: 600, fontSize: '1.25em' }}
          >
            <p className="uppercase">{formatWeekday(draft.event_date)}</p>
            <p className="leading-none" style={{ fontFamily: SCRIPT_FONT, fontWeight: 400, fontSize: '2.8em', color: DEEP }}>
              {formatDayNumber(draft.event_date)}
            </p>
            <p className="uppercase">à {formatEventTime(draft.event_time)}</p>
          </div>
          <Sparkles
            color="#D9B568"
            className="pointer-events-none absolute -right-[4.8em] top-1/2 h-[2.6em] w-[2.6em] -translate-y-1/2"
          />
        </div>

        {draft.venue_name || draft.venue_address ? (
          <div
            className="mt-[1.5em] uppercase"
            style={{ fontFamily: SERIF, fontWeight: 600, fontSize: venueEm ? '1.3em' : '1.15em', letterSpacing: '0.04em', lineHeight: 1.6, color: INK }}
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

        <NoteSection draft={draft} ink={DEEP} />
        <ProgramSection
          draft={draft}
          accent={GOLD}
          ink={DEEP}
          ornament={<TemplateOrnament templateKey="grenat" color={GOLD} />}
        />
        <TableSection
          draft={draft}
          accent={GOLD}
          ink={DEEP}
          ornament={<TemplateOrnament templateKey="grenat" color={GOLD} />}
        />
        <DressCodeSection
          draft={draft}
          accent={GOLD}
          ink={DEEP}
          ornament={<TemplateOrnament templateKey="grenat" color={GOLD} />}
        />
      </div>
    </InvitationPaper>
  )
}
