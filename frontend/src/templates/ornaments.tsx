/**
 * Small ornamental rules — the motifs each template draws with (suns, olive
 * sprigs, stars, blooms, laurels…). Used to dress the template's own sections
 * (Programme, Code vestimentaire) and the public-page panels with the exact
 * decoration language of the chosen template, not just its colours.
 */
import type { CSSProperties } from 'react'

import { FlourishRule } from './florals.tsx'

type OrnamentProps = {
  color?: string
  className?: string
  style?: CSSProperties
}

/** Tapered side rules shared by most ornaments (220×26 canvas). */
function SideRules({ color, from = 6, to = 60 }: { color: string; from?: number; to?: number }) {
  return (
    <g fill={color} opacity="0.5">
      <rect x={from} y="11.4" width={to} height="1.2" />
      <rect x={220 - from - to} y="11.4" width={to} height="1.2" />
    </g>
  )
}

function Ornament({
  className,
  style,
  children,
}: OrnamentProps & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 220 26" className={className} style={style} aria-hidden="true">
      {children}
    </svg>
  )
}

/** « Arche Soleil » — a small rising sun flanked by rays. */
export function SunRayRule({ color = '#BE5330', className, style }: OrnamentProps) {
  const rays = Array.from({ length: 12 }, (_, i) => i * 30)
  return (
    <Ornament color={color} className={className} style={style}>
      <SideRules color={color} />
      <g stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.8">
        {rays.map((deg) => {
          const rad = (deg * Math.PI) / 180
          return (
            <line
              key={deg}
              x1={110 + 7.5 * Math.cos(rad)}
              y1={13 + 7.5 * Math.sin(rad)}
              x2={110 + 11 * Math.cos(rad)}
              y2={13 + 11 * Math.sin(rad)}
            />
          )
        })}
      </g>
      <circle cx="110" cy="13" r="5" fill={color} />
    </Ornament>
  )
}

/** « Jardin Olive » — an olive sprig with two olives. */
export function OliveRule({ color = '#5B6B4B', className, style }: OrnamentProps) {
  return (
    <Ornament color={color} className={className} style={style}>
      <SideRules color={color} />
      <g stroke={color} fill="none" strokeWidth="1.3" strokeLinecap="round" opacity="0.85">
        <path d="M 92 17 Q 110 10 128 17" />
        <ellipse cx="100" cy="11" rx="5.5" ry="2.6" transform="rotate(-24 100 11)" fill={color} fillOpacity="0.35" />
        <ellipse cx="120" cy="11" rx="5.5" ry="2.6" transform="rotate(24 120 11)" fill={color} fillOpacity="0.35" />
        <circle cx="106" cy="18.5" r="2.1" fill={color} fillOpacity="0.6" />
        <circle cx="115" cy="18.5" r="2.1" fill={color} fillOpacity="0.6" />
      </g>
    </Ornament>
  )
}

/** « Nuit Céleste » — three four-point gold stars. */
export function StarRule({ color = '#E2C27C', className, style }: OrnamentProps) {
  const star = (cx: number, cy: number, r: number) =>
    `M ${cx} ${cy - r} L ${cx + r * 0.32} ${cy - r * 0.32} L ${cx + r} ${cy} L ${cx + r * 0.32} ${cy + r * 0.32} L ${cx} ${cy + r} L ${cx - r * 0.32} ${cy + r * 0.32} L ${cx - r} ${cy} L ${cx - r * 0.32} ${cy - r * 0.32} Z`
  return (
    <Ornament color={color} className={className} style={style}>
      <SideRules color={color} />
      <g fill={color}>
        <path d={star(110, 13, 8)} />
        <path d={star(94, 13, 4.4)} opacity="0.8" />
        <path d={star(126, 13, 4.4)} opacity="0.8" />
      </g>
    </Ornament>
  )
}

/** « Jardin Floral » — a small five-petal bloom with leaves. */
export function BloomRule({ color = '#B4636F', className, style }: OrnamentProps) {
  return (
    <Ornament color={color} className={className} style={style}>
      <SideRules color={color} />
      <g fill={color} opacity="0.75">
        {[0, 72, 144, 216, 288].map((deg) => (
          <ellipse
            key={deg}
            cx="110"
            cy="7.8"
            rx="2.6"
            ry="4.6"
            transform={`rotate(${deg} 110 13)`}
          />
        ))}
        <circle cx="110" cy="13" r="2.4" fill="#F2E2DC" stroke={color} strokeWidth="1" />
      </g>
    </Ornament>
  )
}

/** « Confetti » — two hearts and festive dots. */
export function HeartRule({ color = '#C2185B', className, style }: OrnamentProps) {
  return (
    <Ornament color={color} className={className} style={style}>
      <SideRules color={color} />
      <g fill={color}>
        <path d="M 104 9.4 C 104 6.6 108 5.6 110 8.2 C 112 5.6 116 6.6 116 9.4 C 116 12.4 110 15.4 110 15.4 C 110 15.4 104 12.4 104 9.4 Z" />
        <path d="M 94 11 C 94 9.2 96.6 8.6 97.8 10.2 C 99 8.6 101.6 9.2 101.6 11 C 101.6 12.8 97.8 14.8 97.8 14.8 C 97.8 14.8 94 12.8 94 11 Z" opacity="0.65" />
        <path d="M 118.4 11 C 118.4 9.2 121 8.6 122.2 10.2 C 123.4 8.6 126 9.2 126 11 C 126 12.8 122.2 14.8 122.2 14.8 C 122.2 14.8 118.4 12.8 118.4 11 Z" opacity="0.65" />
        <circle cx="89" cy="13" r="1.3" opacity="0.7" />
        <circle cx="131" cy="13" r="1.3" opacity="0.7" />
      </g>
    </Ornament>
  )
}

/** « Ligne Moderne » — a bold bar, a hairline and a red square. */
export function ModernRule({ color = '#C8102E', className, style }: OrnamentProps) {
  return (
    <Ornament color={color} className={className} style={style}>
      <rect x="70" y="11" width="64" height="3.4" fill={color} />
      <rect x="138" y="12.2" width="22" height="1.1" fill={color} opacity="0.6" />
      <rect x="164" y="8.6" width="8" height="8" fill={color} opacity="0.9" />
    </Ornament>
  )
}

/** « Sceau Académique » — a laurel sprig flanked by rules. */
export function LaurelRule({ color = '#9A7B1C', className, style }: OrnamentProps) {
  return (
    <Ornament color={color} className={className} style={style}>
      <SideRules color={color} />
      <g stroke={color} fill={color} strokeWidth="1" opacity="0.8">
        <path d="M 96 18 Q 110 20 124 18" fill="none" strokeWidth="1.3" />
        {[98, 104, 110, 116, 122].map((x, i) => (
          <g key={x}>
            <ellipse cx={x} cy={13.5 - Math.abs(i - 2) * -1} rx="2" ry="3.6" transform={`rotate(${i < 2 ? -32 : i > 2 ? 32 : 0} ${x} 13)`} />
          </g>
        ))}
      </g>
    </Ornament>
  )
}

/** « Soirée Formelle » — a champagne fleuron with curls. */
export function FleuronRule({ color = '#8C6F3F', className, style }: OrnamentProps) {
  return (
    <Ornament color={color} className={className} style={style}>
      <SideRules color={color} />
      <g fill={color} opacity="0.85">
        <path d="M 110 5 L 115 13 L 110 21 L 105 13 Z" />
        <circle cx="97" cy="13" r="1.8" />
        <circle cx="123" cy="13" r="1.8" />
        <path d="M 86 13 Q 92 8 97 11" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
        <path d="M 134 13 Q 128 8 123 11" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      </g>
    </Ornament>
  )
}

/** « Mémoire » — one quiet leaf on a short hairline. */
export function QuietRule({ color = '#7C8A72', className, style }: OrnamentProps) {
  return (
    <Ornament color={color} className={className} style={style}>
      <rect x="76" y="11.4" width="30" height="1" fill={color} opacity="0.45" />
      <rect x="114" y="11.4" width="30" height="1" fill={color} opacity="0.45" />
      <path
        d="M 104 13 Q 110 6.5 116 13 Q 110 19.5 104 13 Z"
        fill="none"
        stroke={color}
        strokeWidth="1.2"
        opacity="0.8"
      />
    </Ornament>
  )
}

const ORNAMENTS: Record<string, (props: OrnamentProps) => React.ReactElement> = {
  'heritage-luxe': ({ color, className, style }) => (
    <FlourishRule color={color ?? '#A67C3D'} className={className} style={style} />
  ),
  'eternite-or': ({ color, className, style }) => (
    <FlourishRule color={color ?? '#C9A24A'} className={className} style={style} />
  ),
  'jardin-olive': OliveRule,
  'arche-soleil': SunRayRule,
  'nuit-celeste': StarRule,
  'jardin-floral': BloomRule,
  confetti: HeartRule,
  'ligne-moderne': ModernRule,
  'sceau-academique': LaurelRule,
  'soiree-formelle': FleuronRule,
  memoire: QuietRule,
}

/** The template's ornamental rule, drawn in its accent colour. */
export function TemplateOrnament({
  templateKey,
  color,
  className,
  style,
}: OrnamentProps & { templateKey: string }) {
  const OrnamentFor = ORNAMENTS[templateKey] ?? QuietRule
  return <OrnamentFor color={color} className={className} style={style} />
}
