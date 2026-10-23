import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DressCodeSection, groupDressCode } from './shared.tsx'
import { emptyDraft } from './registry.tsx'

const photo = (url: string, caption: string) => ({ url, caption })

describe('groupDressCode', () => {
  it('files consecutive photos sharing a caption under one category', () => {
    const groups = groupDressCode([
      photo('a.jpg', 'Tenue des dames'),
      photo('b.jpg', 'Tenue des dames '),
      photo('c.jpg', 'Tenue des messieurs'),
      photo('d.jpg', 'Tenue des messieurs'),
      photo('e.jpg', 'Tenue des messieurs'),
    ])
    expect(groups.map((group) => [group.caption, group.images.map((image) => image.url)])).toEqual([
      ['Tenue des dames', ['a.jpg', 'b.jpg']],
      ['Tenue des messieurs', ['c.jpg', 'd.jpg', 'e.jpg']],
    ])
  })

  it('keeps legacy one-caption-per-photo galleries as separate categories', () => {
    const groups = groupDressCode([photo('a.jpg', 'Robe'), photo('b.jpg', 'Costume'), photo('c.jpg', '')])
    expect(groups.map((group) => group.caption)).toEqual(['Robe', 'Costume', ''])
  })
})

describe('DressCodeSection', () => {
  it('shows a category caption once, with all of its photos', () => {
    const draft = emptyDraft({
      dressCode: [photo('a.jpg', 'Tenue des dames'), photo('b.jpg', 'Tenue des dames'), photo('c.jpg', 'Tenue des messieurs')],
    })
    const { container } = render(<DressCodeSection draft={draft} accent="#000" ink="#000" />)
    expect(screen.getAllByText('Tenue des dames')).toHaveLength(1)
    expect(screen.getAllByText('Tenue des messieurs')).toHaveLength(1)
    expect(container.querySelectorAll('figure')).toHaveLength(2)
    expect(container.querySelectorAll('img')).toHaveLength(3)
  })
})
