/**
 * Engraved gold botanicals — the sketch-line roses of « Roses d'Or »
 * (`very_beautiful template/Screenshot 2026-10-08 022102.png`): wrapped
 * rose heads with curled petal lips and hatching, serrated leaves with
 * veins, lavender sprigs and an open lily, all in a single gold-foil stroke.
 */
import { useId } from 'react'
import type { CSSProperties, ReactNode } from 'react'

/** Rose head, ~80 units across, centred on (0,0). */
function RoseHead() {
  return (
    <g>
      {/* heart: a tight bud spiral */}
      <path d="M -5 -3 C -6 -11, 6 -13, 8 -5 C 10 3, 2 7, -4 5 C -9 3, -10 -5, -4 -9" />
      <path d="M -13 -1 C -15 -15, 1 -21, 13 -15 C 21 -9, 19 5, 9 9" />
      <path d="M -18 7 C -24 -7, -16 -23, 0 -25 C 14 -26, 26 -15, 24 -1" />
      {/* outer petals with turned lips */}
      <path d="M -20 9 C -34 5, -38 -13, -29 -23 C -23 -30, -12 -31, -6 -26" />
      <path d="M -29 -23 C -32 -19, -28 -16, -25 -18" />
      <path d="M 22 -1 C 34 -5, 41 9, 35 19 C 31 27, 20 29, 12 25" />
      <path d="M 35 19 C 39 20, 40 16, 37 14" />
      <path d="M -22 11 C -27 25, -12 35, 2 33 C 14 31, 22 25, 27 16" />
      <path d="M -8 -27 C -2 -36, 13 -36, 19 -28 C 23 -22, 21 -16, 17 -14" />
      <path d="M 19 -28 C 23 -31, 25 -27, 22 -25" />
      {/* hatching in the shadows of the petals */}
      <g strokeWidth="0.5" opacity="0.75">
        <path d="M -30 -10 L -26 -8 M -31 -5 L -26 -4 M -29 0 L -24 1" />
        <path d="M 28 6 L 32 4 M 27 11 L 32 10 M 25 16 L 29 16" />
        <path d="M -10 28 L -8 24 M -4 30 L -3 26 M 2 30 L 2 26" />
        <path d="M 2 -31 L 3 -27 M 8 -31 L 8 -27" />
      </g>
    </g>
  )
}

/** Serrated leaf with midrib and veins, base at (0,0) pointing up. */
function Leaf() {
  return (
    <g>
      <path d="M 0 0 C -10 -8, -14 -22, -10 -34 L -8 -31 L -7 -36 L -4 -33 L -2 -40 L 0 -36 C 6 -28, 10 -14, 0 0 Z" />
      <path d="M 0 -2 C -2 -14, -3 -26, -2 -38" strokeWidth="0.6" />
      <path d="M -1 -10 L -7 -14 M -1 -18 L -8 -23 M -2 -26 L -7 -30 M 0 -12 L 4 -16 M -1 -20 L 4 -25" strokeWidth="0.45" />
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
}: {
  items: EngravedItem[]
  viewBox: string
  className?: string
  style?: CSSProperties
  strokeWidth?: number
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
      </defs>
      <g fill="none" stroke={`url(#${id}-foil)`} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        {items.map((item, index) => {
          if (item.k === 'stem') return <path key={index} d={item.d} />
          const body =
            item.k === 'lavender' ? <Lavender length={item.len} /> : item.k === 'rose' ? <RoseHead /> : item.k === 'leaf' ? <Leaf /> : <Lily />
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
