/**
 * Tests for the PDF image loader: sniffing, retry and refresh behaviour, and
 * the promise that no picture is ever silently replaced by an empty frame.
 * jsdom has no canvas, so the loader inlines verified bytes as-is here.
 */
import { describe, expect, it, vi } from 'vitest'

import {
  createImageLoader,
  sniffImageMime,
  type ImageLoad,
  type RefreshedImageUrls,
} from './pdfImages.ts'

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4])
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1])
const WEBP = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 8, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 1,
])
const GIF = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 1, 2])
const HTML = new TextEncoder().encode('<!doctype html><title>app</title>')

function response(
  body: Uint8Array<ArrayBuffer>,
  status = 200,
  type = 'image/jpeg',
): Response {
  return new Response(body, { status, headers: { 'Content-Type': type } })
}

/** A fetcher replaying a scripted sequence of outcomes per URL. */
function scriptedFetch(
  script: Record<string, Array<Response | 'throw'>>,
  onCall?: (url: string, cache: string) => void,
): typeof fetch {
  const seen = new Map<string, number>()
  const fake = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = String(input)
    onCall?.(url, (init?.cache as string) ?? 'default')
    const steps = script[url] ?? [response(HTML, 404, 'text/html')]
    const index = Math.min(seen.get(url) ?? 0, steps.length - 1)
    seen.set(url, (seen.get(url) ?? 0) + 1)
    const step = steps[index]
    if (step === 'throw') throw new TypeError('Failed to fetch')
    return step.clone()
  }
  return fake as typeof fetch
}

const noSleep = async () => {}

function loaderWith(fetcher: typeof fetch, refresh?: () => Promise<RefreshedImageUrls | null>) {
  return createImageLoader({ fetcher, sleep: noSleep, backoffMs: [1, 2], timeoutMs: 5_000, refresh })
}

const ok = (result: ImageLoad) => (result.ok ? result.dataUrl : '')

describe('sniffImageMime', () => {
  it('recognises the image formats from their magic bytes', () => {
    expect(sniffImageMime(JPEG)).toBe('image/jpeg')
    expect(sniffImageMime(PNG)).toBe('image/png')
    expect(sniffImageMime(WEBP)).toBe('image/webp')
    expect(sniffImageMime(GIF)).toBe('image/gif')
  })

  it('rejects payloads that are not images', () => {
    expect(sniffImageMime(HTML)).toBeNull()
    expect(sniffImageMime(new Uint8Array([]))).toBeNull()
  })
})

describe('createImageLoader.load', () => {
  it('accepts an image served with the wrong content type', async () => {
    // S3-compatible stores serve WebP as octet-stream when the upload had no
    // type: the bytes decide, never the header.
    const loader = loaderWith(scriptedFetch({ 'x': [response(WEBP, 200, 'application/octet-stream')] }))
    const result = await loader.load('x', 1600)
    expect(result.ok).toBe(true)
    expect(ok(result).startsWith('data:image/webp;base64,')).toBe(true)
  })

  it('rejects an HTML body served as an image instead of inlining it', async () => {
    const loader = loaderWith(scriptedFetch({ x: [response(HTML, 200, 'text/html')] }))
    expect(await loader.load('x', 1600)).toEqual({ ok: false, reason: 'invalid' })
  })

  it('retries a transient failure and succeeds', async () => {
    const loader = loaderWith(scriptedFetch({ x: [response(HTML, 503), response(JPEG)] }))
    expect((await loader.load('x', 1600)).ok).toBe(true)
  })

  it('reports forbidden links without endless retries', async () => {
    const calls: string[] = []
    const loader = loaderWith(
      scriptedFetch({ x: [response(HTML, 403)] }, (_url, cache) => calls.push(cache)),
    )
    expect(await loader.load('x', 1600)).toEqual({ ok: false, reason: 'forbidden' })
    expect(calls).toEqual(['default', 'no-store'])
  })

  it('distinguishes a missing CORS header from a network failure', async () => {
    // The CORS fetch throws both times, but the no-cors probe (third call,
    // same URL in this fake) reaches the host: that is a CORS configuration
    // problem, not a dead link — and must not be reported as one.
    const loader = loaderWith(
      scriptedFetch({ x: ['throw', 'throw', response(HTML, 200, 'text/html')] }),
    )
    expect(await loader.load('x', 1600)).toEqual({ ok: false, reason: 'cors' })
  })

  it('passes data URLs through without touching the network', async () => {
    const fetcher = scriptedFetch({})
    const loader = loaderWith(fetcher)
    const result = await loader.load('data:image/jpeg;base64,AAAA', 1600)
    expect(ok(result)).toBe('data:image/jpeg;base64,AAAA')
  })
})

describe('same-origin file URLs', () => {
  it('prefers the same-origin copy and never touches the storage URL', async () => {
    const seen: string[] = []
    const loader = loaderWith(
      scriptedFetch(
        { '/api/events/7/dress-code/3/file/': [response(JPEG)], 'https://storage/x.jpg': [response(HTML, 403)] },
        (url) => seen.push(url),
      ),
    )
    const result = await loader.loadDressCode([
      { url: 'https://storage/x.jpg', fileUrl: '/api/events/7/dress-code/3/file/', caption: 'T', id: 3 },
    ])
    expect(result.missing).toBe(0)
    expect(seen).toEqual(['/api/events/7/dress-code/3/file/'])
  })

  it('falls back to the storage URL when the same-origin copy fails', async () => {
    const loader = loaderWith(
      scriptedFetch({
        '/api/events/7/dress-code/3/file/': [response(HTML, 404)],
        'https://storage/x.jpg': [response(JPEG)],
      }),
    )
    const result = await loader.loadDressCode([
      { url: 'https://storage/x.jpg', fileUrl: '/api/events/7/dress-code/3/file/', caption: 'T', id: 3 },
    ])
    expect(result.missing).toBe(0)
    expect(result.entries[0].url.startsWith('data:image/jpeg')).toBe(true)
  })

  it('loads the cover from its same-origin copy first', async () => {
    const seen: string[] = []
    const loader = loaderWith(
      scriptedFetch({ '/api/events/7/cover/file/': [response(JPEG)] }, (url) => seen.push(url)),
    )
    const result = await loader.loadCardImage('https://storage/c.jpg', true, '/api/events/7/cover/file/')
    expect(result.ok).toBe(true)
    expect(seen).toEqual(['/api/events/7/cover/file/'])
  })
})

describe('createImageLoader.loadDressCode', () => {
  it('reports unloadable photos instead of hiding them', async () => {
    const loader = loaderWith(
      scriptedFetch({
        good: [response(JPEG)],
        bad: [response(HTML, 404)],
      }),
    )
    const result = await loader.loadDressCode([
      { url: 'good', caption: 'Tenue 1', id: 1 },
      { url: 'bad', caption: 'Tenue 2', id: 2 },
    ])
    expect(result.missing).toBe(1)
    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].caption).toBe('Tenue 1')
    expect(result.entries[0].url.startsWith('data:image/jpeg')).toBe(true)
  })

  it('reloads an expired photo from its refreshed URL, matched by id', async () => {
    const fetcher = scriptedFetch({
      old: [response(HTML, 403)],
      fresh: [response(JPEG)],
    })
    const refresh = vi.fn(async (): Promise<RefreshedImageUrls | null> => ({
      dressCode: [{ id: 7, url: 'fresh' }],
    }))
    const loader = loaderWith(fetcher, refresh)
    const result = await loader.loadDressCode([{ url: 'old', caption: 'Tenue', id: 7 }])
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(result.missing).toBe(0)
    expect(result.entries[0].url.startsWith('data:image/jpeg')).toBe(true)
  })

  it('matches refreshed URLs by position when entries carry no id', async () => {
    const fetcher = scriptedFetch({ old: [response(HTML, 403)], fresh: [response(JPEG)] })
    const refresh = vi.fn(async (): Promise<RefreshedImageUrls | null> => ({
      dressCode: [{ url: 'fresh' }],
    }))
    const result = await loaderWith(fetcher, refresh).loadDressCode([
      { url: 'old', caption: 'Tenue' },
    ])
    expect(result.missing).toBe(0)
    expect(result.entries[0].url.startsWith('data:image/jpeg')).toBe(true)
  })

  it('keeps a photo whose refreshed URL is unchanged dropped, not looped', async () => {
    const fetcher = scriptedFetch({ same: [response(HTML, 403)] })
    const refresh = vi.fn(async (): Promise<RefreshedImageUrls | null> => ({
      dressCode: [{ id: 7, url: 'same' }],
    }))
    const result = await loaderWith(fetcher, refresh).loadDressCode([
      { url: 'same', caption: 'Tenue', id: 7 },
    ])
    expect(result.missing).toBe(1)
    expect(refresh).toHaveBeenCalledTimes(1)
  })
})
