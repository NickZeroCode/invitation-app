/**
 * Image loading for the PDF export — every picture the PDF needs (cover,
 * dress-code gallery) is fetched, validated and inlined as a data URL BEFORE
 * any page is rendered, so a capture never depends on the network.
 *
 * Why this exists: an image that failed to load used to be swapped for a blank
 * placeholder at capture time, and the export still "succeeded" — the PDF came
 * out with an empty bordered box where the dress-code photo should be. The
 * failure modes behind it, all handled here:
 *
 * - **Expired presigned URLs** (storage links live one hour; an editor tab
 *   left open past that exports with dead links): on a 403/404/network failure
 *   the caller's `refresh` hook re-reads the event once and the image is
 *   retried with its fresh URL.
 * - **Wrong `Content-Type`** (S3-compatible stores serve `octet-stream` when
 *   the upload carried no type, notably for WebP): the bytes are sniffed, the
 *   header is never trusted.
 * - **Transient network / 5xx / slow mobile links**: per-attempt timeout plus
 *   backed-off retries, with bounded concurrency so parallel multi-megabyte
 *   downloads do not starve each other.
 * - **Poisoned HTTP cache** (an earlier plain `<img>` load cached the response
 *   without CORS headers): the second attempt bypasses the cache.
 * - **Oversized photos** (4 MB uploads): decoded and re-sampled to a bounded
 *   size, which also keeps the page capture's SVG payload small.
 * - **Missing CORS configuration** is detected (a `no-cors` probe reaches the
 *   host while the CORS fetch does not) and reported instead of retried.
 *
 * Anything that still cannot be loaded is reported, never rendered as an
 * empty box: the caller drops it and tells the user.
 */
import type { DressCodeEntry } from '../templates/types.ts'
import { canUseCanvas, loadImage, releaseCanvas, resampleToCanvas } from './pdfCompression.ts'

export type ImageFailure = 'forbidden' | 'missing' | 'cors' | 'network' | 'invalid'

export type ImageLoad = { ok: true; dataUrl: string } | { ok: false; reason: ImageFailure }

/** Fresh storage URLs, as returned by the caller's `refresh` hook. */
export interface RefreshedImageUrls {
  cover?: string | null
  dressCode?: Array<{ id?: number; url: string }>
}

export interface ImageLoaderOptions {
  /** Re-reads the event so expired presigned URLs can be replaced (called once). */
  refresh?: () => Promise<RefreshedImageUrls | null>
  /** Defaults to the global `fetch` (resolved at call time). */
  fetcher?: typeof fetch
  /** Per-attempt budget, headers and body included. Default 25 s. */
  timeoutMs?: number
  /** Waits before the extra attempts that follow a transient failure. */
  backoffMs?: readonly number[]
  /** Simultaneous downloads. Default 3. */
  concurrency?: number
  /** Injectable for tests. */
  sleep?: (ms: number) => Promise<void>
}

/** Longest edge kept for dress-code photos (shown ~240 px wide on the page). */
export const DRESS_CODE_MAX_EDGE = 1600
/** Longest edge kept for pictures on the card itself (cover: full page width). */
export const CARD_IMAGE_MAX_EDGE = 2600
/** Above this many bytes a photo is re-encoded even when its edge is small. */
const MAX_RAW_BYTES = 1_800_000
const REENCODE_QUALITY = 0.9

const DEFAULT_TIMEOUT_MS = 25_000
const DEFAULT_BACKOFF_MS: readonly number[] = [600, 1_600]
const DEFAULT_CONCURRENCY = 3

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

const ascii = (bytes: Uint8Array, start: number, end: number): string =>
  String.fromCharCode(...bytes.subarray(start, end))

/** Image type from the file's magic bytes (null when it is not a known image). */
export function sniffImageMime(
  bytes: Uint8Array,
): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg'
  }
  if (bytes.length >= 8 && bytes[0] === 0x89 && ascii(bytes, 1, 4) === 'PNG') return 'image/png'
  if (bytes.length >= 6 && ascii(bytes, 0, 4) === 'GIF8') return 'image/gif'
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === 'WEBP') {
    return 'image/webp'
  }
  return null
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunk = 0x8000
  for (let offset = 0; offset < bytes.length; offset += chunk) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunk))
  }
  return btoa(binary)
}

/**
 * Validate the picture really decodes and bound its size. Outside a real
 * browser (no canvas) the verified bytes are inlined as they are.
 */
async function normalizeImage(
  bytes: Uint8Array,
  mime: string,
  maxEdge: number,
): Promise<string | null> {
  const raw = `data:${mime};base64,${toBase64(bytes)}`
  if (!canUseCanvas()) return raw

  let image: HTMLImageElement
  try {
    image = await loadImage(raw)
  } catch {
    return null
  }
  const width = image.naturalWidth
  const height = image.naturalHeight
  if (!width || !height) return null

  const longest = Math.max(width, height)
  if (longest <= maxEdge && bytes.length <= MAX_RAW_BYTES) return raw

  const targetWidth = Math.max(1, Math.round(width * Math.min(1, maxEdge / longest)))
  try {
    const canvas = resampleToCanvas(image, targetWidth)
    try {
      return canvas.toDataURL('image/jpeg', REENCODE_QUALITY)
    } finally {
      releaseCanvas(canvas)
    }
  } catch {
    // Resampling is an optimisation: the verified original still embeds.
    return raw
  }
}

async function mapLimit<T, R>(
  items: readonly T[],
  limit: number,
  task: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let next = 0
  const worker = async (): Promise<void> => {
    while (next < items.length) {
      const index = next
      next += 1
      results[index] = await task(items[index], index)
    }
  }
  await Promise.all(Array.from({ length: Math.min(Math.max(1, limit), items.length) }, worker))
  return results
}

const isRefreshable = (reason: ImageFailure): boolean =>
  reason === 'forbidden' || reason === 'missing' || reason === 'network'

// ---------------------------------------------------------------------------
// The loader
// ---------------------------------------------------------------------------

interface Attempt {
  result: ImageLoad
  /** Worth retrying later (network error, timeout, 5xx/408/429). */
  transient: boolean
  /** The request itself threw — no HTTP status came back. */
  threw: boolean
}

export interface ImageLoader {
  /** One URL, with retries, sniffing and size bounding. Never throws. */
  load(url: string, maxEdge: number): Promise<ImageLoad>
  /** A picture on the card; the cover may be refreshed when its URL expired. */
  loadCardImage(url: string, isCover: boolean): Promise<ImageLoad>
  /** The dress-code gallery: loaded images inlined, unloadable ones dropped. */
  loadDressCode(entries: readonly DressCodeEntry[]): Promise<{
    entries: DressCodeEntry[]
    missing: number
  }>
}

export function createImageLoader(options: ImageLoaderOptions = {}): ImageLoader {
  const fetcher: typeof fetch = options.fetcher ?? ((input, init) => fetch(input, init))
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const backoff = options.backoffMs ?? DEFAULT_BACKOFF_MS
  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY
  const sleep =
    options.sleep ?? ((ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms)))

  let refreshed: Promise<RefreshedImageUrls | null> | null = null
  const refresh = (): Promise<RefreshedImageUrls | null> => {
    if (!options.refresh) return Promise.resolve(null)
    refreshed ??= options.refresh().catch(() => null)
    return refreshed
  }

  async function fetchOnce(url: string, cache: RequestCache, maxEdge: number): Promise<Attempt> {
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), timeoutMs)
    try {
      const response = await fetcher(url, { cache, signal: controller.signal })
      if (!response.ok) {
        const { status } = response
        const reason: ImageFailure =
          status === 404 || status === 410
            ? 'missing'
            : status === 401 || status === 403
              ? 'forbidden'
              : 'network'
        return {
          result: { ok: false, reason },
          transient: status >= 500 || status === 408 || status === 429,
          threw: false,
        }
      }
      const bytes = new Uint8Array(await response.arrayBuffer())
      const mime = sniffImageMime(bytes)
      if (!mime) return { result: { ok: false, reason: 'invalid' }, transient: false, threw: false }
      const dataUrl = await normalizeImage(bytes, mime, maxEdge)
      return dataUrl
        ? { result: { ok: true, dataUrl }, transient: false, threw: false }
        : { result: { ok: false, reason: 'invalid' }, transient: false, threw: false }
    } catch {
      return { result: { ok: false, reason: 'network' }, transient: true, threw: true }
    } finally {
      window.clearTimeout(timer)
    }
  }

  /** True when the host answers a `no-cors` request the CORS fetch could not. */
  async function reachableWithoutCors(url: string): Promise<boolean> {
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), Math.min(timeoutMs, 8_000))
    try {
      await fetcher(url, { mode: 'no-cors', cache: 'no-store', signal: controller.signal })
      return true
    } catch {
      return false
    } finally {
      controller.abort()
      window.clearTimeout(timer)
    }
  }

  async function loadUrl(url: string, maxEdge: number): Promise<ImageLoad> {
    if (url.startsWith('data:')) return { ok: true, dataUrl: url }

    let last: ImageLoad = { ok: false, reason: 'network' }
    let probed = false
    // Attempt 1 uses the HTTP cache; every later one bypasses it, so a cached
    // response without CORS headers or a cached error never wins twice.
    for (let attempt = 0; ; attempt += 1) {
      const outcome = await fetchOnce(url, attempt === 0 ? 'default' : 'no-store', maxEdge)
      if (outcome.result.ok) return outcome.result
      last = outcome.result

      if (outcome.threw && attempt >= 1 && !probed) {
        probed = true
        if (await reachableWithoutCors(url)) return { ok: false, reason: 'cors' }
      }
      // The no-store retry is always granted; extra attempts only for
      // transient failures, with growing pauses.
      if (attempt === 0) continue
      const pause = backoff[attempt - 1]
      if (!outcome.transient || pause === undefined) break
      await sleep(pause)
    }
    return last
  }

  // Bounded concurrency across the whole export.
  let active = 0
  const waiting: Array<() => void> = []
  async function load(url: string, maxEdge: number): Promise<ImageLoad> {
    if (active >= concurrency) await new Promise<void>((resolve) => waiting.push(resolve))
    active += 1
    try {
      return await loadUrl(url, maxEdge)
    } finally {
      active -= 1
      waiting.shift()?.()
    }
  }

  return {
    load,

    async loadCardImage(url, isCover) {
      const first = await load(url, CARD_IMAGE_MAX_EDGE)
      if (first.ok || !isCover || !isRefreshable(first.reason)) return first
      const fresh = (await refresh())?.cover
      if (!fresh || fresh === url) return first
      return load(fresh, CARD_IMAGE_MAX_EDGE)
    },

    async loadDressCode(entries) {
      const loaded = await mapLimit(entries, concurrency, (entry) => load(entry.url, DRESS_CODE_MAX_EDGE))

      const retry = loaded
        .map((result, index) => ({ result, index }))
        .filter(({ result }) => !result.ok && isRefreshable(result.reason))
      if (retry.length > 0) {
        const fresh = (await refresh())?.dressCode ?? []
        await mapLimit(retry, concurrency, async ({ index }) => {
          const entry = entries[index]
          // Match the fresh list by stored id when the entry has one, else by
          // position (the refreshed list comes from the same ordered set).
          const replacement =
            entry.id !== undefined
              ? fresh.find((candidate) => candidate.id === entry.id)
              : fresh[index]
          if (!replacement || replacement.url === entry.url) return
          loaded[index] = await load(replacement.url, DRESS_CODE_MAX_EDGE)
        })
      }

      const kept: DressCodeEntry[] = []
      let missing = 0
      loaded.forEach((result, index) => {
        if (result.ok) kept.push({ ...entries[index], url: result.dataUrl })
        else missing += 1
      })
      return { entries: kept, missing }
    },
  }
}
