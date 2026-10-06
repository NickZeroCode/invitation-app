import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '../auth/AuthContext.tsx'
import { GuestRoute, ProtectedRoute } from '../auth/ProtectedRoute.tsx'
import { clearCookies, mockFetch, type MockRoute } from '../test/mockFetch.ts'
import { OverviewPage } from './OverviewPage.tsx'

const ORGANIZER = {
  id: 1,
  email: 'organisateur@nickevents.cd',
  first_name: 'Néhémie',
  last_name: 'Kabongo',
  full_name: 'Néhémie Kabongo',
  timezone: 'Africa/Kinshasa',
  date_joined: '2026-10-01T08:00:00Z',
}

const OVERVIEW = {
  events: { total: 4, upcoming: 1 },
  invitations: { total: 12, active: 8, expired: 3, revoked: 2 },
  responses: { total: 7 },
  generated_at: '2026-10-07T10:30:00Z',
}

function renderOverview(routes: MockRoute[]) {
  mockFetch(routes)
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <Routes>
            <Route
              path="/connexion"
              element={
                <GuestRoute>
                  <div>page-connexion</div>
                </GuestRoute>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <OverviewPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
  clearCookies()
})

describe('OverviewPage', () => {
  it('renders the organizer statistics', async () => {
    renderOverview([
      { url: '/api/auth/me/', body: ORGANIZER },
      { url: '/api/dashboard/overview/', body: OVERVIEW },
    ])

    expect(await screen.findByText('4')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('Événements créés')).toBeInTheDocument()
    expect(screen.getByText('Actives')).toBeInTheDocument()
  })

  it('shows an error state and recovers on retry', async () => {
    const user = userEvent.setup()
    renderOverview([
      { url: '/api/auth/me/', body: ORGANIZER },
      {
        url: '/api/dashboard/overview/',
        status: 500,
        body: {
          error: { code: 'server_error', message: 'Une erreur est survenue. Réessayez.', fields: {} },
        },
        once: true,
      },
      { url: '/api/dashboard/overview/', body: OVERVIEW },
    ])

    expect(await screen.findByText('Impossible de charger les statistiques')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Réessayer' }))
    expect(await screen.findByText('12')).toBeInTheDocument()
  })

  it('signs the organizer out when the session has expired', async () => {
    renderOverview([
      { url: '/api/auth/me/', body: ORGANIZER },
      { url: '/api/dashboard/overview/', status: 401, body: null },
    ])

    expect(await screen.findByText('page-connexion')).toBeInTheDocument()
  })
})
