import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from './AuthContext.tsx'
import { GuestRoute, ProtectedRoute } from './ProtectedRoute.tsx'
import { clearCookies, mockFetch } from '../test/mockFetch.ts'

const ORGANIZER = {
  id: 1,
  email: 'organisateur@nickevents.cd',
  first_name: 'Néhémie',
  last_name: 'Kabongo',
  full_name: 'Néhémie Kabongo',
  timezone: 'Africa/Kinshasa',
  date_joined: '2026-10-01T08:00:00Z',
}

function renderApp(initialPath: string) {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
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
            path="/accueil"
            element={
              <ProtectedRoute>
                <div>espace-protege</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
  clearCookies()
})

describe('auth routing', () => {
  it('shows a loading state while the session is being resolved', async () => {
    mockFetch([{ url: '/api/auth/me/', status: 401, body: null }])

    renderApp('/accueil')
    expect(screen.getByRole('status')).toBeInTheDocument()
    await screen.findByText('page-connexion')
  })

  it('redirects anonymous visitors to the login page', async () => {
    mockFetch([{ url: '/api/auth/me/', status: 401, body: null }])

    renderApp('/accueil')
    expect(await screen.findByText('page-connexion')).toBeInTheDocument()
  })

  it('renders protected content for an authenticated organizer', async () => {
    mockFetch([{ url: '/api/auth/me/', body: ORGANIZER }])

    renderApp('/accueil')
    expect(await screen.findByText('espace-protege')).toBeInTheDocument()
  })

  it('sends authenticated visitors away from the login page', async () => {
    mockFetch([{ url: '/api/auth/me/', body: ORGANIZER }])

    renderApp('/connexion')
    expect(await screen.findByText('espace-protege')).toBeInTheDocument()
  })
})
