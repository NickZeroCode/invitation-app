import { cleanup, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ExportDetailsPage } from './ExportDetailsPage.tsx'
import { ExportQrPage, QR_PAGE_TITLE } from './ExportQrPage.tsx'
import { hasPageDecor } from './pageDecor.tsx'
import { panelSkinFor } from './panelSkin.tsx'
import { TEMPLATES } from './registry.tsx'

const dressCode = [{ url: 'a.jpg', caption: 'Tenue des dames' }]
const program = [{ start_time: '15:00:00', end_time: null, description: 'Cérémonie' }]

describe('PDF details and QR pages', () => {
  it.each(TEMPLATES.map((template) => [template.key] as const))('%s pages wear the template’s own paper', (key) => {
    const skin = panelSkinFor(key)
    const { container } = render(
      <>
        <ExportDetailsPage templateKey={key} dressCode={dressCode} program={program} />
        <ExportQrPage templateKey={key} />
      </>,
    )
    expect(screen.getByText('Dress code')).toBeInTheDocument()
    expect(screen.getByText(QR_PAGE_TITLE)).toBeInTheDocument()
    const pages = Array.from(container.children) as HTMLElement[]
    for (const page of pages) expect(page.style.background).not.toBe('')
    // Templates with a decoration layer draw it on both pages, at card scale.
    if (hasPageDecor(key)) {
      for (const page of pages) {
        const layer = page.querySelector<HTMLElement>('[aria-hidden="true"][style*="font-size"]')
        expect(layer?.style.fontSize).toBe('20.644px')
        expect(layer?.children.length).toBeGreaterThan(0)
      }
    }
    expect(skin.paper).toBeTruthy()
    cleanup()
  })

  it('leaves the QR card to the exporter (it is painted in the PDF, behind the code)', () => {
    const { container } = render(<ExportQrPage templateKey="heritage-luxe" />)
    const card = Array.from(container.querySelectorAll<HTMLElement>('div')).find((div) => div.style.width === '317.6px')
    expect(card).toBeUndefined()
  })

  it('asks for Inter under the name the app loads it', () => {
    const { container } = render(
      <>
        <ExportDetailsPage templateKey="heritage-luxe" dressCode={dressCode} program={program} />
        <ExportQrPage templateKey="heritage-luxe" />
      </>,
    )
    for (const page of Array.from(container.children) as HTMLElement[]) {
      expect(page.style.fontFamily.startsWith('"Inter Variable"')).toBe(true)
    }
  })

  it('sets the Mood Board pages on white with its script titles', () => {
    const skin = panelSkinFor('mood-board')
    expect(skin.paper).toBe('#FFFFFF')
    render(<ExportDetailsPage templateKey="mood-board" dressCode={dressCode} program={program} />)
    const title = screen.getByText('Dress code')
    expect(title.style.fontFamily).toContain('Allison')
  })
})
