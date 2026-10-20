/* oxlint-disable react/only-export-components */
/**
 * Panel skins for the public invitation page.
 *
 * Each sidebar panel wears the exact paper, palette, corner flowers and frames
 * of its template, so the panels read as part of the same card as the
 * invitation itself ("the same colours and design as the invitation body").
 */
import type { CSSProperties } from 'react'

import { BLUSH, DecoCorner, GoldRoseCorner, HexFrame, SAGE, StarField, WatercolorSpray } from './florals.tsx'
import { LuxePattern } from './luxeMotifs.tsx'
import {
  AZURE,
  FoliageCascade,
  FloralWreath,
  GRENAT,
  GoldSprig,
  LILAC,
  MandalaRosette,
  PeonyCluster,
  RibbonField,
  RoseCluster,
  TAUPE,
} from './referenceMotifs.tsx'

export interface PanelSkin {
  /** Paper background (solid colour or gradient), copied from the template. */
  paper: string
  /** Primary text on the paper. */
  ink: string
  /** Secondary/muted text on the paper. */
  inkSoft: string
  /** The template's section-title accent. */
  accent: string
  /** Borders and hairline rules. */
  line: string
  /** Translucent fill for fieldsets and inner boxes. */
  softBg: string
  /** Translucent status-chip background. */
  chipBg: string
  /** Text colour on accent-filled buttons. */
  onAccent: string
  /** Title font classes of the template. */
  titleClass: string
}

const FALLBACK: PanelSkin = {
  paper: '#FBF5EA',
  ink: '#2B2620',
  inkSoft: '#7A6A50',
  accent: '#A67C3D',
  line: '#E4D3AE',
  softBg: 'rgba(166, 124, 61, 0.08)',
  chipBg: 'rgba(255, 255, 255, 0.66)',
  onAccent: '#FFFFFF',
  titleClass: 'font-display',
}

export const PANEL_SKINS: Record<string, PanelSkin> = {
  'heritage-luxe': FALLBACK,
  'eternite-or': {
    paper: 'radial-gradient(120% 90% at 50% 0%, #251C11 0%, #17120D 55%, #0F0B07 100%)',
    ink: '#F3E9D7',
    inkSoft: '#CBB587',
    accent: '#D8B36A',
    line: 'rgba(216, 179, 106, 0.45)',
    softBg: 'rgba(216, 179, 106, 0.10)',
    chipBg: 'rgba(255, 255, 255, 0.07)',
    onAccent: '#241A0D',
    titleClass: 'font-display',
  },
  'jardin-olive': {
    paper: 'radial-gradient(120% 100% at 50% 0%, #F8F4EA 0%, #F4EFE3 52%, #EFE8D8 100%)',
    ink: '#2C3526',
    inkSoft: '#6F7663',
    accent: '#5B6B4B',
    line: '#DAD2B8',
    softBg: 'rgba(91, 107, 75, 0.08)',
    chipBg: 'rgba(255, 255, 255, 0.66)',
    onAccent: '#FFFFFF',
    titleClass: 'font-display',
  },
  'arche-soleil': {
    paper: 'radial-gradient(115% 95% at 50% -8%, #F7EAD8 0%, #F2E4D0 55%, #EAD6BD 100%)',
    ink: '#47282B',
    inkSoft: '#8C6154',
    accent: '#BE5330',
    line: '#E3C69C',
    softBg: 'rgba(190, 83, 48, 0.07)',
    chipBg: 'rgba(255, 255, 255, 0.66)',
    onAccent: '#FFFFFF',
    titleClass: 'font-display',
  },
  'nuit-celeste': {
    paper: 'linear-gradient(180deg, #0D1530 0%, #17234C 48%, #101A3A 78%, #0B1228 100%)',
    ink: '#F2ECDC',
    inkSoft: '#A9B3CF',
    accent: '#E2C27C',
    line: 'rgba(226, 194, 124, 0.38)',
    softBg: 'rgba(226, 194, 124, 0.10)',
    chipBg: 'rgba(255, 255, 255, 0.07)',
    onAccent: '#101A3A',
    titleClass: 'font-display',
  },
  'jardin-floral': {
    paper: '#FCF3F1',
    ink: '#4A3238',
    inkSoft: '#8D6C74',
    accent: '#B4636F',
    line: '#EBCFD4',
    softBg: 'rgba(180, 99, 111, 0.08)',
    chipBg: 'rgba(255, 255, 255, 0.66)',
    onAccent: '#FFFFFF',
    titleClass: 'font-display italic',
  },
  'ligne-moderne': {
    paper: '#FFFFFF',
    ink: '#16181D',
    inkSoft: '#6B6F78',
    accent: '#C8102E',
    line: '#E4E4E8',
    softBg: 'rgba(22, 24, 29, 0.05)',
    chipBg: 'rgba(255, 255, 255, 0.66)',
    onAccent: '#FFFFFF',
    titleClass: '',
  },
  confetti: {
    paper: '#FFF8E7',
    ink: '#312E81',
    inkSoft: '#7A74B4',
    accent: '#EC4899',
    line: '#F0DFB2',
    softBg: 'rgba(236, 72, 153, 0.08)',
    chipBg: 'rgba(255, 255, 255, 0.66)',
    onAccent: '#FFFFFF',
    titleClass: '',
  },
  'sceau-academique': {
    paper: '#14213D',
    ink: '#F4EFE4',
    inkSoft: '#AEB9CD',
    accent: '#C9A227',
    line: 'rgba(201, 162, 39, 0.42)',
    softBg: 'rgba(201, 162, 39, 0.10)',
    chipBg: 'rgba(255, 255, 255, 0.07)',
    onAccent: '#14213D',
    titleClass: 'font-display',
  },
  'soiree-formelle': {
    paper: '#0E2A22',
    ink: '#E8D8B0',
    inkSoft: '#B7A97F',
    accent: '#E8D8B0',
    line: 'rgba(199, 169, 107, 0.42)',
    softBg: 'rgba(199, 169, 107, 0.10)',
    chipBg: 'rgba(255, 255, 255, 0.07)',
    onAccent: '#0E2A22',
    titleClass: 'font-display italic',
  },
  memoire: {
    paper: '#F7F5F0',
    ink: '#4B463F',
    inkSoft: '#7B746A',
    accent: '#8A8377',
    line: '#D8D2C6',
    softBg: 'rgba(138, 131, 119, 0.10)',
    chipBg: 'rgba(255, 255, 255, 0.66)',
    onAccent: '#FFFFFF',
    titleClass: 'font-display',
  },
  floraison: {
    paper: '#F6F2EA',
    ink: '#2C3E63',
    inkSoft: '#6C7B95',
    accent: '#C29A4E',
    line: '#C9A876',
    softBg: 'rgba(194, 154, 78, 0.08)',
    chipBg: 'rgba(255, 255, 255, 0.66)',
    onAccent: '#FFFFFF',
    titleClass: 'font-display',
  },
  'arche-pivoine': {
    paper: '#FFFFFF',
    ink: '#33456B',
    inkSoft: '#7C8BA6',
    accent: '#C29A4E',
    line: '#E3D6BE',
    softBg: 'rgba(194, 154, 78, 0.07)',
    chipBg: 'rgba(255, 255, 255, 0.66)',
    onAccent: '#FFFFFF',
    titleClass: 'font-display',
  },
  'brume-bleue': {
    paper: '#FBFCFD',
    ink: '#3D4E6B',
    inkSoft: '#7A8FB4',
    accent: '#66768C',
    line: '#DCE4EC',
    softBg: 'rgba(102, 118, 140, 0.08)',
    chipBg: 'rgba(255, 255, 255, 0.66)',
    onAccent: '#FFFFFF',
    titleClass: 'font-display',
  },
  'ruban-dor': {
    paper: '#F4EEE3',
    ink: '#2F4A73',
    inkSoft: '#6E7B92',
    accent: '#C9A24A',
    line: '#E3D3AE',
    softBg: 'rgba(201, 162, 74, 0.08)',
    chipBg: 'rgba(255, 255, 255, 0.66)',
    onAccent: '#FFFFFF',
    titleClass: 'font-display',
  },
  hexagone: {
    paper: '#F2EAE0',
    ink: '#5F4636',
    inkSoft: '#8C6F5A',
    accent: '#B4924F',
    line: '#DCCBAF',
    softBg: 'rgba(180, 146, 79, 0.08)',
    chipBg: 'rgba(255, 255, 255, 0.66)',
    onAccent: '#FFFFFF',
    titleClass: 'font-display',
  },
  'roses-dor': {
    paper: '#F4F2ED',
    ink: '#7A6A55',
    inkSoft: '#9A8B74',
    accent: '#A98543',
    line: '#D9CDB4',
    softBg: 'rgba(169, 133, 67, 0.08)',
    chipBg: 'rgba(255, 255, 255, 0.66)',
    onAccent: '#FFFFFF',
    titleClass: 'font-display',
  },
  mandala: {
    paper: '#8E1F2B',
    ink: '#F5E6C8',
    inkSoft: '#E0B86A',
    accent: '#E8C06A',
    line: 'rgba(232, 192, 106, 0.42)',
    softBg: 'rgba(232, 192, 106, 0.10)',
    chipBg: 'rgba(0, 0, 0, 0.16)',
    onAccent: '#4A1013',
    titleClass: 'font-display',
  },
  lilas: {
    paper: '#FCFBF9',
    ink: '#2E3B33',
    inkSoft: '#7A857C',
    accent: '#7C6AA8',
    line: '#DCD4E8',
    softBg: 'rgba(124, 106, 168, 0.08)',
    chipBg: 'rgba(255, 255, 255, 0.66)',
    onAccent: '#FFFFFF',
    titleClass: 'font-display',
  },
  romance: {
    paper: '#FFFFFF',
    ink: '#2C3E63',
    inkSoft: '#7C8BA6',
    accent: '#C29A4E',
    line: '#E3D6BE',
    softBg: 'rgba(194, 154, 78, 0.07)',
    chipBg: 'rgba(255, 255, 255, 0.66)',
    onAccent: '#FFFFFF',
    titleClass: 'font-display',
  },
  grenat: {
    paper: '#F7EDE4',
    ink: '#8E2F45',
    inkSoft: '#A86A77',
    accent: '#8E2F45',
    line: '#E6C9CE',
    softBg: 'rgba(142, 47, 69, 0.07)',
    chipBg: 'rgba(255, 255, 255, 0.66)',
    onAccent: '#FFFFFF',
    titleClass: 'font-display',
  },
  'mood-board': {
    paper: '#F8F1E5',
    ink: '#55240F',
    inkSoft: '#93684C',
    accent: '#B4653A',
    line: '#E6CFA8',
    softBg: 'rgba(180, 101, 58, 0.08)',
    chipBg: 'rgba(255, 255, 255, 0.66)',
    onAccent: '#FFFFFF',
    titleClass: 'font-display',
  },
}

export function panelSkinFor(templateKey: string): PanelSkin {
  return PANEL_SKINS[templateKey] ?? FALLBACK
}

/** Skins whose paper is dark — UI chrome flips to light-on-dark variants. */
export const DARK_PANEL_KEYS = new Set([
  'eternite-or',
  'nuit-celeste',
  'sceau-academique',
  'soiree-formelle',
  'mandala',
])

/**
 * Realistic botanical corner spray for « Jardin floral » — a swept branch of
 * dusty-rose buds and olive leaves that hugs the panel corner, drawn with
 * tapered stems and veined petals (replaces the old circle/ellipse blobs).
 */
function FloralCorner({ flipX = false }: { flipX?: boolean }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className="absolute top-0 h-auto w-[5.75rem] opacity-95"
      style={{
        left: flipX ? undefined : 0,
        right: flipX ? 0 : undefined,
        transform: flipX ? 'scaleX(-1)' : undefined,
      }}
      aria-hidden="true"
    >
      {/* main swept stem hugging the corner + one branch */}
      <g fill="none" stroke="#7C8B6B" strokeLinecap="round">
        <path d="M6 6 C 30 12, 52 30, 66 58" strokeWidth="2" />
        <path d="M6 6 C 12 30, 28 54, 54 68" strokeWidth="2" />
        <path d="M40 26 C 52 30, 62 40, 68 52" strokeWidth="1.6" />
      </g>
      {/* olive leaves, veined and tapered */}
      <g>
        {[
          [24, 16, 40, 13],
          [48, 38, 62, 12],
          [16, 34, -50, 12],
          [40, 54, -30, 11],
          [60, 58, 20, 10],
        ].map(([x, y, rot, s]) => (
          <g key={`${x}-${y}`} transform={`translate(${x} ${y}) rotate(${rot}) scale(${s / 12})`}>
            <path d="M0 0 C 8 -9 22 -10 30 -2 C 22 6 8 7 0 0 Z" fill="#7C8B6B" opacity="0.85" />
            <path d="M3 -1 C 12 -3 22 -3 28 -2" fill="none" stroke="#5E6B47" strokeWidth="0.9" opacity="0.6" />
          </g>
        ))}
      </g>
      {/* dusty-rose blossoms: layered petals around a centre */}
      <g>
        {[
          [62, 26, 9],
          [34, 62, 8],
          [70, 58, 6.5],
        ].map(([x, y, r]) => (
          <g key={`b-${x}-${y}`}>
            {Array.from({ length: 5 }, (_, p) => (
              <ellipse
                key={p}
                cx={x}
                cy={y - r * 0.52}
                rx={r * 0.42}
                ry={r * 0.6}
                fill={p % 2 === 0 ? '#B4636F' : '#C98BA0'}
                opacity="0.9"
                transform={`rotate(${(p * 360) / 5} ${x} ${y})`}
              />
            ))}
            <circle cx={x} cy={y} r={r * 0.22} fill="#E9C4CD" />
          </g>
        ))}
        {/* tiny buds tucked along the stem */}
        <circle cx="20" cy="20" r="2.6" fill="#B4636F" opacity="0.85" />
        <circle cx="52" cy="48" r="2.2" fill="#B4636F" opacity="0.85" />
        <circle cx="12" cy="46" r="2.4" fill="#C98BA0" opacity="0.85" />
      </g>
    </svg>
  )
}

/** Slim confetti band, mirroring « Confetti »'s top band of candy dots. */
function ConfettiBand() {
  return (
    <svg
      viewBox="0 0 320 30"
      className="absolute inset-x-0 top-0 h-[1.9rem] w-full"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <rect x="0" y="0" width="320" height="30" fill="#4338CA" />
      <circle cx="28" cy="9" r="4.5" fill="#F59E0B" />
      <circle cx="70" cy="20" r="3.5" fill="#EC4899" />
      <rect x="118" y="6" width="7" height="7" fill="#FFFFFF" transform="rotate(18 121 9)" />
      <circle cx="176" cy="17" r="4" fill="#F59E0B" />
      <rect x="216" y="15" width="6" height="6" fill="#EC4899" transform="rotate(-14 219 18)" />
      <circle cx="268" cy="7" r="3.8" fill="#FFFFFF" />
      <circle cx="300" cy="19" r="3.5" fill="#F59E0B" />
    </svg>
  )
}

/** Champagne four-point sparkle, mirroring « Soirée formelle »'s rule motif. */
function Sparkle({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="#C7A96B" aria-hidden="true">
      <path d="M12 2c2.2 4.6 5.2 6.4 10 8-4.8 1.6-7.8 3.4-10 8-2.2-4.6-5.2-6.4-10-8 4.8-1.6 7.8-3.4 10-8z" />
    </svg>
  )
}

/** Gold seal star, mirroring « Sceau académique »'s medallion. */
function SealStar({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="none" stroke="#C9A227" strokeWidth="1.6" />
      <circle cx="32" cy="32" r="24" fill="none" stroke="#C9A227" strokeWidth="0.9" />
      <path
        d="M32 16l4.2 8.6 9.5 1.4-6.9 6.7 1.6 9.4L32 37.8l-8.4 4.3 1.6-9.4-6.9-6.7 9.5-1.4z"
        fill="#C9A227"
      />
    </svg>
  )
}

function decorFor(templateKey: string) {
  switch (templateKey) {
    case 'heritage-luxe':
      return (
        <>
          <GoldRoseCorner className="absolute left-[0.35rem] top-[0.35rem] w-[5.5rem] opacity-90" />
          <GoldRoseCorner
            className="absolute bottom-[0.35rem] right-[0.35rem] w-[5.5rem] opacity-90"
            style={{ transform: 'rotate(180deg)' }}
          />
        </>
      )
    case 'eternite-or':
      return (
        <>
          <div
            className="absolute inset-[0.62rem] border"
            style={{ borderColor: 'rgba(216, 179, 106, 0.45)' }}
          />
          <div
            className="absolute inset-[0.28rem] border"
            style={{ borderColor: 'rgba(216, 179, 106, 0.28)' }}
          />
          <DecoCorner
            color="#D8B36A"
            className="absolute left-[0.95rem] top-[0.95rem] h-auto w-[3.25rem]"
          />
          <DecoCorner
            color="#D8B36A"
            className="absolute bottom-[0.95rem] right-[0.95rem] h-auto w-[3.25rem]"
            style={{ transform: 'rotate(180deg)' }}
          />
        </>
      )
    case 'jardin-olive':
      return (
        <>
          <WatercolorSpray
            palette={SAGE}
            className="absolute left-[-0.55rem] top-[-0.45rem] w-[6.5rem]"
          />
          <WatercolorSpray
            palette={SAGE}
            className="absolute bottom-[-0.45rem] right-[-0.55rem] w-[6.5rem]"
            style={{ transform: 'rotate(180deg)' }}
          />
        </>
      )
    case 'arche-soleil':
      return (
        <>
          <div className="absolute inset-[0.55rem]">
            <HexFrame color="#C08A4A" opacity={0.35} className="h-full w-full" />
          </div>
          <WatercolorSpray
            palette={BLUSH}
            className="absolute right-[-0.55rem] top-[-0.45rem] w-[6.5rem]"
            style={{ transform: 'scaleX(-1)' }}
          />
          <WatercolorSpray
            palette={BLUSH}
            className="absolute bottom-[-0.45rem] left-[-0.55rem] w-[6.5rem]"
          />
        </>
      )
    case 'nuit-celeste':
      return (
        <>
          <StarField className="absolute inset-0 h-full w-full opacity-70" />
          <GoldRoseCorner className="absolute left-[0.35rem] top-[0.35rem] w-[5.5rem] opacity-80" />
          <GoldRoseCorner
            className="absolute bottom-[0.35rem] right-[0.35rem] w-[5.5rem] opacity-80"
            style={{ transform: 'rotate(180deg)' }}
          />
        </>
      )
    case 'jardin-floral':
      return (
        <>
          <FloralCorner />
          <FloralCorner flipX />
        </>
      )
    case 'ligne-moderne':
      return null
    case 'confetti':
      return <ConfettiBand />
    case 'sceau-academique':
      return (
        <>
          <div
            className="absolute inset-[0.62rem] border"
            style={{ borderColor: 'rgba(201, 162, 39, 0.42)' }}
          />
          <div
            className="absolute inset-[0.28rem] border"
            style={{ borderColor: 'rgba(201, 162, 39, 0.25)' }}
          />
          <SealStar className="absolute right-[0.85rem] top-[0.85rem] h-auto w-[2.15rem] opacity-90" />
        </>
      )
    case 'soiree-formelle':
      return (
        <>
          <Sparkle className="absolute left-[0.75rem] top-[0.75rem] h-4 w-4" />
          <Sparkle className="absolute bottom-[0.75rem] right-[0.75rem] h-4 w-4" />
          <Sparkle
            className="absolute right-[1.6rem] top-[1.35rem] h-2.5 w-2.5"
            style={{ opacity: 0.7 }}
          />
          <Sparkle
            className="absolute bottom-[1.35rem] left-[1.6rem] h-2.5 w-2.5"
            style={{ opacity: 0.7 }}
          />
        </>
      )
    case 'memoire':
      return (
        <div
          className="absolute inset-[0.62rem] border"
          style={{ borderColor: '#D8D2C6' }}
        />
      )
    case 'floraison':
      return (
        <>
          <WatercolorSpray
            palette={AZURE}
            className="absolute -left-[2.2rem] -top-[1.8rem] w-[7.5rem]"
            style={{ transform: 'scaleY(-1)' }}
          />
          <WatercolorSpray
            palette={AZURE}
            className="absolute -bottom-[1.8rem] -right-[2.2rem] w-[7.5rem]"
            style={{ transform: 'scaleX(-1)' }}
          />
          <GoldSprig className="absolute bottom-[0.2rem] left-[0.4rem] w-[3.4rem]" color="#C29A4E" />
        </>
      )
    case 'arche-pivoine':
      return (
        <>
          <PeonyCluster
            palette={AZURE}
            className="absolute -left-[1.6rem] top-[0.2rem] w-[5.5rem] opacity-90"
          />
          <PeonyCluster
            palette={AZURE}
            className="absolute -right-[1.6rem] bottom-[0.2rem] w-[5.5rem] opacity-90"
            style={{ transform: 'rotate(180deg)' }}
          />
        </>
      )
    case 'brume-bleue':
      return (
        <FoliageCascade className="absolute -right-[1.2rem] top-[0.4rem] h-[10rem] w-[6rem] opacity-90" />
      )
    case 'ruban-dor':
      return <RibbonField className="absolute inset-0 h-full w-full opacity-70" />
    case 'hexagone':
      return (
        <>
          <div className="absolute inset-[0.5rem]">
            <HexFrame color="#B4924F" opacity={0.4} className="h-full w-full" />
          </div>
          <WatercolorSpray
            palette={TAUPE}
            className="absolute -left-[1.8rem] -top-[1.4rem] w-[6.5rem]"
            style={{ transform: 'scaleY(-1)' }}
          />
          <WatercolorSpray
            palette={TAUPE}
            className="absolute -bottom-[1.4rem] -right-[1.8rem] w-[6.5rem]"
            style={{ transform: 'scaleX(-1)' }}
          />
        </>
      )
    case 'roses-dor':
      return (
        <>
          <GoldRoseCorner className="absolute left-[0.35rem] top-[0.35rem] w-[5rem] opacity-90" />
          <GoldRoseCorner
            className="absolute bottom-[0.35rem] right-[0.35rem] w-[5rem] opacity-90"
            style={{ transform: 'rotate(180deg)' }}
          />
        </>
      )
    case 'mandala':
      return (
        <MandalaRosette
          color="#E8C06A"
          className="absolute -right-[2.4rem] top-[1rem] w-[8.5rem] opacity-70"
        />
      )
    case 'lilas':
      return (
        <FloralWreath
          palette={LILAC}
          className="absolute -right-[1.8rem] top-[0.6rem] w-[7rem] opacity-80"
        />
      )
    case 'romance':
      return (
        <>
          <WatercolorSpray
            palette={AZURE}
            className="absolute -left-[1.8rem] -top-[1.4rem] w-[6.5rem]"
            style={{ transform: 'scaleY(-1)' }}
          />
          <WatercolorSpray
            palette={AZURE}
            className="absolute -bottom-[1.4rem] -right-[1.8rem] w-[6.5rem]"
            style={{ transform: 'scaleX(-1)' }}
          />
        </>
      )
    case 'grenat':
      return (
        <>
          <RoseCluster
            palette={GRENAT}
            className="absolute -left-[1.2rem] top-[0.2rem] w-[5.5rem] opacity-95"
          />
          <RoseCluster
            palette={GRENAT}
            className="absolute -right-[1.2rem] bottom-[0.2rem] w-[5.5rem] opacity-95"
            style={{ transform: 'rotate(180deg)' }}
          />
        </>
      )
    case 'mood-board':
      return (
        <>
          <div
            className="absolute inset-[0.55rem]"
            style={{ border: '1px solid rgba(176, 135, 60, 0.5)' }}
          />
          <div
            className="absolute inset-[0.82rem]"
            style={{ border: '1px dashed rgba(176, 135, 60, 0.35)' }}
          />
          <GoldSprig className="absolute left-[0.5rem] top-[0.55rem] w-[3.2rem]" color="#B0873C" />
          <GoldSprig
            className="absolute bottom-[0.55rem] right-[0.5rem] w-[3.2rem]"
            color="#B0873C"
            style={{ transform: 'rotate(180deg)' }}
          />
        </>
      )
    default:
      return null
  }
}

/** Corner decorations and paper frames matching the template's own card. */
export function PanelDecor({ templateKey }: { templateKey: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Same tone-on-tone print as the card (sized for the sidebar). */}
      <LuxePattern templateKey={templateKey} unit="rem" scale={0.62} />
      {decorFor(templateKey)}
    </div>
  )
}
