/**
 * Cover-exclusion, QR-band and filename behaviour of the invitation JPG export.
 */
import { toJpeg } from 'html-to-image'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('html-to-image', () => ({
  toJpeg: vi.fn(async () => 'data:image/jpeg;base64,JPEGDATA'),
}))

import { exportInvitationImage, invitationExportFileName } from './exportInvitation.ts'

function makeCard(): { parent: HTMLDivElement; card: HTMLDivElement; cover: HTMLImageElement } {
  const parent = document.createElement('div')
  const card = document.createElement('div')
  const cover = document.createElement('img')
  cover.setAttribute('data-export-skip', '')
  cover.src = 'https://storage.example.com/photo.jpg'
  const message = document.createElement('p')
  message.textContent = 'Nous serions honorés de votre présence.'
  card.append(cover, message)
  parent.append(card)
  document.body.append(parent)
  return { parent, card, cover }
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.mocked(toJpeg).mockClear()
  vi.restoreAllMocks()
})

describe('exportInvitationImage', () => {
  it('hides cover photographs during the capture and restores them afterwards', async () => {
    const { parent, card, cover } = makeCard()

    let displayAtCapture = 'capture not reached'
    let hasQrAtCapture = false
    vi.mocked(toJpeg).mockImplementation(async (node: HTMLElement) => {
      displayAtCapture = (node.querySelector('[data-export-skip]') as HTMLElement | null)?.style.display ?? 'missing'
      hasQrAtCapture = Boolean(node.querySelector('img[src="data:image/png;base64,QRDATA"]'))
      return 'data:image/jpeg;base64,JPEGDATA'
    })
    const downloads: Array<{ download: string; href: string }> = []
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      downloads.push({ download: this.download, href: this.href })
    })

    await exportInvitationImage(card, 'invitation-test.jpg', {
      qrDataUrl: 'data:image/png;base64,QRDATA',
    })

    // Hidden while capturing (their space is excluded from the measurement)…
    expect(displayAtCapture).toBe('none')
    expect(hasQrAtCapture).toBe(true)
    // …and fully restored once the capture is done.
    expect(cover.style.display).toBe('')
    expect(card.parentNode).toBe(parent)
    expect(parent.querySelectorAll('img')).toHaveLength(1)
    expect(downloads).toHaveLength(1)
    expect(downloads[0].download).toBe('invitation-test.jpg')
    expect(downloads[0].href).toContain('data:image/jpeg')
  })

  it('captures without a QR band when no QR data URL is provided', async () => {
    const { card } = makeCard()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    await exportInvitationImage(card, 'invitation-sans-qr.jpg')

    expect(toJpeg).toHaveBeenCalledTimes(1)
  })
})

describe('invitationExportFileName', () => {
  it('slugifies titles and guest names', () => {
    expect(invitationExportFileName('Mariage de Grâce et Éric', 'Néhémie')).toBe(
      'invitation-mariage-de-grace-et-eric-nehemie.jpg',
    )
    expect(invitationExportFileName('', undefined)).toBe('invitation.jpg')
  })
})
