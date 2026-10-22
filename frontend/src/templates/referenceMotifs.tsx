/**
 * Decorative kit reproduced from the illustrations in `very_beautiful template/`.
 *
 * Every motif is hand-drawn inline SVG — no raster assets, no new
 * dependencies — so screen preview and PDF export scale identically.
 * Gradient/pattern ids come from `useId` so several motifs can coexist on
 * one card without id collisions.
 *
 * The palettes plug into `WatercolorSpray` from `./florals.tsx`.
 */
/* oxlint-disable react/only-export-components -- decorative primitives */
import { useId } from 'react'
import type { CSSProperties } from 'react'
import { Bouquet, sprayPalettes } from './paintedFlora.tsx'
import type { FloraItem } from './paintedFlora.tsx'

import type { SprayPalette } from './florals.tsx'

/** Calligraphic face for celebrated names (bundled via @fontsource). */
export const SCRIPT_FONT = "'Great Vibes', 'Segoe Script', cursive"
/** Soft roman face for elegant secondary lines. */
export const ROMAN_FONT = "'Cormorant Garamond', ui-serif, Georgia, serif"
/** Canonical gold used across the reference set. */
export const GOLD = '#C29A4E'
/** Deep navy ink of the blue-floral references. */
export const NAVY_INK = '#2C3E63'

/* ------------------------------------------------------------------ */
/* Palettes — consumed by `WatercolorSpray`                            */
/* ------------------------------------------------------------------ */

/** Cornflower-blue watercolor blooms (Floraison, Arche Pivoine, Romance). */
export const AZURE: SprayPalette = {
  petal: '#6E8FC9',
  petalDeep: '#33528F',
  petalLight: '#D3DFF3',
  leaf: '#8FA596',
  leafDeep: '#5F7568',
  accent: '#C29A4E',
}

/** Muted rose/taupe blooms (Hexagone). */
export const TAUPE: SprayPalette = {
  petal: '#CBA695',
  petalDeep: '#A5765F',
  petalLight: '#F0E2D6',
  leaf: '#A8B49C',
  leafDeep: '#75816A',
  accent: '#B98F63',
}

/** Lilac/clematis blooms (Lilas). */
export const LILAC: SprayPalette = {
  petal: '#A291D4',
  petalDeep: '#7A66B4',
  petalLight: '#E4DFF4',
  leaf: '#93A287',
  leafDeep: '#68785C',
  accent: '#C9B4E4',
}

/** Burgundy roses with gold leaves (Grenat). */
export const GRENAT: SprayPalette = {
  petal: '#8E2F45',
  petalDeep: '#661B2E',
  petalLight: '#E7C2CC',
  leaf: '#C29A4E',
  leafDeep: '#9A7534',
  accent: '#D9B568',
}

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

/**
 * Splits a celebratory title such as « Daniel & Maria » on an ampersand or
 * plus sign so templates can stack the two names around a gold « & ».
 * Returns null when the title carries no separator (render it as-is then).
 */
export function splitNames(title: string): [string, string] | null {
  const parts = title.split(/\s*[&+]\s*/u)
  if (parts.length === 2 && parts[0].trim() && parts[1].trim()) {
    return [parts[0].trim(), parts[1].trim()]
  }
  return null
}

function parseIso(iso: string): Date | null {
  const parts = iso.split('-').map(Number)
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return null
  return new Date(parts[0], parts[1] - 1, parts[2])
}

/** « DÉCEMBRE » — month name only, same ISO parsing as shared.tsx formatters. */
export function formatMonthOnly(iso: string): string {
  const date = parseIso(iso)
  if (!date) return ''
  return new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(date).toUpperCase()
}

/** « DÉC. » — abbreviated month name. */
export function formatMonthShort(iso: string): string {
  const date = parseIso(iso)
  if (!date) return ''
  return new Intl.DateTimeFormat('fr-FR', { month: 'short' })
    .format(date)
    .replace('.', '')
    .toUpperCase()
}

/** Year of the ISO date. */
export function formatYearOnly(iso: string): string {
  const date = parseIso(iso)
  return date ? String(date.getFullYear()) : ''
}

interface MotifProps {
  className?: string
  style?: CSSProperties
}

/* ------------------------------------------------------------------ */
/* Dividers                                                            */
/* ------------------------------------------------------------------ */

/** Slim gold rule broken by a tiny heart (Floraison). */
export function TinyHeart({
  color = GOLD,
  className,
  style,
}: MotifProps & { color?: string }) {
  return (
    <svg viewBox="0 0 220 24" className={className} style={style} aria-hidden="true">
      <rect x="14" y="11.4" width="76" height="1.1" fill={color} opacity="0.6" />
      <rect x="130" y="11.4" width="76" height="1.1" fill={color} opacity="0.6" />
      <path
        d="M 110 18.6 C 101 12.4 96 9 96 5.4 C 96 2.5 98.5 0.6 101.6 0.6 C 104.4 0.6 107.4 2.2 110 5 C 112.6 2.2 115.6 0.6 118.4 0.6 C 121.5 0.6 124 2.5 124 5.4 C 124 9 119 12.4 110 18.6 Z"
        fill={color}
      />
    </svg>
  )
}

/** Small gold fleuron flanked by tapered rules (Roses d'Or, Mandala). */
export function FleuronDivider({
  color = GOLD,
  className,
  style,
}: MotifProps & { color?: string }) {
  return (
    <svg viewBox="0 0 220 26" className={className} style={style} aria-hidden="true">
      <path d="M 16 13 C 52 10.2 78 11.6 96 13 C 78 14.4 52 15.8 16 13 Z" fill={color} opacity="0.85" />
      <path d="M 204 13 C 168 10.2 142 11.6 124 13 C 142 14.4 168 15.8 204 13 Z" fill={color} opacity="0.85" />
      <path
        d="M 110 4 C 114.6 8.4 118 11 118 13.4 C 118 15.8 114.6 18.4 110 22.8 C 105.4 18.4 102 15.8 102 13.4 C 102 11 105.4 8.4 110 4 Z"
        fill={color}
      />
      <circle cx="110" cy="13.4" r="1.6" fill="#FBF7EE" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Date compositions                                                   */
/* ------------------------------------------------------------------ */

/**
 * Gold-outlined date boxes « JULY | MONDAY 17 | 9:00 AM » — the weekday sits
 * above the large day numeral in the centre box (Floraison, Hexagone).
 */
export function GoldDateBoxes({
  month,
  weekday,
  day,
  time,
  color = GOLD,
  ink = NAVY_INK,
}: {
  month: string
  weekday: string
  day: string
  time?: string
  color?: string
  ink?: string
}) {
  const boxStyle: CSSProperties = { borderColor: color, borderStyle: 'solid', borderWidth: 1 }
  return (
    <div className="flex items-stretch justify-center gap-[0.75em]">
      <div className="flex items-center rounded-[0.15em] px-[1.1em] py-[0.72em]" style={boxStyle}>
        <p className="whitespace-nowrap uppercase" style={{ letterSpacing: '0.22em', color: ink }}>
          {month}
        </p>
      </div>
      <div
        className="flex flex-col items-center rounded-[0.15em] px-[1.15em] pb-[0.42em] pt-[0.55em]"
        style={boxStyle}
      >
        <p className="uppercase" style={{ fontSize: '0.82em', letterSpacing: '0.32em', color }}>
          {weekday}
        </p>
        <p className="font-display leading-[1.05]" style={{ fontSize: '2.55em', color: ink }}>
          {day}
        </p>
      </div>
      {time ? (
        <div className="flex items-center rounded-[0.15em] px-[1.1em] py-[0.72em]" style={boxStyle}>
          <p className="whitespace-nowrap uppercase" style={{ letterSpacing: '0.22em', color: ink }}>
            {time}
          </p>
        </div>
      ) : null}
    </div>
  )
}

/**
 * Heart-shaped chip holding the day numeral — Arche Pivoine puts « 10 »
 * inside a soft blue heart between the weekday and the hour.
 */
export function HeartDay({
  label,
  color = '#3A4A6B',
  fill = '#C9D6EC',
  className,
  style,
}: MotifProps & { label: string; color?: string; fill?: string }) {
  return (
    <span className={`relative inline-flex items-center justify-center ${className ?? ''}`} style={style}>
      <svg viewBox="0 0 100 92" className="h-[2.9em] w-[3.15em]" aria-hidden="true">
        <path
          d="M 50 88 C 22 68 4 52 4 33 C 4 17 15.5 6 28.5 6 C 38.5 6 46 12.5 50 21 C 54 12.5 61.5 6 71.5 6 C 84.5 6 96 17 96 33 C 96 52 78 68 50 88 Z"
          fill={fill}
          stroke={color}
          strokeWidth="3.2"
        />
      </svg>
      <span
        className="absolute font-display leading-none"
        style={{ fontSize: '1.55em', color, letterSpacing: '0.04em' }}
      >
        {label}
      </span>
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Gold foliage / ribbons                                              */
/* ------------------------------------------------------------------ */

/** Slender gold leaf sprig (accent around the blue clusters). */
export function GoldSprig({
  color = GOLD,
  className,
  style,
}: MotifProps & { color?: string }) {
  return (
    <svg viewBox="0 0 130 44" className={className} style={style} aria-hidden="true">
      <g stroke={color} strokeWidth="1.7" strokeLinecap="round" fill="none">
        <path d="M 6 22 C 36 22 74 22 124 22" />
        <path d="M 30 22 C 38 10 52 5 66 6" />
        <path d="M 30 22 C 38 34 52 39 66 38" />
      </g>
      <g fill={color}>
        <path d="M 66 6 C 56 4 44 8 38 16 C 48 18 60 14 66 6 Z" opacity="0.9" />
        <path d="M 66 38 C 56 40 44 36 38 28 C 48 26 60 30 66 38 Z" opacity="0.9" />
        <path d="M 84 22 C 78 14 82 6 90 2 C 96 10 94 18 84 22 Z" opacity="0.85" />
        <path d="M 84 22 C 78 30 82 38 90 42 C 96 34 94 26 84 22 Z" opacity="0.85" />
        <circle cx="112" cy="22" r="3.6" opacity="0.95" />
        <circle cx="122" cy="16" r="2.4" opacity="0.85" />
        <circle cx="122" cy="28" r="2.4" opacity="0.85" />
      </g>
    </svg>
  )
}

/**
 * Flowing gold ribbon brushstrokes — thin translucent washes weaving down
 * the sheet of Ruban d'Or.
 */
export function RibbonField({
  color = '#C9A24E',
  light = '#E3C98B',
  className,
  style,
}: MotifProps & { color?: string; light?: string }) {
  return (
    <svg
      viewBox="0 0 400 540"
      preserveAspectRatio="none"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path
        d="M 170 -30 C 120 70 210 130 175 220 C 145 300 225 355 195 445 C 178 505 205 540 195 580"
        fill="none"
        stroke={color}
        strokeWidth="30"
        strokeLinecap="round"
        opacity="0.42"
      />
      <path
        d="M 265 -30 C 225 75 305 135 275 225 C 250 305 315 360 290 450 C 275 505 295 545 288 580"
        fill="none"
        stroke={light}
        strokeWidth="26"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M 345 -30 C 315 85 385 145 360 235 C 340 315 385 370 368 455 C 358 510 372 545 366 580"
        fill="none"
        stroke={color}
        strokeWidth="22"
        strokeLinecap="round"
        opacity="0.38"
      />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Botanical motifs                                                    */
/* ------------------------------------------------------------------ */


/**
 * Large layered peony cluster with eucalyptus sprigs — the corner bouquets
 * of Arche Pivoine.
 */
const PEONY_ITEMS: FloraItem[] = [
  { k: 'spray', x: 40, y: 200, s: 1, r: 30, p: 'leaf', len: 150, n: 8, round: true },
  { k: 'spray', x: 220, y: 60, s: 0.9, r: -120, p: 'leaf', len: 130, n: 7 },
  { k: 'peony', x: 110, y: 110, s: 1.25, r: -10, p: 'flower' },
  { k: 'rose', x: 190, y: 80, s: 0.6, r: 20, p: 'flower' },
  { k: 'rose', x: 70, y: 180, s: 0.55, r: -20, p: 'flower' },
  { k: 'bud', x: 200, y: 150, s: 0.7, r: 120, p: 'flower' },
  { k: 'forget', x: 40, y: 90, s: 1, p: 'flower' },
]

/** Painted peony cluster with eucalyptus (corner bouquet). */
export function PeonyCluster({
  palette = AZURE,
  className,
  style,
}: MotifProps & { palette?: SprayPalette }) {
  return <Bouquet items={PEONY_ITEMS} palettes={sprayPalettes(palette)} viewBox="0 0 260 240" className={className} style={style} />
}

/**
 * Eucalyptus watercolor cascade spilling along a curve — the foliage of
 * Brume Bleue (top spill and bottom-left cluster).
 */
/** Painted eucalyptus cascade spilling down a curve. */
export function FoliageCascade({
  leaf = '#93A7BD',
  leafDeep = '#66768C',
  bud = '#BCCBD9',
  className,
  style,
}: MotifProps & { leaf?: string; leafDeep?: string; bud?: string }) {
  const palettes = {
    leaf: { light: bud, mid: leaf, dark: leafDeep, deep: leafDeep },
  }
  const items: FloraItem[] = [
    { k: 'spray', x: 110, y: 0, s: 1.2, r: 175, p: 'leaf', len: 230, n: 12, round: true, curve: 0.2 },
    { k: 'spray', x: 150, y: 10, s: 1, r: 200, p: 'leaf', len: 200, n: 10, curve: -0.2 },
    { k: 'spray', x: 70, y: 0, s: 0.9, r: 150, p: 'leaf', len: 180, n: 9, round: true },
    { k: 'berries', x: 120, y: 200, s: 1.4, r: 180, p: 'leaf' },
  ]
  return <Bouquet items={items} palettes={palettes} viewBox="0 0 220 300" className={className} style={style} />
}

/**
 * Purple clematis wreath — two dense arcs (top-left and bottom-right) that
 * wrap around a hero name (Lilas).
 */
function wreathArc(from: number, to: number): FloraItem[] {
  const items: FloraItem[] = []
  for (let i = 0; i <= 8; i += 1) {
    const deg = from + ((to - from) * i) / 8
    const rad = (deg * Math.PI) / 180
    const x = 160 + Math.cos(rad) * 110
    const y = 150 + Math.sin(rad) * 100
    items.push({ k: 'leaf', x, y, s: 0.5, r: deg + 90 + (i % 2 ? 40 : -140), p: 'leaf' })
    items.push(i % 3 === 0 ? { k: 'clematis', x, y, s: 0.42, r: deg, p: 'flower' } : i % 3 === 1 ? { k: 'rose', x, y, s: 0.34, r: deg, p: 'flower' } : { k: 'forget', x, y, s: 1, p: 'flower' })
  }
  return items
}

const WREATH_ITEMS: FloraItem[] = [...wreathArc(150, 300), ...wreathArc(-30, 120)]

/** Painted open floral wreath (clematis, roses, fillers, leaves). */
export function FloralWreath({
  palette = LILAC,
  className,
  style,
}: MotifProps & { palette?: SprayPalette }) {
  return <Bouquet items={WREATH_ITEMS} palettes={sprayPalettes(palette)} viewBox="0 0 320 300" className={className} style={style} />
}

/**
 * Burgundy rose cluster with gold leaves and sparkles (Grenat corners).
 */
const ROSE_ITEMS: FloraItem[] = [
  { k: 'spray', x: 30, y: 30, s: 1, r: 130, p: 'leaf', len: 140, n: 8 },
  { k: 'spray', x: 140, y: 20, s: 0.9, r: 100, p: 'leaf', len: 120, n: 7 },
  { k: 'rose', x: 70, y: 70, s: 1.05, r: -10, p: 'flower' },
  { k: 'rose', x: 150, y: 50, s: 0.7, r: 20, p: 'flower' },
  { k: 'bud', x: 40, y: 150, s: 0.8, r: 190, p: 'flower' },
  { k: 'bud', x: 100, y: 150, s: 0.7, r: 160, p: 'flower' },
  { k: 'berries', x: 200, y: 90, s: 1.3, r: 120, p: 'flower' },
]

/** Painted rose cluster with leaves, buds and berries. */
export function RoseCluster({
  palette = GRENAT,
  className,
  style,
}: MotifProps & { palette?: SprayPalette }) {
  return <Bouquet items={ROSE_ITEMS} palettes={sprayPalettes(palette)} viewBox="0 0 240 210" className={className} style={style} />
}

/** Scattered four-point sparkles (Grenat). */
export function Sparkles({
  color = '#D9B568',
  className,
  style,
}: MotifProps & { color?: string }) {
  const stars: Array<[number, number, number, number]> = [
    [30, 44, 11, 0.9],
    [62, 24, 6.5, 0.8],
    [16, 82, 5.5, 0.7],
    [176, 36, 9, 0.85],
    [204, 62, 5.5, 0.7],
    [148, 66, 5, 0.6],
    [204, 172, 10, 0.85],
    [176, 196, 6, 0.7],
    [42, 176, 8.5, 0.8],
    [70, 196, 5, 0.65],
  ]
  return (
    <svg viewBox="0 0 220 220" className={className} style={style} aria-hidden="true">
      {stars.map(([x, y, s, o]) => (
        <path
          key={`${x}-${y}`}
          d="M 0 -10 C 1.6 -3.2 3.2 -1.6 10 0 C 3.2 1.6 1.6 3.2 0 10 C -1.6 3.2 -3.2 1.6 -10 0 C -3.2 -1.6 -1.6 -3.2 0 -10 Z"
          fill={color}
          opacity={o}
          transform={`translate(${x} ${y}) scale(${s / 10})`}
        />
      ))}
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Ceremonial motifs (Mandala)                                         */
/* ------------------------------------------------------------------ */

/** Intricate gold rosette flanking the edges of Mandala. */
export function MandalaRosette({
  color = '#E8C06A',
  className,
  style,
}: MotifProps & { color?: string }) {
  const outer = Array.from({ length: 20 }, (_, k) => (k * 360) / 20)
  const mid = Array.from({ length: 16 }, (_, k) => 11 + (k * 360) / 16)
  const inner = Array.from({ length: 12 }, (_, k) => (k * 360) / 12)
  const rays = Array.from({ length: 40 }, (_, k) => (k * 360) / 40)
  return (
    <svg viewBox="0 0 200 200" className={className} style={style} aria-hidden="true">
      <g fill="none" stroke={color} strokeWidth="1.4" opacity="0.8">
        <circle cx="100" cy="100" r="94" />
        <circle cx="100" cy="100" r="82" />
        <circle cx="100" cy="100" r="58" />
        <circle cx="100" cy="100" r="46" />
        <circle cx="100" cy="100" r="34" />
      </g>
      <g stroke={color} strokeWidth="0.9" opacity="0.55">
        {rays.map((a) => (
          <line
            key={`r${a}`}
            x1="0"
            y1="-48"
            x2="0"
            y2="-57"
            transform={`translate(100 100) rotate(${a})`}
          />
        ))}
      </g>
      <g fill={color}>
        {outer.map((a) => (
          <path
            key={`o${a}`}
            d="M 0 0 C -6 -13 -6 -30 0 -46 C 6 -30 6 -13 0 0 Z"
            opacity="0.88"
            transform={`translate(100 100) rotate(${a}) translate(0 -52)`}
          />
        ))}
        {mid.map((a) => (
          <ellipse
            key={`m${a}`}
            cx="0"
            cy="-30"
            rx="6.5"
            ry="13"
            opacity="0.75"
            transform={`translate(100 100) rotate(${a})`}
          />
        ))}
        {inner.map((a) => (
          <ellipse
            key={`i${a}`}
            cx="0"
            cy="-16"
            rx="5"
            ry="9"
            opacity="0.85"
            transform={`translate(100 100) rotate(${a})`}
          />
        ))}
        <circle cx="100" cy="100" r="10" opacity="0.95" />
      </g>
    </svg>
  )
}

/** Gold toran — chains of buds and leaves hanging from the top edge. */
export function HangingOrnaments({
  color = '#E8C06A',
  className,
  style,
}: MotifProps & { color?: string }) {
  const drops = [46, 118, 190, 262, 334, 406, 478, 550]
  return (
    <svg
      viewBox="0 0 600 84"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <rect x="0" y="2" width="600" height="3" fill={color} opacity="0.9" />
      <g fill={color}>
        {drops.map((x) => (
          <g key={x} opacity="0.95">
            <rect x={x - 1.6} y="5" width="3.2" height="14" />
            <path d={`M ${x - 12} 19 L ${x + 12} 19 L ${x} 34 Z`} opacity="0.9" />
            <rect x={x - 1.6} y="34" width="3.2" height="12" />
            <path
              d={`M ${x} 46 C ${x - 12} 55 ${x - 17} 68 ${x} 84 C ${x + 17} 68 ${x + 12} 55 ${x} 46 Z`}
              opacity="0.95"
            />
            <circle cx={x} cy="62" r="3.2" fill="#7C1F2B" opacity="0.65" />
          </g>
        ))}
        {[82, 154, 226, 298, 370, 442, 514].map((x) => (
          <g key={`s${x}`} opacity="0.85">
            <rect x={x - 1.2} y="5" width="2.4" height="10" />
            <path
              d={`M ${x} 15 C ${x - 9} 21 ${x - 12} 31 ${x} 42 C ${x + 12} 31 ${x + 9} 21 ${x} 15 Z`}
            />
          </g>
        ))}
      </g>
    </svg>
  )
}

/**
 * Flat groom-and-bride illustration in the naive style of the Romance
 * reference (navy suit, blush gown) — decorative accent only.
 */
export function CoupleIllustration({ className, style }: MotifProps) {
  return (
    <svg viewBox="0 0 220 260" className={className} style={style} aria-hidden="true">
      {/* groom */}
      <g>
        <rect x="74" y="166" width="17" height="74" rx="7" fill="#2E3A54" />
        <rect x="95" y="166" width="17" height="74" rx="7" fill="#2E3A54" />
        <ellipse cx="82" cy="245" rx="13" ry="7" fill="#1F2940" />
        <ellipse cx="104" cy="245" rx="13" ry="7" fill="#1F2940" />
        <path
          d="M 68 84 C 68 70 78 62 88 62 L 98 62 C 110 62 118 70 118 84 L 121 176 L 65 176 Z"
          fill="#33415E"
        />
        <path d="M 86 62 L 96 62 L 98 96 L 84 96 Z" fill="#F4F1EA" />
        <rect x="59" y="88" width="12" height="72" rx="6" fill="#33415E" />
        <rect x="115" y="88" width="12" height="72" rx="6" fill="#33415E" />
        <circle cx="65" cy="163" r="6" fill="#F2C9A8" />
        <circle cx="121" cy="163" r="6" fill="#F2C9A8" />
        <circle cx="92" cy="40" r="17" fill="#F2C9A8" />
        <path
          d="M 75 40 C 74 22 83 15 93 15 C 105 15 111 23 110 39 C 103 30 83 30 75 40 Z"
          fill="#3A2E28"
        />
      </g>
      {/* bride */}
      <g>
        <path d="M 124 78 L 153 78 L 177 238 L 99 238 Z" fill="#E9AEBB" />
        <path d="M 124 78 L 153 78 L 157 132 L 120 132 Z" fill="#F2C4CC" />
        <rect x="111" y="90" width="11" height="54" rx="5.5" fill="#F2C9A8" />
        <rect x="153" y="90" width="11" height="54" rx="5.5" fill="#F2C9A8" />
        <circle cx="138" cy="46" r="16" fill="#F2C9A8" />
        <path
          d="M 122 48 C 121 28 129 21 139 21 C 151 21 157 30 155 48 C 151 58 152 70 151 78 L 127 78 C 126 68 127 56 122 48 Z"
          fill="#4A3226"
        />
      </g>
    </svg>
  )
}

/** Gold line-art cradle with a star on the hood (Mandala). */
export function CradleIcon({
  color = '#E8C06A',
  className,
  style,
}: MotifProps & { color?: string }) {
  return (
    <svg
      viewBox="0 0 130 110"
      className={className}
      style={style}
      aria-hidden="true"
      fill="none"
      stroke={color}
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M 26 52 C 26 18 104 18 104 52" />
      <path d="M 18 56 C 18 90 112 90 112 56" />
      <path d="M 12 56 H 118" />
      <path d="M 33 58 V 72" strokeWidth="2.1" opacity="0.9" />
      <path d="M 48 58 V 78" strokeWidth="2.1" opacity="0.9" />
      <path d="M 65 58 V 81" strokeWidth="2.1" opacity="0.9" />
      <path d="M 82 58 V 78" strokeWidth="2.1" opacity="0.9" />
      <path d="M 97 58 V 72" strokeWidth="2.1" opacity="0.9" />
      <path d="M 30 84 C 48 98 82 98 100 84" opacity="0.9" />
      <path d="M 65 92 V 100" />
      <path
        d="M 65 8 L 67.6 14.4 L 74.5 14.9 L 69.3 19.4 L 70.9 26.1 L 65 22.5 L 59.1 26.1 L 60.7 19.4 L 55.5 14.9 L 62.4 14.4 Z"
        fill={color}
        stroke="none"
      />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Paper effects                                                       */
/* ------------------------------------------------------------------ */

/** Tone-on-tone damask pattern (Mandala paper). */
export function DamaskPattern({
  color = '#E8C06A',
  opacity = 0.16,
  className,
  style,
}: MotifProps & { color?: string; opacity?: number }) {
  const rawId = useId()
  const id = `damask-${rawId.replace(/[^a-zA-Z0-9_-]/gu, '')}`
  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full ${className ?? ''}`}
      style={style}
      aria-hidden="true"
    >
      <defs>
        <pattern id={id} width="88" height="88" patternUnits="userSpaceOnUse">
          <path
            d="M 44 8 C 50 22 62 34 76 44 C 62 54 50 66 44 80 C 38 66 26 54 12 44 C 26 34 38 22 44 8 Z"
            fill="none"
            stroke={color}
            strokeWidth="1.2"
          />
          <circle cx="44" cy="44" r="3.4" fill={color} />
          <circle cx="0" cy="0" r="2.4" fill={color} />
          <circle cx="88" cy="0" r="2.4" fill={color} />
          <circle cx="0" cy="88" r="2.4" fill={color} />
          <circle cx="88" cy="88" r="2.4" fill={color} />
          <path
            d="M 44 26 C 46 32 48 34 44 38 C 40 34 42 32 44 26 Z"
            fill={color}
            opacity="0.7"
          />
          <path
            d="M 44 50 C 46 56 48 58 44 62 C 40 58 42 56 44 50 Z"
            fill={color}
            opacity="0.7"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} opacity={opacity} />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Text paths                                                          */
/* ------------------------------------------------------------------ */

/**
 * Caps text following the crown of the arch (Arche Pivoine header).
 */
export function ArchText({
  text,
  color = '#3A4A6B',
  fontSize = 16.5,
  fontFamily = "'Montserrat', 'Inter', sans-serif",
  letterSpacing = 3.4,
  className,
  style,
}: MotifProps & { text: string; color?: string; fontSize?: number; fontFamily?: string; letterSpacing?: number }) {
  const rawId = useId()
  const id = `arch-${rawId.replace(/[^a-zA-Z0-9_-]/gu, '')}`
  return (
    <svg viewBox="0 0 400 150" className={className} style={style} aria-hidden="true">
      <defs>
        <path id={id} d="M 34 142 A 200 200 0 0 1 366 142" fill="none" />
      </defs>
      <text
        fill={color}
        fontSize={fontSize}
        fontWeight="500"
        letterSpacing={letterSpacing}
        textAnchor="middle"
        fontFamily={fontFamily}
      >
        <textPath href={`#${id}`} startOffset="50%">
          {text}
        </textPath>
      </text>
    </svg>
  )
}
