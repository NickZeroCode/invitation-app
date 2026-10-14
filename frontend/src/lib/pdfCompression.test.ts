/**
 * Tests for the PDF compression engine. A simulated codec stands in for the
 * browser canvas: its byte cost grows with resolution and JPEG quality the way
 * a real encoder's does, so the search logic is exercised deterministically.
 */
import { describe, expect, it } from 'vitest'

import {
  PDF_MAX_BYTES,
  PDF_TARGET_BYTES,
  createPageCompressor,
  dataUrlBytes,
  fitToBudget,
  pdfOverheadBytes,
  type DecodedPage,
  type PageDecoder,
  type PageRaster,
} from './pdfCompression.ts'

/** A data URL whose payload is exactly `bytes` bytes (base64, no padding). */
function fakeDataUrl(bytes: number, tag = ''): string {
  const chars = Math.ceil((bytes * 4) / 3)
  const body = 'A'.repeat(chars - (chars % 4))
  return `data:image/jpeg;base64,${body}${tag}`
}

/**
 * Simulated page: `complexity` is bytes per pixel at quality 0.92, scaled by
 * a quality curve so lower quality is always smaller.
 */
function simulatedPage(width: number, height: number, complexity: number): DecodedPage {
  return {
    width,
    height,
    resample(targetWidth: number) {
      const pixels = targetWidth * Math.round((targetWidth * height) / width)
      return {
        encode(quality: number) {
          const bytes = Math.round(pixels * complexity * (0.12 + 0.88 * quality ** 1.6))
          return { dataUrl: fakeDataUrl(bytes), bytes: dataUrlBytes(fakeDataUrl(bytes)) }
        },
        dispose() {},
      }
    },
    dispose() {},
  }
}

describe('dataUrlBytes', () => {
  it('measures the decoded payload of a base64 data URL', () => {
    expect(dataUrlBytes('data:image/png;base64,QUJD')).toBe(3)
    expect(dataUrlBytes('data:image/png;base64,QUI=')).toBe(2)
    expect(dataUrlBytes('data:image/png;base64,QQ==')).toBe(1)
    expect(dataUrlBytes('data:image/png;base64,')).toBe(0)
  })
})

describe('fitToBudget', () => {
  it('spends a generous budget on quality at full resolution', () => {
    const page = simulatedPage(2480, 3508, 0.4)
    const encoded = fitToBudget(page, 50_000_000)
    expect(encoded.bytes).toBeLessThanOrEqual(50_000_000)
    // Top rung is capped at ~220 dpi (1819 px): far below the 300 dpi master.
    const widest = page.resample(1819).encode(0.92).bytes
    expect(encoded.bytes).toBe(widest)
  })

  it('always lands under a tight budget', () => {
    const page = simulatedPage(2480, 3508, 0.9)
    for (const budget of [900_000, 400_000, 200_000, 120_000]) {
      expect(fitToBudget(page, budget).bytes).toBeLessThanOrEqual(budget)
    }
  })

  it('uses the budget well instead of undershooting it', () => {
    const page = simulatedPage(2480, 3508, 0.6)
    const budget = 600_000
    const encoded = fitToBudget(page, budget)
    expect(encoded.bytes).toBeLessThanOrEqual(budget)
    expect(encoded.bytes).toBeGreaterThan(budget * 0.8)
  })

  it('never upscales a master smaller than the ladder', () => {
    const page = simulatedPage(500, 700, 0.5)
    const encoded = fitToBudget(page, 10_000_000)
    expect(encoded.bytes).toBe(page.resample(500).encode(0.92).bytes)
  })

  it('returns the smallest encoding when the budget is impossible', () => {
    const page = simulatedPage(2480, 3508, 0.9)
    const encoded = fitToBudget(page, 1)
    const smallest = page.resample(Math.round((210 / 25.4) * 60)).encode(0.22).bytes
    expect(encoded.bytes).toBe(smallest)
  })
})

describe('createPageCompressor', () => {
  const decoderFor =
    (pages: DecodedPage[], calls: number[] = []): PageDecoder =>
    async (dataUrl) => {
      const index = Number(/#(\d+)$/.exec(dataUrl)?.[1] ?? -1)
      calls.push(index)
      return pages[index] ?? null
    }

  const tagged = (bytes: number, index: number, widthPx = 794, heightPx = 1123): PageRaster => ({
    dataUrl: `${fakeDataUrl(bytes)}#${index}`,
    widthPx,
    heightPx,
  })

  it('leaves pages that already fit untouched, byte for byte', async () => {
    const small = tagged(60_000, 0)
    const calls: number[] = []
    const compressor = createPageCompressor([small], decoderFor([], calls))
    const [out] = await compressor.fit(500_000)
    expect(out.dataUrl).toBe(small.dataUrl)
    expect(calls).toHaveLength(0) // not even decoded
  })

  it('brings a multi-megabyte document under budget', async () => {
    const pages = [
      tagged(2_400_000, 0),
      tagged(1_800_000, 1),
      tagged(900_000, 2),
      tagged(300_000, 3, 794, 1123),
    ]
    const decoded = [
      simulatedPage(2480, 3508, 0.8),
      simulatedPage(2480, 3508, 0.6),
      simulatedPage(2480, 3508, 0.3),
      simulatedPage(2480, 3508, 0.1),
    ]
    const compressor = createPageCompressor(pages, decoderFor(decoded))
    const budget = PDF_TARGET_BYTES - pdfOverheadBytes(4)
    const out = await compressor.fit(budget)
    const total = out.reduce((sum, page) => sum + dataUrlBytes(page.dataUrl), 0)
    expect(total).toBeLessThanOrEqual(budget)
    expect(total).toBeGreaterThan(budget * 0.7)
    // Layout geometry is preserved exactly.
    out.forEach((page, index) => {
      expect(page.widthPx).toBe(pages[index].widthPx)
      expect(page.heightPx).toBe(pages[index].heightPx)
    })
  })

  it('lets a light page lend its unused share to a heavy one', async () => {
    const pages = [tagged(50_000, 0), tagged(3_000_000, 1)]
    const decoded = [simulatedPage(2480, 3508, 0.05), simulatedPage(2480, 3508, 0.9)]
    const compressor = createPageCompressor(pages, decoderFor(decoded))
    const out = await compressor.fit(700_000)
    expect(out[0].dataUrl).toBe(pages[0].dataUrl) // untouched, byte for byte
    const light = dataUrlBytes(pages[0].dataUrl)
    const heavy = dataUrlBytes(out[1].dataUrl)
    // The heavy page got far more than an even 350 kB split.
    expect(heavy).toBeGreaterThan(550_000)
    expect(light + heavy).toBeLessThanOrEqual(700_000)
  })

  it('keeps a page at full size when it cannot be decoded', async () => {
    const page = tagged(2_000_000, 0)
    const compressor = createPageCompressor([page], async () => null)
    const [out] = await compressor.fit(100_000)
    expect(out.dataUrl).toBe(page.dataUrl)
  })

  it('re-fits with a tighter budget from the cached decode', async () => {
    const calls: number[] = []
    const pages = [tagged(2_000_000, 0)]
    const compressor = createPageCompressor(
      pages,
      decoderFor([simulatedPage(2480, 3508, 0.7)], calls),
    )
    const first = dataUrlBytes((await compressor.fit(600_000))[0].dataUrl)
    const second = dataUrlBytes((await compressor.fit(300_000))[0].dataUrl)
    expect(second).toBeLessThan(first)
    expect(second).toBeLessThanOrEqual(300_000)
    expect(calls).toEqual([0]) // decoded once, reused
  })
})

describe('size ceiling constants', () => {
  it('keeps the target safely under the 1 MB ceiling', () => {
    expect(PDF_MAX_BYTES).toBe(1_000_000)
    expect(PDF_TARGET_BYTES).toBeLessThan(PDF_MAX_BYTES)
    expect(pdfOverheadBytes(4)).toBeLessThan(PDF_MAX_BYTES - PDF_TARGET_BYTES + 20_000)
  })
})
