/**
 * Decorative SVG kit for wedding templates: watercolor flower sprays, gold
 * line-art roses, flourish rules, arch/hex frames and paper grain.
 *
 * Everything is inline SVG (no external images) so it renders identically on
 * the page and in exported pictures, and colours are parameterised so each
 * template keeps its own identity. Gradient ids come from `useId` — several
 * ornaments can appear on one paper without id collisions.
 */
/* oxlint-disable react/only-export-components -- pure helpers + decorative primitives */
import { useId } from 'react'
import type { CSSProperties } from 'react'

import { EngravedBouquet } from './engravedFlora.tsx'
import type { EngravedItem } from './engravedFlora.tsx'
import { Bouquet, sprayPalettes } from './paintedFlora.tsx'
import type { FloraItem } from './paintedFlora.tsx'

export interface SprayPalette {
  petal: string
  petalDeep: string
  petalLight: string
  leaf: string
  leafDeep: string
  accent: string
}

export const SAGE: SprayPalette = {
  petal: '#A8B888',
  petalDeep: '#7E9060',
  petalLight: '#DCE5C6',
  leaf: '#8A9A6B',
  leafDeep: '#5E6B47',
  accent: '#D9B25E',
}

export const BLUSH: SprayPalette = {
  petal: '#E2A08C',
  petalDeep: '#B4633F',
  petalLight: '#F5D9CC',
  leaf: '#8A9A6B',
  leafDeep: '#5E6B47',
  accent: '#D98A5F',
}

export const ROSE: SprayPalette = {
  petal: '#C98BA0',
  petalDeep: '#9E5A72',
  petalLight: '#EFD5DC',
  leaf: '#93A57C',
  leafDeep: '#68784F',
  accent: '#D9B25E',
}

/**
 * Premium blue bloom palette — a deeper sapphire with an icy petal-light and
 * a cool eucalyptus leaf. Richer and more jewel-like than AZURE (which stays
 * unchanged for backwards compatibility with the reference reproductions).
 */
export const PREMIUM_AZURE: SprayPalette = {
  petal: '#5D7FBE',
  petalDeep: '#2C4178',
  petalLight: '#E3EBFA',
  leaf: '#7C9084',
  leafDeep: '#4E5F55',
  accent: '#CBA24E',
}

/**
 * Subtle premium motif for the photo cover: a faint diagonal trellis of fine
 * hairlines with a tiny diamond at each crossing, printed like a silk
 * book-cloth. Kept very light (it sits over a photograph) so it reads as an
 * expensive texture rather than a pattern. Renders in the accent colour at
 * low alpha.
 */
export function CoverSheen({
  color = '#E2C27C',
  opacity = 0.16,
  className,
  style,
}: {
  color?: string
  opacity?: number
  className?: string
  style?: CSSProperties
}) {
  const id = useId().replace(/[^a-zA-Z0-9-]/g, '')
  const cell = 26
  return (
    <svg
      viewBox="0 0 210 297"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <defs>
        <pattern id={`cs-${id}`} width={cell} height={cell} patternUnits="userSpaceOnUse">
          <g fill="none" stroke={color} strokeWidth="0.5" opacity="0.55">
            <path d={`M 0 ${cell} L ${cell} 0`} />
            <path d={`M 0 0 L ${cell} ${cell}`} />
          </g>
          <path
            d={`M ${cell / 2} ${cell / 2 - 2} L ${cell / 2 + 2} ${cell / 2} L ${cell / 2} ${cell / 2 + 2} L ${cell / 2 - 2} ${cell / 2} Z`}
            fill={color}
            opacity="0.8"
          />
        </pattern>
      </defs>
      <rect width="210" height="297" fill={`url(#cs-${id})`} opacity={opacity} />
    </svg>
  )
}


/**
 * Gold line-art rose corner (top-left origin; mirror/rotate for other
 * corners) — scalloped roses, outlined leaves and sprig dots.
 */
const GOLD_ROSE_CORNER: EngravedItem[] = [
  { k: 'stem', d: 'M 18 30 C 60 22, 96 30, 122 52 C 150 76, 168 104, 178 132' },
  { k: 'leaf', x: 100, y: 36, s: 1.3, r: 70 },
  { k: 'leaf', x: 158, y: 92, s: 1.2, r: 120 },
  { k: 'leaf', x: 34, y: 92, s: 1.2, r: 200 },
  { k: 'rose', x: 52, y: 48, s: 1.25, r: -10 },
  { k: 'rose', x: 132, y: 66, s: 0.85, r: 20 },
  { k: 'lavender', x: 182, y: 150, s: 0.7, r: 150, len: 60 },
]

/** Engraved gold rose spray for a top-left corner (mirror/rotate for the
 * others): wrapped rose heads, serrated leaves, a lavender sprig. */
export function GoldRoseCorner({
  className,
  style,
  strokeWidth = 2.1,
}: {
  className?: string
  style?: CSSProperties
  strokeWidth?: number
}) {
  return (
    <EngravedBouquet
      items={GOLD_ROSE_CORNER}
      viewBox="0 0 240 200"
      className={className}
      style={style}
      strokeWidth={Math.max(0.9, strokeWidth * 0.55)}
    />
  )
}

/**
 * Watercolor flower spray (bottom-left anchor, growing to the upper right).
 * Layered translucent petals and leaves give the painted look.
 */
const SPRAY_ITEMS: FloraItem[] = [
  { k: 'spray', x: 30, y: 210, s: 1, r: 40, p: 'leaf', len: 150, n: 8 },
  { k: 'spray', x: 60, y: 215, s: 0.85, r: 70, p: 'leaf', len: 130, n: 7 },
  { k: 'spray', x: 20, y: 200, s: 0.8, r: 10, p: 'leaf', len: 110, n: 6 },
  { k: 'rose', x: 92, y: 140, s: 0.95, r: -10, p: 'flower' },
  { k: 'anemone', x: 156, y: 92, s: 0.72, r: 12, p: 'flower' },
  { k: 'rose', x: 52, y: 176, s: 0.6, r: 20, p: 'flower' },
  { k: 'forget', x: 200, y: 54, s: 1, p: 'flower' },
  { k: 'forget', x: 128, y: 178, s: 0.9, p: 'flower' },
  { k: 'bud', x: 214, y: 30, s: 0.7, r: 40, p: 'flower' },
  { k: 'bud', x: 128, y: 70, s: 0.6, r: 20, p: 'flower' },
]

/**
 * Painted flower spray (bottom-left anchor, growing to the upper right):
 * layered roses and an anemone over leafy stems, in the template's colours.
 */
export function WatercolorSpray({
  palette,
  className,
  style,
}: {
  palette: SprayPalette
  className?: string
  style?: CSSProperties
}) {
  return (
    <Bouquet items={SPRAY_ITEMS} palettes={sprayPalettes(palette)} viewBox="0 0 260 220" className={className} style={style} />
  )
}

/** Divider: tapered lines, curls and a centre diamond. */
export function FlourishRule({
  color = '#A67C3D',
  className,
  style,
}: {
  color?: string
  className?: string
  style?: CSSProperties
}) {
  return (
    <svg viewBox="0 0 220 24" className={className} style={style} aria-hidden="true" fill={color}>
      <rect x="6" y="11.4" width="72" height="1.2" opacity="0.55" />
      <rect x="142" y="11.4" width="72" height="1.2" opacity="0.55" />
      <path d="M 84 12 C 90 5 98 6 102 11" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 136 12 C 130 5 122 6 118 11" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 110 4 L 116 12 L 110 20 L 104 12 Z" />
      <circle cx="94" cy="12" r="1.6" />
      <circle cx="126" cy="12" r="1.6" />
    </svg>
  )
}

/** Art-déco corner fan (radiating lines + arcs). */
export function DecoCorner({
  color = '#C9A24A',
  className,
  style,
}: {
  color?: string
  className?: string
  style?: CSSProperties
}) {
  return (
    <svg viewBox="0 0 120 120" className={className} style={style} aria-hidden="true">
      <g fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" opacity="0.7">
        {Array.from({ length: 7 }, (_, k) => {
          const a = (Math.PI / 2) * (k / 6)
          return <line key={k} x1="6" y1="114" x2={6 + 104 * Math.cos(a)} y2={114 - 104 * Math.sin(a)} />
        })}
        <path d="M 34 114 A 28 28 0 0 0 6 86" />
        <path d="M 60 114 A 54 54 0 0 0 6 60" />
        <path d="M 86 114 A 80 80 0 0 0 6 34" />
        <circle cx="6" cy="114" r="3" fill={color} stroke="none" />
      </g>
    </svg>
  )
}

/**
 * Thin arch outline behind the content (rounded-top rectangle).
 * `preserveAspectRatio="none"` stretches to the paper; non-scaling stroke
 * keeps the hairline even.
 */
export function ArchFrame({
  color = '#C9A24A',
  opacity = 0.5,
  className,
  style,
}: {
  color?: string
  opacity?: number
  className?: string
  style?: CSSProperties
}) {
  return (
    <svg
      viewBox="0 0 200 300"
      preserveAspectRatio="none"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path
        d="M 3 297 V 102 A 97 97 0 0 1 197 102 V 297"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        opacity={opacity}
      />
    </svg>
  )
}

/** Thin flat-top hexagon outline (ref: gold hexagon frames). */
export function HexFrame({
  color = '#C9A24A',
  opacity = 0.55,
  className,
  style,
}: {
  color?: string
  opacity?: number
  className?: string
  style?: CSSProperties
}) {
  return (
    <svg
      viewBox="0 0 100 140"
      preserveAspectRatio="none"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <polygon
        points="50,4 95,37 95,103 50,136 5,103 5,37"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        opacity={opacity}
      />
    </svg>
  )
}

/** Scattered star specks for night-sky papers. */
export function StarField({
  color = '#F4EEDF',
  className,
  style,
}: {
  color?: string
  className?: string
  style?: CSSProperties
}) {
  const stars: Array<[number, number, number, number]> = [
    [8, 12, 1.6, 0.7], [18, 32, 1, 0.45], [30, 8, 1.2, 0.55], [42, 22, 0.9, 0.4],
    [55, 6, 1.5, 0.65], [66, 18, 1, 0.5], [78, 9, 1.3, 0.6], [90, 26, 1, 0.4],
    [12, 52, 1, 0.4], [24, 68, 1.4, 0.55], [38, 82, 1, 0.35], [52, 74, 1.2, 0.5],
    [64, 88, 1, 0.4], [76, 66, 1.5, 0.6], [88, 80, 1, 0.45], [94, 52, 1.2, 0.5],
    [6, 90, 1, 0.35], [46, 46, 1, 0.4], [70, 40, 1.1, 0.45], [86, 94, 1, 0.4],
    [34, 94, 1.3, 0.5], [16, 96, 1, 0.35],
  ]
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={className} style={style} aria-hidden="true">
      {stars.map(([cx, cy, r, opacity], index) => (
        <circle key={index} cx={cx} cy={cy} r={r * 0.28} fill={color} opacity={opacity} />
      ))}
    </svg>
  )
}

const NOISE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140">' +
  '<filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>' +
  '<feColorMatrix type="saturate" values="0"/></filter>' +
  '<rect width="140" height="140" filter="url(#n)" opacity="0.55"/></svg>'

const NOISE_URL = `url("data:image/svg+xml,${encodeURIComponent(NOISE_SVG)}")`

/** Subtle paper grain over the whole sheet. */
export function PaperGrain({
  opacity = 0.05,
  blend = 'multiply',
}: {
  opacity?: number
  blend?: CSSProperties['mixBlendMode']
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{ backgroundImage: NOISE_URL, opacity, mixBlendMode: blend }}
    />
  )
}
