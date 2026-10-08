/**
 * Tests for the PDF export pipeline: page composition, A4 geometry, the
 * centred verification QR page and the downloaded file name.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

interface FakePdfRecord {
  pages: number[][]
  images: Array<{ dataUrl: string; format: string; x: number; y: number; w: number; h: number; page: number }>
  props: Record<string, string> | null
}

const pdfState = vi.hoisted(() => ({
  instances: [] as Array<{
    pages: number[][]
    images: Array<{ dataUrl: string; format: string; x: number; y: number; w: number; h: number; page: number }>
    props: Record<string, string> | null
  }>,
}))

const captureState = vi.hoisted(() => ({
  skipDisplayDuringCapture: [] as string[],
}))

vi.mock('jspdf', () => {
  class FakeJsPDF {
    pageIndex = 0
    pages: number[][] = []
    images: Array<{ dataUrl: string; format: string; x: number; y: number; w: number; h: number; page: number }> = []
    props: Record<string, string> | null = null

    constructor(options: { format: number[] }) {
      this.pages = [options.format]
      pdfState.instances.push(this as unknown as (typeof pdfState.instances)[number])
    }

    setProperties(props: Record<string, string>) {
      this.props = props
    }

    addPage(format: number[]) {
      this.pages.push(format)
      this.pageIndex += 1
    }

    addImage(dataUrl: string, format: string, x: number, y: number, w: number, h: number) {
      this.images.push({ dataUrl, format, x, y, w, h, page: this.pageIndex })
    }

    output() {
      return 'data:application/pdf;base64,0123456789'
    }
  }
  return { jsPDF: FakeJsPDF }
})

vi.mock('html-to-image', () => ({
  toJpeg: vi.fn(async (node: HTMLElement) => {
    const skip = node.querySelector<HTMLElement>('[data-export-skip=""]')
    captureState.skipDisplayDuringCapture.push(skip ? skip.style.display : 'missing')
    return 'data:image/jpeg;base64,JPEGDATA'
  }),
}))

vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn(async () => 'data:image/png;base64,QRDATA'),
  },
}))

import QRCode from 'qrcode'
import { toJpeg } from 'html-to-image'
import { exportInvitationPdf, invitationPdfFileName } from './exportInvitationPdf.ts'
import { emptyDraft } from '../templates/registry.tsx'

function buildCard(): HTMLElement {
  const card = document.createElement('div')
  Object.defineProperty(card, 'offsetWidth', { value: 794 })
  Object.defineProperty(card, 'offsetHeight', { value: 1000 })

  const cover = document.createElement('div')
  cover.setAttribute('data-export-skip', 'cover')
  const coverImage = document.createElement('img')
  coverImage.setAttribute('src', 'data:image/png;base64,COVERDATA')
  cover.appendChild(coverImage)

  const body = document.createElement('div')
  body.textContent = 'Mariage de Grâce et Éric'

  const section = document.createElement('section')
  section.setAttribute('data-export-skip', '')
  section.textContent = 'Programme'

  card.append(cover, body, section)
  document.body.appendChild(card)
  return card
}

function captureDownloads(): { downloads: Array<{ download: string; href: string }>; restore: () => void } {
  const downloads: Array<{ download: string; href: string }> = []
  const spy = vi
    .spyOn(HTMLAnchorElement.prototype, 'click')
    .mockImplementation(function (this: HTMLAnchorElement) {
      downloads.push({ download: this.download, href: this.href })
    })
  return { downloads, restore: () => spy.mockRestore() }
}

beforeEach(() => {
  vi.clearAllMocks()
  pdfState.instances.length = 0
  captureState.skipDisplayDuringCapture.length = 0
  document.body.innerHTML = ''
})

describe('invitationPdfFileName', () => {
  it('slugifies the title and the guest name', () => {
    expect(invitationPdfFileName('Mariage de Grâce et Éric', 'M. Éric Mukendi')).toBe(
      'invitation-mariage-de-grace-et-eric-m-eric-mukendi.pdf',
    )
    expect(invitationPdfFileName('Gala')).toBe('invitation-gala.pdf')
    expect(invitationPdfFileName('!!!')).toBe('invitation-invitation.pdf')
  })
})

describe('exportInvitationPdf', () => {
  it('composes the cover, card, details and centred QR pages', async () => {
    const card = buildCard()
    const { downloads, restore } = captureDownloads()

    await exportInvitationPdf({
      cardNode: card,
      templateKey: 'heritage-luxe',
      dressCode: [{ url: 'data:image/jpeg;base64,DRESSDATA', caption: 'Tenue de cérémonie' }],
      program: [{ start_time: '19:30:00', end_time: '20:30:00', description: 'Repas' }],
      title: 'Mariage de Grâce et Éric',
      guestName: 'M. Éric Mukendi',
      qrText: 'https://nickevents.cd/i/tok-abc123',
    })

    const doc = pdfState.instances.at(-1) as FakePdfRecord
    expect(doc.pages).toHaveLength(4)

    // Page 1: the cover fallback ratio (A4); page 2: the measured card
    // (794x1000px → 210mm × 210*1000/794 mm); page 3: the details page; page
    // 4: the full A4 QR page.
    expect(doc.pages[0][0]).toBe(210)
    expect(doc.pages[0][1]).toBeCloseTo(297, 1)
    expect(doc.pages[1][0]).toBe(210)
    expect(doc.pages[1][1]).toBeCloseTo((210 * 1000) / 794, 1)
    expect(doc.pages[2][1]).toBeCloseTo(297, 1)
    expect(doc.pages[3]).toEqual([210, 297])

    expect(doc.images).toHaveLength(4)
    // Cover and card span the full page width with zero margin.
    expect(doc.images[0]).toMatchObject({ format: 'JPEG', x: 0, y: 0, w: 210, page: 0 })
    expect(doc.images[1]).toMatchObject({ format: 'JPEG', x: 0, y: 0, w: 210, page: 1 })
    expect(doc.images[2]).toMatchObject({ format: 'JPEG', x: 0, y: 0, w: 210, page: 2 })
    // The QR code is 70x70mm exactly centred on its A4 page.
    expect(doc.images[3]).toMatchObject({ format: 'PNG', x: 70, y: 113.5, w: 70, h: 70, page: 3 })
    expect(doc.images[3]?.dataUrl).toBe('data:image/png;base64,QRDATA')

    expect(doc.props).toEqual({
      title: 'Mariage de Grâce et Éric',
      subject: 'Invitation',
      creator: 'NickEvents',
    })

    expect(QRCode.toDataURL).toHaveBeenCalledWith('https://nickevents.cd/i/tok-abc123', {
      width: 1200,
      margin: 1,
      color: { dark: '#1a261f', light: '#ffffff' },
    })

    // The on-page sections are hidden while the card is captured, then restored.
    expect(captureState.skipDisplayDuringCapture[1]).toBe('none')
    expect(card.querySelector<HTMLElement>('[data-export-skip=""]')?.style.display).toBe('')

    expect(downloads).toHaveLength(1)
    expect(downloads[0]?.download).toBe('invitation-mariage-de-grace-et-eric-m-eric-mukendi.pdf')
    expect(downloads[0]?.href).toContain('data:application/pdf')
    restore()
  })

  it('exports only the card and the QR page when there is no cover or details', async () => {
    const card = document.createElement('div')
    Object.defineProperty(card, 'offsetWidth', { value: 794 })
    Object.defineProperty(card, 'offsetHeight', { value: 1122 })
    card.textContent = 'Invitation'
    document.body.appendChild(card)
    const { downloads, restore } = captureDownloads()

    await exportInvitationPdf({
      cardNode: card,
      templateKey: 'heritage-luxe',
      dressCode: [],
      program: [],
      title: 'Gala',
      qrText: 'https://nickevents.cd/i/tok-999',
    })

    const doc = pdfState.instances.at(-1) as FakePdfRecord
    expect(doc.pages).toHaveLength(2)
    expect(toJpeg).toHaveBeenCalledTimes(1)
    expect(doc.images).toHaveLength(2)
    expect(doc.images[1]).toMatchObject({ format: 'PNG', x: 70, y: 113.5, w: 70, h: 70, page: 1 })
    expect(downloads[0]?.download).toBe('invitation-gala.pdf')
    restore()
  })

  it('renders the template off-screen when no card node is provided', async () => {
    const { downloads, restore } = captureDownloads()

    await exportInvitationPdf({
      templateKey: 'heritage-luxe',
      draft: emptyDraft({ title: 'Gala', event_date: '2026-12-12', event_time: '18:00' }),
      dressCode: [],
      program: [],
      title: 'Gala',
      qrText: 'https://nickevents.cd/i/tok-999',
    })

    const doc = pdfState.instances.at(-1) as FakePdfRecord
    expect(toJpeg).toHaveBeenCalledTimes(1)
    expect(doc.pages).toHaveLength(2)
    expect(downloads[0]?.download).toBe('invitation-gala.pdf')
    expect(downloads[0]?.href).toContain('data:application/pdf')
    // The off-screen host is disposed after the export.
    expect(document.body.textContent).toBe('')
    restore()
  })
})
