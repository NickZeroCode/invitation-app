/* oxlint-disable react/only-export-components -- page insets and the decor lookup beside PageDecor */
/**
 * Decoration of the PDF's details and QR pages.
 *
 * These pages must look like more sheets of the same invitation, so wherever
 * a template has its own decoration layer (bouquets, frames, ribbons, bands)
 * the page draws that very layer — the component the card itself renders —
 * at the card's scale: every template measure is in `em` of the paper's base
 * size (2.6 % of the sheet width), so the page sets the same base size for
 * its A4 width. Templates without a layer of their own keep the panel décor.
 */
import type { ReactNode } from 'react'

import { ArchePivoineDecor } from './ArchePivoine.tsx'
import { ArcheSoleilDecor } from './ArcheSoleil.tsx'
import { EterniteOrDecor } from './EterniteOr.tsx'
import { HeritageLuxeDecor } from './HeritageLuxe.tsx'
import { JardinFloralDecor } from './JardinFloral.tsx'
import { JardinOliveDecor } from './JardinOlive.tsx'
import { NuitCelesteDecor } from './NuitCeleste.tsx'
import { SceauAcademiqueDecor } from './SceauAcademique.tsx'
import { BrumeBleueDecor } from './BrumeBleue.tsx'
import { ConfettiDecor } from './Confetti.tsx'
import { FloraisonDecor } from './Floraison.tsx'
import { FloralDamask } from './festiveMotifs.tsx'
import { GrenatDecor } from './Grenat.tsx'
import { HexagoneDecor } from './Hexagone.tsx'
import { KasaiDecor } from './Kasai.tsx'
import { MandalaDecor } from './Mandala.tsx'
import { MemoireDecor } from './Memoire.tsx'
import { PanelDecor } from './panelSkin.tsx'
import { RomanceDecor } from './Romance.tsx'
import { RosesDorDecor } from './RosesDor.tsx'
import { RubanDorDecor } from './RubanDor.tsx'

/** A4 width at 96 dpi — the width every exported page is built at. */
export const A4_WIDTH_PX = 794
/** Same ratio as the paper's base size (`PAPER_FONT_SIZE`, 2.6cqw). */
const PAPER_FONT_RATIO = 0.026

const PAGE_DECOR: Record<string, () => ReactNode> = {
  'arche-soleil': () => <ArcheSoleilDecor />,
  'eternite-or': () => <EterniteOrDecor />,
  'heritage-luxe': () => <HeritageLuxeDecor />,
  'jardin-floral': () => <JardinFloralDecor />,
  'jardin-olive': () => <JardinOliveDecor />,
  'nuit-celeste': () => <NuitCelesteDecor />,
  'sceau-academique': () => <SceauAcademiqueDecor />,
  'arche-pivoine': () => <ArchePivoineDecor />,
  'brume-bleue': () => <BrumeBleueDecor />,
  confetti: () => <ConfettiDecor />,
  floraison: () => <FloraisonDecor />,
  grenat: () => <GrenatDecor />,
  hexagone: () => <HexagoneDecor />,
  kasai: () => <KasaiDecor />,
  mandala: () => (
    <>
      <FloralDamask color="#6E0F15" opacity={0.42} />
      <MandalaDecor />
    </>
  ),
  memoire: () => <MemoireDecor />,
  romance: () => <RomanceDecor />,
  'roses-dor': () => <RosesDorDecor />,
  'ruban-dor': () => <RubanDorDecor />,
  // The board is plain white paper: its voice is the script, not ornament.
  'mood-board': () => null,
}

/**
 * Where a page's content may start, in paper em — the card's own content
 * padding, so titles clear the corner bouquets exactly as on the card. The
 * sides are capped (the details grid needs its width on A4).
 */
const PAGE_INSET_EM: Record<string, { top: number; bottom: number }> = {
  'arche-soleil': { top: 4.6, bottom: 4.2 },
  'eternite-or': { top: 5.5, bottom: 5.5 },
  'heritage-luxe': { top: 5, bottom: 5 },
  'jardin-floral': { top: 4.6, bottom: 4.5 },
  'jardin-olive': { top: 6, bottom: 6 },
  'nuit-celeste': { top: 5.5, bottom: 5.5 },
  'sceau-academique': { top: 4.5, bottom: 4.5 },
  'arche-pivoine': { top: 11, bottom: 6 },
  'brume-bleue': { top: 12, bottom: 9 },
  confetti: { top: 7, bottom: 8 },
  floraison: { top: 7.2, bottom: 12 },
  grenat: { top: 7, bottom: 9 },
  hexagone: { top: 10.5, bottom: 10 },
  kasai: { top: 6.5, bottom: 3 },
  mandala: { top: 10, bottom: 5 },
  memoire: { top: 4, bottom: 4 },
  romance: { top: 8.5, bottom: 12 },
  'roses-dor': { top: 10, bottom: 12 },
  'ruban-dor': { top: 9, bottom: 12 },
}
const DEFAULT_INSET_PX = { top: 57.6, bottom: 57.6, x: 54.4 }
const DECORATED_SIDE_EM = 4.5

/** Content insets (px) of an exported page for this template. */
export function pageInset(templateKey: string, widthPx = A4_WIDTH_PX) {
  const inset = PAGE_INSET_EM[templateKey]
  if (!inset) return DEFAULT_INSET_PX
  const em = widthPx * PAPER_FONT_RATIO
  return {
    top: Math.max(DEFAULT_INSET_PX.top, inset.top * em),
    bottom: Math.max(DEFAULT_INSET_PX.bottom, inset.bottom * em),
    x: Math.max(DEFAULT_INSET_PX.x, DECORATED_SIDE_EM * em),
  }
}

export function PageDecor({ templateKey, widthPx = A4_WIDTH_PX }: { templateKey: string; widthPx?: number }) {
  const decor = PAGE_DECOR[templateKey]
  if (!decor) return <PanelDecor templateKey={templateKey} />
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ fontSize: `${widthPx * PAPER_FONT_RATIO}px` }}
      aria-hidden="true"
    >
      {decor()}
    </div>
  )
}

/** Whether the template's PDF pages draw its own decoration layer. */
export function hasPageDecor(templateKey: string) {
  return templateKey in PAGE_DECOR && templateKey !== 'mood-board'
}
