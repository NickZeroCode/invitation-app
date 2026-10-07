import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { clearCookies } from '../test/mockFetch.ts'
import { LandingPage } from './LandingPage.tsx'

afterEach(() => {
  vi.unstubAllGlobals()
  clearCookies()
})

function renderLanding() {
  render(
    <MemoryRouter initialEntries={['/']}>
      <LandingPage />
    </MemoryRouter>,
  )
}

describe('LandingPage', () => {
  it('shows the hero with a clear path to login', () => {
    renderLanding()

    expect(
      screen.getByRole('heading', {
        name: 'Des invitations dignes de vos plus beaux moments.',
      }),
    ).toBeInTheDocument()
    const loginLinks = screen.getAllByRole('link', { name: 'Se connecter' })
    expect(loginLinks.length).toBeGreaterThan(0)
    for (const link of loginLinks) {
      expect(link).toHaveAttribute('href', '/connexion')
    }
  })

  it('previews real invitation templates', () => {
    renderLanding()

    // Sample drafts are rendered through the actual template components.
    expect(screen.getAllByText('Mariage de Grâce et Éric').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Les 30 ans de Sarah').length).toBeGreaterThan(0)
    // The full showcase lists every template by name.
    for (const name of [
      'Héritage',
      'Jardin',
      'Ligne moderne',
      'Confetti',
      'Sceau académique',
      'Soirée',
      'Mémoire',
    ]) {
      expect(screen.getAllByText(name).length).toBeGreaterThan(0)
    }
  })

  it('presents benefits, workflow and event categories', () => {
    renderLanding()

    expect(
      screen.getByRole('heading', { name: 'Pensé pour les organisateurs exigeants' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Comment ça fonctionne' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Pour chaque célébration' })).toBeInTheDocument()
    expect(screen.getAllByText('Remise de diplômes').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Hommage').length).toBeGreaterThan(0)
  })

  it('renders the QR verification panel', async () => {
    renderLanding()

    expect(await screen.findByAltText('QR code de vérification')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: 'Des invitations vérifiables, partagées en un instant',
      }),
    ).toBeInTheDocument()
  })
})
