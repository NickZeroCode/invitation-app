import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '../auth/AuthContext.tsx'
import { GuestRoute, ProtectedRoute } from '../auth/ProtectedRoute.tsx'
import { clearCookies, mockFetch, type MockFetch, type MockRoute } from '../test/mockFetch.ts'
import { SignupPage } from './SignupPage.tsx'

const ORGANIZER = {
  id: 1,
  email: 'nouvelle.organisatrice@nickevents.cd',
  first_name: 'Grâce',
  last_name: 'Mukendi',
  full_name: 'Grâce Mukendi',
  timezone: 'Africa/Kinshasa',
  date_joined: '2026-10-08T08:00:00Z',
}

function renderSignup(routes: MockRoute[]): MockFetch {
  const mock = mockFetch(routes)
  render(
    <MemoryRouter initialEntries={['/inscription']}>
      <AuthProvider>
        <Routes>
          <Route
            path="/inscription"
            element={
              <GuestRoute>
                <SignupPage />
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
  return mock
}

async function fillForm(
  user: ReturnType<typeof userEvent.setup>,
  overrides: Partial<Record<'firstName' | 'lastName' | 'email' | 'password' | 'confirmPassword', string>> = {},
) {
  await user.type(screen.getByLabelText(/^Prénom/), overrides.firstName ?? 'Grâce')
  await user.type(screen.getByLabelText(/^Nom/), overrides.lastName ?? 'Mukendi')
  await user.type(screen.getByLabelText(/^Adresse e-mail/), overrides.email ?? 'nouvelle.organisatrice@nickevents.cd')
  await user.type(screen.getByLabelText(/^Mot de passe/), overrides.password ?? 'mot-de-passe-secret')
  await user.type(
    screen.getByLabelText(/^Confirmer le mot de passe/),
    overrides.confirmPassword ?? 'mot-de-passe-secret',
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
  clearCookies()
})

describe('SignupPage', () => {
  it('validates required fields before calling the API', async () => {
    const user = userEvent.setup()
    const mock = renderSignup([{ url: '/api/auth/me/', status: 401, body: null }])

    await screen.findByRole('heading', { name: 'Créer un compte' })
    await user.click(screen.getByRole('button', { name: 'Créer mon compte' }))

    expect(await screen.findAllByText('Ce champ est obligatoire.')).toHaveLength(5)
    expect(mock.callsTo('/api/auth/register/', 'POST')).toHaveLength(0)
  })

  it('rejects mismatched password confirmation locally', async () => {
    const user = userEvent.setup()
    const mock = renderSignup([{ url: '/api/auth/me/', status: 401, body: null }])

    await screen.findByRole('heading', { name: 'Créer un compte' })
    await fillForm(user, { confirmPassword: 'autre-mot-de-passe' })
    await user.click(screen.getByRole('button', { name: 'Créer mon compte' }))

    expect(await screen.findByText('Les mots de passe ne correspondent pas.')).toBeInTheDocument()
    expect(mock.callsTo('/api/auth/register/', 'POST')).toHaveLength(0)
  })

  it('shows the backend message on duplicate email', async () => {
    const user = userEvent.setup()
    renderSignup([
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
        url: '/api/auth/register/',
        status: 400,
        body: {
          error: {
            code: 'validation_error',
            message: 'Les données envoyées sont invalides.',
            fields: { email: ['Un compte existe déjà avec cette adresse e-mail.'] },
          },
        },
      },
    ])

    await screen.findByRole('heading', { name: 'Créer un compte' })
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Créer mon compte' }))

    expect(
      await screen.findByText('Un compte existe déjà avec cette adresse e-mail.'),
    ).toBeInTheDocument()
  })

  it('creates the account and navigates to the organizer workspace', async () => {
    const user = userEvent.setup()
    const mock = renderSignup([
      { url: '/api/auth/me/', status: 401, body: null, once: true },
      {
        url: '/api/auth/csrf/',
        status: 204,
        onRequest: () => {
          document.cookie = 'csrftoken=fresh-token'
        },
      },
      { method: 'POST', url: '/api/auth/register/', status: 201, body: ORGANIZER },
    ])

    await screen.findByRole('heading', { name: 'Créer un compte' })
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Créer mon compte' }))

    expect(await screen.findByText('espace-protege')).toBeInTheDocument()
    expect(mock.callsTo('/api/auth/register/', 'POST')[0].body).toEqual({
      email: 'nouvelle.organisatrice@nickevents.cd',
      password: 'mot-de-passe-secret',
      confirm_password: 'mot-de-passe-secret',
      first_name: 'Grâce',
      last_name: 'Mukendi',
    })
  })
})
