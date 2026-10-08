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

/** Gold foil gradient stops, shared by the line-art ornaments. */
const GOLD_STOPS: Array<[number, string]> = [
  [0, '#B0873C'],
  [0.45, '#E7CE8E'],
  [0.8, '#C9A24A'],
  [1, '#9C7531'],
]

function GoldDefs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
        {GOLD_STOPS.map(([offset, color]) => (
          <stop key={offset} offset={offset} stopColor={color} />
        ))}
      </linearGradient>
    </defs>
  )
}

/** Scalloped rose outline: `bumps` petal arcs around (cx, cy). */
function rosePath(cx: number, cy: number, r: number, bumps = 5, phase = -Math.PI / 2): string {
  const parts: string[] = []
  const step = (Math.PI * 2) / bumps
  for (let k = 0; k < bumps; k += 1) {
    const a0 = phase + k * step
    const a1 = a0 + step
    const x0 = cx + r * Math.cos(a0)
    const y0 = cy + r * Math.sin(a0)
    const x1 = cx + r * Math.cos(a1)
    const y1 = cy + r * Math.sin(a1)
    const am = (a0 + a1) / 2
    const xm = cx + r * 1.34 * Math.cos(am)
    const ym = cy + r * 1.34 * Math.sin(am)
    if (k === 0) parts.push(`M ${x0.toFixed(1)} ${y0.toFixed(1)}`)
    parts.push(`Q ${xm.toFixed(1)} ${ym.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`)
  }
  parts.push('Z')
  return parts.join(' ')
}

/**
 * Gold line-art rose corner (top-left origin; mirror/rotate for other
 * corners) — scalloped roses, outlined leaves and sprig dots.
 */
export function GoldRoseCorner({
  className,
  style,
  strokeWidth = 2.1,
}: {
  className?: string
  style?: CSSProperties
  strokeWidth?: number
}) {
  const id = useId().replace(/[^a-zA-Z0-9-]/g, '')
  return (
    <svg viewBox="0 0 240 200" className={className} style={style} aria-hidden="true">
      <GoldDefs id={`g-${id}`} />
      <g
        fill="none"
        stroke={`url(#g-${id})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={rosePath(78, 74, 30, 5)} />
        <path d={rosePath(78, 74, 18, 5, -Math.PI / 2 + 0.5)} />
        <path d="M 75 74 a 3 3 0 1 1 -3 3" />
        <path d={rosePath(168, 46, 18, 5)} />
        <path d={rosePath(168, 46, 10.5, 5, -Math.PI / 2 + 0.5)} />
        <path d="M 166 46 a 2 2 0 1 1 -2 2" />
        <path d={rosePath(150, 132, 13, 5)} />
        <path d="M 148 132 a 1.8 1.8 0 1 1 -1.8 1.8" />
        {/* leaves */}
        <path d="M 108 92 C 124 78 146 76 158 86 C 142 98 122 100 108 92 Z" />
        <path d="M 112 90 C 126 86 142 86 154 87" strokeWidth={strokeWidth * 0.7} />
        <path d="M 62 112 C 50 128 48 150 58 162 C 70 146 72 126 62 112 Z" />
        <path d="M 60 116 C 58 130 58 146 59 158" strokeWidth={strokeWidth * 0.7} />
        <path d="M 186 74 C 196 92 194 114 182 126 C 176 108 176 90 186 74 Z" />
        <path d="M 185 78 C 188 94 187 110 183 122" strokeWidth={strokeWidth * 0.7} />
        <path d="M 40 158 C 28 168 22 186 28 196" />
        <path d="M 118 44 C 132 30 152 26 166 32" />
        <path d="M 96 118 C 110 132 118 152 114 170" />
        {/* sprig dots */}
        <circle cx="30" cy="182" r="2.6" />
        <circle cx="42" cy="190" r="1.9" />
        <circle cx="122" cy="180" r="2.4" />
        <circle cx="196" cy="122" r="2.2" />
        <circle cx="132" cy="24" r="2.1" />
      </g>
    </svg>
  )
}

/**
 * Watercolor flower spray (bottom-left anchor, growing to the upper right).
 * Layered translucent petals and leaves give the painted look.
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
  const id = useId().replace(/[^a-zA-Z0-9-]/g, '')
  const petal = `p-${id}`
  const leaf = `l-${id}`
  return (
    <svg viewBox="0 0 260 220" className={className} style={style} aria-hidden="true">
      <defs>
        <radialGradient id={petal} cx="0.5" cy="0.28" r="0.85">
          <stop offset="0" stopColor={palette.petalLight} />
          <stop offset="0.55" stopColor={palette.petal} />
          <stop offset="1" stopColor={palette.petalDeep} />
        </radialGradient>
        <linearGradient id={leaf} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={palette.leaf} />
          <stop offset="1" stopColor={palette.leafDeep} />
        </linearGradient>
        <filter id={`b-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
      </defs>

      {/* soft watercolor bleed under the blooms */}
      <g filter={`url(#b-${id})`} opacity="0.22">
        <circle cx="108" cy="112" r="30" fill={palette.petal} />
        <circle cx="170" cy="88" r="23" fill={palette.petal} />
        <circle cx="66" cy="152" r="17" fill={palette.petalDeep} />
      </g>

      {/* stems */}
      <g
        fill="none"
        stroke={palette.leafDeep}
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.6"
      >
        <path d="M 14 214 C 38 176 62 146 104 122" />
        <path d="M 14 214 C 32 166 82 132 156 104" />
        <path d="M 18 212 C 48 184 92 168 138 154" />
      </g>

      {/* leaves */}
      <g>
        {(
          [
            [36, 188, -52, 0.95],
            [58, 158, -38, 0.85],
            [82, 146, -18, 1],
            [46, 168, -118, 0.8],
            [120, 118, -30, 0.9],
            [150, 112, -58, 0.78],
            [186, 92, -20, 0.88],
            [64, 128, -142, 0.72],
            [128, 152, 14, 0.82],
          ] as Array<[number, number, number, number]>
        ).map(([x, y, rot, s], index) => (
          <g key={`${x}-${y}`} transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={0.6 + (index % 3) * 0.12}>
            <path
              d="M 0 0 C 10 -13 30 -16 44 -5 C 30 8 10 10 0 0 Z"
              fill={`url(#${leaf})`}
            />
            <path
              d="M 3 0 C 15 -4 30 -5 41 -4"
              fill="none"
              stroke={palette.leafDeep}
              strokeWidth="1.4"
              opacity="0.55"
            />
          </g>
        ))}
      </g>

      {/* blooms */}
      <g>
        {(
          [
            [108, 112, 26, 6, 0],
            [170, 88, 20, 6, 14],
            [66, 152, 15, 5, 28],
          ] as Array<[number, number, number, number, number]>
        ).map(([cx, cy, r, petals, phase]) => (
          <g key={`f-${cx}`}>
            {Array.from({ length: petals }, (_, k) => {
              const angle = phase + (k * 360) / petals
              return (
                <ellipse
                  key={angle}
                  cx={0}
                  cy={-r * 0.62}
                  rx={r * 0.42}
                  ry={r * 0.72}
                  fill={`url(#${petal})`}
                  opacity={0.62 + ((k + phase) % 3) * 0.11}
                  transform={`translate(${cx} ${cy}) rotate(${angle})`}
                />
              )
            })}
            <circle cx={cx} cy={cy} r={r * 0.24} fill={palette.accent} opacity="0.9" />
            <circle cx={cx - r * 0.1} cy={cy - r * 0.12} r={r * 0.08} fill={palette.petalDeep} opacity="0.7" />
          </g>
        ))}
      </g>

      {/* berries */}
      <g fill={palette.accent} opacity="0.8">
        <circle cx="140" cy="126" r="4.2" />
        <circle cx="152" cy="140" r="3.2" />
        <circle cx="128" cy="148" r="3.6" />
        <circle cx="198" cy="112" r="3.2" />
        <circle cx="88" cy="126" r="3" />
      </g>
    </svg>
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
