/**
 * PDF export of a rendered invitation (jsPDF) — the printable file a guest or
 * the organizer downloads.
 *
 * Composition (A4 width, 210 mm, on every page):
 *
 *   1. Cover page — the template's own cover hero (photo + names in the
 *      template's tone), spanning the page edge to edge. Omitted when the
 *      event has no cover photo.
 *   2. Invitation card — exactly one page, full bleed with no decorative
 *      white margins: the rendered card with its cover and dress-code /
 *      programme blocks removed (`data-export-skip`), so the card never
 *      duplicates pages 1/3 and never splits across two pages.
 *   3. Dress code + programme — a dedicated page in the template's palette
 *      (LAC MUNKAMBA reference, p.3): dress-code gallery and a symmetric
 *      two-column programme with mirrored badge bullets.
 *   4. Verification QR page — the template's own paper tone and ornaments,
 *      a stylish « Scannez pour confirmer la présence » title with an arrow
 *      pointing to the QR code, overlaid print-sharp at the page's center.
 *
 * Page heights follow the content (only the width is the A4 width), so the
 * invitation card lands on a single page whatever its length.
 */
import { createElement } from 'react'
import type { ReactElement } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import QRCode from 'qrcode'
import { toJpeg } from 'html-to-image'

import { ExportDetailsPage } from '../templates/ExportDetailsPage.tsx'
import { ExportQrPage } from '../templates/ExportQrPage.tsx'
import { fontScaleStyle } from '../templates/fontSizes.ts'
import { getTemplate } from '../templates/registry.tsx'
import type { DressCodeEntry, InvitationDraft, ProgramEntry } from '../templates/types.ts'

/** A4 page: fixed width everywhere, full height only for the QR page. */
const A4_WIDTH_MM = 210
const A4_HEIGHT_MM = 297
/** A4 width at 96dpi — off-screen pages are built at this width. */
const PAGE_WIDTH_PX = 794
/** Target raster width ≈ 300dpi across the A4 width. */
const TARGET_RASTER_PX = 2480
/** QR code side on the verification page (mm). */
const QR_SIDE_MM = 70
/** Same palette as the on-screen QR panels. */
const QR_COLORS = { dark: '#1a261f', light: '#ffffff' }

export interface InvitationPdfContent {
  /** Live invitation card node (public page / editor preview). */
  cardNode?: HTMLElement | null
  /** Template key for the off-screen card render and the details page tone. */
  templateKey: string
  /** Card content for the off-screen render when `cardNode` is absent. */
  draft?: InvitationDraft
  /** Dress-code gallery (page 3). */
  dressCode: DressCodeEntry[]
  /** Programme steps (page 3). */
  program: ProgramEntry[]
  /** Invitation title (PDF metadata + file name). */
  title: string
  /** Guest display name (file name). */
  guestName?: string
  /** Verification URL encoded on the final QR page. */
  qrText?: string
}

interface PageRaster {
  dataUrl: string
  widthPx: number
  heightPx: number
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** `invitation-mariage-de-grace-et-eric[-m-eric-mukendi].pdf`. */
export function invitationPdfFileName(title: string, guestName?: string): string {
  const base = slugify(title) || 'invitation'
  const guest = guestName ? slugify(guestName) : ''
  return `invitation-${base}${guest ? `-${guest}` : ''}.pdf`
}

function triggerDownload(dataUrl: string, fileName: string): void {
  const anchor = document.createElement('a')
  anchor.href = dataUrl
  anchor.download = fileName
  anchor.click()
}

/**
 * Fetch a remote image and inline it as a data URL (CORS-friendly capture).
 * Anything that is not a real image payload (SPA fallback HTML, storage XML
 * error bodies, …) counts as a failure — those would rasterize as broken
 * image icons.
 */
async function fetchAsDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const blob = await response.blob()
    if (blob.type && !blob.type.startsWith('image/')) return null
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

/**
 * Swap every remote image inside `node` for an inlined data URL so the capture
 * can embed it (presigned storage URLs break under html-to-image's cacheBust).
 * Images that cannot be fetched are left untouched on screen and neutralized
 * with a transparent placeholder at capture time instead.
 */
async function inlineImages(node: HTMLElement): Promise<void> {
  const images = Array.from(node.querySelectorAll('img'))
  await Promise.all(
    images.map(async (image) => {
      const src = image.getAttribute('src') ?? ''
      if (!src || src.startsWith('data:')) return
      const dataUrl = await fetchAsDataUrl(src)
      if (dataUrl) image.setAttribute('src', dataUrl)
    }),
  )
}

function measure(node: HTMLElement): { widthPx: number; heightPx: number } {
  const rect = node.getBoundingClientRect()
  const widthPx = node.offsetWidth || rect.width || PAGE_WIDTH_PX
  const heightPx =
    node.offsetHeight || rect.height || (widthPx * A4_HEIGHT_MM) / A4_WIDTH_MM
  return { widthPx, heightPx }
}

/** Verified 1×1 transparent PNG — stands in for images that cannot be inlined. */
const IMAGE_PLACEHOLDER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgAAIAAAUAAXpeqz8AAAAASUVORK5CYII='

/**
 * Computed style properties copied onto the capture clone. Chrome reports
 * the legacy `-webkit-border-image` shorthand with an implicit `fill`
 * keyword; replayed on the clone it floods the whole box with the border
 * gradient (the gilt edge turned entire cards gold). The standard
 * `border-image` longhands carry the correct, unfilled value.
 */
let captureStyleProperties: string[] | null = null
function styleProperties(): string[] {
  if (!captureStyleProperties) {
    captureStyleProperties = Array.from(
      window.getComputedStyle(document.documentElement),
    ).filter((name) => name !== '-webkit-border-image')
  }
  return captureStyleProperties
}

/**
 * Rasterize a node at print resolution (JPEG for compact pages).
 *
 * The capture is made bullet-proof:
 * - no cache-busting (it corrupts presigned storage URLs),
 * - images that could not be inlined are temporarily replaced by a
 *   transparent placeholder so the clone never paints a broken-image icon
 *   (storage XML errors and SPA fallback pages come back as fake images),
 * - broken images resolve to a transparent placeholder instead of rejecting
 *   the whole capture (which used to fail the export),
 * - the clone is forced back on-canvas — the off-screen host's `position:
 *   fixed` is copied onto the clone and would paint 20 000 px outside the
 *   capture viewport (blank page).
 */
async function captureRaster(node: HTMLElement): Promise<PageRaster> {
  const { widthPx, heightPx } = measure(node)
  const pixelRatio = Math.min(4, Math.max(2, TARGET_RASTER_PX / widthPx))
  const neutralized: Array<{ image: HTMLImageElement; source: string }> = []
  for (const image of Array.from(node.querySelectorAll('img'))) {
    const source = image.getAttribute('src') ?? ''
    if (source && !source.startsWith('data:')) {
      neutralized.push({ image, source })
      image.setAttribute('src', IMAGE_PLACEHOLDER)
    }
  }
  try {
    const dataUrl = await toJpeg(node, {
      pixelRatio,
      quality: 0.95,
      backgroundColor: '#ffffff',
      imagePlaceholder: IMAGE_PLACEHOLDER,
      onImageErrorHandler: () => undefined,
      includeStyleProperties: styleProperties(),
      style: { position: 'static', left: '0px', top: '0px' },
    })
    return { dataUrl, widthPx, heightPx }
  } finally {
    for (const entry of neutralized) {
      entry.image.setAttribute('src', entry.source)
    }
  }
}

/**
 * Render a React element off-screen at the A4 page width.
 *
 * The returned node is the inner static wrapper, not the fixed-position host:
 * html-to-image copies every computed style of its target onto the clone, so
 * capturing the host would reproduce `position: fixed; left: -20000px` inside
 * the capture and rasterize a blank page. The inner wrapper is in normal flow
 * and captures exactly like the live card.
 */
function renderOffscreen(
  element: ReactElement,
): { node: HTMLElement; dispose: () => void } {
  const host = document.createElement('div')
  host.style.cssText = `position:fixed;left:-20000px;top:0;width:${PAGE_WIDTH_PX}px;pointer-events:none;`
  const page = document.createElement('div')
  page.style.cssText = 'position:static;'
  host.appendChild(page)
  document.body.appendChild(host)
  const root = createRoot(page)
  flushSync(() => {
    root.render(element)
  })
  return {
    node: page,
    dispose: () => {
      root.unmount()
      host.remove()
    },
  }
}

function pageHeightMm(page: PageRaster): number {
  return (A4_WIDTH_MM * page.heightPx) / page.widthPx
}

/**
 * Build and download the invitation PDF. Page 1 is the cover photo (when
 * present), page 2 the full-bleed invitation card, page 3 the dress code and
 * programme, and the last page the centered verification QR code.
 */
export async function exportInvitationPdf(content: InvitationPdfContent): Promise<void> {
  const pages: PageRaster[] = []
  let offscreen: { node: HTMLElement; dispose: () => void } | null = null

  try {
    if (document.fonts?.ready) {
      await document.fonts.ready.catch(() => undefined)
    }

    let cardNode = content.cardNode
    if (!cardNode) {
      const template = getTemplate(content.templateKey)
      const draft = content.draft
      if (!template || !draft) {
        throw new Error('A rendered card node or a template draft is required.')
      }
      offscreen = renderOffscreen(
        createElement(
          'div',
          {
            style: {
              ...fontScaleStyle(draft.fontSize),
              background: '#ffffff',
            },
          },
          createElement(template.Component, { draft }),
        ),
      )
      cardNode = offscreen.node
    }

    // Inline every remote image once (cover, card and its hidden sections
    // alike) so no capture ever depends on network access or expiring
    // storage URLs — those used to fail the whole export.
    await inlineImages(cardNode)

    const skipped = Array.from(cardNode.querySelectorAll<HTMLElement>('[data-export-skip]'))

    // Page 1 — the template's cover hero, full bleed (needs an inlined photo).
    const cover = cardNode.querySelector<HTMLElement>('[data-export-skip="cover"]')
    if (cover) {
      const coverImage = cover.querySelector('img')
      if (coverImage && (coverImage.getAttribute('src') ?? '').startsWith('data:')) {
        pages.push(await captureRaster(cover))
      }
    }

    // Page 2 — the card alone, one page, with cover and sections stripped.
    const restore = skipped.map((element) => ({ element, display: element.style.display }))
    restore.forEach(({ element }) => {
      element.style.display = 'none'
    })
    try {
      pages.push(await captureRaster(cardNode))
    } finally {
      restore.forEach(({ element, display }) => {
        element.style.display = display
      })
    }

    // Page 3 — dress code + programme on the template's paper tone.
    if (content.dressCode.length || content.program.length) {
      const details = renderOffscreen(
        createElement(ExportDetailsPage, {
          templateKey: content.templateKey,
          dressCode: content.dressCode,
          program: content.program,
        }),
      )
      try {
        await inlineImages(details.node)
        pages.push(await captureRaster(details.node))
      } catch (error) {
        console.warn('[exportInvitationPdf] details page skipped', error)
      } finally {
        details.dispose()
      }
    }

    // Page 4 — the styled verification page (template tone + title + arrow),
    // with the QR generated at print resolution and overlaid as a crisp PNG.
    let qrPage: PageRaster | null = null
    let qrDataUrl = ''
    if (content.qrText) {
      qrDataUrl = await QRCode.toDataURL(content.qrText, {
        width: 1200,
        margin: 1,
        color: QR_COLORS,
      })
      const qrBackground = renderOffscreen(
        createElement(ExportQrPage, { templateKey: content.templateKey }),
      )
      try {
        qrPage = await captureRaster(qrBackground.node)
      } catch (error) {
        console.warn('[exportInvitationPdf] QR page background skipped', error)
      } finally {
        qrBackground.dispose()
      }
    }

    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({
      unit: 'mm',
      format: [A4_WIDTH_MM, pageHeightMm(pages[0] as PageRaster)],
      orientation: 'portrait',
      compress: true,
    })
    doc.setProperties({
      title: content.title,
      subject: 'Invitation',
      creator: 'NickEvents',
    })
    pages.forEach((page, index) => {
      const height = pageHeightMm(page)
      if (index > 0) doc.addPage([A4_WIDTH_MM, height], 'portrait')
      doc.addImage(page.dataUrl, 'JPEG', 0, 0, A4_WIDTH_MM, height)
    })

    if (qrDataUrl) {
      doc.addPage([A4_WIDTH_MM, A4_HEIGHT_MM], 'portrait')
      if (qrPage) {
        doc.addImage(qrPage.dataUrl, 'JPEG', 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM)
      }
      doc.addImage(
        qrDataUrl,
        'PNG',
        (A4_WIDTH_MM - QR_SIDE_MM) / 2,
        (A4_HEIGHT_MM - QR_SIDE_MM) / 2,
        QR_SIDE_MM,
        QR_SIDE_MM,
      )
    }

    triggerDownload(doc.output('datauristring'), invitationPdfFileName(content.title, content.guestName))
  } finally {
    offscreen?.dispose()
  }
}
