/**
 * PDF page 4 — the verification QR page, dressed in the selected template's
 * own tone (paper, ornaments, title styling) like every other export page.
 *
 * Composition (A4, 794 × 1123 px):
 *   - a stylish invitation title (« Scannez pour confirmer la présence »),
 *   - the template's flourish under it,
 *   - an elegant arrow pointing down to the page's exact center,
 *   - a soft white card at the center, where the exporter overlays the
 *     print-resolution QR code (a crisp PNG at 70 × 70 mm).
 *
 * The QR itself is never rasterized into this page: it stays a sharp PNG
 * placed by jsPDF, so scanning is print-perfect.
 */
import { TemplateOrnament } from './ornaments.tsx'
import { PanelDecor, panelSkinFor } from './panelSkin.tsx'

/** Full A4 height at 96dpi (794 × 297 ⁄ 210 ≈ 1122.5), one clean page. */
const A4_HEIGHT_PX = 1123
/** White QR card side: 84 mm — the 70 mm QR lands centered inside it. */
const QR_CARD_PX = 317.6
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

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: skin.paper,
        color: skin.ink,
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        height: A4_HEIGHT_PX,
      }}
    >
      <PanelDecor templateKey={templateKey} />

      {/* Title — the stylish invitation to scan. */}
      <div className="absolute inset-x-0 top-[7.4rem] px-[4.5rem] text-center">
        <h2
          className={`mx-auto max-w-[34rem] text-balance leading-[1.24] ${skin.titleClass}`}
          style={{ fontSize: '2.65rem', letterSpacing: '0.012em', color: skin.ink }}
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
      <div className="absolute left-1/2 top-[18.75rem] -translate-x-1/2">
        <ScanArrow color={skin.accent} />
      </div>

      {/* QR card at the page's exact center — the exporter overlays the QR. */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: QR_CARD_PX,
          height: QR_CARD_PX,
          background: '#ffffff',
          borderRadius: 22,
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.14), 0 0 0 1px rgba(0, 0, 0, 0.05)',
        }}
      />
    </div>
  )
}
