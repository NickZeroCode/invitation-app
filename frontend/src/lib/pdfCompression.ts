/**
 * PDF compression engine — keeps every exported invitation under 1 MB.
 *
 * The export captures each page once at print resolution (a ~300 dpi JPEG
 * "master"). Masters are far too heavy to ship: a four-page invitation weighs
 * several megabytes. Instead of re-running the slow DOM capture at a lower
 * quality, this engine decodes each master once and re-encodes it from memory
 * until the whole document fits a byte budget.
 *
 * Strategy
 * --------
 * 1. **Budget** — the caller hands over the bytes available to page images
 *    (PDF ceiling minus structure, QR code and safety margin).
 * 2. **Max-min fair sharing** — pages are served from the cheapest up and
 *    each gets an equal slice of what remains. A page whose master already
 *    fits its slice is left byte-for-byte untouched and its unused bytes flow
 *    to the heavier, photo-rich pages still waiting.
 * 3. **Fitting ladder** — a page that must shrink walks an ordered ladder of
 *    (resolution, minimum JPEG quality) rungs, best picture first. At the
 *    first rung whose floor can fit the page's share, a binary search finds
 *    the highest quality under budget — so slack is always spent on quality,
 *    and detail is shed gradually (quality and resolution step down together)
 *    rather than falling off a cliff. Pages are never upscaled.
 * 4. **Verification** (in `exportInvitationPdf`) — the real PDF blob is
 *    measured; if it is still over the ceiling the budget is tightened in
 *    proportion and the pages are re-fitted, and a last-resort pass applies
 *    the bottom of the ladder to every page so the ceiling always holds.
 *
 * Image decoding/encoding sits behind {@link PageDecoder} so the search logic
 * is pure and unit-testable; the canvas implementation is the default.
 */

/** Hard ceiling for an exported PDF (1 MB, decimal — safe under both readings). */
export const PDF_MAX_BYTES = 1_000_000
/** Size the engine aims for, leaving headroom for PDF structure drift. */
export const PDF_TARGET_BYTES = 940_000

const PDF_FIXED_OVERHEAD_BYTES = 6_000
const PDF_PAGE_OVERHEAD_BYTES = 1_800

/** Estimated non-image bytes of a PDF with `pageCount` pages. */
export function pdfOverheadBytes(pageCount: number): number {
  return PDF_FIXED_OVERHEAD_BYTES + PDF_PAGE_OVERHEAD_BYTES * pageCount
}

/** A rasterised PDF page: a JPEG data URL plus its layout size in CSS px. */
export interface PageRaster {
  dataUrl: string
  widthPx: number
  heightPx: number
}

/** One encoded JPEG and its exact size in bytes. */
export interface Encoded {
  dataUrl: string
  bytes: number
}

/** A page bitmap resampled to one width, ready to be encoded at any quality. */
export interface ResampledPage {
  encode(quality: number): Encoded
  dispose(): void
}

/** A decoded master page. */
export interface DecodedPage {
  readonly width: number
  readonly height: number
  resample(width: number): ResampledPage
  dispose(): void
}

/** Decodes a master data URL; resolves null when it cannot be decoded here. */
export type PageDecoder = (dataUrl: string) => Promise<DecodedPage | null>

/** Exact payload size of a base64 data URL, in bytes. */
export function dataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',')
  const body = comma >= 0 ? dataUrl.length - comma - 1 : dataUrl.length
  const padding = dataUrl.endsWith('==') ? 2 : dataUrl.endsWith('=') ? 1 : 0
  return Math.max(0, Math.floor((body * 3) / 4) - padding)
}

// ---------------------------------------------------------------------------
// The fitting ladder
// ---------------------------------------------------------------------------

const PAGE_WIDTH_MM = 210
/**
 * Fitting ladder, best picture first. Each rung is a resolution (dpi across
 * the A4 width) plus the lowest JPEG quality accepted at that resolution; the
 * engine takes the first rung that can fit the budget and then spends the
 * remaining slack on quality. Detail is shed gently — resolution and quality
 * step down together — because a flat template page survives lower JPEG
 * quality far better than it survives being blurred by a tiny resolution.
 */
const LADDER: ReadonlyArray<{ dpi: number; minQuality: number }> = [
  { dpi: 220, minQuality: 0.72 },
  { dpi: 180, minQuality: 0.7 },
  { dpi: 150, minQuality: 0.66 },
  { dpi: 150, minQuality: 0.55 },
  { dpi: 125, minQuality: 0.55 },
  { dpi: 125, minQuality: 0.45 },
  { dpi: 105, minQuality: 0.45 },
  { dpi: 105, minQuality: 0.36 },
  { dpi: 90, minQuality: 0.36 },
  { dpi: 90, minQuality: 0.28 },
  { dpi: 72, minQuality: 0.28 },
  { dpi: 60, minQuality: 0.22 },
]
/** Above this, extra bytes buy no visible improvement. */
const QUALITY_MAX = 0.92
const BISECT_STEPS = 6

const dpiToPx = (dpi: number): number => Math.round((PAGE_WIDTH_MM / 25.4) * dpi)

/** Highest quality in `[minQuality, QUALITY_MAX]` whose encoding fits `budget`. */
function searchQuality(
  resampled: ResampledPage,
  minQuality: number,
  budget: number,
): { encoded: Encoded; fits: boolean } {
  const floor = resampled.encode(minQuality)
  if (floor.bytes > budget) return { encoded: floor, fits: false }
  const ceiling = resampled.encode(QUALITY_MAX)
  if (ceiling.bytes <= budget) return { encoded: ceiling, fits: true }

  let best = floor
  let low = minQuality
  let high = QUALITY_MAX
  for (let step = 0; step < BISECT_STEPS; step += 1) {
    const mid = (low + high) / 2
    const candidate = resampled.encode(mid)
    if (candidate.bytes <= budget) {
      best = candidate
      low = mid
    } else {
      high = mid
    }
  }
  return { encoded: best, fits: true }
}

/**
 * Best encoding of `page` that fits `budget` bytes. When nothing fits (an
 * impossible budget) the smallest encoding on the ladder is returned.
 * Never upscales: a rung wider than the master is capped at the master.
 */
export function fitToBudget(page: DecodedPage, budget: number): Encoded {
  let smallest: Encoded | null = null
  let current: { width: number; resampled: ResampledPage } | null = null
  try {
    for (const rung of LADDER) {
      const width = Math.max(1, Math.min(page.width, dpiToPx(rung.dpi)))
      if (!current || current.width !== width) {
        current?.resampled.dispose()
        current = null
        current = { width, resampled: page.resample(width) }
      }
      const result = searchQuality(current.resampled, rung.minQuality, budget)
      if (result.fits) return result.encoded
      if (!smallest || result.encoded.bytes < smallest.bytes) smallest = result.encoded
    }
  } finally {
    current?.resampled.dispose()
  }
  if (!smallest) throw new Error('No encoding produced')
  return smallest
}
// ---------------------------------------------------------------------------
// Page set compression
// ---------------------------------------------------------------------------

export interface PageCompressor {
  /** Re-encode the pages so their images total at most `budgetBytes`. */
  fit(budgetBytes: number): Promise<PageRaster[]>
  /** Release every decoded master. */
  dispose(): void
}

/**
 * Compressor for one export. Masters are decoded lazily (only a page that
 * must shrink is ever decoded) and cached, so re-fitting with a tighter
 * budget after a verification miss costs encodes only.
 */
export function createPageCompressor(
  pages: readonly PageRaster[],
  decoder: PageDecoder,
): PageCompressor {
  const sizes = pages.map((page) => dataUrlBytes(page.dataUrl))
  const decoded = new Map<number, Promise<DecodedPage | null>>()

  const decode = (index: number): Promise<DecodedPage | null> => {
    let pending = decoded.get(index)
    if (!pending) {
      pending = decoder(pages[index].dataUrl).catch(() => null)
      decoded.set(index, pending)
    }
    return pending
  }

  return {
    async fit(budgetBytes: number): Promise<PageRaster[]> {
      const result = pages.slice()
      let remaining = Math.max(0, budgetBytes)
      const order = pages.map((_, index) => index).sort((a, b) => sizes[a] - sizes[b])

      // Max-min fair sharing: cheapest page first, each gets an equal slice of
      // what is left. A page needing less than its slice keeps its master and
      // hands the surplus to the heavier pages still waiting.
      for (const [position, index] of order.entries()) {
        const weight = sizes[index]
        const share = remaining / (order.length - position)

        let used = weight
        if (weight > share) {
          const source = await decode(index)
          if (source) {
            try {
              const encoded = fitToBudget(source, Math.floor(share))
              result[index] = { ...pages[index], dataUrl: encoded.dataUrl }
              used = encoded.bytes
            } catch (error) {
              console.warn('[pdfCompression] page kept at full size', error)
            }
          }
        }
        remaining = Math.max(0, remaining - used)
      }
      return result
    },

    dispose(): void {
      for (const pending of decoded.values()) {
        void pending.then((page) => page?.dispose())
      }
      decoded.clear()
    },
  }
}

// ---------------------------------------------------------------------------
// Canvas implementation
// ---------------------------------------------------------------------------

/** jsdom/happy-dom impersonate real browsers but have no 2D canvas. */
function canUseCanvas(): boolean {
  if (typeof document === 'undefined' || typeof navigator === 'undefined') return false
  if (/jsdom|happy-dom/i.test(navigator.userAgent)) return false
  try {
    return document.createElement('canvas').getContext('2d') != null
  } catch {
    return false
  }
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Page image could not be decoded'))
    image.src = dataUrl
  })
}

function drawOnWhite(source: CanvasImageSource, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('2d canvas unavailable')
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(source, 0, 0, width, height)
  return canvas
}

function releaseCanvas(canvas: HTMLCanvasElement): void {
  // Safari keeps canvas backing stores alive until they are shrunk.
  canvas.width = 0
  canvas.height = 0
}

/**
 * Resample to `targetWidth` by repeated halving: a single big drawImage jump
 * aliases thin ornament strokes, halving keeps them smooth.
 */
function resampleToCanvas(image: HTMLImageElement, targetWidth: number): HTMLCanvasElement {
  const targetHeight = Math.max(1, Math.round((targetWidth * image.naturalHeight) / image.naturalWidth))
  let source: CanvasImageSource = image
  let sourceWidth = image.naturalWidth
  let sourceHeight = image.naturalHeight
  let previous: HTMLCanvasElement | null = null

  while (sourceWidth / 2 >= targetWidth) {
    const stepWidth = Math.ceil(sourceWidth / 2)
    const stepHeight = Math.ceil(sourceHeight / 2)
    const step = drawOnWhite(source, stepWidth, stepHeight)
    if (previous) releaseCanvas(previous)
    previous = step
    source = step
    sourceWidth = stepWidth
    sourceHeight = stepHeight
  }

  const output = drawOnWhite(source, targetWidth, targetHeight)
  if (previous) releaseCanvas(previous)
  return output
}

/** Default decoder: browser image decode + canvas resample + JPEG encode. */
export const canvasDecoder: PageDecoder = async (dataUrl) => {
  if (!canUseCanvas()) return null
  let image: HTMLImageElement
  try {
    image = await loadImage(dataUrl)
  } catch {
    return null
  }
  const width = image.naturalWidth
  const height = image.naturalHeight
  if (!width || !height) return null

  return {
    width,
    height,
    resample(targetWidth: number): ResampledPage {
      const canvas = resampleToCanvas(image, targetWidth)
      return {
        encode(quality: number): Encoded {
          const encoded = canvas.toDataURL('image/jpeg', quality)
          return { dataUrl: encoded, bytes: dataUrlBytes(encoded) }
        },
        dispose(): void {
          releaseCanvas(canvas)
        },
      }
    },
    dispose(): void {
      image.removeAttribute('src')
    },
  }
}
