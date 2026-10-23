/**
 * Watercolour botanicals — the loose blue peonies, anemones, leaf sprays and
 * berries of « Ruban d'Or » (`very_beautiful template/Screenshot
 * 2026-10-08 021847.png`).
 *
 * Flat vector petals read as clip-art. A painted bloom is three things a
 * vector is not: an irregular edge, pigment pooling darker along that edge,
 * and translucent washes stacked on each other. So every petal is generated
 * with its own jitter (seeded, so a bouquet always paints the same), filled
 * with a translucent base-to-rim wash, and the whole arrangement passes
 * through one filter that roughens the edges (displacement), pools the
 * pigment at the rims (edge-weighted composite) and leaves the paper grain
 * showing through (noise alpha).
 */
/* oxlint-disable react/only-export-components -- tone table beside the painted primitives */
import { useId } from 'react'
import type { CSSProperties, ReactNode } from 'react'

interface Tone {
  deep: string
  dark: string
  mid: string
  light: string
}

export const WATERCOLOR_TONES = {
  royal: { deep: '#142A62', dark: '#244A99', mid: '#5577C0', light: '#B5C8EC' },
  cornflower: { deep: '#1F3F80', dark: '#3D66AE', mid: '#7598D2', light: '#CCDAF2' },
  dusty: { deep: '#38527A', dark: '#5B7BA4', mid: '#91ABCA', light: '#DCE4EE' },
  leafBlue: { deep: '#1F4169', dark: '#3A6591', mid: '#7C9FC3', light: '#C6D7E8' },
  leafGrey: { deep: '#3A5063', dark: '#5F788C', mid: '#98AEBE', light: '#D7E1E7' },
} satisfies Record<string, Tone>

export type ToneName = keyof typeof WATERCOLOR_TONES

/** Small deterministic PRNG (mulberry32): same seed, same brushwork. */
function rng(seed: number) {
  let t = seed >>> 0
  return () => {
    t = (t + 0x6d2b79f5) >>> 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

const f = (n: number) => n.toFixed(1)

/** A petal from the heart (0,0) out to -y, with a wavy, uneven rim. */
function petalPath(len: number, width: number, rand: () => number) {
  const w = width * (0.85 + rand() * 0.3)
  const l = len * (0.88 + rand() * 0.24)
  const lean = (rand() - 0.5) * w * 0.35
  const n1 = (rand() - 0.5) * l * 0.08
  const n2 = (rand() - 0.5) * l * 0.1
  return (
    `M0 0 C ${f(-w * 0.75)} ${f(-l * 0.18)}, ${f(-w + lean)} ${f(-l * 0.72)}, ${f(-w * 0.55 + lean)} ${f(-l * 0.95 + n1)} ` +
    `Q ${f(-w * 0.25 + lean)} ${f(-l * 1.06)}, ${f(lean)} ${f(-l + n2)} ` +
    `Q ${f(w * 0.25 + lean)} ${f(-l * 1.07)}, ${f(w * 0.55 + lean)} ${f(-l * 0.94 - n1)} ` +
    `C ${f(w + lean)} ${f(-l * 0.7)}, ${f(w * 0.75)} ${f(-l * 0.18)}, 0 0 Z`
  )
}

interface Ctx {
  id: string
}

function wash(ctx: Ctx, tone: ToneName, part: 'petal' | 'leaf' | 'bud') {
  return `url(#${ctx.id}-${tone}-${part})`
}

/** One ring of petals. */
function Ring({
  ctx,
  tone,
  count,
  len,
  width,
  offset,
  seed,
  opacity,
  veins = true,
}: {
  ctx: Ctx
  tone: ToneName
  count: number
  len: number
  width: number
  offset: number
  seed: number
  opacity: number
  veins?: boolean
}) {
  const rand = rng(seed)
  const t = WATERCOLOR_TONES[tone]
  const petals: ReactNode[] = []
  for (let i = 0; i < count; i += 1) {
    const angle = offset + (360 / count) * i + (rand() - 0.5) * 14
    const d = petalPath(len, width, rand)
    petals.push(
      <g key={i} transform={`rotate(${f(angle)})`}>
        <path d={d} fill={wash(ctx, tone, 'petal')} opacity={opacity * (0.85 + rand() * 0.15)} />
        {veins ? (
          <path
            d={`M0 ${f(-len * 0.12)} Q ${f((rand() - 0.5) * 6)} ${f(-len * 0.5)} ${f((rand() - 0.5) * 8)} ${f(-len * 0.82)} M ${f(-width * 0.1)} ${f(-len * 0.15)} Q ${f(-width * 0.35)} ${f(-len * 0.5)} ${f(-width * 0.42)} ${f(-len * 0.74)} M ${f(width * 0.1)} ${f(-len * 0.15)} Q ${f(width * 0.35)} ${f(-len * 0.5)} ${f(width * 0.4)} ${f(-len * 0.76)}`}
            fill="none"
            stroke={t.deep}
            strokeWidth="0.55"
            strokeLinecap="round"
            opacity="0.22"
          />
        ) : null}
      </g>,
    )
  }
  return <g>{petals}</g>
}

/** Ochre heart: a shadowed well ringed by stamens. */
function Heart({ ctx, tone, radius, seed }: { ctx: Ctx; tone: ToneName; radius: number; seed: number }) {
  const rand = rng(seed)
  const t = WATERCOLOR_TONES[tone]
  const stamens: ReactNode[] = []
  const count = Math.round(radius * 2.2)
  for (let i = 0; i < count; i += 1) {
    const a = (Math.PI * 2 * i) / count + rand() * 0.3
    const r = radius * (0.55 + rand() * 0.55)
    stamens.push(
      <circle
        key={i}
        cx={f(Math.cos(a) * r)}
        cy={f(Math.sin(a) * r)}
        r={f(0.7 + rand() * 0.9)}
        fill={rand() > 0.35 ? '#C8952F' : '#7A5317'}
        opacity="0.92"
      />,
    )
  }
  return (
    <g>
      <circle r={radius * 1.5} fill={t.deep} opacity="0.32" />
      <circle r={radius} fill={`url(#${ctx.id}-ochre)`} />
      {stamens}
    </g>
  )
}

/** Open anemone / single peony seen from the front. */
function Bloom({ ctx, tone, seed }: { ctx: Ctx; tone: ToneName; seed: number }) {
  return (
    <g>
      <Ring ctx={ctx} tone={tone} count={8} len={46} width={24} offset={0} seed={seed} opacity={0.72} />
      <Ring ctx={ctx} tone={tone} count={7} len={36} width={20} offset={22} seed={seed + 1} opacity={0.8} />
      <Ring ctx={ctx} tone={tone} count={6} len={24} width={14} offset={8} seed={seed + 2} opacity={0.86} veins={false} />
      <Heart ctx={ctx} tone={tone} radius={8} seed={seed + 3} />
    </g>
  )
}

/** Full double peony: more rings, cupped inner petals, a small heart. */
function Peony({ ctx, tone, seed }: { ctx: Ctx; tone: ToneName; seed: number }) {
  return (
    <g>
      <Ring ctx={ctx} tone={tone} count={9} len={54} width={26} offset={10} seed={seed} opacity={0.66} />
      <Ring ctx={ctx} tone={tone} count={8} len={45} width={23} offset={30} seed={seed + 1} opacity={0.72} />
      <Ring ctx={ctx} tone={tone} count={7} len={35} width={19} offset={4} seed={seed + 2} opacity={0.8} />
      <Ring ctx={ctx} tone={tone} count={6} len={24} width={14} offset={26} seed={seed + 3} opacity={0.86} veins={false} />
      <Ring ctx={ctx} tone={tone} count={5} len={14} width={9} offset={12} seed={seed + 4} opacity={0.85} veins={false} />
      <Heart ctx={ctx} tone={tone} radius={5.5} seed={seed + 5} />
    </g>
  )
}

/** Closed bud on a short stem with two sepals; base at (0,0), tip to -y. */
function Bud({ ctx, tone, seed }: { ctx: Ctx; tone: ToneName; seed: number }) {
  const rand = rng(seed)
  const lean = (rand() - 0.5) * 4
  return (
    <g>
      <path d="M0 0 Q 1 -9 0 -16" fill="none" stroke={WATERCOLOR_TONES.leafBlue.dark} strokeWidth="1.1" strokeLinecap="round" />
      <path
        d={`M0 -14 C -9 -16, -10 -30, ${f(lean)} -38 C 10 -30, 9 -16, 0 -14 Z`}
        fill={wash(ctx, tone, 'bud')}
        opacity="0.9"
      />
      <path d="M0 -14 C -6 -16, -9 -22, -8 -27 C -4 -22, -2 -18, 0 -14 Z" fill={WATERCOLOR_TONES.leafBlue.dark} opacity="0.75" />
      <path d="M0 -14 C 6 -16, 9 -22, 8 -27 C 4 -22, 2 -18, 0 -14 Z" fill={WATERCOLOR_TONES.leafBlue.dark} opacity="0.75" />
    </g>
  )
}

/** Lanceolate leaf, base at (0,0) toward -y, with midrib and side veins. */
function Leaf({ ctx, tone, len = 40, seed }: { ctx: Ctx; tone: ToneName; len?: number; seed: number }) {
  const rand = rng(seed)
  const w = len * (0.22 + rand() * 0.08)
  const bend = (rand() - 0.5) * len * 0.25
  const t = WATERCOLOR_TONES[tone]
  const veins: string[] = []
  for (let i = 1; i <= 4; i += 1) {
    const y = -len * (0.18 * i)
    const x = bend * (i / 5)
    veins.push(`M ${f(x)} ${f(y)} Q ${f(x - w * 0.4)} ${f(y - len * 0.05)} ${f(x - w * 0.7)} ${f(y - len * 0.12)}`)
    veins.push(`M ${f(x)} ${f(y)} Q ${f(x + w * 0.4)} ${f(y - len * 0.05)} ${f(x + w * 0.7)} ${f(y - len * 0.12)}`)
  }
  return (
    <g>
      <path
        d={`M0 0 C ${f(-w * 1.1)} ${f(-len * 0.2)}, ${f(-w + bend)} ${f(-len * 0.7)}, ${f(bend)} ${f(-len)} C ${f(w + bend)} ${f(-len * 0.72)}, ${f(w * 1.1)} ${f(-len * 0.22)}, 0 0 Z`}
        fill={wash(ctx, tone, 'leaf')}
        opacity={0.82}
      />
      <path d={`M0 0 Q ${f(bend * 0.4)} ${f(-len * 0.5)} ${f(bend)} ${f(-len * 0.96)}`} fill="none" stroke={t.deep} strokeWidth="0.7" opacity="0.45" />
      <path d={veins.join(' ')} fill="none" stroke={t.deep} strokeWidth="0.45" opacity="0.3" strokeLinecap="round" />
    </g>
  )
}

/** Arching stem with alternating leaves, the tip leaf largest. */
function Spray({ ctx, tone, len = 90, n = 7, seed }: { ctx: Ctx; tone: ToneName; len?: number; n?: number; seed: number }) {
  const rand = rng(seed)
  const t = WATERCOLOR_TONES[tone]
  const curve = len * 0.18
  const point = (k: number) => {
    // Quadratic arch: (0,0) → (curve, -len), control (curve*1.6, -len*0.5)
    const x = 2 * (1 - k) * k * curve * 1.6 + k * k * curve
    const y = -2 * (1 - k) * k * len * 0.5 - k * k * len
    return [x, y] as const
  }
  const leaves: ReactNode[] = []
  for (let i = 1; i <= n; i += 1) {
    const k = i / (n + 0.4)
    const [x, y] = point(k)
    const side = i % 2 === 0 ? 1 : -1
    const angle = side * (38 + rand() * 18) + curve * 0.2
    leaves.push(
      <g key={i} transform={`translate(${f(x)} ${f(y)}) rotate(${f(angle)})`}>
        <Leaf ctx={ctx} tone={tone} len={len * (0.2 + k * 0.12)} seed={seed * 13 + i} />
      </g>,
    )
  }
  const [tx, ty] = point(1)
  return (
    <g>
      <path
        d={`M0 0 Q ${f(curve * 1.6)} ${f(-len * 0.5)} ${f(tx)} ${f(ty)}`}
        fill="none"
        stroke={t.dark}
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.8"
      />
      {leaves}
      <g transform={`translate(${f(tx)} ${f(ty)}) rotate(${f(curve * 0.3)})`}>
        <Leaf ctx={ctx} tone={tone} len={len * 0.32} seed={seed * 13} />
      </g>
    </g>
  )
}

/** A twig of dark navy berries with a white glint each. */
function Berries({ seed }: { seed: number }) {
  const rand = rng(seed)
  const dots: ReactNode[] = []
  const twigs: string[] = []
  for (let i = 0; i < 5; i += 1) {
    const x = (rand() - 0.5) * 22
    const y = -18 - rand() * 18
    const r = 2.6 + rand() * 1.6
    twigs.push(`M0 0 Q ${f(x * 0.4)} ${f(y * 0.6)} ${f(x)} ${f(y)}`)
    dots.push(
      <g key={i} transform={`translate(${f(x)} ${f(y)})`}>
        <circle r={f(r)} fill="#1C2B55" opacity="0.92" />
        <circle cx={f(-r * 0.35)} cy={f(-r * 0.35)} r={f(r * 0.3)} fill="#FFFFFF" opacity="0.45" />
      </g>,
    )
  }
  return (
    <g>
      <path d={twigs.join(' ')} fill="none" stroke="#2D3F63" strokeWidth="0.8" strokeLinecap="round" />
      {dots}
    </g>
  )
}

export type WatercolorItem =
  | { k: 'bloom' | 'peony' | 'bud'; x: number; y: number; s: number; r?: number; tone: ToneName; seed?: number }
  | { k: 'leaf'; x: number; y: number; s: number; r?: number; tone: ToneName; len?: number; seed?: number }
  | { k: 'spray'; x: number; y: number; s: number; r?: number; tone: ToneName; len?: number; n?: number; seed?: number }
  | { k: 'berries'; x: number; y: number; s: number; r?: number; seed?: number }

/**
 * A hand-placed watercolour arrangement. Items paint in order (first = back),
 * all inside one watercolour filter so overlapping washes behave like paint.
 */
export function WatercolorBouquet({
  items,
  viewBox,
  className,
  style,
}: {
  items: WatercolorItem[]
  viewBox: string
  className?: string
  style?: CSSProperties
}) {
  const id = useId().replace(/:/g, '')
  const ctx: Ctx = { id }
  const tones = Object.entries(WATERCOLOR_TONES) as Array<[ToneName, Tone]>
  return (
    <svg viewBox={viewBox} className={className} style={style} aria-hidden="true" overflow="visible">
      <defs>
        {tones.map(([name, t]) => (
          <g key={name}>
            {/* Pigment settles at the heart and thins toward the rim. */}
            <radialGradient id={`${id}-${name}-petal`} cx="0.5" cy="1" r="1.05" fx="0.5" fy="1">
              <stop offset="0" stopColor={t.deep} />
              <stop offset="0.35" stopColor={t.dark} />
              <stop offset="0.72" stopColor={t.mid} />
              <stop offset="1" stopColor={t.light} />
            </radialGradient>
            <linearGradient id={`${id}-${name}-leaf`} x1="0.5" y1="1" x2="0.5" y2="0">
              <stop offset="0" stopColor={t.deep} />
              <stop offset="0.55" stopColor={t.dark} />
              <stop offset="1" stopColor={t.mid} />
            </linearGradient>
            <linearGradient id={`${id}-${name}-bud`} x1="0.3" y1="1" x2="0.7" y2="0">
              <stop offset="0" stopColor={t.deep} />
              <stop offset="0.6" stopColor={t.dark} />
              <stop offset="1" stopColor={t.mid} />
            </linearGradient>
          </g>
        ))}
        <radialGradient id={`${id}-ochre`} cx="0.42" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#F2D27A" />
          <stop offset="0.55" stopColor="#D2A040" />
          <stop offset="1" stopColor="#8A6020" />
        </radialGradient>
        <filter id={`${id}-wc`} x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
          {/* Ragged, bleeding edges. */}
          <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="4" seed="11" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="4" xChannelSelector="R" yChannelSelector="G" result="ragged" />
          {/* Pigment pooling: the rim is denser than the inside of a wash. */}
          <feGaussianBlur in="ragged" stdDeviation="1.8" result="soft" />
          <feComposite in="ragged" in2="soft" operator="arithmetic" k1="0" k2="1.7" k3="-0.7" k4="0" result="pooled" />
          {/* Paper grain lifting a little pigment. */}
          <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" seed="5" result="grain" />
          <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.3 1.12" result="grainAlpha" />
          <feComposite in="pooled" in2="grainAlpha" operator="in" />
        </filter>
      </defs>
      <g filter={`url(#${id}-wc)`}>
        {items.map((item, index) => {
          const seed = item.seed ?? index * 7 + 3
          let body: ReactNode
          switch (item.k) {
            case 'bloom':
              body = <Bloom ctx={ctx} tone={item.tone} seed={seed} />
              break
            case 'peony':
              body = <Peony ctx={ctx} tone={item.tone} seed={seed} />
              break
            case 'bud':
              body = <Bud ctx={ctx} tone={item.tone} seed={seed} />
              break
            case 'leaf':
              body = <Leaf ctx={ctx} tone={item.tone} len={item.len} seed={seed} />
              break
            case 'spray':
              body = <Spray ctx={ctx} tone={item.tone} len={item.len} n={item.n} seed={seed} />
              break
            default:
              body = <Berries seed={seed} />
          }
          return (
            <g key={index} transform={`translate(${item.x} ${item.y}) rotate(${item.r ?? 0}) scale(${item.s})`}>
              {body}
            </g>
          )
        })}
      </g>
    </svg>
  )
}
