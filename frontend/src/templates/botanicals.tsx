/**
 * Fine-line botanical drawings for the quieter templates (« Jardin »,
 * « Mémoire »): engraved-style leaves with midribs, tapering branches,
 * rosebuds and a calla lily, each over a soft watercolour wash.
 *
 * Leaves are placed along the branch with a deterministic rhythm (alternate
 * sides, tapering toward the tip, slight angle drift) — the regularity of a
 * botanical plate rather than random clip-art scatter. Everything is vector,
 * so it stays crisp from a gallery thumbnail to a printed PDF.
 */
import { useId } from 'react'
import type { CSSProperties } from 'react'

type Point = { x: number; y: number }

/** A pointed leaf of length `l` along +x, with a midrib. */
function leafPath(l: number, w = 0.3): string {
  const h = l * w
  return `M0 0 C ${l * 0.28} ${-h}, ${l * 0.72} ${-h * 0.92}, ${l} 0 C ${l * 0.72} ${h * 0.92}, ${l * 0.28} ${h}, 0 0 Z`
}

function Leaf({
  at,
  angle,
  length,
  stroke,
  fill,
}: {
  at: Point
  angle: number
  length: number
  stroke: string
  fill: string
}) {
  return (
    <g transform={`translate(${at.x.toFixed(2)} ${at.y.toFixed(2)}) rotate(${angle.toFixed(1)})`}>
      <path d={leafPath(length)} fill={fill} stroke={stroke} strokeWidth="0.7" strokeLinejoin="round" />
      <path d={`M${length * 0.06} 0 Q ${length * 0.5} ${-length * 0.03} ${length * 0.9} 0`} fill="none" stroke={stroke} strokeWidth="0.45" opacity="0.8" />
    </g>
  )
}

/** A closed rosebud in line art: cupped outer petals around a spiral heart. */
function Rosebud({ at, size, angle, stroke, fill }: { at: Point; size: number; angle: number; stroke: string; fill: string }) {
  const s = size
  return (
    <g transform={`translate(${at.x} ${at.y}) rotate(${angle}) scale(${s / 10})`}>
      <path d="M-6 1 C -7 -5, -2 -9, 0 -9 C 2 -9, 7 -5, 6 1 C 4 5, -4 5, -6 1 Z" fill={fill} stroke={stroke} strokeWidth="0.7" />
      <path d="M-3.5 -1 C -3 -5, 0 -6.5, 1.5 -5 C 3 -3.5, 2 -1, 0 -1.2" fill="none" stroke={stroke} strokeWidth="0.6" />
      <path d="M-6 1 C -3 -1, 3 -1, 6 1" fill="none" stroke={stroke} strokeWidth="0.6" />
      <path d="M-5 3.5 L -7.5 7 M 5 3.5 L 7.5 7 M 0 4.5 L 0 8" stroke={stroke} strokeWidth="0.6" />
    </g>
  )
}

/** Soft watercolour pool behind a drawing: displaced, blurred, translucent. */
function Wash({ id, cx, cy, rx, ry, color, opacity }: { id: string; cx: number; cy: number; rx: number; ry: number; color: string; opacity: number }) {
  return (
    <>
      <filter id={id} x="-30%" y="-30%" width="160%" height="160%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="11" />
        <feDisplacementMap in="SourceGraphic" scale="14" />
        <feGaussianBlur stdDeviation="3.2" />
      </filter>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={color} opacity={opacity} filter={`url(#${id})`} />
    </>
  )
}

/**
 * Open laurel-and-rosebud wreath (two branches rising from a crossed base,
 * open at the top). viewBox 200×200; the centre stays empty for a numeral or
 * a monogram.
 */
export function BotanicalWreath({
  leaf = '#6F7F63',
  leafWash = 'rgba(150,168,136,0.38)',
  bud = '#9C5B66',
  budWash = 'rgba(214,150,158,0.55)',
  wash = '#E9C9C6',
  className,
  style,
}: {
  leaf?: string
  leafWash?: string
  bud?: string
  budWash?: string
  wash?: string
  className?: string
  style?: CSSProperties
}) {
  const washId = useId()
  const cx = 100
  const cy = 100
  const r = 74
  const leaves: { at: Point; angle: number; length: number }[] = []
  const buds: { at: Point; angle: number }[] = []
  // Each branch: from the base (≈ 100°/80°) up its side to ≈ 245°/-65°.
  for (const side of [1, -1] as const) {
    const start = side === 1 ? 102 : 78
    const end = side === 1 ? 246 : -66
    const steps = 15
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps
      const deg = start + (end - start) * t
      const rad = (deg * Math.PI) / 180
      const at = { x: cx + Math.cos(rad) * r, y: cy + Math.sin(rad) * r }
      // Direction of growth along the circle (the left branch climbs
      // clockwise, the right one counter-clockwise); leaves point forward,
      // alternating sides, opening ~40° from the stem.
      const growth = side === 1 ? deg + 90 : deg - 90
      const out = i % 2 === 0 ? 1 : -1
      const length = 20 - t * 9 + (i % 3) * 0.9
      leaves.push({ at, angle: growth + out * (38 + (i % 4) * 3), length })
      // Rosebud art points up (-y): rotate it onto the growth direction.
      if (i % 5 === 3) buds.push({ at, angle: growth + 90 - out * 28 })
    }
  }
  const branch = (side: 1 | -1) => {
    const a0 = ((side === 1 ? 102 : 78) * Math.PI) / 180
    const a1 = ((side === 1 ? 250 : -70) * Math.PI) / 180
    const p0 = { x: cx + Math.cos(a0) * r, y: cy + Math.sin(a0) * r }
    const p1 = { x: cx + Math.cos(a1) * r, y: cy + Math.sin(a1) * r }
    return `M ${p0.x.toFixed(1)} ${p0.y.toFixed(1)} A ${r} ${r} 0 0 ${side === 1 ? 1 : 0} ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`
  }

  return (
    <svg viewBox="0 0 200 200" className={className} style={style} aria-hidden="true">
      {/* Two uneven pools — blush low, a breath of sage high — so the wash
          reads as pigment settling, not a disc. */}
      <Wash id={washId} cx={108} cy={122} rx={74} ry={46} color={wash} opacity={0.34} />
      <ellipse cx={74} cy={84} rx={34} ry={26} fill={leafWash} opacity={0.35} filter={`url(#${washId})`} />
      <g fill="none" stroke={leaf} strokeLinecap="round">
        <path d={branch(1)} strokeWidth="1.1" />
        <path d={branch(-1)} strokeWidth="1.1" />
        {/* crossed stems at the base */}
        <path d="M 86 176 Q 100 172 116 186" strokeWidth="1" />
        <path d="M 114 176 Q 100 172 84 186" strokeWidth="1" />
      </g>
      {leaves.map((entry, index) => (
        <Leaf key={index} at={entry.at} angle={entry.angle} length={entry.length} stroke={leaf} fill={leafWash} />
      ))}
      {buds.map((entry, index) => (
        <Rosebud key={index} at={entry.at} angle={entry.angle} size={7} stroke={bud} fill={budWash} />
      ))}
      {/* a pair of open buds where the branches cross */}
      <Rosebud at={{ x: 92, y: 172 }} angle={-24} size={10} stroke={bud} fill={budWash} />
      <Rosebud at={{ x: 108, y: 172 }} angle={22} size={10} stroke={bud} fill={budWash} />
    </svg>
  )
}

/** A small sprig (one tapering stem, five leaves, one bud) — a closing mark. */
export function BotanicalSprig({
  leaf = '#6F7F63',
  leafWash = 'rgba(150,168,136,0.38)',
  bud = '#9C5B66',
  budWash = 'rgba(214,150,158,0.55)',
  className,
  style,
}: {
  leaf?: string
  leafWash?: string
  bud?: string
  budWash?: string
  className?: string
  style?: CSSProperties
}) {
  const leaves = [
    { at: { x: 40, y: 20 }, angle: -150, length: 11 },
    { at: { x: 52, y: 18 }, angle: -32, length: 12 },
    { at: { x: 64, y: 17 }, angle: -148, length: 12 },
    { at: { x: 76, y: 17.5 }, angle: -28, length: 11 },
    { at: { x: 88, y: 19 }, angle: -150, length: 9 },
  ]
  return (
    <svg viewBox="0 0 140 36" className={className} style={style} aria-hidden="true">
      <path d="M 30 22 Q 70 12 110 22" fill="none" stroke={leaf} strokeWidth="0.9" strokeLinecap="round" />
      {leaves.map((entry, index) => (
        <Leaf key={index} {...entry} stroke={leaf} fill={leafWash} />
      ))}
      <Rosebud at={{ x: 112, y: 21 }} angle={80} size={8} stroke={bud} fill={budWash} />
    </svg>
  )
}

/**
 * A single calla lily, drawn as an engraving: a long arched stem, the
 * trumpet spathe with its turned lip, the spadix inside, one broad leaf.
 * viewBox 120×220 — tall, for a vertical vignette.
 */
export function CallaLily({
  ink = '#6B7368',
  petal = 'rgba(255,255,255,0.65)',
  leafWash = 'rgba(150,164,140,0.32)',
  spadix = '#D9B65E',
  wash = '#DCE3DA',
  className,
  style,
}: {
  ink?: string
  petal?: string
  leafWash?: string
  spadix?: string
  wash?: string
  className?: string
  style?: CSSProperties
}) {
  const washId = useId()
  return (
    <svg viewBox="0 -22 120 242" className={className} style={style} aria-hidden="true">
      <Wash id={washId} cx={60} cy={60} rx={44} ry={52} color={wash} opacity={0.42} />
      <g fill="none" stroke={ink} strokeLinecap="round" strokeLinejoin="round">
        {/* stem */}
        <path d="M 58 92 C 56 130, 52 168, 60 216" strokeWidth="1.2" />
        {/* broad leaf, from low on the stem */}
        <path d="M 58 196 C 34 182, 20 150, 26 118 C 40 134, 54 160, 58 196 Z" fill={leafWash} strokeWidth="0.8" />
        <path d="M 57 192 C 44 170, 34 148, 27 121" strokeWidth="0.5" />
        {/* spathe: trumpet with a turned-back lip (scaled up from its base
            so the bloom carries the composition, not the stem) */}
        <g transform="translate(58 92) scale(1.32) translate(-58 -92)">
        <path
          d="M 58 92 C 46 84, 38 64, 44 42 C 50 22, 70 12, 86 18 C 78 22, 74 30, 76 40 C 80 58, 72 80, 58 92 Z"
          fill={petal}
          strokeWidth="1"
        />
        <path d="M 86 18 C 92 22, 92 30, 84 34 C 80 34, 77 30, 76 26" fill={petal} strokeWidth="0.9" />
        {/* engraved shading lines inside the trumpet */}
        <path d="M 52 80 C 46 68, 46 54, 52 42" strokeWidth="0.4" opacity="0.7" />
        <path d="M 56 84 C 52 70, 52 56, 58 44" strokeWidth="0.4" opacity="0.55" />
        <path d="M 62 86 C 62 72, 64 58, 70 48" strokeWidth="0.4" opacity="0.45" />
        {/* spadix */}
        <path d="M 60 74 C 58 62, 60 50, 66 44 C 68 52, 66 64, 62 76 Z" fill={spadix} strokeWidth="0.5" />
        </g>
      </g>
    </svg>
  )
}
