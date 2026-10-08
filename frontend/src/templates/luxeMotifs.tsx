/* oxlint-disable react/only-export-components -- motif data + small art components */
/**
 * Couture motifs for the wedding collection.
 *
 * Each wedding template owns an original, hand-drawn repeat pattern laid over
 * its paper like a tone-on-tone print (damask, art-déco lattice, olive toile,
 * zellige, constellations), a "vellum" halo that keeps the reading field
 * clean, a gilt foil edge, and a monogram crest built from the couple's
 * initials. All art is inline SVG (data-URI tiles sized in `em`), so it scales
 * with the paper and survives the JPG export untouched.
 */
import type { CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Repeat patterns (one original tile per template)
// ---------------------------------------------------------------------------

/** Ogee damask: curved lattice, central fleur, corner rosettes. */
function damaskTile(c: string): string {
  return (
    `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='120' viewBox='0 0 80 120'>` +
    `<g fill='none' stroke='${c}' stroke-width='0.9' stroke-linecap='round'>` +
    `<path d='M40 0 C40 26 80 34 80 60 C80 86 40 94 40 120'/>` +
    `<path d='M40 0 C40 26 0 34 0 60 C0 86 40 94 40 120'/>` +
    `<path d='M40 71 C48 71 53 65 50 58 C48 54 44 55 44 58'/>` +
    `<path d='M40 71 C32 71 27 65 30 58 C32 54 36 55 36 58'/>` +
    `<path d='M40 49 C46 45 49 39 46 34'/><path d='M40 49 C34 45 31 39 34 34'/>` +
    `</g><g fill='${c}'>` +
    `<path d='M40 42 C46 50 46 58 40 68 C34 58 34 50 40 42 Z' opacity='0.85'/>` +
    `<circle cx='40' cy='37' r='1.6'/><circle cx='40' cy='76' r='1.3'/>` +
    `<circle cx='0' cy='0' r='2.4'/><circle cx='80' cy='0' r='2.4'/>` +
    `<circle cx='0' cy='120' r='2.4'/><circle cx='80' cy='120' r='2.4'/>` +
    `<circle cx='0' cy='60' r='1.4'/><circle cx='80' cy='60' r='1.4'/>` +
    `</g></svg>`
  )
}

/** Art-déco harlequin: nested diamonds, pinstripes and tiny studs. */
function decoTile(c: string): string {
  return (
    `<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'>` +
    `<g fill='none' stroke='${c}' stroke-linecap='round'>` +
    `<path d='M0 24 L24 0 L48 24 L24 48 Z' stroke-width='0.8'/>` +
    `<path d='M24 9 L39 24 L24 39 L9 24 Z' stroke-width='0.45'/>` +
    `<path d='M24 0 V9 M24 39 V48 M0 24 H9 M39 24 H48' stroke-width='0.45'/>` +
    `</g><g fill='${c}'>` +
    `<path d='M24 19 L29 24 L24 29 L19 24 Z' opacity='0.8'/>` +
    `<circle cx='0' cy='0' r='1.3'/><circle cx='48' cy='0' r='1.3'/>` +
    `<circle cx='0' cy='48' r='1.3'/><circle cx='48' cy='48' r='1.3'/>` +
    `</g></svg>`
  )
}

const LEAF = 'M0 0 C3 -4.6 9.4 -6.2 13 -2 C9.4 2.6 3 4.2 0 0 Z'

/** One olive sprig: curved stem, six leaves, two olives. */
function sprig(x: number, y: number, rot: number, c: string): string {
  const leaves = [
    [6, -2, -40], [6, 2, 40], [14, -4, -35], [14, 0, 45], [22, -5, -25], [23, -3, 30],
  ]
  return (
    `<g transform='translate(${x} ${y}) rotate(${rot})'>` +
    `<path d='M0 0 C8 -1 18 -3 28 -6' fill='none' stroke='${c}' stroke-width='0.8' stroke-linecap='round'/>` +
    leaves
      .map(([lx, ly, lr]) => `<path d='${LEAF}' fill='${c}' transform='translate(${lx} ${ly}) rotate(${lr})'/>`)
      .join('') +
    `<ellipse cx='11' cy='4.2' rx='2.1' ry='2.8' fill='${c}' opacity='0.75'/>` +
    `<ellipse cx='19' cy='-9' rx='1.9' ry='2.6' fill='${c}' opacity='0.75'/>` +
    `</g>`
  )
}

/** Olive toile: half-drop scatter of sprigs and seed dots. */
function oliveTile(c: string): string {
  return (
    `<svg xmlns='http://www.w3.org/2000/svg' width='110' height='110' viewBox='0 0 110 110'>` +
    sprig(10, 30, -18, c) +
    sprig(64, 86, 160, c) +
    sprig(70, 22, 38, c) +
    sprig(4, 92, -62, c) +
    `<g fill='${c}'><circle cx='50' cy='52' r='1.1'/><circle cx='96' cy='60' r='0.9'/>` +
    `<circle cx='34' cy='104' r='0.9'/><circle cx='100' cy='4' r='1'/></g>` +
    `</svg>`
  )
}

/** Zellige: eight-point stars knotted into a diagonal lattice. */
function zelligeTile(c: string): string {
  return (
    `<svg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'>` +
    `<g fill='none' stroke='${c}' stroke-width='0.75' stroke-linejoin='round'>` +
    `<rect x='14' y='14' width='16' height='16'/>` +
    `<rect x='14' y='14' width='16' height='16' transform='rotate(45 22 22)'/>` +
    `<path d='M0 0 L10.7 10.7 M44 0 L33.3 10.7 M0 44 L10.7 33.3 M44 44 L33.3 33.3' />` +
    `<path d='M22 0 V10.7 M22 33.3 V44 M0 22 H10.7 M33.3 22 H44' stroke-width='0.45'/>` +
    `</g><g fill='${c}'><circle cx='22' cy='22' r='2.1'/>` +
    `<circle cx='0' cy='0' r='1.5'/><circle cx='44' cy='0' r='1.5'/>` +
    `<circle cx='0' cy='44' r='1.5'/><circle cx='44' cy='44' r='1.5'/></g>` +
    `</svg>`
  )
}

const STAR4 = (x: number, y: number, s: number) =>
  `M${x} ${y - s} L${x + s * 0.22} ${y - s * 0.22} L${x + s} ${y} L${x + s * 0.22} ${y + s * 0.22} ` +
  `L${x} ${y + s} L${x - s * 0.22} ${y + s * 0.22} L${x - s} ${y} L${x - s * 0.22} ${y - s * 0.22} Z`

/** Constellations: hairline star-maps with four-point stars and gold dust. */
function constellationTile(c: string): string {
  return (
    `<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'>` +
    `<g fill='none' stroke='${c}' stroke-width='0.45' stroke-dasharray='1.6 1.8'>` +
    `<path d='M14 22 L36 14 L52 30 L44 52 L22 46 Z'/>` +
    `<path d='M84 70 L104 60 L124 74 L116 96'/>` +
    `<path d='M30 104 L52 96 L66 116'/>` +
    `</g><g fill='${c}'>` +
    `<path d='${STAR4(36, 14, 3.2)}'/><path d='${STAR4(52, 30, 2.2)}'/><path d='${STAR4(14, 22, 1.8)}'/>` +
    `<path d='${STAR4(44, 52, 2.6)}'/><path d='${STAR4(22, 46, 1.6)}'/>` +
    `<path d='${STAR4(104, 60, 3.4)}'/><path d='${STAR4(124, 74, 2)}'/><path d='${STAR4(84, 70, 1.7)}'/>` +
    `<path d='${STAR4(116, 96, 2.4)}'/><path d='${STAR4(52, 96, 2.8)}'/><path d='${STAR4(30, 104, 1.6)}'/>` +
    `<path d='${STAR4(66, 116, 2)}'/>` +
    `<circle cx='92' cy='18' r='0.9'/><circle cx='120' cy='34' r='0.7'/><circle cx='70' cy='42' r='0.8'/>` +
    `<circle cx='10' cy='76' r='0.8'/><circle cx='100' cy='126' r='0.9'/><circle cx='130' cy='112' r='0.6'/>` +
    `</g></svg>`
  )
}

interface PatternSpec {
  svg: string
  /** Tile size at paper scale (em). */
  w: number
  h: number
  opacity: number
}

const PATTERNS: Record<string, PatternSpec> = {
  'heritage-luxe': { svg: damaskTile('#A67C3D'), w: 6.4, h: 9.6, opacity: 0.13 },
  'eternite-or': { svg: decoTile('#D8B36A'), w: 4.2, h: 4.2, opacity: 0.11 },
  'jardin-olive': { svg: oliveTile('#5B6B4B'), w: 10, h: 10, opacity: 0.1 },
  'arche-soleil': { svg: zelligeTile('#BE5330'), w: 4, h: 4, opacity: 0.1 },
  'nuit-celeste': { svg: constellationTile('#E2C27C'), w: 12, h: 12, opacity: 0.3 },
}

export const LUXE_PATTERN_KEYS = new Set(Object.keys(PATTERNS))

/**
 * Tone-on-tone repeat print for a wedding template. `unit` lets the sidebar
 * panels reuse the exact print at rem scale.
 */
export function LuxePattern({
  templateKey,
  unit = 'em',
  scale = 1,
  className = '',
}: {
  templateKey: string
  unit?: 'em' | 'rem'
  scale?: number
  className?: string
}) {
  const spec = PATTERNS[templateKey]
  if (!spec) return null
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(spec.svg)}")`,
        backgroundSize: `${spec.w * scale}${unit} ${spec.h * scale}${unit}`,
        backgroundPosition: 'center top',
        opacity: spec.opacity,
      }}
    />
  )
}

/**
 * Clean reading field: a soft paper-coloured halo so the print recedes behind
 * the text and blooms toward the edges, as on a letterpress card.
 */
export function VellumHalo({ color, strength = 0.9 }: { color: string; strength?: number }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: `radial-gradient(ellipse 62% 46% at 50% 50%, ${color} 35%, transparent 100%)`,
        opacity: strength,
      }}
    />
  )
}

// ---------------------------------------------------------------------------
// Gilt foil edge
// ---------------------------------------------------------------------------

export const FOIL_GOLD =
  'linear-gradient(135deg, #8E6A2C 0%, #E9D08F 18%, #B48A3E 34%, #F6E7B9 50%, #A57B35 66%, #E3C47E 82%, #8E6A2C 100%)'

/** Hot-foil gilt border just inside the card's edge. */
export function GiltEdge({
  inset = '0.7em',
  width = '0.16em',
  gradient = FOIL_GOLD,
  style,
}: {
  inset?: string
  width?: string
  gradient?: string
  style?: CSSProperties
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute"
      style={{
        inset,
        borderStyle: 'solid',
        borderWidth: width,
        borderColor: 'transparent',
        borderImage: `${gradient} 1`,
        ...style,
      }}
    />
  )
}

// ---------------------------------------------------------------------------
// Monogram crest
// ---------------------------------------------------------------------------

function firstLetter(word: string): string {
  const letter = Array.from(word.replace(/^[^\p{L}]+/u, ''))[0] ?? ''
  return letter.toLocaleUpperCase('fr-FR')
}

/**
 * The couple's initials from the title ("Mariage de Grâce et Éric" → G, É).
 * Returns null when the title doesn't name two people.
 */
export function monogramFrom(title: string): [string, string] | null {
  const parts = title.split(/\s+(?:&|et|and|\+)\s+/i)
  if (parts.length !== 2) return null
  const left = parts[0].trim().split(/\s+/).pop() ?? ''
  const right = parts[1].trim().split(/\s+/)[0] ?? ''
  const a = firstLetter(left)
  const b = firstLetter(right)
  return a && b ? [a, b] : null
}

type CrestVariant = 'roundel' | 'lozenge' | 'wreath'

function polar(r: number, deg: number): [number, number] {
  const t = (deg * Math.PI) / 180
  return [50 + r * Math.cos(t), 50 + r * Math.sin(t)]
}

function CrestFrame({ variant, color }: { variant: CrestVariant; color: string }) {
  if (variant === 'roundel') {
    const beads = Array.from({ length: 48 }, (_, i) => polar(43.2, i * 7.5))
    return (
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" fill="none" aria-hidden="true">
        <circle cx="50" cy="50" r="47" stroke={color} strokeWidth="1.3" />
        <circle cx="50" cy="50" r="39.5" stroke={color} strokeWidth="0.6" />
        {beads.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="0.75" fill={color} />
        ))}
        {[0, 90, 180, 270].map((deg) => {
          const [x, y] = polar(47, deg)
          return <path key={deg} d={`M${x} ${y - 2.6} L${x + 2.6} ${y} L${x} ${y + 2.6} L${x - 2.6} ${y} Z`} fill={color} />
        })}
      </svg>
    )
  }
  if (variant === 'lozenge') {
    return (
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" fill="none" aria-hidden="true">
        <path d="M50 1 L99 50 L50 99 L1 50 Z" stroke={color} strokeWidth="1.2" />
        <path d="M50 9 L91 50 L50 91 L9 50 Z" stroke={color} strokeWidth="0.55" />
        <path d="M50 1 V9 M50 91 V99 M1 50 H9 M91 50 H99" stroke={color} strokeWidth="0.55" />
        {[
          [50, 1], [99, 50], [50, 99], [1, 50],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="2" fill={color} />
        ))}
        <g stroke={color} strokeWidth="0.5" strokeOpacity="0.8">
          {[-30, -15, 0, 15, 30].map((d) => {
            const [x, y] = polar(40, -90 + d)
            const [x2, y2] = polar(46, -90 + d)
            return <line key={d} x1={x} y1={y} x2={x2} y2={y2} />
          })}
        </g>
      </svg>
    )
  }
  // Wreath: two olive branches rising from the base, open at the top.
  const branch = (from: number, to: number, side: 1 | -1) => {
    const steps = 9
    return Array.from({ length: steps }, (_, i) => {
      const deg = from + ((to - from) * i) / (steps - 1)
      const [x, y] = polar(40, deg)
      const tangent = deg + 90 * side
      return (
        <g key={`${side}-${i}`} transform={`translate(${x} ${y})`}>
          <ellipse rx="4.6" ry="1.75" fill={color} transform={`rotate(${tangent - 32 * side}) translate(4 0)`} />
          <ellipse rx="4.2" ry="1.6" fill={color} opacity="0.85" transform={`rotate(${tangent + 32 * side}) translate(3.6 0)`} />
        </g>
      )
    })
  }
  const [lx, ly] = polar(40, 100)
  const [lx2, ly2] = polar(40, 255)
  const [rx, ry] = polar(40, 80)
  const [rx2, ry2] = polar(40, -75)
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible" fill="none" aria-hidden="true">
      <path d={`M${lx} ${ly} A40 40 0 0 1 ${lx2} ${ly2}`} stroke={color} strokeWidth="0.9" />
      <path d={`M${rx} ${ry} A40 40 0 0 0 ${rx2} ${ry2}`} stroke={color} strokeWidth="0.9" />
      {branch(100, 250, -1)}
      {branch(80, -70, 1)}
      <path d="M44 92 C48 96 52 96 56 92" stroke={color} strokeWidth="0.9" strokeLinecap="round" />
    </svg>
  )
}

/** Monogram crest: the couple's initials set inside an engraved frame. */
export function MonogramCrest({
  title,
  variant,
  color,
  inkStyle,
  className = '',
}: {
  title: string
  variant: CrestVariant
  color: string
  /** Initials paint (solid colour or a clipped gold-leaf gradient). */
  inkStyle?: CSSProperties
  className?: string
}) {
  const initials = monogramFrom(title)
  if (!initials) return null
  return (
    <div
      aria-hidden="true"
      className={`relative flex h-[6.2em] w-[6.2em] shrink-0 items-center justify-center ${className}`}
    >
      <CrestFrame variant={variant} color={color} />
      <span
        className="relative whitespace-nowrap leading-none"
        style={{ fontFamily: "'Great Vibes', cursive", fontSize: '2.35em', color, ...inkStyle }}
      >
        {initials[0]}
        <span style={{ fontSize: '0.62em', margin: '0 0.08em' }}>&amp;</span>
        {initials[1]}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Signature accents
// ---------------------------------------------------------------------------

/** Rising-sun rays fanning from the top edge (Arche Soleil). */
export function SunRays({ color, className = '', style }: { color: string; className?: string; style?: CSSProperties }) {
  const rays = Array.from({ length: 19 }, (_, i) => 180 + i * 10)
  return (
    <svg viewBox="0 0 200 100" className={className} style={style} aria-hidden="true">
      {rays.map((deg, i) => {
        const a = ((deg - 2.2) * Math.PI) / 180
        const b = ((deg + 2.2) * Math.PI) / 180
        return (
          <path
            key={deg}
            d={`M100 0 L${100 + 140 * Math.cos(a)} ${-140 * Math.sin(a)} L${100 + 140 * Math.cos(b)} ${-140 * Math.sin(b)} Z`}
            fill={color}
            opacity={i % 2 ? 0.55 : 1}
          />
        )
      })}
    </svg>
  )
}

/** Moonlight bloom behind the crescent (Nuit Céleste). */
export function MoonGlow({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute ${className}`}
      style={{
        backgroundImage:
          'radial-gradient(circle at 50% 50%, rgba(242,227,184,0.16) 0%, rgba(226,194,124,0.07) 34%, transparent 66%)',
      }}
    />
  )
}
