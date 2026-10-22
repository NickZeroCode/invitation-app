/**
 * Painted botanical library — the watercolour florals of the reference
 * stationery (« very_beautiful template »), redrawn as layered vector paint.
 *
 * Every bloom is built like a painter builds it: overlapping translucent
 * petals in rings, each petal shaded from a deep base to a pale rim (an
 * objectBoundingBox radial gradient anchored at the petal's base), a lighter
 * rim line to separate the layers, then the heart (cupped spiral, stamens,
 * pansy blotch…). Leaves carry a base-to-tip gradient and a midrib.
 *
 * `Bouquet` lays out a hand-placed arrangement in its own viewBox and shares
 * one set of gradients per palette, so a template describes its corner
 * cluster as data and stays readable.
 */
/* oxlint-disable react/only-export-components -- palettes and helpers beside the painted primitives */
import { useId } from 'react'
import type { CSSProperties, ReactNode } from 'react'

export interface Palette {
  /** Pale petal rim. */
  light: string
  /** Body of the petal. */
  mid: string
  /** Shadow toward the heart. */
  dark: string
  /** Deepest core / blotch. */
  deep: string
  /** Stamens / eye. */
  heart?: string
}

export const FLORA = {
  royalBlue: { light: '#DCE6FA', mid: '#7E9CE0', dark: '#3355B5', deep: '#1B2A6B', heart: '#F2C94C' },
  iceBlue: { light: '#FBFCFF', mid: '#D3DEF4', dark: '#8EA6DC', deep: '#24357A', heart: '#F2C94C' },
  powderBlue: { light: '#EEF3FB', mid: '#A9BEE3', dark: '#5F7FBF', deep: '#2E4A86', heart: '#E7C76A' },
  dustyBlue: { light: '#E6ECF4', mid: '#9FB3CF', dark: '#5D7699', deep: '#33496B', heart: '#D9B65E' },
  blush: { light: '#FBEFEF', mid: '#F0C3C6', dark: '#D58C95', deep: '#A9566A', heart: '#E9C46A' },
  burgundy: { light: '#A63A4E', mid: '#7C1A2D', dark: '#550C1C', deep: '#33050E', heart: '#D9A441' },
  taupe: { light: '#F6EEE6', mid: '#D9C5B5', dark: '#A78C7B', deep: '#6E5446', heart: '#B9874E' },
  cream: { light: '#FFFDF8', mid: '#F3E7D8', dark: '#D7C1A6', deep: '#9E8064', heart: '#E3A85A' },
  lilac: { light: '#F2ECFA', mid: '#C9B5EA', dark: '#9273CF', deep: '#5B3D9A', heart: '#F4E9B0' },
  violet: { light: '#E7DCF6', mid: '#A88BDB', dark: '#7151B8', deep: '#45297F', heart: '#F4E3A0' },
} satisfies Record<string, Palette>

export const FOLIAGE = {
  sage: { light: '#C9D4C0', mid: '#93A587', dark: '#5F7357', deep: '#3D4F38' },
  eucalyptus: { light: '#D9E2EC', mid: '#9DB2C9', dark: '#5F7C9C', deep: '#3D5675' },
  blueLeaf: { light: '#C6D5EA', mid: '#7E9BC4', dark: '#46679A', deep: '#2B4573' },
  olive: { light: '#D4D8B8', mid: '#9EA676', dark: '#6A7346', deep: '#444B2A' },
  dried: { light: '#F1E2CF', mid: '#D2B394', dark: '#A98463', deep: '#7A5A3E' },
  silver: { light: '#EDEFEF', mid: '#C5CCCB', dark: '#929D9C', deep: '#64706F' },
  gold: { light: '#F4E0A6', mid: '#D9B25E', dark: '#B08433', deep: '#7D5A1E' },
  copper: { light: '#F1C79A', mid: '#C88A52', dark: '#9A5E2C', deep: '#6B3D17' },
} satisfies Record<string, Palette>

export type PaletteName = keyof typeof FLORA | keyof typeof FOLIAGE
/** A built-in palette name, or a key of the `palettes` passed to Bouquet. */
export type PaletteKey = PaletteName | (string & {})
const ALL_PALETTES: Record<string, Palette> = { ...FLORA, ...FOLIAGE }

/** Older templates describe colours as a SprayPalette; map it onto the
 * painted library's two roles: 'flower' and 'leaf'. */
export function sprayPalettes(spray: {
  petal: string
  petalDeep: string
  petalLight: string
  leaf: string
  leafDeep: string
  accent: string
}): Record<string, Palette> {
  return {
    flower: { light: spray.petalLight, mid: spray.petal, dark: spray.petalDeep, deep: spray.petalDeep, heart: spray.accent },
    leaf: { light: spray.petalLight, mid: spray.leaf, dark: spray.leafDeep, deep: spray.leafDeep },
  }
}

/* ------------------------------------------------------------------ shapes */

/** Broad cupped petal, base at (0,0), tip toward -y, length 50. */
const CUP_PETAL = 'M0 0 C -24 -6, -34 -40, -10 -50 Q 0 -54, 10 -50 C 34 -40, 24 -6, 0 0 Z'
/** Ruffled peony petal with a scalloped rim. */
const RUFFLE_PETAL =
  'M0 0 C -26 -6, -40 -34, -24 -48 Q -18 -54, -11 -49 Q -5 -56, 1 -50 Q 7 -56, 12 -49 Q 19 -54, 24 -47 C 40 -34, 26 -6, 0 0 Z'
/** Rounded pansy / forget-me-not petal. */
const ROUND_PETAL = 'M0 0 C -28 -2, -32 -40, 0 -46 C 32 -40, 28 -2, 0 0 Z'
/** Pointed clematis petal. */
const POINT_PETAL = 'M0 0 C -14 -10, -16 -34, 0 -56 C 16 -34, 14 -10, 0 0 Z'
/** Anemone petal: broad, slightly squared rim. */
const ANEMONE_PETAL = 'M0 0 C -22 -4, -30 -36, -16 -46 Q 0 -52, 16 -46 C 30 -36, 22 -4, 0 0 Z'
/** Pointed leaf along -y, length 50, with a gentle S. */
const LEAF = 'M0 0 C -14 -10, -16 -34, -2 -50 C 12 -36, 14 -12, 0 0 Z'
/** Round eucalyptus leaf. */
const ROUND_LEAF = 'M0 0 C -15 -2, -19 -22, 0 -30 C 19 -22, 15 -2, 0 0 Z'

interface PaintCtx {
  id: string
  pal: Record<string, Palette>
}

function petalFill(ctx: PaintCtx, palette: string) {
  return `url(#${ctx.id}-p-${palette})`
}
function leafFill(ctx: PaintCtx, palette: string) {
  return `url(#${ctx.id}-l-${palette})`
}

function Petals({
  ctx,
  palette,
  d,
  count,
  scale,
  offset = 0,
  rim,
  opacity = 0.95,
}: {
  ctx: PaintCtx
  palette: string
  d: string
  count: number
  scale: number
  offset?: number
  rim: string
  opacity?: number
}) {
  const items: ReactNode[] = []
  for (let i = 0; i < count; i += 1) {
    const angle = offset + (360 / count) * i
    // Slight per-petal variation keeps the ring from looking stamped.
    const s = scale * (1 + ((i * 37) % 7) * 0.012 - 0.03)
    items.push(
      <path
        key={i}
        d={d}
        transform={`rotate(${angle.toFixed(1)}) scale(${s.toFixed(3)})`}
        fill={petalFill(ctx, palette)}
        stroke={rim}
        strokeWidth={0.9 / s}
        strokeOpacity="0.55"
        opacity={opacity}
      />,
    )
  }
  return <>{items}</>
}

/* ------------------------------------------------------------------ blooms */

function Rose({ ctx, palette, ruffled = false }: { ctx: PaintCtx; palette: string; ruffled?: boolean }) {
  const p = ctx.pal[palette]
  const d = ruffled ? RUFFLE_PETAL : CUP_PETAL
  return (
    <g>
      <Petals ctx={ctx} palette={palette} d={d} count={ruffled ? 7 : 6} scale={1} rim={p.light} />
      <Petals ctx={ctx} palette={palette} d={d} count={ruffled ? 6 : 5} scale={0.78} offset={26} rim={p.light} />
      <Petals ctx={ctx} palette={palette} d={d} count={5} scale={0.56} offset={8} rim={p.light} />
      {ruffled ? <Petals ctx={ctx} palette={palette} d={d} count={4} scale={0.38} offset={40} rim={p.light} /> : null}
      {/* cupped heart: a closed bud of petals wrapped in a spiral */}
      <circle r={ruffled ? 9 : 12} fill={p.dark} opacity="0.85" />
      <g fill="none" stroke={p.deep} strokeLinecap="round" opacity="0.5">
        <path d="M -9 3 C -11 -7, -2 -12, 6 -8" strokeWidth="0.9" />
        <path d="M 9 -2 C 10 6, 2 10, -5 8" strokeWidth="0.9" />
        <path d="M -4 -3 C -3 -7, 3 -7, 4 -2 C 4 2, -1 3, -2 0" strokeWidth="0.8" />
      </g>
      <g fill="none" stroke={p.light} strokeLinecap="round" opacity="0.55">
        <path d="M -12 6 C -14 -4, -6 -13, 4 -12" strokeWidth="0.9" />
        <path d="M 12 -4 C 13 6, 5 12, -4 12" strokeWidth="0.9" />
      </g>
      {ruffled && p.heart ? (
        <g fill={p.heart}>
          {Array.from({ length: 9 }, (_, i) => {
            const a = (i / 9) * Math.PI * 2
            return <circle key={i} cx={Math.cos(a) * 5.5} cy={Math.sin(a) * 5.5} r="1.2" />
          })}
        </g>
      ) : null}
    </g>
  )
}

function Pansy({ ctx, palette }: { ctx: PaintCtx; palette: string }) {
  const p = ctx.pal[palette]
  const petal = (rot: number, sx: number, sy: number) => (
    <path
      d={ROUND_PETAL}
      transform={`rotate(${rot}) scale(${sx} ${sy})`}
      fill={petalFill(ctx, palette)}
      stroke={p.light}
      strokeWidth="0.8"
      strokeOpacity="0.6"
    />
  )
  const lines = (rot: number) => (
    <g transform={`rotate(${rot})`} stroke={p.deep} strokeWidth="0.7" opacity="0.7" strokeLinecap="round">
      <path d="M0 -4 L 0 -26" />
      <path d="M -3 -4 L -9 -22" />
      <path d="M 3 -4 L 9 -22" />
    </g>
  )
  return (
    <g>
      {petal(-32, 1.02, 1.05)}
      {petal(32, 1.02, 1.05)}
      {petal(-104, 0.86, 0.9)}
      {petal(104, 0.86, 0.9)}
      {petal(180, 1.12, 1.02)}
      {lines(-104)}
      {lines(104)}
      {lines(180)}
      {/* dark face blotch + bright eye */}
      <circle r="8" fill={p.deep} opacity="0.8" />
      <path d="M -3 1 Q 0 -4 3 1 Q 0 3 -3 1 Z" fill={p.heart ?? '#F2C94C'} />
      <circle cx="0" cy="-1.5" r="1.1" fill="#FFFFFF" opacity="0.85" />
    </g>
  )
}

function Anemone({ ctx, palette, petals = 6 }: { ctx: PaintCtx; palette: string; petals?: number }) {
  const p = ctx.pal[palette]
  return (
    <g>
      <Petals ctx={ctx} palette={palette} d={ANEMONE_PETAL} count={petals} scale={1} rim={p.light} />
      <Petals ctx={ctx} palette={palette} d={ANEMONE_PETAL} count={petals} scale={0.7} offset={180 / petals} rim={p.light} opacity={0.75} />
      <circle r="10" fill={p.deep} opacity="0.55" />
      <g fill={p.heart ?? '#E7C76A'}>
        {Array.from({ length: 14 }, (_, i) => {
          const a = (i / 14) * Math.PI * 2
          const r = 6.5 + (i % 2) * 2
          return <circle key={i} cx={Math.cos(a) * r} cy={Math.sin(a) * r} r="1.25" />
        })}
      </g>
      <circle r="4.2" fill={p.deep} />
    </g>
  )
}

function Clematis({ ctx, palette }: { ctx: PaintCtx; palette: string }) {
  const p = ctx.pal[palette]
  return (
    <g>
      <Petals ctx={ctx} palette={palette} d={POINT_PETAL} count={6} scale={1} rim={p.light} />
      <g stroke={p.light} strokeWidth="0.8" opacity="0.7">
        {Array.from({ length: 6 }, (_, i) => (
          <path key={i} d="M0 -6 L 0 -44" transform={`rotate(${i * 60})`} />
        ))}
      </g>
      <circle r="6" fill={p.heart ?? '#F4E9B0'} />
      <g stroke={p.deep} strokeWidth="0.6">
        {Array.from({ length: 10 }, (_, i) => (
          <path key={i} d="M0 0 L 0 -8" transform={`rotate(${i * 36})`} />
        ))}
      </g>
    </g>
  )
}

/** Five-petal forget-me-not (small filler). */
function ForgetMeNot({ ctx, palette }: { ctx: PaintCtx; palette: string }) {
  const p = ctx.pal[palette]
  return (
    <g>
      <Petals ctx={ctx} palette={palette} d={ROUND_PETAL} count={5} scale={0.34} rim={p.light} />
      <circle r="3.2" fill="#FFFFFF" />
      <circle r="1.7" fill={p.heart ?? '#F2C94C'} />
    </g>
  )
}

function Bud({ ctx, palette }: { ctx: PaintCtx; palette: string }) {
  const p = ctx.pal[palette]
  return (
    <g>
      <path d="M0 0 C -9 -6, -9 -20, 0 -28 C 9 -20, 9 -6, 0 0 Z" fill={petalFill(ctx, palette)} stroke={p.light} strokeWidth="0.7" />
      <path d="M0 0 C -6 -6, -8 -14, -4 -20" fill="none" stroke={p.deep} strokeWidth="0.8" opacity="0.6" />
      <path d="M -6 2 C -10 -4, -8 -10, -4 -12 M 6 2 C 10 -4, 8 -10, 4 -12" fill="none" stroke="#6F8462" strokeWidth="1.2" />
    </g>
  )
}

function Berries({ ctx, palette }: { ctx: PaintCtx; palette: string }) {
  const p = ctx.pal[palette]
  const dots = [
    [0, -2, 4],
    [7, -7, 3.6],
    [-6, -9, 3.4],
    [2, -15, 3.2],
    [10, -15, 2.8],
    [-3, -21, 2.6],
  ]
  return (
    <g>
      <path d="M0 6 C 0 2, 1 -6, 2 -15 M 1 -2 L 7 -7 M 1 -4 L -6 -9 M 2 -15 L 10 -15 M 2 -15 L -3 -21" stroke={p.dark} strokeWidth="0.45" strokeOpacity="0.6" fill="none" />
      {dots.map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r} fill={p.dark} />
          <circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.35} fill={p.light} opacity="0.8" />
        </g>
      ))}
    </g>
  )
}

/* ------------------------------------------------------------------ foliage */

function Leaf({ ctx, palette }: { ctx: PaintCtx; palette: string }) {
  const p = ctx.pal[palette]
  return (
    <g>
      <path d={LEAF} fill={leafFill(ctx, palette)} stroke={p.dark} strokeWidth="0.5" strokeOpacity="0.5" />
      <path d="M0 -2 C -1 -18, -2 -34, -2 -48" fill="none" stroke={p.light} strokeWidth="0.9" opacity="0.7" />
    </g>
  )
}

/** Pale leaf edged in gold foil (the gilded leaves of the blush bouquets). */
function GildedLeaf({ ctx, palette }: { ctx: PaintCtx; palette: string }) {
  return (
    <g>
      <path d={LEAF} fill={leafFill(ctx, palette)} opacity="0.75" stroke="#C9A24E" strokeWidth="1.1" />
      <path d="M0 -2 C -1 -18, -2 -34, -2 -48" fill="none" stroke="#C9A24E" strokeWidth="0.7" />
    </g>
  )
}

/** A curved stem carrying alternating leaves that shrink toward the tip. */
function Spray({
  ctx,
  palette,
  length,
  leaves,
  round = false,
  curve = 0.25,
}: {
  ctx: PaintCtx
  palette: string
  length: number
  leaves: number
  round?: boolean
  curve?: number
}) {
  const p = ctx.pal[palette]
  const bend = length * curve
  const path = `M0 0 Q ${bend} ${-length / 2}, 0 ${-length}`
  const items: ReactNode[] = []
  for (let i = 0; i < leaves; i += 1) {
    const t = (i + 0.6) / (leaves + 0.4)
    // Point on the quadratic stem.
    const x = 2 * (1 - t) * t * bend
    const y = -length * t
    const side = i % 2 === 0 ? 1 : -1
    const size = (round ? 0.74 : 0.76) * (1.15 - t * 0.5)
    const angle = side * (round ? 62 : 48) - (bend > 0 ? 6 : -6)
    items.push(
      <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle}) scale(${size.toFixed(2)})`}>
        {round ? (
          <path d={ROUND_LEAF} fill={leafFill(ctx, palette)} stroke={p.dark} strokeWidth="0.6" strokeOpacity="0.4" />
        ) : (
          <Leaf ctx={ctx} palette={palette} />
        )}
      </g>,
    )
  }
  return (
    <g>
      <path d={path} fill="none" stroke={p.dark} strokeWidth="1.1" strokeLinecap="round" />
      {items}
      {round ? (
        <g transform={`translate(0 ${-length}) scale(0.38)`}>
          <path d={ROUND_LEAF} fill={leafFill(ctx, palette)} />
        </g>
      ) : null}
    </g>
  )
}

/** Feathery dried leaf (pampas-like) for the taupe bouquets. */
function Plume({ ctx, palette }: { ctx: PaintCtx; palette: string }) {
  const p = ctx.pal[palette]
  const barbs: ReactNode[] = []
  for (let i = 0; i < 14; i += 1) {
    const y = -6 - i * 3.4
    const w = 10 * Math.sin(((i + 1) / 15) * Math.PI)
    barbs.push(<path key={`l${i}`} d={`M0 ${y} Q ${-w * 0.6} ${y - 1}, ${-w} ${y - 5}`} />)
    barbs.push(<path key={`r${i}`} d={`M0 ${y} Q ${w * 0.6} ${y - 1}, ${w} ${y - 5}`} />)
  }
  return (
    <g fill="none" stroke={p.mid} strokeLinecap="round" opacity="0.9">
      <path d="M0 0 L 0 -54" stroke={p.dark} strokeWidth="0.9" />
      <g strokeWidth="1.1">{barbs}</g>
    </g>
  )
}

/* ------------------------------------------------------------------ bouquet */

export type FloraItem =
  | { k: 'rose' | 'peony' | 'pansy' | 'anemone' | 'clematis' | 'forget' | 'bud'; x: number; y: number; s: number; r?: number; p: PaletteKey }
  | { k: 'leaf' | 'gildedLeaf' | 'berries' | 'plume'; x: number; y: number; s: number; r?: number; p: PaletteKey }
  | { k: 'spray'; x: number; y: number; s: number; r?: number; p: PaletteKey; len: number; n: number; round?: boolean; curve?: number }

function Item({ ctx, item }: { ctx: PaintCtx; item: FloraItem }) {
  let body: ReactNode = null
  switch (item.k) {
    case 'rose':
      body = <Rose ctx={ctx} palette={item.p} />
      break
    case 'peony':
      body = <Rose ctx={ctx} palette={item.p} ruffled />
      break
    case 'pansy':
      body = <Pansy ctx={ctx} palette={item.p} />
      break
    case 'anemone':
      body = <Anemone ctx={ctx} palette={item.p} />
      break
    case 'clematis':
      body = <Clematis ctx={ctx} palette={item.p} />
      break
    case 'forget':
      body = <ForgetMeNot ctx={ctx} palette={item.p} />
      break
    case 'bud':
      body = <Bud ctx={ctx} palette={item.p} />
      break
    case 'leaf':
      body = <Leaf ctx={ctx} palette={item.p} />
      break
    case 'gildedLeaf':
      body = <GildedLeaf ctx={ctx} palette={item.p} />
      break
    case 'berries':
      body = <Berries ctx={ctx} palette={item.p} />
      break
    case 'plume':
      body = <Plume ctx={ctx} palette={item.p} />
      break
    case 'spray':
      body = <Spray ctx={ctx} palette={item.p} length={item.len} leaves={item.n} round={item.round} curve={item.curve} />
      break
  }
  return <g transform={`translate(${item.x} ${item.y}) rotate(${item.r ?? 0}) scale(${item.s})`}>{body}</g>
}

/**
 * A hand-placed arrangement. Items paint in order (first = furthest back),
 * so foliage goes first, then the large blooms, then fillers on top.
 */
export function Bouquet({
  items,
  viewBox,
  className,
  style,
  shadow = true,
  palettes,
}: {
  items: FloraItem[]
  /** Extra named palettes (e.g. a template's own colours). */
  palettes?: Record<string, Palette>
  viewBox: string
  className?: string
  style?: CSSProperties
  /** Soft contact shadow that lifts the painted cluster off the paper. */
  shadow?: boolean
}) {
  const id = useId().replace(/:/g, '')
  const pal = palettes ? { ...ALL_PALETTES, ...palettes } : ALL_PALETTES
  const ctx = { id, pal }
  const used = Array.from(new Set(items.map((item) => item.p)))
  return (
    <svg viewBox={viewBox} className={className} style={style} aria-hidden="true" overflow="visible">
      <defs>
        {used.map((name) => {
          const p = pal[name]
          return (
            <g key={name}>
              {/* petal: deep at the base, pale at the rim */}
              <radialGradient id={`${id}-p-${name}`} cx="0.5" cy="1" r="1.05" fx="0.5" fy="1">
                <stop offset="0" stopColor={p.deep} />
                <stop offset="0.28" stopColor={p.dark} />
                <stop offset="0.62" stopColor={p.mid} />
                <stop offset="1" stopColor={p.light} />
              </radialGradient>
              {/* leaf: darker at the stem, catching light toward the tip */}
              <linearGradient id={`${id}-l-${name}`} x1="0.5" y1="1" x2="0.5" y2="0">
                <stop offset="0" stopColor={p.dark} />
                <stop offset="0.55" stopColor={p.mid} />
                <stop offset="1" stopColor={p.light} />
              </linearGradient>
            </g>
          )
        })}
        {shadow ? (
          <filter id={`${id}-lift`} x="-10%" y="-10%" width="120%" height="125%">
            <feDropShadow dx="0" dy="1.4" stdDeviation="1.6" floodColor="#1B1F2A" floodOpacity="0.16" />
          </filter>
        ) : null}
      </defs>
      <g filter={shadow ? `url(#${id}-lift)` : undefined}>
        {items.map((item, index) => (
          <Item key={index} ctx={ctx} item={item} />
        ))}
      </g>
    </svg>
  )
}
