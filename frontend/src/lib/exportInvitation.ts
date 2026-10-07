/**
 * Invitation card export (PNG / JPG).
 *
 * The export captures the rendered template DOM — the exact artwork the guest
 * sees — and embeds webfonts, so the downloaded card matches the on-screen
 * design instead of a simplified canvas re-drawing.
 */
import { toJpeg, toPng } from 'html-to-image'

export type InvitationExportFormat = 'png' | 'jpg'

/** Retina-sharp output that still keeps file sizes shareable (WhatsApp, email). */
const PIXEL_RATIO = 2
const JPEG_QUALITY = 0.95

/** Accented-safe, URL/filesystem-safe slug: "Mariage de Grâce" → "mariage-de-grace". */
function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function invitationExportFileName(
  title: string,
  guestName: string | undefined,
  format: InvitationExportFormat,
): string {
  const parts = ['invitation', slugify(title), guestName ? slugify(guestName) : ''].filter(
    (part) => part.length > 0,
  )
  return `${parts.join('-') || 'invitation'}.${format}`
}

/** JPEG has no alpha channel: give it the card's own background (or white). */
function resolveBackground(node: HTMLElement): string {
  const background = typeof getComputedStyle === 'function' ? getComputedStyle(node).backgroundColor : ''
  const transparent = !background || background === 'transparent' || /rgba\(\s*0,\s*0,\s*0,\s*0\s*\)/.test(background)
  return transparent ? '#ffffff' : background
}

function triggerDownload(dataUrl: string, fileName: string): void {
  const link = document.createElement('a')
  link.download = fileName
  link.href = dataUrl
  link.click()
}

export async function exportInvitationImage(
  node: HTMLElement,
  format: InvitationExportFormat,
  fileName: string,
): Promise<void> {
  const options = { pixelRatio: PIXEL_RATIO, cacheBust: true }
  const dataUrl =
    format === 'png'
      ? await toPng(node, options)
      : await toJpeg(node, { ...options, quality: JPEG_QUALITY, backgroundColor: resolveBackground(node) })
  triggerDownload(dataUrl, fileName)
}
