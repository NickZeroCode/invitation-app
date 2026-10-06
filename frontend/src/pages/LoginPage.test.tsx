import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '../auth/AuthContext.tsx'
import { GuestRoute, ProtectedRoute } from '../auth/ProtectedRoute.tsx'
import { clearCookies, mockFetch, type MockFetch, type MockRoute } from '../test/mockFetch.ts'
import { LoginPage } from './LoginPage.tsx'

const ORGANIZER = {
  id: 1,
  email: 'organisateur@nickevents.cd',
  first_name: 'Néhémie',
  last_name: 'Kabongo',
  full_name: 'Néhémie Kabongo',
  timezone: 'Africa/Kinshasa',
  date_joined: '2026-10-01T08:00:00Z',
}

function renderLogin(routes: MockRoute[]): MockFetch {
  const mock = mockFetch(routes)
  render(
    <MemoryRouter initialEntries={['/connexion']}>
      <AuthProvider>
        <Routes>
          <Route
            path="/connexion"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route
            path="/"
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
  return mock
}

afterEach(() => {
  vi.unstubAllGlobals()
  clearCookies()
})

describe('LoginPage', () => {
  it('validates required fields before calling the API', async () => {
    const user = userEvent.setup()
    const mock = renderLogin([{ url: '/api/auth/me/', status: 401, body: null }])

    await screen.findByRole('heading', { name: 'Connexion' })
    await user.click(screen.getByRole('button', { name: 'Se connecter' }))

    expect(await screen.findAllByText('Ce champ est obligatoire.')).toHaveLength(2)
    expect(mock.callsTo('/api/auth/login/', 'POST')).toHaveLength(0)
  })

  it('shows the backend message on invalid credentials', async () => {
    const user = userEvent.setup()
    renderLogin([
      { url: '/api/auth/me/', status: 401, body: null },
      {
        url: '/api/auth/csrf/',
        status: 204,
        onRequest: () => {
          document.cookie = 'csrftoken=fresh-token'
        },
      },
      {
        method: 'POST',
        url: '/api/auth/login/',
        status: 401,
        body: {
          error: { code: 'authentication_failed', message: 'Identifiants invalides.', fields: {} },
        },
      },
    ])

    await screen.findByRole('heading', { name: 'Connexion' })
    await user.type(screen.getByLabelText(/^Adresse e-mail/), 'organisateur@nickevents.cd')
    await user.type(screen.getByLabelText(/^Mot de passe/), 'mauvais-mdp')
    await user.click(screen.getByRole('button', { name: 'Se connecter' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Identifiants invalides.')
  })

  it('logs in and navigates to the organizer workspace', async () => {
    const user = userEvent.setup()
    const mock = renderLogin([
      { url: '/api/auth/me/', status: 401, body: null, once: true },
      {
        url: '/api/auth/csrf/',
        status: 204,
        onRequest: () => {
          document.cookie = 'csrftoken=fresh-token'
        },
      },
      { method: 'POST', url: '/api/auth/login/', body: ORGANIZER },
    ])

    await screen.findByRole('heading', { name: 'Connexion' })
    await user.type(screen.getByLabelText(/^Adresse e-mail/), 'organisateur@nickevents.cd')
    await user.type(screen.getByLabelText(/^Mot de passe/), 'mot-de-passe-secret')
    await user.click(screen.getByRole('button', { name: 'Se connecter' }))

    expect(await screen.findByText('espace-protege')).toBeInTheDocument()
    expect(mock.callsTo('/api/auth/login/', 'POST')[0].body).toEqual({
      email: 'organisateur@nickevents.cd',
      password: 'mot-de-passe-secret',
    })
  })
})
