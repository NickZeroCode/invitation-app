import { cleanup, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DRESS_CODE_CATEGORY_MAX } from './dressCodeLimits.ts'
import { DressCodeSection, groupDressCode } from './shared.tsx'
import { TEMPLATES, emptyDraft } from './registry.tsx'

const photo = (url: string, caption: string) => ({ url, caption })
const photos = (count: number, caption: string, prefix = caption) =>
  Array.from({ length: count }, (_, i) => photo(`${prefix}-${i}.jpg`, caption))

describe('groupDressCode', () => {
  it('files consecutive photos sharing a caption under one category, on one row', () => {
    const groups = groupDressCode([
      photo('a.jpg', 'Tenue des dames'),
      photo('b.jpg', 'Tenue des dames '),
      photo('c.jpg', 'Tenue des messieurs'),
      photo('d.jpg', 'Tenue des messieurs'),
      photo('e.jpg', 'Tenue des messieurs'),
    ])
    expect(groups.map((group) => [group.caption, group.images.map((image) => image.url), group.first, group.last])).toEqual([
      ['Tenue des dames', ['a.jpg', 'b.jpg'], true, true],
      ['Tenue des messieurs', ['c.jpg', 'd.jpg', 'e.jpg'], true, true],
    ])
  })

  it('keeps legacy one-caption-per-photo galleries as separate categories', () => {
    const groups = groupDressCode([photo('a.jpg', 'Robe'), photo('b.jpg', 'Costume'), photo('c.jpg', '')])
    expect(groups.map((group) => group.caption)).toEqual(['Robe', 'Costume', ''])
  })

  it('never puts more than five photos on a row, even for older or uncaptioned galleries', () => {
    const groups = groupDressCode([...photos(7, 'Tenue des dames'), ...photos(11, '', 'sans')])
    expect(groups.map((group) => [group.caption, group.images.length, group.first, group.last])).toEqual([
      ['Tenue des dames', 5, true, false],
      ['Tenue des dames', 2, false, true],
      ['', 5, true, false],
      ['', 5, false, false],
      ['', 1, false, true],
    ])
  })
})

describe('DressCodeSection', () => {
  it('shows a category caption once, with all of its photos on one row', () => {
    const draft = emptyDraft({ dressCode: [...photos(5, 'Tenue des dames'), ...photos(2, 'Tenue des messieurs')] })
    const { container } = render(<DressCodeSection draft={draft} accent="#000" ink="#000" />)
    expect(screen.getAllByText('Tenue des dames')).toHaveLength(1)
    expect(screen.getAllByText('Tenue des messieurs')).toHaveLength(1)
    const rows = Array.from(container.querySelectorAll('figure > div'))
    expect(rows.map((row) => row.querySelectorAll('img').length)).toEqual([5, 2])
  })
})

describe('outfit rows in every template', () => {
  it.each(TEMPLATES.map((template) => [template.key, template] as const))(
    '%s shows each category on one row of at most five photos',
    (_key, template) => {
      const dressCode = [...photos(5, 'Tenue des dames', 'dames'), ...photos(7, 'Tenue des messieurs', 'messieurs')]
      const { container } = render(<template.Component draft={emptyDraft({ title: 'Test', dressCode })} />)
      const outfitImages = Array.from(container.querySelectorAll<HTMLImageElement>('img')).filter((image) =>
        /^(dames|messieurs)-/.test(image.getAttribute('src') ?? ''),
      )
      expect(outfitImages).toHaveLength(12)
      // Photos are laid out row by row: group them by their row container.
      const rows = new Map<Element, string[]>()
      for (const image of outfitImages) {
        const row = image.parentElement as Element
        rows.set(row, [...(rows.get(row) ?? []), image.getAttribute('src') ?? ''])
      }
      const sizes = Array.from(rows.values()).map((row) => row.length)
      expect(Math.max(...sizes)).toBeLessThanOrEqual(DRESS_CODE_CATEGORY_MAX)
      // The five « dames » photos share a single row.
      const damesRows = Array.from(rows.values()).filter((row) => row.some((src) => src.startsWith('dames-')))
      expect(damesRows).toEqual([photos(5, 'x', 'dames').map((image) => image.url)])
      cleanup()
    },
  )
})
