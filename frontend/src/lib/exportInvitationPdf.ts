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
import { toJpeg, toPng } from 'html-to-image'

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

/**
 * Hand the finished PDF to the browser as a real file download.
 *
 * A Blob object URL is used instead of a data URI: multi-megabyte data URIs
 * exceed browser URL limits and are blocked as top-level navigations on
 * mobile, so the click silently did nothing. The anchor is attached to the
 * document (required by Firefox / Safari for synthetic clicks) and the URL is
 * revoked once the download has had time to start.
 */
function triggerDownload(
  doc: { output(type: 'blob'): Blob; output(type: 'datauristring'): string },
  fileName: string,
): void {
  const anchor = document.createElement('a')
  anchor.download = fileName
  anchor.rel = 'noopener'
  anchor.style.display = 'none'

  let objectUrl: string | null = null
  const blob: unknown = doc.output('blob')
  if (blob instanceof Blob && typeof URL.createObjectURL === 'function') {
    objectUrl = URL.createObjectURL(
      blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' }),
    )
    anchor.href = objectUrl
  } else {
    anchor.href = doc.output('datauristring')
  }

  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  if (objectUrl) {
    const url = objectUrl
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }
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
      if (!dataUrl) return
      image.removeAttribute('srcset')
      image.loading = 'eager'
      image.setAttribute('src', dataUrl)
      // Mobile browsers decode lazily: wait until the pixels are ready so the
      // capture never snapshots an empty image box.
      await image.decode?.().catch(() => undefined)
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

/**
 * Largest canvas area every mobile browser can allocate (iOS Safari caps a
 * canvas at 16 777 216 px; beyond it the canvas silently comes back blank).
 * A safety margin keeps long cards well inside it.
 */
const MAX_CANVAS_AREA = 16_000_000

/** Print-grade pixel ratio that never exceeds the mobile canvas budget. */
function safePixelRatio(widthPx: number, heightPx: number): number {
  const target = Math.min(4, Math.max(2, TARGET_RASTER_PX / widthPx))
  const budget = Math.sqrt(MAX_CANVAS_AREA / Math.max(1, widthPx * heightPx))
  return Math.max(1, Math.min(target, budget))
}

/** True on WebKit engines: desktop Safari and every browser on iOS/iPadOS. */
function isWebKit(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const iOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
  const safari = /AppleWebKit/.test(ua) && !/Chrome|Chromium|Edg|OPR|Android/.test(ua)
  return iOS || safari
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

/** Photo fit modes that need explicit crop maths when compositing. */
type ObjectFit = 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'

/** A photo redrawn over the blank capture at its exact box. */
interface PhotoLayer {
  kind: 'photo'
  element: HTMLImageElement
  x: number
  y: number
  width: number
  height: number
  fit: ObjectFit
  radii: [number, number, number, number]
}

/** An element painted over a photo (cover scrim band, names, ornament). */
interface OverlayLayer {
  kind: 'overlay'
  element: HTMLElement
  x: number
  y: number
  width: number
  height: number
}

type CompositeLayer = PhotoLayer | OverlayLayer

/**
 * Can the WebKit compositing pass run here? Real browsers expose a 2D
 * canvas; jsdom and happy-dom do not — and their UA strings impersonate
 * Safari, so without this guard the tests would take the compositing path
 * blind and see different capture behaviour.
 */
function canCompositeRaster(): boolean {
  if (typeof navigator === 'undefined') return false
  if (/jsdom|happy-dom/i.test(navigator.userAgent)) return false
  try {
    return document.createElement('canvas').getContext('2d') != null
  } catch {
    return false
  }
}

function parseRadius(value: string, box: number): number {
  const trimmed = value.trim()
  const parsed = Number.parseFloat(trimmed)
  if (!Number.isFinite(parsed)) return 0
  return trimmed.endsWith('%') ? (box * parsed) / 100 : parsed
}

function effectiveZIndex(element: Element): number {
  const value = Number.parseInt(window.getComputedStyle(element).zIndex, 10)
  return Number.isFinite(value) ? value : 0
}

/**
 * The photos to redraw and the elements painted over them (the cover scrim
 * band and its names, decorative frames). The result keeps paint order —
 * document order within a z-index level, which is exactly how the invitation
 * templates stack their positioned layers.
 */
function collectCompositeLayers(node: HTMLElement): CompositeLayer[] {
  const nodeRect = node.getBoundingClientRect()
  const all = Array.from(node.querySelectorAll('*'))
  const boxOf = (element: Element) => {
    const rect = element.getBoundingClientRect()
    return {
      x: rect.left - nodeRect.left,
      y: rect.top - nodeRect.top,
      width: rect.width,
      height: rect.height,
    }
  }
  const overlaps = (
    a: { x: number; y: number; width: number; height: number },
    b: { x: number; y: number; width: number; height: number },
  ) =>
    Math.min(a.x + a.width, b.x + b.width) > Math.max(a.x, b.x) &&
    Math.min(a.y + a.height, b.y + b.height) > Math.max(a.y, b.y)

  const photos: PhotoLayer[] = []
  for (const image of Array.from(node.querySelectorAll('img'))) {
    const box = boxOf(image)
    if (box.width <= 0 || box.height <= 0) continue
    if (image.complete && image.naturalWidth === 0) continue
    const computed = window.getComputedStyle(image)
    const fit = computed.objectFit as ObjectFit
    photos.push({
      kind: 'photo',
      element: image,
      ...box,
      fit:
        fit === 'contain' || fit === 'cover' || fit === 'none' || fit === 'scale-down'
          ? fit
          : 'fill',
      radii: [
        parseRadius(computed.borderTopLeftRadius, Math.min(box.width, box.height)),
        parseRadius(computed.borderTopRightRadius, Math.min(box.width, box.height)),
        parseRadius(computed.borderBottomRightRadius, Math.min(box.width, box.height)),
        parseRadius(computed.borderBottomLeftRadius, Math.min(box.width, box.height)),
      ],
    })
  }

  const photoElements = new Set<Element>(photos.map((photo) => photo.element))
  const overlays: OverlayLayer[] = []
  for (const photo of photos) {
    const photoZ = effectiveZIndex(photo.element)
    for (const candidate of all) {
      if (candidate === photo.element) continue
      // Ancestors would repaint the photo's own area, descendants belong to
      // the photo's box, and other photos have their own layer.
      if (candidate.contains(photo.element) || photo.element.contains(candidate)) continue
      if (photoElements.has(candidate)) continue
      // Only positioned elements paint over an earlier positioned photo;
      // in-flow siblings paint below it.
      if (window.getComputedStyle(candidate).position === 'static') continue
      const z = effectiveZIndex(candidate)
      if (z < photoZ) continue
      if (
        z === photoZ &&
        (candidate.compareDocumentPosition(photo.element) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
      ) {
        continue
      }
      if (!overlaps(boxOf(candidate), photo)) continue
      if (overlays.some((overlay) => overlay.element === candidate)) continue
      overlays.push({ kind: 'overlay', element: candidate as HTMLElement, ...boxOf(candidate) })
    }
  }
  // When one overlay contains another, capturing the outer slice already
  // paints the inner one — keep the outermost only.
  const topOverlays = overlays.filter(
    (overlay) =>
      !overlays.some((other) => other !== overlay && other.element.contains(overlay.element)),
  )

  const order = new Map<Element, number>()
  all.forEach((element, position) => order.set(element, position))
  const layers: CompositeLayer[] = [...photos, ...topOverlays]
  layers.sort((a, b) => {
    const za = effectiveZIndex(a.element)
    const zb = effectiveZIndex(b.element)
    return za !== zb ? za - zb : (order.get(a.element) ?? 0) - (order.get(b.element) ?? 0)
  })
  return layers
}

function loadImageElement(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('image failed to load'))
    image.src = source
  })
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radii: readonly [number, number, number, number],
): void {
  const max = Math.min(width, height) / 2
  const tl = Math.max(0, Math.min(radii[0], max))
  const tr = Math.max(0, Math.min(radii[1], max))
  const br = Math.max(0, Math.min(radii[2], max))
  const bl = Math.max(0, Math.min(radii[3], max))
  ctx.beginPath()
  ctx.moveTo(x + tl, y)
  ctx.arcTo(x + width, y, x + width, y + height, tr)
  ctx.arcTo(x + width, y + height, x, y + height, br)
  ctx.arcTo(x, y + height, x, y, bl)
  ctx.arcTo(x, y, x + width, y, tl)
  ctx.closePath()
}

function drawPhotoLayer(
  ctx: CanvasRenderingContext2D,
  layer: PhotoLayer,
  photo: HTMLImageElement,
  scale: number,
): void {
  const x = layer.x * scale
  const y = layer.y * scale
  const width = layer.width * scale
  const height = layer.height * scale
  const naturalWidth = photo.naturalWidth || photo.width
  const naturalHeight = photo.naturalHeight || photo.height
  if (!naturalWidth || !naturalHeight) return
  const radii = layer.radii.map((radius) => radius * scale) as [number, number, number, number]
  ctx.save()
  roundedRectPath(ctx, x, y, width, height, radii)
  ctx.clip()
  let sx = 0
  let sy = 0
  let sw = naturalWidth
  let sh = naturalHeight
  let dx = x
  let dy = y
  let dw = width
  let dh = height
  if (layer.fit === 'cover') {
    const ratio = Math.max(width / naturalWidth, height / naturalHeight)
    sw = width / ratio
    sh = height / ratio
    sx = (naturalWidth - sw) / 2
    sy = (naturalHeight - sh) / 2
  } else if (layer.fit === 'contain' || layer.fit === 'scale-down') {
    const ratio =
      layer.fit === 'scale-down'
        ? Math.min(1, width / naturalWidth, height / naturalHeight)
        : Math.min(width / naturalWidth, height / naturalHeight)
    dw = naturalWidth * ratio
    dh = naturalHeight * ratio
    dx = x + (width - dw) / 2
    dy = y + (height - dh) / 2
  } else if (layer.fit === 'none') {
    dx = x + (width - naturalWidth) / 2
    dy = y + (height - naturalHeight) / 2
    dw = naturalWidth
    dh = naturalHeight
  }
  ctx.drawImage(photo, sx, sy, sw, sh, dx, dy, dw, dh)
  ctx.restore()
}

/**
 * Paint the blank capture, then every photo and every element that paints
 * over one, in paint order. The photos arrive at print scale and never go
 * through the engine's SVG decode race.
 */
async function compositeLayers(
  base: string,
  layers: CompositeLayer[],
  pixelRatio: number,
  widthPx: number,
  heightPx: number,
): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(widthPx * pixelRatio))
  canvas.height = Math.max(1, Math.round(heightPx * pixelRatio))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2d canvas unavailable')
  ctx.drawImage(await loadImageElement(base), 0, 0, canvas.width, canvas.height)
  for (const layer of layers) {
    if (layer.kind === 'photo') {
      const source = layer.element.currentSrc || layer.element.src
      if (!source) continue
      try {
        drawPhotoLayer(ctx, layer, await loadImageElement(source), pixelRatio)
      } catch {
        // One undrawable photo never takes the whole page down.
      }
      continue
    }
    // Overlays are captured as transparent PNG slices and redrawn at their
    // exact box so scrims, names and ornaments keep painting over the photo.
    const slice = await toPng(layer.element, {
      pixelRatio: safePixelRatio(layer.width, layer.height),
      backgroundColor: '',
      imagePlaceholder: IMAGE_PLACEHOLDER,
      onImageErrorHandler: () => undefined,
      includeStyleProperties: styleProperties(),
      style: {
        position: 'absolute' as const,
        left: '0px',
        top: '0px',
        right: 'auto',
        bottom: 'auto',
        margin: '0px',
        width: `${layer.width}px`,
        height: `${layer.height}px`,
      },
    })
    ctx.drawImage(
      await loadImageElement(slice),
      layer.x * pixelRatio,
      layer.y * pixelRatio,
      layer.width * pixelRatio,
      layer.height * pixelRatio,
    )
  }
  return canvas.toDataURL('image/jpeg', 0.95)
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
 *
 * On WebKit (Safari and every iOS browser) the engine snapshots the SVG
 * clone before its embedded photos finish decoding, which produced blank
 * photo boxes; the warm-up passes that papered over it doubled every
 * capture. Instead the node is captured without its photos and the photos —
 * plus the elements painted over them, like the cover names band — are
 * composited back at their exact boxes with object-fit and border-radius
 * honoured. Other engines capture in one pass exactly as before.
 */
async function captureRaster(node: HTMLElement): Promise<PageRaster> {
  const { widthPx, heightPx } = measure(node)
  const pixelRatio = safePixelRatio(widthPx, heightPx)
  const neutralized: Array<{ image: HTMLImageElement; source: string }> = []
  for (const image of Array.from(node.querySelectorAll('img'))) {
    const source = image.getAttribute('src') ?? ''
    if (source && !source.startsWith('data:')) {
      neutralized.push({ image, source })
      image.setAttribute('src', IMAGE_PLACEHOLDER)
    }
  }
  try {
    const options = {
      pixelRatio,
      quality: 0.95,
      backgroundColor: '#ffffff',
      imagePlaceholder: IMAGE_PLACEHOLDER,
      onImageErrorHandler: () => undefined,
      includeStyleProperties: styleProperties(),
      style: { position: 'static' as const, left: '0px', top: '0px' },
    }
    const layers = isWebKit() && canCompositeRaster() ? collectCompositeLayers(node) : []
    if (layers.length === 0) {
      const dataUrl = await toJpeg(node, options)
      return { dataUrl, widthPx, heightPx }
    }
    const hidden: Array<{ element: HTMLElement; visibility: string }> = []
    for (const layer of layers) {
      hidden.push({ element: layer.element, visibility: layer.element.style.visibility })
      layer.element.style.visibility = 'hidden'
    }
    let base: string
    try {
      base = await toJpeg(node, options)
    } finally {
      for (const entry of hidden) {
        entry.element.style.visibility = entry.visibility
      }
    }
    try {
      return {
        dataUrl: await compositeLayers(base, layers, pixelRatio, widthPx, heightPx),
        widthPx,
        heightPx,
      }
    } catch (error) {
      // Compositing is an optimisation: if it cannot run (tainted canvas,
      // allocation failure) the plain capture with visible photos wins.
      console.warn('[exportInvitationPdf] photo compositing skipped', error)
      const dataUrl = await toJpeg(node, options)
      return { dataUrl, widthPx, heightPx }
    }
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

    triggerDownload(doc, invitationPdfFileName(content.title, content.guestName))
  } finally {
    offscreen?.dispose()
  }
}
