/**
 * « Ruban d'Or » — matched to `very_beautiful template/Screenshot 2026-10-08 021847.png`.
 *
 * Warm cream paper crossed by four dry-brushed gold ribbons that enter at
 * the top right of centre and sweep down to the bottom-left corner, painted
 * blue anemone-and-peony clusters at top-right and bottom-left, an arched
 * bold serif opener, a huge script occasion word, thin sans capitals, the
 * honoured names in script and a bold serif date line.
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
  formatEventDate,
  formatProgramTime,
  isEmphasized,
} from './shared.tsx'
import { ArchText, GOLD, SCRIPT_FONT } from './referenceMotifs.tsx'
import type { TemplateProps } from './types.ts'

const PAPER = '#F3EEE4'
const INK = '#26457E'
const SERIF = "'Playfair Display', Georgia, serif"
const SANS = "'Montserrat', 'Inter', sans-serif"

const CLUSTER_TOP_RIGHT: FloraItem[] = [
  { k: 'spray', x: 120, y: 30, s: 0.9, r: 250, p: 'blueLeaf', len: 110, n: 8 },
  { k: 'spray', x: 150, y: 120, s: 0.9, r: 200, p: 'blueLeaf', len: 100, n: 7 },
  { k: 'spray', x: 40, y: 20, s: 0.7, r: 260, p: 'blueLeaf', len: 90, n: 6 },
  { k: 'anemone', x: 70, y: 40, s: 0.62, r: 10, p: 'dustyBlue' },
  { k: 'peony', x: 132, y: 46, s: 0.95, r: -10, p: 'royalBlue' },
  { k: 'anemone', x: 168, y: 96, s: 0.72, r: 20, p: 'powderBlue' },
  { k: 'anemone', x: 186, y: 30, s: 0.55, r: -16, p: 'dustyBlue' },
  { k: 'bud', x: 30, y: 60, s: 0.7, r: -120, p: 'royalBlue' },
  { k: 'bud', x: 46, y: 76, s: 0.55, r: -140, p: 'royalBlue' },
  { k: 'bud', x: 176, y: 150, s: 0.6, r: 170, p: 'royalBlue' },
]

const CLUSTER_BOTTOM_LEFT: FloraItem[] = [
  { k: 'spray', x: 40, y: 150, s: 0.9, r: -20, p: 'blueLeaf', len: 110, n: 8 },
  { k: 'spray', x: 90, y: 180, s: 0.85, r: 50, p: 'blueLeaf', len: 100, n: 7 },
  { k: 'spray', x: 10, y: 100, s: 0.75, r: -40, p: 'blueLeaf', len: 90, n: 6 },
  { k: 'anemone', x: 30, y: 128, s: 0.7, r: -10, p: 'powderBlue' },
  { k: 'peony', x: 82, y: 156, s: 1, r: 8, p: 'royalBlue' },
  { k: 'anemone', x: 138, y: 168, s: 0.66, r: 14, p: 'dustyBlue' },
  { k: 'anemone', x: 20, y: 180, s: 0.6, r: 0, p: 'dustyBlue' },
  { k: 'bud', x: 20, y: 80, s: 0.6, r: 10, p: 'royalBlue' },
  { k: 'bud', x: 160, y: 130, s: 0.55, r: 60, p: 'royalBlue' },
]

/** Four dry-brushed gold ribbons (rough edges from a displacement filter). */
function GoldBrushRibbons() {
  const id = useId().replace(/:/g, '')
  const strands = [
    { d: 'M 230 -20 C 200 80, 280 150, 230 250 C 190 330, 120 380, 60 470 C 30 515, 10 540, -10 570', w: 22, o: 0.72 },
    { d: 'M 268 -20 C 240 85, 318 160, 268 262 C 228 342, 150 395, 92 482 C 62 525, 42 552, 22 580', w: 15, o: 0.62 },
    { d: 'M 312 -20 C 284 92, 360 170, 312 276 C 272 356, 196 410, 140 494 C 110 538, 92 560, 74 590', w: 18, o: 0.58 },
    { d: 'M 350 -20 C 326 100, 396 182, 352 290 C 314 370, 240 424, 186 506 C 160 546, 144 568, 128 600', w: 11, o: 0.52 },
  ]
  return (
    <svg viewBox="0 0 400 560" preserveAspectRatio="none" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E9D3A0" />
          <stop offset="0.4" stopColor="#CDAA62" />
          <stop offset="0.7" stopColor="#E8CF97" />
          <stop offset="1" stopColor="#C29A50" />
        </linearGradient>
        <filter id={`${id}-brush`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.35 0.012" numOctaves="3" seed="4" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="3.5" />
        </filter>
      </defs>
      <g filter={`url(#${id}-brush)`} fill="none" strokeLinecap="round">
        {strands.map((strand, index) => (
          <path key={index} d={strand.d} stroke={`url(#${id}-g)`} strokeWidth={strand.w} opacity={strand.o} />
        ))}
      </g>
    </svg>
  )
}

export function RubanDor({ draft }: TemplateProps) {
  const titleEm = isEmphasized(draft, 'title')
  const dateEm = isEmphasized(draft, 'date')
  const venueEm = isEmphasized(draft, 'venue')
  return (
    <InvitationPaper style={{ backgroundColor: PAPER, color: INK }}>
      <CoverHero
        draft={draft}
        bandColor="rgba(38,69,126,0.55)"
        edgeColor="rgba(201,162,74,0.9)"
        eyebrow="Fiançailles"
        paperColor={PAPER}
        titleStyle={{ fontFamily: SCRIPT_FONT, fontSize: titleEm ? '4.6em' : '3.7em', color: '#F8F1E2' }}
      />

      <div className="relative flex flex-1 flex-col">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <GoldBrushRibbons />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <Bouquet items={CLUSTER_TOP_RIGHT} viewBox="0 0 200 170" className="absolute -right-[1em] -top-[0.6em] h-[17em] w-[20em]" />
          <Bouquet items={CLUSTER_BOTTOM_LEFT} viewBox="0 0 180 200" className="absolute -bottom-[1em] -left-[1em] h-[19em] w-[17em]" />
        </div>

        <div className="relative flex flex-1 flex-col items-center px-[6.5em] pb-[12em] pt-[6em] text-center">
          <ArchText
            text="Rejoignez-nous pour des"
            color={INK}
            fontSize={30}
            letterSpacing={0.5}
            fontFamily={SERIF}
            className="-mb-[0.4em] h-[5.4em] w-[17em]"
          />
          <p className="break-words leading-[1.05]" style={{ fontFamily: SCRIPT_FONT, fontSize: titleEm ? '7em' : '6.2em', color: INK }}>
            Fiançailles
          </p>

          <p className="mt-[0.9em] uppercase" style={{ fontFamily: SANS, fontWeight: 400, fontSize: '2.3em', letterSpacing: '0.04em' }}>
            Fête
          </p>
          <p className="mt-[0.3em] uppercase" style={{ fontFamily: SANS, fontWeight: 400, fontSize: '1.45em', letterSpacing: '0.04em' }}>
            En l’honneur de
          </p>

          <h1 className="mt-[0.5em] break-words text-balance leading-[1.15]" style={{ fontFamily: SCRIPT_FONT, fontSize: titleEm ? '5em' : '4.3em' }}>
            {draft.title}
          </h1>

          {draft.guestName?.trim() ? (
            <p className="mt-[0.8em] italic" style={{ fontFamily: SERIF, fontSize: '1.15em', opacity: 0.85 }}>
              {draft.guestName}
            </p>
          ) : null}

          {draft.message ? (
            <p className="mt-[0.9em] max-w-[26em] text-pretty leading-[1.6] break-words" style={{ fontSize: '1.15em', fontFamily: messageFontCss(draft.messageFont) ?? SERIF }}>
              {draft.message}
            </p>
          ) : null}

          <p className="mt-[1.2em] break-words first-letter:uppercase" style={{ fontFamily: SERIF, fontWeight: 700, fontSize: dateEm ? '1.65em' : '1.45em' }}>
            {formatEventDate(draft.event_date)}
            {draft.event_time ? ` à ${formatProgramTime(draft.event_time)}` : ''}
          </p>

          {draft.venue_name || draft.venue_address ? (
            <div className="mt-[0.7em]" style={{ fontFamily: SERIF, fontSize: venueEm ? '1.35em' : '1.2em', lineHeight: 1.6 }}>
              {draft.venue_name ? <p>{draft.venue_name}</p> : null}
              {draft.venue_address ? <p>{draft.venue_address}</p> : null}
            </div>
          ) : null}
          {draft.venue_details ? (
            <p className="mt-[0.7em]" style={{ fontFamily: SERIF, fontWeight: 700, fontSize: '1.2em' }}>
              {draft.venue_details}
            </p>
          ) : null}

          <NoteSection draft={draft} ink={INK} />
          <ProgramSection draft={draft} accent={GOLD} ink={INK} ornament={<TemplateOrnament templateKey="ruban-dor" color={GOLD} />} />
          <TableSection draft={draft} accent={GOLD} ink={INK} ornament={<TemplateOrnament templateKey="ruban-dor" color={GOLD} />} />
          <DressCodeSection draft={draft} accent={GOLD} ink={INK} ornament={<TemplateOrnament templateKey="ruban-dor" color={GOLD} />} />
        </div>
      </div>
    </InvitationPaper>
  )
}
