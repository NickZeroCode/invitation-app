/**
 * PDF page 4 — the verification QR page, dressed in the selected template's
 * own tone (paper, ornaments, title styling) like every other export page.
 *
 * Composition (A4, 794 × 1123 px):
 *   - a stylish invitation title (« Scannez pour confirmer la présence »),
 *   - the template's flourish under it,
 *   - an elegant arrow pointing down to the page's exact center.
 *
 * The white QR card, its soft shadow and the QR code itself are NOT part of
 * this page: the exporter draws them straight into the PDF at the page's
 * centre (see qrCard.ts), all from the same coordinates. Drawn
 * inside the captured page, the card's shadow drifted beside the code on
 * phones; this way they cannot part, and the QR stays a print-sharp PNG.
 */
import { TemplateOrnament } from './ornaments.tsx'
import { PageDecor, hasPageDecor } from './pageDecor.tsx'
import { panelSkinFor } from './panelSkin.tsx'

/** Full A4 height at 96dpi (794 × 297 ⁄ 210 ≈ 1122.5), one clean page. */
const A4_HEIGHT_PX = 1123
/** Invitation title on the verification page. */
export const QR_PAGE_TITLE = 'Scannez pour confirmer la présence'

/** Refined arrow: lozenge tip, long thin shaft, open chevron head. */
function ScanArrow({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 28 100"
      className="h-[100px] w-[28px]"
      fill="none"
      stroke={color}
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 1 l3.4 4.6 L14 10.2 L10.6 5.6 Z" fill={color} stroke="none" />
      <path d="M14 12 V 84" />
      <path d="M6.2 76.5 L 14 89 L 21.8 76.5" />
    </svg>
  )
}

export function ExportQrPage({ templateKey }: { templateKey: string }) {
  const skin = panelSkinFor(templateKey)
  // Over a template's own corner bouquets the title gets a soft halo of the
  // paper colour (its first solid tone), so it always reads cleanly.
  const paperTone = skin.paper.match(/#[0-9A-Fa-f]{6}/)?.[0] ?? '#FFFFFF'
  const halo = hasPageDecor(templateKey)
    ? `radial-gradient(closest-side, ${paperTone}F2 62%, ${paperTone}00)`
    : undefined

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: skin.paper,
        color: skin.ink,
        // The app loads Inter as « Inter Variable »: a plain 'Inter' never
        // matched, so each device fell back to its own sans (Arial, Helvetica…).
        fontFamily: "'Inter Variable', 'Inter', ui-sans-serif, system-ui, sans-serif",
        height: A4_HEIGHT_PX,
      }}
    >
      <PageDecor templateKey={templateKey} />

      {/* Title — the stylish invitation to scan. */}
      <div className="absolute inset-x-0 top-[4.4rem] px-[2.5rem] py-[3rem] text-center" style={{ background: halo }}>
        <h2
          className={`mx-auto max-w-[34rem] text-balance ${skin.titleScript ? 'leading-[1.08]' : 'leading-[1.24]'} ${skin.titleClass}`}
          style={{
            fontSize: skin.titleScript ? '4.4rem' : '2.65rem',
            letterSpacing: skin.titleScript ? undefined : '0.012em',
            fontFamily: skin.titleFont,
            color: skin.ink,
          }}
        >
          {QR_PAGE_TITLE}
        </h2>
        <TemplateOrnament
          templateKey={templateKey}
          color={skin.accent}
          className="mx-auto mt-7 block h-auto w-44"
        />
      </div>

      {/* Arrow — pointing straight at the QR card below. */}
      <div className="absolute top-[18.75rem]" style={{ left: 'calc(50% - 14px)' }}>
        <ScanArrow color={skin.accent} />
      </div>
    </div>
  )
}
