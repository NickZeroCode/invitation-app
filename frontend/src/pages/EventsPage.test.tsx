import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '../auth/AuthContext.tsx'
import { ProtectedRoute } from '../auth/ProtectedRoute.tsx'
import { clearCookies, mockFetch, type MockFetch, type MockRoute } from '../test/mockFetch.ts'
import { EventsPage } from './EventsPage.tsx'

const ORGANIZER = {
  id: 1,
  email: 'organisateur@nickevents.cd',
  first_name: 'Néhémie',
  last_name: 'Kabongo',
  full_name: 'Néhémie Kabongo',
  timezone: 'Africa/Kinshasa',
  date_joined: '2026-10-01T08:00:00Z',
}

const TEMPLATE_DETAIL = {
  key: 'heritage-luxe',
  name: 'Héritage',
  category: 'wedding',
  category_label: 'Mariage',
  description: 'Composition classique et centrée.',
  version: 1,
  supports_cover: true,
  config: { supports_cover: true, sections: [], emphasis_fields: ['title', 'date', 'venue'] },
}

function event(overrides: Record<string, unknown> = {}) {
  return {
    id: 7,
    template: 'heritage-luxe',
    template_detail: TEMPLATE_DETAIL,
    title: 'Mariage de Grâce et Éric',
    message: 'Nous serions honorés de votre présence.',
    event_date: '2026-12-12',
    event_time: '15:00:00',
    timezone: 'Africa/Kinshasa',
    venue_name: 'Cathédrale Notre-Dame',
    venue_address: 'Avenue de la Paix, Kinshasa',
    venue_details: '',
    cover_url: null,
    cover_title: '',
    display_config: { emphasis: ['title'] },
    preference_questions: [],
    invitations_count: 3,
    is_active: true,
    created_at: '2026-10-07T10:00:00Z',
    updated_at: '2026-10-07T10:00:00Z',
    ...overrides,
  }
}

const PAGE = { count: 1, next: null, previous: null, results: [event()] }

function renderEvents(routes: MockRoute[]): MockFetch {
  const mock = mockFetch(routes)
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/evenements']}>
        <AuthProvider>
          <Routes>
            <Route
              path="/evenements"
              element={
                <ProtectedRoute>
                  <EventsPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return mock
}

afterEach(() => {
  vi.unstubAllGlobals()
  clearCookies()
})

describe('EventsPage', () => {
  it('lists event models with their invitation counts', async () => {
    renderEvents([
      { url: '/api/auth/me/', body: ORGANIZER },
      { url: '/api/events/', body: PAGE },
    ])

    expect(await screen.findByText('Mariage de Grâce et Éric')).toBeInTheDocument()
    expect(screen.getByText('Héritage')).toBeInTheDocument()
    expect(screen.getByText(/3 invitations/)).toBeInTheDocument()
  })

  it('deletes an event after confirmation', async () => {
    const user = userEvent.setup()
    const mock = renderEvents([
      { url: '/api/auth/me/', body: ORGANIZER },
      { url: '/api/events/', body: PAGE, once: true },
      { url: '/api/auth/csrf/', body: null, onRequest: () => { document.cookie = 'csrftoken=fresh-token' } },
      { url: '/api/events/7/', method: 'DELETE', status: 204 },
      { url: '/api/events/', body: { count: 0, next: null, previous: null, results: [] } },
    ])

    await user.click(await screen.findByRole('button', { name: 'Supprimer' }))
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(
      screen.getByText("Cette action est définitive. L'événement sera supprimé."),
    ).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: 'Supprimer' })[1])

    expect(await screen.findByText('Événement supprimé.')).toBeInTheDocument()
    expect(mock.callsTo('/api/events/7/', 'DELETE')).toHaveLength(1)
  })

  it('explains when deletion is blocked by existing invitations', async () => {
    const user = userEvent.setup()
    renderEvents([
      { url: '/api/auth/me/', body: ORGANIZER },
      { url: '/api/events/', body: PAGE },
      {
        url: '/api/auth/csrf/',
        body: null,
        onRequest: () => {
          document.cookie = 'csrftoken=fresh-token'
        },
      },
      {
        url: '/api/events/7/',
        method: 'DELETE',
        status: 400,
        body: {
          error: {
            code: 'event_has_invitations',
            message:
              'Cet événement a déjà des invitations. Supprimez ou révoquez d’abord ses invitations.',
            fields: {},
          },
        },
      },
    ])

    await user.click(await screen.findByRole('button', { name: 'Supprimer' }))
    await user.click(screen.getAllByRole('button', { name: 'Supprimer' })[1])

    expect(
      await screen.findByText(/a déjà des invitations/),
    ).toBeInTheDocument()
    expect(screen.getByText('Mariage de Grâce et Éric')).toBeInTheDocument()
  })
})
