import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '../auth/AuthContext.tsx'
import { ProtectedRoute } from '../auth/ProtectedRoute.tsx'
import { clearCookies, mockFetch, type MockRoute } from '../test/mockFetch.ts'
import type { InvitationTemplate } from '../lib/types.ts'
import { TemplatesPage } from './TemplatesPage.tsx'

const ORGANIZER = {
  id: 1,
  email: 'organisateur@nickevents.cd',
  first_name: 'Néhémie',
  last_name: 'Kabongo',
  full_name: 'Néhémie Kabongo',
  timezone: 'Africa/Kinshasa',
  date_joined: '2026-10-01T08:00:00Z',
}

function template(overrides: Partial<InvitationTemplate>): InvitationTemplate {
  return {
    key: 'heritage-luxe',
    name: 'Héritage',
    category: 'wedding',
    category_label: 'Mariage',
    description: 'Composition classique et centrée.',
    version: 1,
    supports_cover: true,
    config: {
      supports_cover: true,
      sections: ['cover', 'guest', 'title', 'message', 'date', 'venue', 'preferences', 'qr', 'footer'],
      emphasis_fields: ['title', 'date', 'venue'],
    },
    ...overrides,
  }
}

const CATALOG = [
  template({}),
  template({
    key: 'confetti',
    name: 'Confetti',
    category: 'birthday',
    category_label: 'Anniversaire',
    description: 'Anniversaire festif.',
    config: {
      supports_cover: true,
      sections: ['guest', 'title', 'message', 'date', 'venue', 'preferences', 'qr', 'footer'],
      emphasis_fields: ['title', 'date'],
    },
  }),
  template({
    key: 'ligne-moderne',
    name: 'Ligne moderne',
    category: 'corporate',
    category_label: 'Entreprise',
    description: 'Grille contemporaine.',
    supports_cover: false,
    config: {
      supports_cover: false,
      sections: ['guest', 'title', 'message', 'date', 'venue', 'preferences', 'qr', 'footer'],
      emphasis_fields: ['title', 'message', 'date', 'venue'],
    },
  }),
]

function renderTemplates(routes: MockRoute[]) {
  mockFetch(routes)
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/modeles']}>
        <AuthProvider>
          <Routes>
            <Route
              path="/modeles"
              element={
                <ProtectedRoute>
                  <TemplatesPage />
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

describe('TemplatesPage', () => {
  it('renders the catalog with live previews', async () => {
    renderTemplates([
      { url: '/api/auth/me/', body: ORGANIZER },
      { url: '/api/templates/', body: CATALOG },
    ])

    expect(await screen.findByText('Héritage')).toBeInTheDocument()
    expect(screen.getByText('Confetti')).toBeInTheDocument()
    expect(screen.getByText('Ligne moderne')).toBeInTheDocument()
    // Real mini-renders of the sample invitations, not placeholders.
    expect(screen.getByText('Mariage de Grâce et Éric')).toBeInTheDocument()
    expect(screen.getByText('Les 30 ans de Sarah')).toBeInTheDocument()
    expect(screen.getByText('Ouverture du siège de Kinshasa')).toBeInTheDocument()
  })

  it('filters the gallery by category', async () => {
    const user = userEvent.setup()
    renderTemplates([
      { url: '/api/auth/me/', body: ORGANIZER },
      { url: '/api/templates/', body: CATALOG },
    ])

    expect(await screen.findByText('Héritage')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Anniversaire' }))
    expect(screen.getByText('Confetti')).toBeInTheDocument()
    expect(screen.queryByText('Héritage')).not.toBeInTheDocument()
    expect(screen.queryByText('Ligne moderne')).not.toBeInTheDocument()
  })

  it('links each template to the editor pre-styled', async () => {
    renderTemplates([
      { url: '/api/auth/me/', body: ORGANIZER },
      { url: '/api/templates/', body: CATALOG },
    ])

    const links = await screen.findAllByRole('link', { name: 'Utiliser ce modèle' })
    const hrefs = links.map((link) => link.getAttribute('href'))
    expect(hrefs).toContain('/evenements/nouveau?modele=heritage-luxe')
    expect(hrefs).toContain('/evenements/nouveau?modele=confetti')
  })
})
