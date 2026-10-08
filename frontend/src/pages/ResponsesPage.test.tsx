import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '../auth/AuthContext.tsx'
import { ProtectedRoute } from '../auth/ProtectedRoute.tsx'
import { clearCookies, mockFetch, type MockFetch, type MockRoute } from '../test/mockFetch.ts'
import { ResponsesPage } from './ResponsesPage.tsx'

const ORGANIZER = {
  id: 1,
  email: 'organisateur@nickevents.cd',
  first_name: 'Néhémie',
  last_name: 'Kabongo',
  full_name: 'Néhémie Kabongo',
  timezone: 'Africa/Kinshasa',
  date_joined: '2026-10-01T08:00:00Z',
}

const EVENT = {
  id: 7,
  template: 'heritage-luxe',
  template_detail: {
    key: 'heritage-luxe',
    name: 'Héritage',
    category: 'wedding',
    category_label: 'Mariage',
    description: 'Composition classique et centrée.',
    version: 1,
    supports_cover: true,
    config: { supports_cover: true, sections: [], emphasis_fields: ['title', 'date'] },
  },
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
  invitations_count: 2,
  is_active: true,
  created_at: '2026-10-07T10:00:00Z',
  updated_at: '2026-10-07T10:00:00Z',
}

const SUMMARY = {
  invitations: 2,
  responses: 1,
  questions: [
    {
      id: 3,
      label: 'Serez-vous présent ?',
      input_type: 'single',
      options: [
        { id: 9, label: 'Oui', count: 1 },
        { id: 10, label: 'Non', count: 0 },
      ],
    },
    {
      id: 4,
      label: 'Quels plats préférez-vous ?',
      input_type: 'multiple',
      options: [
        { id: 11, label: 'Poisson', count: 1 },
        { id: 12, label: 'Végétarien', count: 0 },
      ],
    },
  ],
}

const RESPONSES_PAGE = {
  count: 1,
  next: null,
  previous: null,
  results: [
    {
      id: 11,
      invitation: 41,
      guest_name: 'Éric Mukendi',
      display_name: 'Mme Éric Mukendi',
      invitation_status: 'active',
      submitted_at: '2026-10-08T10:00:00Z',
      updated_at: '2026-10-08T10:00:00Z',
      answers: [
        {
          question: 3,
          question_label: 'Serez-vous présent ?',
          input_type: 'single',
          options: [{ id: 9, label: 'Oui' }],
        },
        {
          question: 4,
          question_label: 'Quels plats préférez-vous ?',
          input_type: 'multiple',
          options: [{ id: 11, label: 'Poisson' }],
        },
      ],
    },
  ],
  summary: SUMMARY,
}

function renderResponses(routes: MockRoute[]): MockFetch {
  const mock = mockFetch(routes)
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/evenements/7/reponses']}>
        <AuthProvider>
          <Routes>
            <Route
              path="/evenements/:id/reponses"
              element={
                <ProtectedRoute>
                  <ResponsesPage />
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

describe('ResponsesPage', () => {
  it('shows summary tallies and individual guest answers', async () => {
    renderResponses([
      { url: '/api/auth/me/', body: ORGANIZER },
      // Longer URL first: routes match by substring.
      { url: '/api/events/7/responses/', body: RESPONSES_PAGE },
      { url: '/api/events/7/', body: EVENT },
    ])

    expect(await screen.findByText('Réponses reçues')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('sur 2 invitations')).toBeInTheDocument()

    // Per-question tallies (summary) with option counts and percentages.
    // Question labels appear twice: summary tally + individual answer.
    expect(screen.getAllByText('Serez-vous présent ?').length).toBe(2)
    expect(screen.getByText('Choix unique')).toBeInTheDocument()
    expect(screen.getAllByText('Quels plats préférez-vous ?').length).toBe(2)
    expect(screen.getByText('Choix multiples')).toBeInTheDocument()
    expect(screen.getAllByText(/1 vote · 100 %/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/0 vote · 0 %/).length).toBe(2)

    // Individual responses.
    expect(screen.getByText('Réponses individuelles')).toBeInTheDocument()
    expect(screen.getByText('Mme Éric Mukendi')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getAllByText('Oui').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Poisson').length).toBeGreaterThanOrEqual(1)
  })

  it('paginates individual responses through the URL', async () => {
    const mock = renderResponses([
      { url: '/api/auth/me/', body: ORGANIZER },
      // Longer URL first: routes match by substring.
      {
        url: '/api/events/7/responses/',
        body: {
          ...RESPONSES_PAGE,
          count: 26,
          next: 'http://localhost/api/events/7/responses/?page=2',
          previous: null,
        },
      },
      { url: '/api/events/7/', body: EVENT },
    ])

    expect(await screen.findByText('Suivant')).toBeInTheDocument()
    expect(screen.getByText('Page 1 / 2')).toBeInTheDocument()

    await userEvent.click(screen.getByText('Suivant'))

    await vi.waitFor(() => {
      expect(mock.callsTo('/api/events/7/responses/').length).toBe(2)
    })
    expect(mock.callsTo('/api/events/7/responses/')[1]?.url).toContain('page=2')
  })

  it('shows an empty state when no response was submitted', async () => {
    renderResponses([
      { url: '/api/auth/me/', body: ORGANIZER },
      // Longer URL first: routes match by substring.
      {
        url: '/api/events/7/responses/',
        body: {
          count: 0,
          next: null,
          previous: null,
          results: [],
          summary: { invitations: 2, responses: 0, questions: [] },
        },
      },
      { url: '/api/events/7/', body: EVENT },
    ])

    expect(await screen.findByText('Aucune réponse pour le moment')).toBeInTheDocument()
  })

  it('recovers from a failed responses request', async () => {
    renderResponses([
      { url: '/api/auth/me/', body: ORGANIZER },
      // Longer URL first: routes match by substring.
      {
        url: '/api/events/7/responses/',
        status: 500,
        body: { error: { code: 'server_error', message: 'Erreur serveur.' } },
      },
      { url: '/api/events/7/', body: EVENT },
    ])

    expect(await screen.findByText('Impossible de charger les réponses')).toBeInTheDocument()
  })
})
