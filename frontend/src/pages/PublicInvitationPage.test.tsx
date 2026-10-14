import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { clearCookies, mockFetch } from '../test/mockFetch.ts'
import { PublicInvitationPage } from './PublicInvitationPage.tsx'

vi.mock('qrcode', () => ({
  default: { toDataURL: vi.fn(async () => 'data:image/png;base64,QRDATA') },
}))

const PUBLIC_PAYLOAD = {
  status: 'active',
  is_valid: true,
  invitation: {
    guest_name: 'Éric Mukendi',
    civility: 'm',
    display_name: 'M. Éric Mukendi',
    issued_at: '2026-10-01T12:00:00Z',
    expires_at: '2026-12-12T15:00:00Z',
  },
  event: {
    title: 'Mariage de Grâce et Éric',
    message: 'Nous serions honorés de votre présence.',
    event_date: '2026-12-12',
    event_time: '15:00:00',
    timezone: 'Africa/Kinshasa',
    venue_name: 'Cathédrale Notre-Dame',
    venue_address: 'Avenue de la Paix, Kinshasa',
    venue_details: 'Tenue de soirée',
    note: '',
    cover_url: null,
    cover_title: '',
    display_config: { emphasis: ['title', 'date', 'venue'] },
    template: {
      key: 'heritage-luxe',
      name: 'Héritage',
      config: {
        supports_cover: true,
        sections: ['title', 'message', 'date', 'venue', 'preferences'],
        emphasis_fields: ['title', 'date', 'venue'],
      },
    },
  },
  preferences: {
    enabled: true,
    questions: [
      {
        id: 11,
        label: 'Repas',
        help_text: 'Choisissez votre menu.',
        input_type: 'single',
        required: true,
        order: 1,
        options: [
          { id: 21, label: 'Poisson', order: 1 },
          { id: 22, label: 'Viande', order: 2 },
        ],
      },
    ],
  },
  presence: { confirmed: false, confirmed_at: null },
  response: null,
}

const VERIFY = {
  result: 'valid',
  is_valid: true,
  verified_at: '2026-10-01T12:30:00Z',
  guest_name: 'M. Éric Mukendi',
  event_title: 'Mariage de Grâce et Éric',
}

describe('PublicInvitationPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    clearCookies()
  })

  it('renders a premium public invitation and QR verification panel', async () => {
    mockFetch([
      { url: '/api/public/invitations/tok-abc123/', body: PUBLIC_PAYLOAD },
      { url: '/api/public/invitations/tok-abc123/verify/', body: VERIFY },
    ])

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/i/tok-abc123']}>
          <Routes>
            <Route path="/i/:token" element={<PublicInvitationPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect((await screen.findAllByText('Mariage de Grâce et Éric')).length).toBeGreaterThan(0)
    expect((await screen.findAllByText('M. Éric Mukendi')).length).toBeGreaterThan(0)
    expect((await screen.findAllByText('Valide')).length).toBeGreaterThan(0)
    // findBy: the QR image only mounts after QRCode.toDataURL resolves.
    expect(
      await screen.findByAltText('QR code de vérification', {}, { timeout: 5000 }),
    ).toBeInTheDocument()
  })

  it('shows the dress code and the programme in their own panel, dress code on top', async () => {
    mockFetch([
      {
        url: '/api/public/invitations/tok-abc123/',
        body: {
          ...PUBLIC_PAYLOAD,
          dress_code: {
            enabled: true,
            images: [
              { url: 'https://cdn.example/tenue.jpg', caption: 'Tenue de cérémonie', order: 1 },
            ],
          },
          program: {
            enabled: true,
            items: [
              {
                start_time: '15:00:00',
                end_time: '16:30:00',
                description: 'Cérémonie religieuse',
                order: 1,
              },
              { start_time: '18:00:00', end_time: null, description: 'Cocktail', order: 2 },
            ],
          },
        },
      },
      { url: '/api/public/invitations/tok-abc123/verify/', body: VERIFY },
    ])

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/i/tok-abc123']}>
          <Routes>
            <Route path="/i/:token" element={<PublicInvitationPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    // Both sections live in the shared panel only — the paper keeps the message.
    expect(await screen.findAllByText('Dress code')).toHaveLength(1)
    expect(screen.getAllByText('Programme')).toHaveLength(1)
    // No umbrella heading: each block carries its own panel-style title.
    expect(screen.queryByText('Tenue & programme')).not.toBeInTheDocument()

    // The dress code sits above the programme inside the panel.
    const dressTitle = screen.getByText('Dress code')
    const programTitle = screen.getByText('Programme')
    expect(dressTitle.compareDocumentPosition(programTitle)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)

    // Each block title is centered like the panel titles.
    expect(dressTitle).toHaveClass('text-center')
    expect(programTitle).toHaveClass('text-center')

    expect(screen.getByText('Tenue de cérémonie')).toBeInTheDocument()
    expect(screen.getByText('15h – 16h30')).toBeInTheDocument()
    expect(screen.getByText('Cérémonie religieuse')).toBeInTheDocument()
    expect(screen.getByText('18h')).toBeInTheDocument()
    expect(screen.getByText('Cocktail')).toBeInTheDocument()
  })

  it('shows the table right after the programme in the shared panel', async () => {
    mockFetch([
      {
        url: '/api/public/invitations/tok-abc123/',
        body: {
          ...PUBLIC_PAYLOAD,
          program: {
            enabled: true,
            items: [
              { start_time: '18:00:00', end_time: null, description: 'Cocktail', order: 1 },
            ],
          },
          table: { enabled: true, number: '5', text: 'Avec vue sur le jardin' },
        },
      },
      { url: '/api/public/invitations/tok-abc123/verify/', body: VERIFY },
    ])

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/i/tok-abc123']}>
          <Routes>
            <Route path="/i/:token" element={<PublicInvitationPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(await screen.findByText('Votre table')).toBeInTheDocument()
    expect(screen.getByText('Avec vue sur le jardin')).toBeInTheDocument()

    // The table travels with the programme: it sits right under it.
    const programTitle = screen.getByText('Programme')
    const tableTitle = screen.getByText('Votre table')
    expect(programTitle.compareDocumentPosition(tableTitle)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })

  it('hides the table block when no table is assigned', async () => {
    mockFetch([
      {
        url: '/api/public/invitations/tok-abc123/',
        body: {
          ...PUBLIC_PAYLOAD,
          program: {
            enabled: true,
            items: [
              { start_time: '18:00:00', end_time: null, description: 'Cocktail', order: 1 },
            ],
          },
          table: { enabled: false, number: '', text: '' },
        },
      },
      { url: '/api/public/invitations/tok-abc123/verify/', body: VERIFY },
    ])

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/i/tok-abc123']}>
          <Routes>
            <Route path="/i/:token" element={<PublicInvitationPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(await screen.findByText('Programme')).toBeInTheDocument()
    expect(screen.queryByText('Votre table')).not.toBeInTheDocument()
    expect(screen.queryByText('Avec vue sur le jardin')).not.toBeInTheDocument()
  })

  it('lets a guest submit a preference response', async () => {
    const user = (await import('@testing-library/user-event')).default.setup()
    mockFetch([
      { url: '/api/public/invitations/tok-abc123/', body: PUBLIC_PAYLOAD },
      { url: '/api/public/invitations/tok-abc123/verify/', body: VERIFY },
      { url: '/api/auth/csrf/', body: { detail: 'CSRF cookie set.' }, onRequest: () => {
          document.cookie = 'csrftoken=csrf-test-token; path=/'
        },
      },
      {
        method: 'POST',
        url: '/api/public/invitations/tok-abc123/response/',
        status: 201,
        body: {
          id: 88,
          invitation: 7,
          guest_name: 'Éric Mukendi',
          display_name: 'M. Éric Mukendi',
          invitation_status: 'active',
          submitted_at: '2026-10-01T12:05:00Z',
          updated_at: '2026-10-01T12:05:00Z',
          answers: [
            {
              question: 11,
              question_label: 'Repas',
              input_type: 'single',
              options: [{ id: 21, label: 'Poisson' }],
            },
          ],
        },
      },
    ])

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/i/tok-abc123']}>
          <Routes>
            <Route path="/i/:token" element={<PublicInvitationPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    await screen.findByText('Repas')
    await user.click(screen.getByLabelText('Poisson'))
    await user.click(screen.getByRole('button', { name: 'Envoyer ma réponse' }))

    expect(await screen.findByText('Réponse enregistrée.')).toBeInTheDocument()
  })

  it('lets a guest confirm their presence', async () => {
    const user = (await import('@testing-library/user-event')).default.setup()
    const mock = mockFetch([
      {
        url: '/api/public/invitations/tok-abc123/confirm-presence/',
        method: 'POST',
        body: { presence: { confirmed: true, confirmed_at: '2026-10-02T12:00:00Z' } },
      },
      {
        url: '/api/auth/csrf/',
        body: { detail: 'CSRF cookie set.' },
        onRequest: () => {
          document.cookie = 'csrftoken=csrf-test-token; path=/'
        },
      },
      { url: '/api/public/invitations/tok-abc123/verify/', body: VERIFY },
      { url: '/api/public/invitations/tok-abc123/', body: PUBLIC_PAYLOAD },
    ])

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/i/tok-abc123']}>
          <Routes>
            <Route path="/i/:token" element={<PublicInvitationPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    await screen.findByText('Repas')
    await user.click(screen.getByRole('button', { name: 'Confirmer la présence' }))

    // The action button switches to the confirmed state.
    expect(await screen.findByRole('button', { name: /Présence confirmée/ })).toBeDisabled()
    expect(mock.callsTo('/confirm-presence/', 'POST')).toHaveLength(1)
    // \s tolerates the narrow no-break spaces of fr-FR formatting.
    expect(screen.getByText(/Confirmée le\s*2\s*octobre\s*2026/)).toBeInTheDocument()
  })

  it('shows the confirmed state when the presence is already confirmed', async () => {
    mockFetch([
      { url: '/api/public/invitations/tok-abc123/verify/', body: VERIFY },
      {
        url: '/api/public/invitations/tok-abc123/',
        body: {
          ...PUBLIC_PAYLOAD,
          presence: { confirmed: true, confirmed_at: '2026-10-02T12:00:00Z' },
        },
      },
    ])

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/i/tok-abc123']}>
          <Routes>
            <Route path="/i/:token" element={<PublicInvitationPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    await screen.findByText('Repas')
    expect(await screen.findByRole('button', { name: /Présence confirmée/ })).toBeDisabled()
    expect(
      screen.queryByRole('button', { name: 'Confirmer la présence' }),
    ).not.toBeInTheDocument()
  })
})
