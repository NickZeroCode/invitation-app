import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

// Each test renders the full page, all 23 template previews included; under
// a parallel full-suite run that alone can approach the global 15 s limit.
describe('LandingPage', { timeout: 30_000 }, () => {
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

    // The demo QR is drawn asynchronously (QRCode.toDataURL); give jsdom's
    // generation a generous budget so full-suite CPU load cannot flake it.
    expect(
      await screen.findByAltText('QR code de vérification', {}, { timeout: 5000 }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: 'Des invitations vérifiables, partagées en un instant',
      }),
    ).toBeInTheDocument()
  })

  it('lists the collection horizontally and filters it by occasion', async () => {
    const user = userEvent.setup()
    renderLanding()

    const track = screen.getByRole('list', { name: 'Modèles d’invitation, défilement horizontal' })
    expect(within(track).getAllByRole('listitem').length).toBeGreaterThan(9)

    await user.click(screen.getByRole('button', { name: 'Hommage' }))
    expect(screen.getByRole('button', { name: 'Hommage' })).toHaveAttribute('aria-pressed', 'true')
    const items = within(track).getAllByRole('listitem')
    expect(items).toHaveLength(1)
    expect(within(items[0]).getByText('Mémoire')).toBeInTheDocument()
  })
})
