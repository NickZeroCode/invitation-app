import { cleanup, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DRESS_CODE_CATEGORY_MAX as MAX } from './dressCodeLimits.ts'
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

  it('keeps a full category on a single row', () => {
    const groups = groupDressCode(photos(MAX, 'Tenue des dames'))
    expect(groups).toHaveLength(1)
    expect(groups[0].images).toHaveLength(MAX)
  })

  it('keeps legacy one-caption-per-photo galleries as separate categories', () => {
    const groups = groupDressCode([photo('a.jpg', 'Robe'), photo('b.jpg', 'Costume'), photo('c.jpg', '')])
    expect(groups.map((group) => group.caption)).toEqual(['Robe', 'Costume', ''])
  })

  it('never puts more than the limit on a row, even for older or uncaptioned galleries', () => {
    const groups = groupDressCode([...photos(MAX + 2, 'Tenue des dames'), ...photos(MAX * 2 + 1, '', 'sans')])
    expect(groups.map((group) => [group.caption, group.images.length, group.first, group.last])).toEqual([
      ['Tenue des dames', MAX, true, false],
      ['Tenue des dames', 2, false, true],
      ['', MAX, true, false],
      ['', MAX, false, false],
      ['', 1, false, true],
    ])
  })
})

describe('DressCodeSection', () => {
  it('shows a category caption once, with all of its photos on one row', () => {
    const draft = emptyDraft({ dressCode: [...photos(MAX, 'Tenue des dames'), ...photos(2, 'Tenue des messieurs')] })
    const { container } = render(<DressCodeSection draft={draft} accent="#000" ink="#000" />)
    expect(screen.getAllByText('Tenue des dames')).toHaveLength(1)
    expect(screen.getAllByText('Tenue des messieurs')).toHaveLength(1)
    const rows = Array.from(container.querySelectorAll('figure > div'))
    expect(rows.map((row) => row.querySelectorAll('img').length)).toEqual([MAX, 2])
  })
})

describe('outfit rows in every template', () => {
  it.each(TEMPLATES.map((template) => [template.key, template] as const))(
    '%s shows each category on one row, captioned or not',
    (_key, template) => {
      // A full captioned category, then a full category without caption
      // (the Mood Board used to split uncaptioned photos in two halves).
      const dressCode = [...photos(MAX, 'Tenue des dames', 'dames'), ...photos(MAX, '', 'sans')]
      const { container } = render(<template.Component draft={emptyDraft({ title: 'Test', dressCode })} />)
      const outfitImages = Array.from(container.querySelectorAll<HTMLImageElement>('img')).filter((image) =>
        /^(dames|sans)-/.test(image.getAttribute('src') ?? ''),
      )
      expect(outfitImages).toHaveLength(MAX * 2)
      const rows = new Map<Element, string[]>()
      for (const image of outfitImages) {
        const row = image.parentElement as Element
        rows.set(row, [...(rows.get(row) ?? []), image.getAttribute('src') ?? ''])
      }
      expect(Array.from(rows.values())).toEqual([
        photos(MAX, 'x', 'dames').map((image) => image.url),
        photos(MAX, 'x', 'sans').map((image) => image.url),
      ])
      cleanup()
    },
  )
})
