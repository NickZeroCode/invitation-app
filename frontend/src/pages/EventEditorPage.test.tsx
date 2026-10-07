import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '../auth/AuthContext.tsx'
import { ProtectedRoute } from '../auth/ProtectedRoute.tsx'
import { clearCookies, mockFetch, type MockFetch, type MockRoute } from '../test/mockFetch.ts'
import { EventEditorPage } from './EventEditorPage.tsx'

const ORGANIZER = {
  id: 1,
  email: 'organisateur@nickevents.cd',
  first_name: 'Néhémie',
  last_name: 'Kabongo',
  full_name: 'Néhémie Kabongo',
  timezone: 'Africa/Kinshasa',
  date_joined: '2026-10-01T08:00:00Z',
}

const CREATED = {
  id: 42,
  template: 'confetti',
  title: 'Les 30 ans de Sarah',
  message: 'Une soirée festive vous attend.',
  event_date: '2026-12-12',
  event_time: '15:00:00',
  timezone: 'Africa/Kinshasa',
  venue_name: 'Le Palmier',
  venue_address: '',
  venue_details: '',
  cover_url: null,
  display_config: { emphasis: ['title'] },
  preference_questions: [],
  invitations_count: 0,
  is_active: true,
  created_at: '2026-10-07T10:00:00Z',
  updated_at: '2026-10-07T10:00:00Z',
}

const CSRF: MockRoute = {
  url: '/api/auth/csrf/',
  body: null,
  onRequest: () => {
    document.cookie = 'csrftoken=fresh-token'
  },
}

function renderEditor(routes: MockRoute[], path = '/evenements/nouveau?modele=confetti'): MockFetch {
  const mock = mockFetch(routes)
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/evenements/nouveau"
              element={
                <ProtectedRoute>
                  <EventEditorPage />
                </ProtectedRoute>
              }
            />
            <Route path="/evenements" element={<div>page-evenements</div>} />
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

describe('EventEditorPage', () => {
  // Full-form userEvent flow (dozens of keystrokes) — generous explicit
  // timeout instead of the 5s default, which it flakily exceeds under load.
  it(
    'creates an event model with its preference questions',
    async () => {
    const user = userEvent.setup()
    const mock = renderEditor([
      { url: '/api/auth/me/', body: ORGANIZER },
      CSRF,
      { url: '/api/events/', method: 'POST', body: CREATED },
    ])

    await user.type(await screen.findByLabelText(/^Titre de l/), 'Les 30 ans de Sarah')
    await user.type(screen.getByLabelText(/^Message/), 'Une soirée festive vous attend.')
    fireEvent.change(document.getElementById('event-date') as HTMLInputElement, {
      target: { value: '2026-12-12' },
    })
    fireEvent.change(document.getElementById('event-time') as HTMLInputElement, {
      target: { value: '15:00' },
    })
    await user.type(screen.getByLabelText(/^Nom du lieu/), 'Le Palmier')
    await user.click(screen.getByRole('checkbox', { name: 'Titre' }))

    await user.click(screen.getByRole('button', { name: 'Ajouter une question' }))
    await user.type(document.getElementById('question-0-label') as HTMLInputElement, 'Participerez-vous ?')
    const optionInputs = screen.getAllByLabelText("Libellé de l'option")
    await user.type(optionInputs[0], 'Oui')
    await user.click(screen.getByRole('button', { name: 'Ajouter une option' }))
    await user.type(screen.getAllByLabelText("Libellé de l'option")[1], 'Non')

    await user.click(screen.getByRole('button', { name: "Créer l'événement" }))

    expect(await screen.findByText('page-evenements')).toBeInTheDocument()
    const post = mock.callsTo('/api/events/', 'POST')[0]
    expect(post).toBeDefined()
    expect(post.body).toMatchObject({
      template: 'confetti',
      title: 'Les 30 ans de Sarah',
      message: 'Une soirée festive vous attend.',
      event_date: '2026-12-12',
      event_time: '15:00',
      timezone: 'Africa/Kinshasa',
      venue_name: 'Le Palmier',
      display_config: { emphasis: ['title'] },
      preference_questions: [
        {
          label: 'Participerez-vous ?',
          help_text: '',
          input_type: 'single',
          required: false,
          order: 0,
          is_active: true,
          options: [{ label: 'Oui' }, { label: 'Non' }],
        },
      ],
    })
    },
    15000,
  )

  it('requires a title before saving', async () => {
    const user = userEvent.setup()
    const mock = renderEditor([
      { url: '/api/auth/me/', body: ORGANIZER },
      CSRF,
    ])

    await user.click(await screen.findByRole('button', { name: "Créer l'événement" }))

    expect(await screen.findByText('Ce champ est obligatoire.')).toBeInTheDocument()
    expect(mock.callsTo('/api/events/', 'POST')).toHaveLength(0)
  })

  it('rejects cover images above the size limit', async () => {
    const user = userEvent.setup()
    renderEditor([
      { url: '/api/auth/me/', body: ORGANIZER },
      CSRF,
    ])

    const input = await screen.findByLabelText('Choisir une image')
    const big = new File([new Uint8Array(6 * 1024 * 1024)], 'grosse.jpg', { type: 'image/jpeg' })
    await user.upload(input, big)

    expect(
      await screen.findByText("L'image ne doit pas dépasser 5 Mo."),
    ).toBeInTheDocument()
  })
})
