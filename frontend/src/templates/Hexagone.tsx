/**
 * « Hexagone » — reproduction of `very_beautiful template/Screenshot 2026-10-08 022004.png`.
 *
 * Cream watercolour paper crossed by an open gold hexagon (its lines
 * intersecting above and below), muted rose/taupe floral corners with red
 * berries, stacked brown calligraphy names and a rule-framed
 * « NOVEMBRE | 14 | 18:00 » date row.
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
  isEmphasized,
} from './shared.tsx'
import {
  SCRIPT_FONT,
  formatMonthOnly,
  splitNames,
} from './referenceMotifs.tsx'
import type { TemplateProps } from './types.ts'

const PAPER = '#F2EAE0'
const INK = '#5F4636'
const GOLD = '#B4924F'
const SERIF_CAPS = "'Cormorant Garamond', 'Playfair Display', Georgia, serif"

/** Two overlapping gold gem outlines, slightly offset — the faceted frame
 * of the reference — drawn to the sheet with non-scaling hairlines. */
function GemFrame() {
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 562 784" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9C7A3E" />
          <stop offset="0.35" stopColor="#D9BD7E" />
          <stop offset="0.65" stopColor="#A9864A" />
          <stop offset="1" stopColor="#D6B878" />
        </linearGradient>
      </defs>
      <g fill="none" stroke={`url(#${id}-g)`} strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="miter">
        <path d="M 48 218 L 282 36 L 498 196 L 522 584 L 428 742 L 128 732 L 40 548 Z" vectorEffect="non-scaling-stroke" />
        <path d="M 62 186 L 304 58 L 476 236 L 514 610 L 356 738 L 92 692 L 54 420 Z" vectorEffect="non-scaling-stroke" />
      </g>
    </svg>
  )
}

const DRIED_TOP_LEFT: FloraItem[] = [
  { k: 'plume', x: 70, y: 60, s: 1.5, r: 120, p: 'dried' },
  { k: 'plume', x: 40, y: 90, s: 1.3, r: 160, p: 'dried' },
  { k: 'spray', x: 110, y: 40, s: 0.7, r: 110, p: 'dried', len: 80, n: 6 },
  { k: 'leaf', x: 90, y: 90, s: 0.6, r: 140, p: 'burgundy' },
  { k: 'rose', x: 34, y: 34, s: 0.8, r: 10, p: 'taupe' },
  { k: 'anemone', x: 86, y: 28, s: 0.5, r: 0, p: 'cream' },
  { k: 'berries', x: 14, y: 120, s: 1.1, r: 200, p: 'burgundy' },
]

const DRIED_TOP_RIGHT: FloraItem[] = [
  { k: 'plume', x: 40, y: 40, s: 1.5, r: -100, p: 'dried' },
  { k: 'plume', x: 130, y: 130, s: 1.4, r: 200, p: 'dried' },
  { k: 'spray', x: 30, y: 70, s: 0.75, r: -110, p: 'dried', len: 90, n: 7 },
  { k: 'leaf', x: 100, y: 110, s: 0.7, r: 170, p: 'burgundy' },
  { k: 'leaf', x: 60, y: 30, s: 0.55, r: -80, p: 'burgundy' },
  { k: 'rose', x: 110, y: 50, s: 0.85, r: -10, p: 'cream' },
  { k: 'anemone', x: 140, y: 100, s: 0.62, r: 14, p: 'taupe' },
  { k: 'rose', x: 70, y: 70, s: 0.55, r: 30, p: 'blush' },
  { k: 'anemone', x: 150, y: 30, s: 0.5, r: 0, p: 'cream' },
  { k: 'berries', x: 168, y: 140, s: 1, r: 200, p: 'burgundy' },
]

const DRIED_BOTTOM: FloraItem[] = [
  { k: 'plume', x: 60, y: 150, s: 1.5, r: 40, p: 'dried' },
  { k: 'plume', x: 20, y: 120, s: 1.3, r: -20, p: 'dried' },
  { k: 'spray', x: 110, y: 160, s: 0.75, r: 70, p: 'dried', len: 90, n: 7 },
  { k: 'leaf', x: 90, y: 120, s: 0.65, r: 20, p: 'burgundy' },
  { k: 'rose', x: 40, y: 120, s: 0.82, r: 0, p: 'taupe' },
  { k: 'anemone', x: 96, y: 140, s: 0.6, r: 10, p: 'cream' },
  { k: 'rose', x: 70, y: 96, s: 0.5, r: -20, p: 'blush' },
  { k: 'berries', x: 130, y: 120, s: 1, r: 60, p: 'burgundy' },
]

export function Hexagone({ draft }: TemplateProps) {
  const titleEm = isEmphasized(draft, 'title')
  const dateEm = isEmphasized(draft, 'date')
  const venueEm = isEmphasized(draft, 'venue')
  const names = splitNames(draft.title)
  return (
    <InvitationPaper
      style={{
        backgroundColor: PAPER,
        // Soft beige watercolour wash, lighter at the heart.
        backgroundImage: 'radial-gradient(ellipse 70% 55% at 50% 45%, rgba(255,251,245,0.75), transparent 75%), linear-gradient(160deg, #EFE3D4, #F4ECE2 45%, #EDE0D0)',
        color: INK,
      }}
    >

      <CoverHero
        draft={draft}
        bandColor="rgba(43,32,24,0.6)"
        edgeColor="rgba(216,178,106,0.85)"
        eyebrow="Célébrons ensemble"
        paperColor={PAPER}
        titleStyle={{
          fontFamily: SCRIPT_FONT,
          fontSize: titleEm ? '4.4em' : '3.5em',
          color: '#F7EEDD',
          textShadow: '0 0.05em 0.3em rgba(30,20,12,0.5)',
        }}
      />

      <GemFrame />

      {/* Dried bouquets: cream and blush roses, taupe anemones, tan plumes,
          burgundy leaves and red berries, at all four corners. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <Bouquet items={DRIED_TOP_LEFT} viewBox="0 0 140 140" className="absolute -left-[0.6em] -top-[0.6em] h-[14em] w-[14em]" />
        <Bouquet items={DRIED_TOP_RIGHT} viewBox="0 0 180 160" className="absolute -right-[0.6em] -top-[0.4em] h-[16em] w-[18em]" />
        <Bouquet items={DRIED_BOTTOM} viewBox="0 0 160 170" className="absolute -bottom-[0.6em] -left-[0.6em] h-[15em] w-[14em]" />
        <Bouquet items={DRIED_BOTTOM} viewBox="0 0 160 170" className="absolute -bottom-[0.6em] -right-[0.6em] h-[16em] w-[15em]" style={{ transform: 'scaleX(-1)' }} />
      </div>

      <div className="relative flex flex-1 flex-col items-center px-[6.8em] pb-[10em] pt-[10.5em] text-center">
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

        {/* MONTH | DAY | TIME: rules frame the side words only. */}
        <div
          className="mt-[1.7em] grid w-full max-w-[25em] grid-cols-[1fr_auto_1fr] items-center gap-[1.2em]"
          style={{ transform: dateEm ? 'scale(1.12)' : undefined, fontFamily: SERIF_CAPS }}
        >
          <p className="whitespace-nowrap py-[0.35em] text-center uppercase" style={{ borderTop: `1px solid ${INK}`, borderBottom: `1px solid ${INK}`, fontSize: '1.3em', fontWeight: 600, letterSpacing: '0.05em' }}>
            {formatMonthOnly(draft.event_date)}
          </p>
          <p className="leading-none" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '3.4em', fontWeight: 500 }}>
            {formatDayNumber(draft.event_date)}
          </p>
          <p className="whitespace-nowrap py-[0.35em] text-center" style={{ borderTop: `1px solid ${INK}`, borderBottom: `1px solid ${INK}`, fontSize: '1.3em', fontWeight: 600, letterSpacing: '0.05em' }}>
            {formatEventTime(draft.event_time)}
          </p>
        </div>

        {draft.venue_name || draft.venue_address ? (
          <div
            className="mt-[1.4em] uppercase"
            style={{ fontFamily: SERIF_CAPS, fontWeight: 600, fontSize: venueEm ? '1.3em' : '1.15em', letterSpacing: '0.05em', lineHeight: 1.5 }}
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
