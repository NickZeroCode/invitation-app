import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import QRCode from 'qrcode'
import { toJpeg } from 'html-to-image'
import { clearCookies, mockFetch } from '../test/mockFetch.ts'
import { PublicInvitationPage } from './PublicInvitationPage.tsx'

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

  it('exports the invitation as a PDF with a verification QR page', async () => {
    const user = (await import('@testing-library/user-event')).default.setup()
    const downloads: Array<{ download: string; href: string }> = []
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        downloads.push({ download: this.download, href: this.href })
      })

    mockFetch([
      {
        url: '/api/public/invitations/tok-abc123/',
        body: {
          ...PUBLIC_PAYLOAD,
          dress_code: {
            enabled: true,
            images: [
              { url: 'data:image/jpeg;base64,DRESSDATA', caption: 'Tenue de cérémonie', order: 1 },
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

    await screen.findByText('Repas')
    await waitFor(() => expect(QRCode.toDataURL).toHaveBeenCalled())
    await user.click(screen.getByRole('button', { name: "Télécharger l’invitation" }))

    await waitFor(() => expect(downloads).toHaveLength(1))
    expect(downloads[0].download).toMatch(/^invitation-.*\.pdf$/)
    expect(downloads[0].href).toContain('data:application/pdf')

    // Three captures: the invitation card (cover and on-page sections
    // stripped), the dress code + programme page, and the styled verification
    // QR page background. The QR code itself is overlaid at print resolution.
    expect(toJpeg).toHaveBeenCalledTimes(3)
    const card = vi.mocked(toJpeg).mock.calls[0]?.[0] as HTMLElement
    expect(card.textContent ?? '').toContain('Mariage de Grâce et Éric')
    clickSpy.mockRestore()
  })
})
