/**
 * Invitation card export (JPG).
 *
 * The export captures the rendered template DOM — the exact artwork the guest
 * sees — and embeds webfonts, so the downloaded picture matches the on-screen
 * design instead of a simplified canvas re-drawing. Cover photographs are
 * excluded from the capture (elements marked `data-export-skip`): they live on
 * cross-origin storage the capture cannot embed, and the downloaded picture is
 * designed as a type-and-QR artifact. The card is captured
 * together with a small verification band (QR code + caption) appended below
 * it, so the downloaded picture carries its own QR code. The capture measures
 * the full scroll size of the content — nothing below the fold can be
 * truncated — and scales the output to a minimum width so downloads stay
 * sharp even from narrow phone screens.
 */
import { toJpeg } from 'html-to-image'

/** Sharable downloads (WhatsApp, email) must stay crisp: at least this wide. */
const MIN_OUTPUT_WIDTH = 1200
const PIXEL_RATIO_FLOOR = 2
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

export function invitationExportFileName(title: string, guestName: string | undefined): string {
  const parts = ['invitation', slugify(title), guestName ? slugify(guestName) : ''].filter(
    (part) => part.length > 0,
  )
  return `${parts.join('-') || 'invitation'}.jpg`
}

function triggerDownload(dataUrl: string, fileName: string): void {
  const link = document.createElement('a')
  link.download = fileName
  link.href = dataUrl
  link.click()
}

/**
 * Verification band appended below the card for the export only: the QR code
 * the guest sees on the page, plus a caption. Plain inline styles so the
 * capture (which inlines computed styles) renders it identically everywhere.
 */
function buildQrBand(qrDataUrl: string): HTMLDivElement {
  const band = document.createElement('div')
  band.setAttribute('aria-hidden', 'true')
  band.style.cssText =
    'display:flex;align-items:center;justify-content:center;gap:16px;' +
    'padding:18px 20px;background:#ffffff;border-top:1px solid rgba(28,25,23,0.10);' +
    'font-family:Inter,ui-sans-serif,system-ui,sans-serif'

  const qr = document.createElement('img')
  qr.src = qrDataUrl
  qr.alt = ''
  qr.style.cssText = 'width:76px;height:76px;flex-shrink:0'

  const copy = document.createElement('div')
  copy.style.cssText = 'display:flex;flex-direction:column;gap:3px'

  const title = document.createElement('p')
  title.style.cssText = 'margin:0;font-size:13px;font-weight:600;letter-spacing:0.02em;color:#1c1917'
  title.textContent = 'Invitation vérifiée par QR code'

  const sub = document.createElement('p')
  sub.style.cssText = 'margin:0;font-size:10.5px;letter-spacing:0.04em;color:#6b6560'
  sub.textContent = 'Scannez ce code pour vérifier l’invitation · NickEvents'

  copy.append(title, sub)
  band.append(qr, copy)
  return band
}

export async function exportInvitationImage(
  node: HTMLElement,
  fileName: string,
  options: { qrDataUrl?: string } = {},
): Promise<void> {
  const parent = node.parentNode
  if (!parent) throw new Error('Export target is detached')

  // Temporary capture wrapper: the card plus the QR band, as one column.
  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:stretch'
  parent.insertBefore(wrapper, node)
  wrapper.appendChild(node)
  if (options.qrDataUrl) wrapper.appendChild(buildQrBand(options.qrDataUrl))

  // Cover photographs are left out of the downloaded picture: hiding them
  // before measuring also removes their space, so the capture has no blank
  // hole where the photo sits on the page. Exact previous inline state is
  // restored afterwards.
  const skipped = Array.from(
    wrapper.querySelectorAll<HTMLElement>('[data-export-skip]'),
  ).map((element) => ({ element, display: element.style.display }))
  for (const { element } of skipped) {
    element.style.display = 'none'
  }

  try {
    // Explicit scroll dimensions keep long invitations complete: the capture
    // must cover the full content, not just the visible/offset box (which is
    // clipped when the card lives inside a fixed-height preview frame).
    const width = Math.ceil(wrapper.scrollWidth || node.scrollWidth) || undefined
    const height = Math.ceil(wrapper.scrollHeight || node.scrollHeight) || undefined
    const baseWidth = node.offsetWidth || node.clientWidth || 600
    const pixelRatio = Math.max(PIXEL_RATIO_FLOOR, MIN_OUTPUT_WIDTH / baseWidth)
    const dataUrl = await toJpeg(wrapper, {
      pixelRatio,
      cacheBust: true,
      quality: JPEG_QUALITY,
      backgroundColor: '#ffffff',
      width,
      height,
    })
    triggerDownload(dataUrl, fileName)
  } finally {
    for (const { element, display } of skipped) {
      element.style.display = display
    }
    parent.insertBefore(node, wrapper)
    wrapper.remove()
  }
}
