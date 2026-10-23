/**
 * Engraved gold botanicals — the sketch-line roses of « Roses d'Or »
 * (`very_beautiful template/Screenshot 2026-10-08 022102.png`): cupped
 * three-quarter rose heads with rolled lips and burin hatching over a faint
 * sepia wash, serrated leaves with veins, lavender sprigs and an open lily,
 * all in a single gold-foil stroke.
 */
import { useId } from 'react'
import type { CSSProperties, ReactNode } from 'react'

/**
 * Engraver's hatching: `count` parallel strokes whose start points step
 * from (x1, y1) to (x2, y2), each `len` long at `angle` degrees, the
 * middle strokes longest so the shade swells and fades like a burin cut.
 */
function hatch(x1: number, y1: number, x2: number, y2: number, angle: number, len: number, count: number) {
  const a = (angle * Math.PI) / 180
  const out: string[] = []
  for (let i = 0; i < count; i += 1) {
    const t = count === 1 ? 0.5 : i / (count - 1)
    const x = x1 + (x2 - x1) * t
    const y = y1 + (y2 - y1) * t
    const l = len * (0.45 + 0.55 * Math.sin(Math.PI * t))
    out.push(`M ${x.toFixed(1)} ${y.toFixed(1)} l ${(Math.cos(a) * l).toFixed(1)} ${(Math.sin(a) * l).toFixed(1)}`)
  }
  return out.join(' ')
}

/* Silhouette of the cup, for the sepia wash under the line work. */
const ROSE_SILHOUETTE =
  'M -26 -16 C -14 -27, 16 -27, 30 -15 C 40 -5, 38 13, 30 20 C 19 30, -19 30, -31 19 C -40 9, -38 -8, -26 -16 Z'

/**
 * Rose head in three-quarter view, ~80 × 56 units centred on (0,0): an oval
 * opening holding a folded spiral heart, two petals wrapping it, broad outer
 * petals forming the cup with their rims rolled outward, and hatching that
 * follows each petal into its shadow.
 */
function RoseHead({ wash }: { wash: string }) {
  return (
    <g>
      <path d={ROSE_SILHOUETTE} fill={wash} stroke="none" />
      {/* the heart: a squashed spiral of folded petals inside the opening */}
      <path d="M -3 -13 C -3 -16, 4 -16, 5 -13 C 6 -10, -1 -9, -5 -11 C -9 -13, -7 -18, 0 -19 C 8 -20, 13 -16, 12 -11" />
      <path d="M -10 -12 C -12 -17, -6 -21, 2 -22 C 10 -22, 16 -18, 16 -13" />
      {/* the opening: back petal rim with its rolled lip */}
      <path d="M -18 -12 C -16 -22, 14 -25, 19 -13" />
      <path d="M -18 -12 C -21 -13, -22 -17, -18 -18 C -16 -18, -15 -16, -16 -15" />
      <path d="M 19 -13 C 22 -15, 23 -18, 20 -19" />
      {/* inner petals wrapping the heart */}
      <path d="M -18 -12 C -24 -3, -20 8, -8 12" />
      <path d="M 19 -13 C 25 -4, 21 8, 8 12" />
      <path d="M -14 -6 C -8 -1, 8 -1, 15 -7" />
      <path d="M -14 -6 C -13 -9, -9 -10, -7 -7" />
      <path d="M -8 12 C -3 15, 3 15, 8 12" />
      {/* outer petals forming the cup, rims turned back */}
      <path d="M -18 -12 C -31 -14, -39 -1, -34 11 C -29 22, -14 27, 0 26" />
      <path d="M -24 -14 C -29 -19, -23 -24, -18 -20 C -16 -18, -18 -16, -20 -17" />
      <path d="M 19 -13 C 32 -16, 41 -2, 35 10 C 30 21, 15 27, 0 26" />
      <path d="M 27 -15 C 32 -19, 36 -14, 33 -11" />
      <path d="M -31 15 C -24 31, 23 32, 31 15" />
      <path d="M -31 15 C -34 18, -32 22, -28 21" />
      <path d="M 31 15 C 34 17, 33 21, 29 21" />
      {/* engraved shade, following each petal */}
      <g strokeWidth="0.45" opacity="0.9">
        <path d={hatch(6, -12, 15, -11, 95, 4, 6)} />
        <path d={hatch(-31, -7, -25, 14, 20, 6, 9)} />
        <path d={hatch(33, -6, 27, 15, 160, 6, 9)} />
        <path d={hatch(-7, 15, 7, 15, 90, 6, 7)} />
        <path d={hatch(-20, -2, -14, 9, 15, 4, 6)} />
        <path d={hatch(21, -3, 15, 9, 165, 4, 6)} />
        <path d={hatch(-22, 22, 20, 24, 75, 3.5, 12)} />
      </g>
      <g strokeWidth="0.3" opacity="0.6">
        <path d={hatch(-12, -4, 12, -4, 80, 3, 9)} />
        <path d={hatch(-16, -19, -8, -21, 60, 2.5, 4)} />
      </g>
    </g>
  )
}

/** Serrated leaf with midrib, paired veins and shading on one half;
 * base at (0,0) pointing up. */
function Leaf({ wash }: { wash: string }) {
  const outline =
    'M 0 0 C -9 -6, -14 -18, -12 -28 L -10 -27 L -10 -32 L -7 -31 L -6 -36 L -3 -35 L -1 -41 C 3 -36, 6 -31, 7 -26 L 5 -25 L 8 -20 L 5 -19 L 7 -13 L 4 -12 C 4 -7, 2 -3, 0 0 Z'
  return (
    <g>
      <path d={outline} fill={wash} stroke="none" opacity="0.45" />
      <path d={outline} />
      <path d="M 0 -1 C -1 -13, -2 -27, -1 -39" strokeWidth="0.6" />
      <path
        d="M -0.5 -8 Q -5 -11 -8 -15 M -1 -15 Q -6 -19 -9 -23 M -1 -22 Q -5 -27 -7 -30 M -1 -29 Q -3 -33 -4 -35 M 0 -10 Q 3 -13 5 -17 M 0 -17 Q 3 -20 5 -23 M -0.5 -24 Q 2 -27 4 -29"
        strokeWidth="0.4"
      />
      <g strokeWidth="0.3" opacity="0.7">
        <path d="M 1 -6 L 3 -8 M 1.5 -12 L 4 -14 M 1.5 -19 L 4 -21 M 1 -26 L 3 -28 M 0.5 -32 L 2 -34" />
      </g>
    </g>
  )
}

function Lavender({ length = 60 }: { length?: number }) {
  const buds: ReactNode[] = []
  for (let i = 0; i < 9; i += 1) {
    const y = -length * 0.45 - i * (length * 0.06)
    const side = i % 2 === 0 ? -1 : 1
    buds.push(<ellipse key={i} cx={side * 2.4} cy={y} rx="1.8" ry="3" transform={`rotate(${side * 25} ${side * 2.4} ${y})`} />)
  }
  return (
    <g>
      <path d={`M 0 0 C 1 ${-length * 0.4}, -1 ${-length * 0.7}, 0 ${-length}`} />
      <g strokeWidth="0.6">{buds}</g>
    </g>
  )
}

function Lily() {
  return (
    <g>
      <path d="M 0 0 C -6 -10, -20 -18, -30 -16 C -22 -10, -12 -4, 0 0 Z" />
      <path d="M 0 0 C 6 -10, 20 -18, 30 -16 C 22 -10, 12 -4, 0 0 Z" />
      <path d="M 0 0 C -4 -14, -2 -30, 4 -38 C 8 -28, 6 -12, 0 0 Z" />
      <path d="M 0 0 C -10 -4, -26 -2, -32 6 C -20 6, -8 4, 0 0 Z" />
      <path d="M 0 -4 L -6 -22 M 0 -4 L 4 -24 M 0 -4 L 10 -20" strokeWidth="0.5" />
      <circle cx="-6" cy="-23" r="1" />
      <circle cx="4" cy="-25" r="1" />
      <circle cx="10" cy="-21" r="1" />
    </g>
  )
}

export type EngravedItem =
  | { k: 'rose' | 'leaf' | 'lily'; x: number; y: number; s: number; r?: number }
  | { k: 'lavender'; x: number; y: number; s: number; r?: number; len?: number }
  | { k: 'stem'; d: string }

export function EngravedBouquet({
  items,
  viewBox,
  className,
  style,
  strokeWidth = 1.1,
  ink,
}: {
  items: EngravedItem[]
  viewBox: string
  className?: string
  style?: CSSProperties
  strokeWidth?: number
  /** Plain line-art colour instead of the gold foil (and no sepia wash). */
  ink?: string
}) {
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox={viewBox} className={className} style={style} aria-hidden="true" overflow="visible">
      <defs>
        <linearGradient id={`${id}-foil`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9A7330" />
          <stop offset="0.3" stopColor="#D8B46A" />
          <stop offset="0.55" stopColor="#A67E36" />
          <stop offset="0.8" stopColor="#DDBD7A" />
          <stop offset="1" stopColor="#8E6A2A" />
        </linearGradient>
        {/* Faint sepia wash under the line work, darker in the hollows. */}
        <radialGradient id={`${id}-wash`} cx="0.5" cy="0.5" r="0.6">
          <stop offset="0" stopColor="#B88E4E" stopOpacity="0.32" />
          <stop offset="0.6" stopColor="#D4B27A" stopOpacity="0.28" />
          <stop offset="1" stopColor="#E6CFA2" stopOpacity="0.12" />
        </radialGradient>
      </defs>
      <g fill="none" stroke={ink ?? `url(#${id}-foil)`} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        {items.map((item, index) => {
          if (item.k === 'stem') return <path key={index} d={item.d} />
          const body =
            item.k === 'lavender' ? (
              <Lavender length={item.len} />
            ) : item.k === 'rose' ? (
              <RoseHead wash={ink ? 'none' : `url(#${id}-wash)`} />
            ) : item.k === 'leaf' ? (
              <Leaf wash={ink ? 'none' : `url(#${id}-wash)`} />
            ) : (
              <Lily />
            )
          return (
            <g key={index} transform={`translate(${item.x} ${item.y}) rotate(${item.r ?? 0}) scale(${item.s})`} strokeWidth={strokeWidth / item.s}>
              {body}
            </g>
          )
        })}
      </g>
    </svg>
  )
}
