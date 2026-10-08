import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { toJpeg } from 'html-to-image'
import { AuthProvider } from '../auth/AuthContext.tsx'
import { ProtectedRoute } from '../auth/ProtectedRoute.tsx'
import { clearCookies, mockFetch, type MockFetch, type MockRoute } from '../test/mockFetch.ts'

import { GuestsPage } from './GuestsPage.tsx'

vi.mock('html-to-image', () => ({
  toJpeg: vi.fn(async () => 'data:image/jpeg;base64,JPEGDATA'),
}))
vi.mock('qrcode', () => ({
  default: { toDataURL: vi.fn(async () => 'data:image/png;base64,QRDATA') },
}))
vi.mock('jspdf', () => ({
  jsPDF: class {
    setProperties() {}
    addPage() {}
    addImage() {}
    output() {
      return 'data:application/pdf;base64,0123456789'
    }
  },
}))

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
  dress_code: [],
  program_items: [],
  invitations_count: 1,
  is_active: true,
  created_at: '2026-10-07T10:00:00Z',
  updated_at: '2026-10-07T10:00:00Z',
}

function invitation(overrides: Record<string, unknown> = {}) {
  return {
    id: 41,
    event: 7,
    event_title: 'Mariage de Grâce et Éric',
    guest_name: 'Éric Mukendi',
    civility: 'mme',
    display_name: 'Mme Éric Mukendi',
    token: 'tok-abc123',
    issued_at: '2026-10-07T10:00:00Z',
    expires_at: '2026-12-20T23:59:59Z',
    state: 'active',
    status: 'active',
    is_valid: true,
    has_response: true,
    created_at: '2026-10-07T10:00:00Z',
    updated_at: '2026-10-07T10:00:00Z',
    ...overrides,
  }
}

const PAGE = { count: 1, next: null, previous: null, results: [invitation()] }

const CSRF_ROUTE: MockRoute = {
  url: '/api/auth/csrf/',
  body: null,
  onRequest: () => {
    document.cookie = 'csrftoken=fresh-token'
  },
}

function byId(id: string): HTMLElement {
  const element = document.getElementById(id)
  if (!element) throw new Error(`Élément #${id} introuvable.`)
  return element
}

function renderGuests(routes: MockRoute[]): MockFetch {
  const mock = mockFetch(routes)
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/evenements/7/invitations']}>
        <AuthProvider>
          <Routes>
            <Route
              path="/evenements/:id/invitations"
              element={
                <ProtectedRoute>
                  <GuestsPage />
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

describe('GuestsPage', () => {
  it('lists guest invitations with status and details', async () => {
    renderGuests([
      { url: '/api/auth/me/', body: ORGANIZER },
      // Longer URL first: routes match by substring.
      { url: '/api/events/7/invitations/', body: PAGE },
      { url: '/api/events/7/', body: EVENT },
    ])

    expect(await screen.findByText('Mme Éric Mukendi')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('A répondu')).toBeInTheDocument()
    expect(screen.getByText(/Émise le/)).toBeInTheDocument()
    expect(screen.getByText(/Expire le/)).toBeInTheDocument()
    expect(screen.getByText('Mariage de Grâce et Éric')).toBeInTheDocument()
  })

  it('creates a single guest invitation', async () => {
    const user = userEvent.setup()
    const mock = renderGuests([
      { url: '/api/auth/me/', body: ORGANIZER },
      { url: '/api/events/7/invitations/', body: PAGE },
      { url: '/api/events/7/', body: EVENT },
      CSRF_ROUTE,
      {
        url: '/api/events/7/invitations/',
        method: 'POST',
        status: 201,
        body: invitation({ id: 42, guest_name: 'Sarah Kabamba', display_name: 'Mme Sarah Kabamba', has_response: false }),
      },
    ])

    await user.click(await screen.findByRole('button', { name: 'Ajouter un invité' }))
    await screen.findByRole('button', { name: "Créer l'invitation" })
    await user.type(byId('guest-name'), 'Sarah Kabamba')
    await user.selectOptions(byId('guest-civility'), 'mme')
    await user.click(screen.getByRole('button', { name: "Créer l'invitation" }))

    expect(await screen.findByText('Invitation créée.')).toBeInTheDocument()
    const [call] = mock.callsTo('/api/events/7/invitations/', 'POST')
    expect(call.body).toMatchObject({ guest_name: 'Sarah Kabamba', civility: 'mme', expires_at: null })
  })

  it('generates a batch of invitations from the guest list', async () => {
    const user = userEvent.setup()
    const mock = renderGuests([
      { url: '/api/auth/me/', body: ORGANIZER },
      { url: '/api/events/7/invitations/', body: PAGE },
      { url: '/api/events/7/', body: EVENT },
      CSRF_ROUTE,
      {
        url: '/api/events/7/invitations/bulk/',
        method: 'POST',
        status: 201,
        body: { count: 2, invitations: [invitation(), invitation({ id: 43, guest_name: 'Sarah Kabamba' })] },
      },
    ])

    await user.click(await screen.findByRole('button', { name: 'Ajouter un invité' }))
    await screen.findByRole('button', { name: 'Générer les invitations' })
    await user.type(byId('guest-bulk'), 'Éric Mukendi{enter}Sarah Kabamba')
    await user.click(screen.getByRole('button', { name: 'Générer les invitations' }))

    expect(await screen.findByText('Invitations générées.')).toBeInTheDocument()
    const [call] = mock.callsTo('/api/events/7/invitations/bulk/', 'POST')
    expect(call.body).toEqual({
      invitations: [{ guest_name: 'Éric Mukendi' }, { guest_name: 'Sarah Kabamba' }],
    })
  })

  it('copies the unique invitation link', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    renderGuests([
      { url: '/api/auth/me/', body: ORGANIZER },
      { url: '/api/events/7/invitations/', body: PAGE },
      { url: '/api/events/7/', body: EVENT },
    ])

    await user.click(await screen.findByRole('button', { name: 'Copier le lien' }))

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('/i/tok-abc123'))
    expect(screen.getByRole('button', { name: 'Lien copié.' })).toBeInTheDocument()
  })

  it('revokes an invitation after confirmation', async () => {
    const user = userEvent.setup()
    const mock = renderGuests([
      { url: '/api/auth/me/', body: ORGANIZER },
      { url: '/api/events/7/invitations/', body: PAGE },
      { url: '/api/events/7/', body: EVENT },
      CSRF_ROUTE,
      {
        url: '/api/invitations/41/revoke/',
        method: 'POST',
        body: invitation({ state: 'revoked', status: 'revoked', is_valid: false }),
      },
    ])

    await user.click(await screen.findByRole('button', { name: 'Révoquer' }))
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(
      screen.getByText("Le lien de l'invité cessera immédiatement de fonctionner."),
    ).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: 'Révoquer' })[1])

    expect(await screen.findByText('Invitation révoquée.')).toBeInTheDocument()
    expect(mock.callsTo('/api/invitations/41/revoke/', 'POST')).toHaveLength(1)
  })

  it('deletes an invitation after confirmation', async () => {
    const user = userEvent.setup()
    const mock = renderGuests([
      { url: '/api/auth/me/', body: ORGANIZER },
      { url: '/api/events/7/invitations/', body: PAGE },
      { url: '/api/events/7/', body: EVENT },
      CSRF_ROUTE,
      { url: '/api/invitations/41/', method: 'DELETE', status: 204 },
    ])

    await user.click(await screen.findByRole('button', { name: 'Supprimer' }))
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(
      screen.getByText("L'invité sera retiré de la liste. L'historique des réponses est conservé."),
    ).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: 'Supprimer' })[1])

    expect(await screen.findByText('Invitation supprimée.')).toBeInTheDocument()
    expect(mock.callsTo('/api/invitations/41/', 'DELETE')).toHaveLength(1)
  })

  it('exports the guest invitation as a PDF', async () => {
    const user = userEvent.setup()
    const downloads: Array<{ download: string; href: string }> = []
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        downloads.push({ download: this.download, href: this.href })
      })
    renderGuests([
      { url: '/api/auth/me/', body: ORGANIZER },
      { url: '/api/events/7/invitations/', body: PAGE },
      { url: '/api/events/7/', body: EVENT },
    ])

    await user.click(await screen.findByRole('button', { name: 'Exporter' }))

    await waitFor(() => expect(downloads).toHaveLength(1))
    expect(downloads[0].download).toBe('invitation-mariage-de-grace-et-eric-mme-eric-mukendi.pdf')
    expect(downloads[0].href).toContain('data:application/pdf')
    // Two captures: the off-screen invitation card (no cover, dress code or
    // programme in this fixture) and the styled verification QR page
    // background; the QR code itself is overlaid at print resolution.
    expect(toJpeg).toHaveBeenCalledTimes(2)
    clickSpy.mockRestore()
  })
})
