import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { LuxePattern, MonogramCrest, monogramFrom } from './luxeMotifs.tsx'

describe('monogramFrom', () => {
  it('extracts the couple initials from common wedding titles', () => {
    expect(monogramFrom('Mariage de Grâce et Éric')).toEqual(['G', 'É'])
    expect(monogramFrom('Le Mariage de Camille & Antoine')).toEqual(['C', 'A'])
    expect(monogramFrom('inès + samir')).toEqual(['I', 'S'])
  })

  it('returns null when the title does not name two people', () => {
    expect(monogramFrom('Soirée de gala caritative')).toBeNull()
    expect(monogramFrom('')).toBeNull()
  })
})

describe('MonogramCrest', () => {
  it('renders nothing without two names and the initials otherwise', () => {
    const { container, rerender } = render(
      <MonogramCrest title="Gala" variant="roundel" color="#A67C3D" />,
    )
    expect(container).toBeEmptyDOMElement()
    rerender(<MonogramCrest title="Léa & Gabriel" variant="wreath" color="#5B6B4B" />)
    expect(container.textContent).toBe('L&G')
  })
})

describe('LuxePattern', () => {
  it('only prints a pattern for wedding templates', () => {
    const { container, rerender } = render(<LuxePattern templateKey="confetti" />)
    expect(container).toBeEmptyDOMElement()
    rerender(<LuxePattern templateKey="heritage-luxe" />)
    const layer = container.firstElementChild as HTMLElement
    expect(layer.style.backgroundImage).toContain('data:image/svg+xml')
  })
})
