import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { MoodBoard } from './MoodBoard.tsx'
import { emptyDraft } from './registry.tsx'

const base = {
  title: 'Mariage Civil & Religieux',
  coverTitle: 'James & Tony',
  message: 'Nous serions honorés de votre présence.',
  event_date: '2027-01-16',
}

describe('MoodBoard', () => {
  it('draws the monogram and names from the cover text, the script line from the title', () => {
    render(<MoodBoard draft={emptyDraft(base)} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Mariage Civil & Religieux')
    expect(screen.getByText('James & Tony')).toBeInTheDocument()
    // Monogram initials J & T, not the title's M & R.
    expect(screen.getByText('J')).toBeInTheDocument()
    expect(screen.getByText('T')).toBeInTheDocument()
    expect(screen.queryByText('M')).not.toBeInTheDocument()
  })

  it('shows no monogram when the cover text is empty', () => {
    render(<MoodBoard draft={emptyDraft({ ...base, coverTitle: '' })} />)
    expect(screen.queryByText('James & Tony')).not.toBeInTheDocument()
    expect(screen.queryByText('J')).not.toBeInTheDocument()
  })

  it('sets the message as body text, not as the script title', () => {
    render(<MoodBoard draft={emptyDraft(base)} />)
    const message = screen.getByText(base.message)
    expect(message.tagName).toBe('P')
    expect(message.style.fontSize).toBe('1.15em')
  })

  it('uses the organizer’s theme and palette, with terracotta by default', () => {
    const { unmount } = render(<MoodBoard draft={emptyDraft(base)} />)
    expect(screen.getByText('Terracotta')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(5)
    unmount()

    render(<MoodBoard draft={emptyDraft({ ...base, board: { theme: 'Émeraude', palette: ['#0B6E4F', '#F2E8CF'] } })} />)
    expect(screen.getByText('Émeraude')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').map((item) => item.getAttribute('aria-label'))).toEqual(['#0B6E4F', '#F2E8CF'])
  })

  it('hides the theme line and palette when both are cleared', () => {
    render(<MoodBoard draft={emptyDraft({ ...base, board: { theme: '', palette: [] } })} />)
    expect(screen.queryByText(/Thème/)).not.toBeInTheDocument()
    expect(screen.queryByText('Palette de couleurs')).not.toBeInTheDocument()
  })

  it('lays each outfit category on a single row', () => {
    const photos = Array.from({ length: 4 }, (_, i) => ({ url: `w${i}.jpg`, caption: 'Tenue des dames' }))
    const { container } = render(<MoodBoard draft={emptyDraft({ ...base, dressCode: photos })} />)
    const images = Array.from(container.querySelectorAll('img[src^="w"]'))
    expect(images).toHaveLength(4)
    expect(new Set(images.map((image) => image.parentElement))).toHaveProperty('size', 1)
    expect(screen.getByText('Tenue des dames')).toBeInTheDocument()
  })

  it('keeps four photos without a caption together, under one « Outfit » label', () => {
    const photos = Array.from({ length: 4 }, (_, i) => ({ url: `u${i}.jpg`, caption: '' }))
    const { container } = render(<MoodBoard draft={emptyDraft({ ...base, dressCode: photos })} />)
    const images = Array.from(container.querySelectorAll('img[src^="u"]'))
    expect(new Set(images.map((image) => image.parentElement))).toHaveProperty('size', 1)
    expect(screen.getAllByText('Outfit')).toHaveLength(1)
    expect(screen.queryByText(/Outfit Women|Outfit men/)).not.toBeInTheDocument()
  })
})
