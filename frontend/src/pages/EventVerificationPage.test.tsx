import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { clearCookies, mockFetch, type MockFetch, type MockRoute } from '../test/mockFetch.ts'
import { EventVerificationPage } from './EventVerificationPage.tsx'

const EVENT = {
  id: 7,
  title: 'Mariage de Grâce et Éric',
  event_date: '2026-12-12',
  event_time: '15:00:00',
}

const LINKS = {
  results: [
    {
      id: 51,
      label: 'Équipe d’accueil',
      token: 'tok-a',
      status: 'active',
      expires_at: '2026-12-12T22:59:59Z',
      revoked_at: null,
      created_at: '2026-10-07T10:00:00Z',
    },
    {
      id: 52,
      label: 'Prestataire photo',
      token: 'tok-b',
      status: 'expired',
      expires_at: '2026-10-01T22:59:59Z',
      revoked_at: null,
      created_at: '2026-09-01T10:00:00Z',
    },
    {
      id: 53,
      label: 'Ancien agent',
      token: 'tok-c',
      status: 'revoked',
      expires_at: '2026-12-12T22:59:59Z',
      revoked_at: '2026-10-05T09:00:00Z',
      created_at: '2026-09-20T10:00:00Z',
    },
  ],
}

const SCAN_VALID = {
  result: 'valid',
  is_authentic: true,
  message: 'Invitation authentique et valide.',
  summary: {
    display_name: 'Mme Nadine Kanku',
    guest_name: 'Nadine Kanku',
    civility: 'mme',
    event_title: 'Mariage de Grâce et Éric',
    event_date: '2026-12-12',
    event_time: '15:00',
    venue_name: 'Cathédrale Notre-Dame',
    table_number: '3',
    table_text: 'Table d’honneur',
    issued_at: '2026-10-01T12:00:00Z',
    expires_at: '2026-12-12T15:00:00Z',
    presence_confirmed: true,
    presence_confirmed_at: '2026-10-07T12:00:00Z',
  },
  verified_at: '2026-10-07T12:30:00Z',
}

const CSRF_ROUTE: MockRoute = {
  url: '/api/auth/csrf/',
  body: { detail: 'CSRF cookie set.' },
  onRequest: () => {
    document.cookie = 'csrftoken=csrf-test-token; path=/'
  },
}

function renderVerification(routes: MockRoute[]): MockFetch {
  const mock = mockFetch(routes)
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/evenements/7/verification']}>
        <Routes>
          <Route path="/evenements/:id/verification" element={<EventVerificationPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return mock
}

afterEach(() => {
  vi.unstubAllGlobals()
  clearCookies()
})

describe('EventVerificationPage', () => {
  it('lists the delegated links with their status', async () => {
    const user = userEvent.setup()
    renderVerification([
      { url: '/api/events/7/verification-links/', body: LINKS },
      { url: '/api/events/7/', body: EVENT },
    ])

    expect(await screen.findByText('Vérificateur d’invitations')).toBeInTheDocument()
    // The links live behind their own button; findBy waits for the query.
    await user.click(screen.getByRole('button', { name: 'Voir les liens' }))
    expect(await screen.findByText('Équipe d’accueil')).toBeInTheDocument()
    expect(screen.getByText('Prestataire photo')).toBeInTheDocument()
    expect(screen.getByText('Actif')).toBeInTheDocument()
    expect(screen.getByText('Expiré')).toBeInTheDocument()
    expect(screen.getByText('Révoqué')).toBeInTheDocument()
    // Only the non-revoked links can be revoked.
    expect(screen.getAllByRole('button', { name: 'Révoquer' })).toHaveLength(2)
    expect(screen.getByRole('link', { name: 'Invités' })).toBeInTheDocument()
  })

  it('creates a delegated link and reveals its one-time code', async () => {
    const user = userEvent.setup()
    const mock = renderVerification([
      {
        url: '/api/events/7/verification-links/',
        method: 'POST',
        status: 201,
        body: {
          id: 54,
          label: 'Équipe d’accueil',
          token: 'tok-new',
          status: 'active',
          expires_at: '2026-12-01T22:59:59Z',
          revoked_at: null,
          created_at: '2026-10-07T10:00:00Z',
        },
      },
      { url: '/api/events/7/verification-links/', body: LINKS },
      { url: '/api/events/7/', body: EVENT },
      CSRF_ROUTE,
    ])

    await screen.findByText('Vérificateur d’invitations')
    await user.click(screen.getByRole('button', { name: 'Créer un lien de vérification' }))
    await user.type(screen.getByLabelText(/^Libellé/), 'Équipe d’accueil')
    fireEvent.change(document.getElementById('verify-link-expiry') as HTMLInputElement, {
      target: { value: '2026-12-01' },
    })
    await user.click(screen.getByRole('button', { name: 'Créer le lien' }))

    expect(await screen.findByText('Lien de vérification créé')).toBeInTheDocument()
    expect(screen.getByText(/\/verification\/tok-new$/)).toBeInTheDocument()
    expect(screen.getByText(/^Code d’autorisation : [A-Z2-9]{8}$/)).toBeInTheDocument()

    const [call] = mock.callsTo('/api/events/7/verification-links/', 'POST')
    expect(call.body).toMatchObject({ label: 'Équipe d’accueil' })
    const payload = call.body as { code: string; expires_at: string }
    expect(payload.code).toMatch(/^[A-Z2-9]{8}$/)
    expect(payload.expires_at).toEqual(expect.any(String))
  })

  it('scans an invitation as the organizer and shows the summary', async () => {
    const user = userEvent.setup()
    const mock = renderVerification([
      { url: '/api/events/7/verification-scan/', method: 'POST', body: SCAN_VALID },
      { url: '/api/events/7/verification-links/', body: LINKS },
      { url: '/api/events/7/', body: EVENT },
      CSRF_ROUTE,
    ])

    await screen.findByText('Vérificateur d’invitations')
    await user.type(screen.getByLabelText('Code de l’invitation'), 'tok-e2e-001')
    await user.click(screen.getByRole('button', { name: 'Vérifier' }))

    expect(await screen.findByText('Invitation authentique et valide.')).toBeInTheDocument()
    const region = screen
      .getByText('Invitation authentique et valide.')
      .closest('[data-verification-result]')
    expect(region).toHaveAttribute('data-verification-result', 'valid')
    expect(screen.getByText('Mme Nadine Kanku')).toBeInTheDocument()
    expect(screen.getByText('Présence confirmée')).toBeInTheDocument()

    const [call] = mock.callsTo('/api/events/7/verification-scan/', 'POST')
    expect(call.body).toEqual({ content: 'tok-e2e-001' })
  })

  it('restarts the camera for the next scan once the verdict is dismissed', async () => {
    const user = userEvent.setup()
    const getUserMedia = vi.fn().mockResolvedValue({ getTracks: () => [] })
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia },
      configurable: true,
    })
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    try {
      renderVerification([
        { url: '/api/events/7/verification-scan/', method: 'POST', body: SCAN_VALID },
        { url: '/api/events/7/verification-links/', body: LINKS },
        { url: '/api/events/7/', body: EVENT },
        CSRF_ROUTE,
      ])

      await screen.findByText('Vérificateur d’invitations')
      await waitFor(() => expect(getUserMedia).toHaveBeenCalledTimes(1))

      await user.type(screen.getByLabelText('Code de l’invitation'), 'tok-e2e-001')
      await user.click(screen.getByRole('button', { name: 'Vérifier' }))
      await screen.findByText('Invitation authentique et valide.')

      // A decoded scan stops the stream: the next scan needs a fresh camera,
      // otherwise the viewfinder stays black.
      await user.click(screen.getByRole('button', { name: 'Scanner l’invitation suivante' }))
      await waitFor(() => expect(getUserMedia).toHaveBeenCalledTimes(2))
      expect(screen.queryByText('Invitation authentique et valide.')).not.toBeInTheDocument()
    } finally {
      play.mockRestore()
      Reflect.deleteProperty(navigator, 'mediaDevices')
    }
  })

  it('revokes a link after confirmation', async () => {
    const user = userEvent.setup()
    const mock = renderVerification([
      {
        url: '/api/verification-links/51/revoke/',
        method: 'POST',
        body: {
          id: 51,
          label: 'Équipe d’accueil',
          token: 'tok-a',
          status: 'revoked',
          expires_at: '2026-12-12T22:59:59Z',
          revoked_at: '2026-10-07T12:00:00Z',
          created_at: '2026-10-07T10:00:00Z',
        },
      },
      { url: '/api/events/7/verification-links/', body: LINKS },
      { url: '/api/events/7/', body: EVENT },
      CSRF_ROUTE,
    ])

    await screen.findByText('Vérificateur d’invitations')
    await user.click(screen.getByRole('button', { name: 'Voir les liens' }))
    await screen.findByText('Équipe d’accueil')
    await user.click(screen.getAllByRole('button', { name: 'Révoquer' })[0])

    const dialog = screen.getByRole('alertdialog')
    expect(within(dialog).getByText('Révoquer ce lien ?')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Révoquer' }))

    await waitFor(() => expect(mock.callsTo('/api/verification-links/51/revoke/', 'POST')).toHaveLength(1))
  })
})
