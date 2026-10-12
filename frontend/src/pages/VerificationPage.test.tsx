import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { clearCookies, mockFetch, type MockFetch, type MockRoute } from '../test/mockFetch.ts'
import { VerificationPage } from './VerificationPage.tsx'

const LINK_ACTIVE = {
  status: 'active',
  label: 'Équipe d’accueil',
  event_title: 'Mariage de Grâce et Éric',
  expires_at: '2026-12-12T22:59:59Z',
  revoked_at: null,
}

const SESSION = {
  session: 'signed-session-value',
  event_title: 'Mariage de Grâce et Éric',
  expires_at: '2026-12-12T22:59:59Z',
}

const SCAN_VALID = {
  result: 'valid',
  is_authentic: true,
  message: 'Invitation authentique et valide.',
  summary: {
    display_name: 'M. Éric Mukendi',
    guest_name: 'Éric Mukendi',
    civility: 'm',
    event_title: 'Mariage de Grâce et Éric',
    event_date: '2026-12-12',
    event_time: '15:00',
    venue_name: 'Cathédrale Notre-Dame',
    table_number: '5',
    table_text: 'Table des mariés',
    issued_at: '2026-10-01T12:00:00Z',
    expires_at: '2026-12-12T15:00:00Z',
    presence_confirmed: false,
    presence_confirmed_at: null,
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
      <MemoryRouter initialEntries={['/verification/tok-v1']}>
        <Routes>
          <Route path="/verification/:token" element={<VerificationPage />} />
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

describe('VerificationPage', () => {
  it('asks for the authorization code before opening the scanner', async () => {
    const user = userEvent.setup()
    const mock = renderVerification([
      { url: '/api/public/verify-links/tok-v1/authorize/', method: 'POST', body: SESSION },
      { url: '/api/public/verify-links/tok-v1/', body: LINK_ACTIVE },
      CSRF_ROUTE,
    ])

    // Link status gate first: no code form before the link is known.
    expect(await screen.findByText('Événement · Mariage de Grâce et Éric')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Saisissez le code d’autorisation transmis par l’organisateur pour accéder au vérificateur.',
      ),
    ).toBeInTheDocument()

    await user.type(screen.getByLabelText(/^Code d’autorisation/), 'ABC123')
    await user.click(screen.getByRole('button', { name: 'Accéder au vérificateur' }))

    expect(await screen.findByText('Scanner une invitation')).toBeInTheDocument()
    expect(
      screen.getByText('La caméra n’est pas disponible. Saisissez le code de l’invitation ci-dessous.'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Code de l’invitation')).toBeInTheDocument()
    const [call] = mock.callsTo('/authorize/', 'POST')
    expect(call.body).toEqual({ code: 'ABC123' })
  })

  it('shows the server refusal when the code is wrong', async () => {
    const user = userEvent.setup()
    renderVerification([
      {
        url: '/api/public/verify-links/tok-v1/authorize/',
        method: 'POST',
        status: 400,
        body: {
          error: {
            code: 'invalid_code',
            message: 'Code d’autorisation incorrect.',
            fields: {},
          },
        },
      },
      { url: '/api/public/verify-links/tok-v1/', body: LINK_ACTIVE },
      CSRF_ROUTE,
    ])

    await screen.findByText('Événement · Mariage de Grâce et Éric')
    await user.type(screen.getByLabelText(/^Code d’autorisation/), 'WRONG1')
    await user.click(screen.getByRole('button', { name: 'Accéder au vérificateur' }))

    expect(await screen.findByText('Code d’autorisation incorrect.')).toBeInTheDocument()
    expect(screen.queryByText('Scanner une invitation')).not.toBeInTheDocument()
  })

  it('verifies a scanned invitation and shows the summary', async () => {
    const user = userEvent.setup()
    const mock = renderVerification([
      { url: '/api/public/verify-links/tok-v1/scan/', method: 'POST', body: SCAN_VALID },
      { url: '/api/public/verify-links/tok-v1/authorize/', method: 'POST', body: SESSION },
      { url: '/api/public/verify-links/tok-v1/', body: LINK_ACTIVE },
      CSRF_ROUTE,
    ])

    await screen.findByText('Événement · Mariage de Grâce et Éric')
    await user.type(screen.getByLabelText(/^Code d’autorisation/), 'ABC123')
    await user.click(screen.getByRole('button', { name: 'Accéder au vérificateur' }))
    await screen.findByText('Scanner une invitation')

    await user.type(screen.getByLabelText('Code de l’invitation'), 'https://malaikaevents.app/i/tok-abc123')
    await user.click(screen.getByRole('button', { name: 'Vérifier' }))

    const card = await screen.findByText('Invitation authentique et valide.')
    expect(card).toBeInTheDocument()
    const region = screen.getByText('Invitation authentique et valide.').closest('[data-verification-result]')
    expect(region).toHaveAttribute('data-verification-result', 'valid')
    expect(screen.getByText('M. Éric Mukendi')).toBeInTheDocument()
    expect(screen.getByText('Cathédrale Notre-Dame')).toBeInTheDocument()
    // The signed session travels in its dedicated header.
    const [scanCall] = mock.callsTo('/scan/', 'POST')
    expect(scanCall.headers['x-verification-session']).toBe('signed-session-value')
    expect(scanCall.body).toEqual({ content: 'https://malaikaevents.app/i/tok-abc123' })
  })

  it('returns to the code form when the session has expired', async () => {
    const user = userEvent.setup()
    renderVerification([
      {
        url: '/api/public/verify-links/tok-v1/scan/',
        method: 'POST',
        status: 400,
        body: {
          error: {
            code: 'verification_session_expired',
            message: 'Session de vérification expirée.',
            fields: {},
          },
        },
      },
      { url: '/api/public/verify-links/tok-v1/authorize/', method: 'POST', body: SESSION },
      { url: '/api/public/verify-links/tok-v1/', body: LINK_ACTIVE },
      CSRF_ROUTE,
    ])

    await screen.findByText('Événement · Mariage de Grâce et Éric')
    await user.type(screen.getByLabelText(/^Code d’autorisation/), 'ABC123')
    await user.click(screen.getByRole('button', { name: 'Accéder au vérificateur' }))
    await screen.findByText('Scanner une invitation')

    await user.type(screen.getByLabelText('Code de l’invitation'), 'tok-abc123')
    await user.click(screen.getByRole('button', { name: 'Vérifier' }))

    expect(
      await screen.findByText(
        'Session de vérification expirée. Saisissez à nouveau le code d’autorisation.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/^Code d’autorisation/)).toBeInTheDocument()
    expect(screen.queryByText('Scanner une invitation')).not.toBeInTheDocument()
  })

  it('refuses an expired link before the code form', async () => {
    renderVerification([
      {
        url: '/api/public/verify-links/tok-v1/',
        body: {
          status: 'expired',
          label: 'Équipe d’accueil',
          event_title: 'Mariage de Grâce et Éric',
          expires_at: '2026-10-01T22:59:59Z',
          revoked_at: null,
        },
      },
    ])

    expect(await screen.findByText('Ce lien de vérification a expiré.')).toBeInTheDocument()
    expect(screen.getByText('Mariage de Grâce et Éric')).toBeInTheDocument()
    expect(screen.queryByLabelText(/^Code d’autorisation/)).not.toBeInTheDocument()
  })

  it('refuses a revoked link before the code form', async () => {
    renderVerification([
      {
        url: '/api/public/verify-links/tok-v1/',
        body: {
          status: 'revoked',
          label: 'Équipe d’accueil',
          event_title: 'Mariage de Grâce et Éric',
          expires_at: '2026-12-12T22:59:59Z',
          revoked_at: '2026-10-05T09:00:00Z',
        },
      },
    ])

    expect(await screen.findByText('Ce lien de vérification a été révoqué.')).toBeInTheDocument()
    expect(screen.queryByLabelText(/^Code d’autorisation/)).not.toBeInTheDocument()
  })
})
