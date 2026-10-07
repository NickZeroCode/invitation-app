import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { toJpeg, toPng } from 'html-to-image'
import { clearCookies, mockFetch } from '../test/mockFetch.ts'
import { PublicInvitationPage } from './PublicInvitationPage.tsx'

vi.mock('html-to-image', () => ({
  toPng: vi.fn(async () => 'data:image/png;base64,PNGDATA'),
  toJpeg: vi.fn(async () => 'data:image/jpeg;base64,JPEGDATA'),
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
    cover_url: null,
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
    expect(screen.getByAltText('QR code de vérification')).toBeInTheDocument()
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

  it('exports the invitation card as a downloadable PNG', async () => {
    const user = (await import('@testing-library/user-event')).default.setup()
    const downloads: Array<{ download: string; href: string }> = []
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        downloads.push({ download: this.download, href: this.href })
      })

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

    await screen.findByText('Repas')
    await user.click(screen.getByRole('button', { name: 'Télécharger PNG' }))

    await waitFor(() => expect(downloads).toHaveLength(1))
    expect(downloads[0].download).toMatch(/^invitation-.*\.png$/)
    expect(downloads[0].href).toContain('data:image/png')
    expect(toPng).toHaveBeenCalledTimes(1)
    clickSpy.mockRestore()
  })

  it('exports the invitation card as a downloadable JPG', async () => {
    const user = (await import('@testing-library/user-event')).default.setup()
    const downloads: Array<{ download: string; href: string }> = []
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        downloads.push({ download: this.download, href: this.href })
      })

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

    await screen.findByText('Repas')
    await user.click(screen.getByRole('button', { name: 'Télécharger JPG' }))

    await waitFor(() => expect(downloads).toHaveLength(1))
    expect(downloads[0].download).toMatch(/^invitation-.*\.jpg$/)
    expect(downloads[0].href).toContain('data:image/jpeg')
    expect(toJpeg).toHaveBeenCalledTimes(1)
    clickSpy.mockRestore()
  })
})
