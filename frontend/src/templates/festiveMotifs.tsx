/**
 * Ceremonial gold motifs for « Mandala »
 * (`very_beautiful template/Screenshot 2026-10-08 022321.png`): a
 * tone-on-tone floral damask, a marigold toran with hanging lotus bells, and
 * a lace mandala built from concentric petal rings.
 */
import { useId } from 'react'
import type { CSSProperties, ReactNode } from 'react'

/** Damask tile: a stylised bloom with curling leaves, mirrored, in a darker
 * shade of the paper — read as woven brocade, never as print. */
export function FloralDamask({ color, opacity = 0.35, size = 9 }: { color: string; opacity?: number; size?: number }) {
  const tile = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">',
    `<g fill="${color}">`,
    // central bloom
    '<g transform="translate(60 60)">',
    ...Array.from({ length: 8 }, (_, i) => `<path transform="rotate(${i * 45})" d="M0 0 C -6 -6, -6 -16, 0 -22 C 6 -16, 6 -6, 0 0 Z"/>`),
    '<circle r="4"/></g>',
    // curling leaves to the corners
    ...[0, 90, 180, 270].map(
      (r) => `<g transform="translate(60 60) rotate(${r})"><path d="M 18 18 C 30 14, 40 22, 42 34 C 34 30, 26 30, 18 18 Z"/><path d="M 22 26 C 18 36, 24 44, 32 46 C 28 40, 28 32, 22 26 Z"/></g>`,
    ),
    // small rosettes at the tile corners (they join across tiles)
    ...[
      [0, 0],
      [120, 0],
      [0, 120],
      [120, 120],
    ].map(([x, y]) => `<g transform="translate(${x} ${y})">${Array.from({ length: 6 }, (_, i) => `<ellipse transform="rotate(${i * 60})" cx="0" cy="-6" rx="3" ry="6"/>`).join('')}</g>`),
    '</g></svg>',
  ].join('')
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(tile)}")`,
        backgroundSize: `${size}em ${size}em`,
        opacity,
      }}
    />
  )
}

/** A marigold rosette (two rings of rounded petals and a seeded heart). */
function Marigold({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${r / 10})`}>
      {Array.from({ length: 10 }, (_, i) => (
        <ellipse key={`o${i}`} transform={`rotate(${i * 36})`} cx="0" cy="-6.5" rx="3.2" ry="4.2" />
      ))}
      {Array.from({ length: 7 }, (_, i) => (
        <ellipse key={`i${i}`} transform={`rotate(${i * 51 + 20})`} cx="0" cy="-3.6" rx="2" ry="2.8" opacity="0.85" />
      ))}
      <circle r="2" opacity="0.7" />
    </g>
  )
}

/** Lotus bell: petals cupping a bud, with a bead and a tiny drop below. */
function LotusBell({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx="0" cy="0" r="2.4" />
      <path d="M -1 2 L 1 2 L 0.6 8 L -0.6 8 Z" />
      <path d="M 0 8 C -10 10, -12 22, -9 30 C -6 24, -3 18, 0 14 C 3 18, 6 24, 9 30 C 12 22, 10 10, 0 8 Z" />
      <path d="M 0 12 C -6 18, -6 30, 0 38 C 6 30, 6 18, 0 12 Z" opacity="0.92" />
      <circle cx="0" cy="42" r="1.8" />
      <path d="M 0 44 C -1.6 47, -1.6 49, 0 51 C 1.6 49, 1.6 47, 0 44 Z" />
    </g>
  )
}

/**
 * Toran across the top edge: a garland of marigolds on a gold cord, small
 * blooms strung down to four large lotus bells (the reference's hangings).
 */
export function MarigoldToran({ color, className, style }: { color: string; className?: string; style?: CSSProperties }) {
  const id = useId().replace(/:/g, '')
  const flowers: ReactNode[] = []
  for (let i = 0; i <= 20; i += 1) {
    flowers.push(<Marigold key={i} x={i * 20} y={6} r={i % 2 === 0 ? 7 : 5.5} />)
  }
  const hangs = [42, 152, 248, 358]
  return (
    <svg viewBox="0 0 400 110" preserveAspectRatio="xMidYMin slice" className={className} style={style} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F6DD9A" />
          <stop offset="0.5" stopColor={color} />
          <stop offset="1" stopColor="#B88A34" />
        </linearGradient>
      </defs>
      <g fill={`url(#${id}-g)`} stroke="none">
        <path d="M 0 6 L 400 6" stroke={color} strokeWidth="1.4" fill="none" />
        {flowers}
        {hangs.map((x, index) => (
          <g key={x}>
            <path d={`M ${x} 10 L ${x} 52`} stroke={color} strokeWidth="1" fill="none" />
            <Marigold x={x} y={22} r={4.5} />
            <Marigold x={x} y={36} r={4} />
            <LotusBell x={x} y={48} s={index % 3 === 0 ? 1.15 : 1} />
          </g>
        ))}
        {[98, 202, 302].map((x) => (
          <g key={x}>
            <path d={`M ${x} 10 L ${x} 30`} stroke={color} strokeWidth="0.8" fill="none" />
            <Marigold x={x} y={22} r={3.6} />
            <circle cx={x} cy={32} r="1.8" />
          </g>
        ))}
      </g>
    </svg>
  )
}

/** Lace mandala: pointed outer petals, a scalloped band, lotus petals with
 * inner veins, a bead ring and a rosette heart — all in gold line and fill. */
export function LaceMandala({ color, className, style }: { color: string; className?: string; style?: CSSProperties }) {
  const ring = (count: number, render: (angle: number, i: number) => ReactNode) =>
    Array.from({ length: count }, (_, i) => render((360 / count) * i, i))
  return (
    <svg viewBox="-100 -100 200 200" className={className} style={style} aria-hidden="true">
      <g fill="none" stroke={color} strokeWidth="0.9">
        {ring(32, (a) => (
          <path key={`p${a}`} transform={`rotate(${a})`} d="M -5 -70 Q 0 -98, 5 -70" />
        ))}
        {ring(32, (a) => (
          <path key={`pi${a}`} transform={`rotate(${a})`} d="M -2.5 -72 Q 0 -88, 2.5 -72" strokeWidth="0.6" />
        ))}
        <circle r="70" />
        <circle r="66" strokeWidth="0.6" />
        {ring(48, (a) => (
          <path key={`s${a}`} transform={`rotate(${a})`} d="M -4.3 -66 A 4.3 4.3 0 0 0 4.3 -66" strokeWidth="0.7" />
        ))}
        {ring(16, (a) => (
          <g key={`l${a}`} transform={`rotate(${a})`}>
            <path d="M 0 -26 C -14 -36, -14 -52, 0 -60 C 14 -52, 14 -36, 0 -26 Z" />
            <path d="M 0 -30 C -7 -38, -7 -48, 0 -54 C 7 -48, 7 -38, 0 -30 Z" strokeWidth="0.6" />
            <path d="M 0 -32 L 0 -52" strokeWidth="0.5" />
          </g>
        ))}
        {ring(16, (a) => (
          <path key={`m${a}`} transform={`rotate(${a + 11.25})`} d="M 0 -30 C -6 -38, -5 -46, 0 -50 C 5 -46, 6 -38, 0 -30 Z" strokeWidth="0.6" />
        ))}
        <circle r="24" />
      </g>
      <g fill={color}>
        {ring(24, (a) => (
          <circle key={`b${a}`} transform={`rotate(${a})`} cx="0" cy="-20" r="1.5" />
        ))}
        {ring(12, (a) => (
          <path key={`c${a}`} transform={`rotate(${a})`} d="M 0 -4 C -3.5 -8, -3.5 -14, 0 -16 C 3.5 -14, 3.5 -8, 0 -4 Z" />
        ))}
        {ring(32, (a) => (
          <circle key={`t${a}`} transform={`rotate(${a})`} cx="0" cy="-99" r="1.3" />
        ))}
        <circle r="3.4" />
      </g>
    </svg>
  )
}
