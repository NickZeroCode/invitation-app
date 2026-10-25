/**
 * The verification page's white QR card. The exporter paints it straight into
 * the PDF, centred with the QR code (see `renderQrCard`), so the card and its
 * shadow always sit exactly behind the code, on every device.
 */

/** White QR card side: 84 mm — the 70 mm QR lands centered inside it. */
export const QR_CARD_PX = 317.6
/** The card's look, in page px (the exporter paints it in the PDF). */
export const QR_CARD_STYLE = {
  radiusPx: 22,
  shadow: { offsetYPx: 24, blurPx: 60, color: 'rgba(0, 0, 0, 0.14)' },
  ring: 'rgba(0, 0, 0, 0.05)',
} as const
