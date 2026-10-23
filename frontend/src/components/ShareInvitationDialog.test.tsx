import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { clearCookies, mockFetch } from '../test/mockFetch.ts'
import { ShareInvitationDialog } from './ShareInvitationDialog.tsx'

const URL = 'https://www.nickevents.com/i/tok-1'

const CONTEXT = {
  can_share: true,
  shareable: true,
  status: 'active',
  invitation_id: 7,
  display_name: 'M. Éric Mukendi',
  public_url: URL,
  email_enabled: true,
  event: { title: 'Mariage de Grâce et Éric', event_date: '2026-12-12', event_time: '15:00:00', venue_name: 'Salle' },
  default_subject: 'Invitation — Mariage de Grâce et Éric',
  default_message: `Bonjour M. Éric Mukendi,\n\nVotre invitation :\n${URL}`,
}

function renderDialog(buildPdf?: () => Promise<Blob>) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ShareInvitationDialog token="tok-1" open onClose={() => {}} buildPdf={buildPdf} />
    </QueryClientProvider>,
  )
}

describe('ShareInvitationDialog', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    clearCookies()
  })

  it('prepares a WhatsApp link for a normalised DRC number with the public URL', async () => {
    mockFetch([{ url: '/api/share/invitations/tok-1/', body: CONTEXT }])
    const user = userEvent.setup()
    renderDialog()

    const phone = await screen.findByLabelText('Numéro WhatsApp')
    expect(screen.getByRole('button', { name: /Ouvrir dans WhatsApp/ })).toBeDisabled()

    await user.type(phone, '081 234 5678')
    const link = screen.getByRole('link', { name: /Ouvrir dans WhatsApp/ })
    expect(link.getAttribute('href')).toBe(
      `https://wa.me/243812345678?text=${encodeURIComponent(CONTEXT.default_message)}`,
    )
    expect(screen.getByText('Sera ouvert pour +243812345678')).toBeInTheDocument()

    // Handing off never claims the message was sent.
    await user.click(link)
    expect(screen.getByText(/Appuyez sur « Envoyer » dans WhatsApp/)).toBeInTheDocument()
  })

  it('flags an invalid phone number instead of guessing', async () => {
    mockFetch([{ url: '/api/share/invitations/tok-1/', body: CONTEXT }])
    const user = userEvent.setup()
    renderDialog()

    const phone = await screen.findByLabelText('Numéro WhatsApp')
    await user.type(phone, '12')
    await user.tab()
    expect(screen.getByText('Ce numéro est trop court.')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Ouvrir dans WhatsApp/ })).not.toBeInTheDocument()
  })

  it('reports success only after the server accepted the e-mail', async () => {
    const api = mockFetch([
      { url: '/api/share/invitations/tok-1/email/', method: 'POST', body: { status: 'accepted' } },
      { url: '/api/share/invitations/tok-1/', body: CONTEXT },
      { url: '/api/auth/csrf/', status: 204, onRequest: () => (document.cookie = 'csrftoken=tok') },
    ])
    const user = userEvent.setup()
    renderDialog()

    await user.click(await screen.findByRole('tab', { name: /E-mail/ }))
    await user.type(screen.getByLabelText('Adresse e-mail de l’invité'), 'invite@example.com')
    expect(screen.queryByText(/remis au service d’envoi/)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Envoyer l’e-mail/ }))

    expect(await screen.findByText(/E-mail remis au service d’envoi pour invite@example.com/)).toBeInTheDocument()
    const [call] = api.callsTo('/email/', 'POST')
    expect(call.body).toMatchObject({ recipient: 'invite@example.com', subject: CONTEXT.default_subject })
    expect(screen.getByRole('button', { name: /Envoyé/ })).toBeDisabled()
  })

  it('shows the provider error and no success when sending fails', async () => {
    mockFetch([
      {
        url: '/api/share/invitations/tok-1/email/',
        method: 'POST',
        status: 502,
        body: { error: { code: 'email_failed', message: 'Le service d’e-mail n’a pas accepté le message.', fields: {} } },
      },
      { url: '/api/share/invitations/tok-1/', body: CONTEXT },
      { url: '/api/auth/csrf/', status: 204, onRequest: () => (document.cookie = 'csrftoken=tok') },
    ])
    const user = userEvent.setup()
    renderDialog()

    await user.click(await screen.findByRole('tab', { name: /E-mail/ }))
    await user.type(screen.getByLabelText('Adresse e-mail de l’invité'), 'invite@example.com')
    await user.click(screen.getByRole('button', { name: /Envoyer l’e-mail/ }))

    expect(await screen.findByText('Le service d’e-mail n’a pas accepté le message.')).toBeInTheDocument()
    expect(screen.queryByText(/remis au service d’envoi/)).not.toBeInTheDocument()
  })

  it('falls back to the mail app when e-mail delivery is not configured', async () => {
    mockFetch([{ url: '/api/share/invitations/tok-1/', body: { ...CONTEXT, email_enabled: false } }])
    const user = userEvent.setup()
    renderDialog()

    await user.click(await screen.findByRole('tab', { name: /E-mail/ }))
    expect(screen.queryByRole('button', { name: /Envoyer l’e-mail/ })).not.toBeInTheDocument()
    const fallback = screen.getByRole('link', { name: /Ouvrir ma messagerie/ })
    expect(fallback.getAttribute('href')).toContain('mailto:')
  })

  it('refuses to send a revoked invitation', async () => {
    mockFetch([{ url: '/api/share/invitations/tok-1/', body: { ...CONTEXT, shareable: false, status: 'revoked' } }])
    renderDialog()
    await waitFor(() => expect(screen.getByText(/n’est plus active \(révoquée\)/)).toBeInTheDocument())
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
  })

  it('tells a non-owner they cannot send it', async () => {
    mockFetch([{ url: '/api/share/invitations/tok-1/', body: { can_share: false } }])
    renderDialog()
    expect(await screen.findByText(/Seul l’organisateur/)).toBeInTheDocument()
  })

  it('attaches the invitation PDF to the e-mail', async () => {
    const api = mockFetch([
      { url: '/api/share/invitations/tok-1/email/', method: 'POST', body: { status: 'accepted' } },
      { url: '/api/share/invitations/tok-1/', body: CONTEXT },
      { url: '/api/auth/csrf/', status: 204, onRequest: () => (document.cookie = 'csrftoken=tok') },
    ])
    const buildPdf = vi.fn(async () => new Blob(['%PDF-1.7 test'], { type: 'application/pdf' }))
    const user = userEvent.setup()
    renderDialog(buildPdf)

    await user.click(await screen.findByRole('tab', { name: /E-mail/ }))
    expect(screen.getByLabelText(/Joindre l’invitation en PDF/)).toBeChecked()
    await user.type(screen.getByLabelText('Adresse e-mail de l’invité'), 'invite@example.com')
    await user.click(screen.getByRole('button', { name: /Envoyer l’e-mail/ }))

    expect(await screen.findByText(/avec l’invitation en PDF/)).toBeInTheDocument()
    expect(buildPdf).toHaveBeenCalledTimes(1)
    const [call] = api.callsTo('/email/', 'POST')
    expect(atob(String((call.body as { pdf: string }).pdf))).toBe('%PDF-1.7 test')
  })

  it('shares the PDF and the message to WhatsApp through the share sheet', async () => {
    mockFetch([{ url: '/api/share/invitations/tok-1/', body: CONTEXT }])
    const share = vi.fn(async () => undefined)
    vi.stubGlobal('navigator', { ...navigator, canShare: () => true, share })
    const buildPdf = vi.fn(async () => new Blob(['%PDF-1.7 test'], { type: 'application/pdf' }))
    const user = userEvent.setup()
    renderDialog(buildPdf)

    expect(await screen.findByLabelText(/Joindre l’invitation en PDF/)).toBeChecked()
    const send = await screen.findByRole('button', { name: /Envoyer sur WhatsApp avec le PDF/ })
    await waitFor(() => expect(send).toBeEnabled())
    expect(screen.getByText(/choisissez WhatsApp puis votre invité/)).toBeInTheDocument()
    await user.click(send)

    expect(share).toHaveBeenCalledTimes(1)
    const [payload] = share.mock.calls[0] as unknown as [{ files: File[]; text: string }]
    expect(payload.text).toBe(CONTEXT.default_message)
    expect(payload.files[0].name).toBe('Invitation - M. Éric Mukendi.pdf')
    expect(payload.files[0].type).toBe('application/pdf')
    expect(await screen.findByText(/ne peut pas confirmer leur réception/)).toBeInTheDocument()
    expect(buildPdf).toHaveBeenCalledTimes(1)
  })

  it('downloads the PDF and opens WhatsApp where files cannot be shared', async () => {
    mockFetch([{ url: '/api/share/invitations/tok-1/', body: CONTEXT }])
    const open = vi.fn()
    vi.stubGlobal('open', open)
    const createObjectURL = vi.fn(() => 'blob:pdf')
    vi.stubGlobal('URL', Object.assign(globalThis.URL, { createObjectURL, revokeObjectURL: vi.fn() }))
    const user = userEvent.setup()
    renderDialog(async () => new Blob(['%PDF-1.7 test'], { type: 'application/pdf' }))

    await user.type(await screen.findByLabelText('Numéro WhatsApp'), '081 234 5678')
    const send = screen.getByRole('button', { name: /Envoyer sur WhatsApp avec le PDF/ })
    await waitFor(() => expect(send).toBeEnabled())
    expect(screen.getByText(/le PDF sera téléchargé/)).toBeInTheDocument()
    await user.click(send)

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(open).toHaveBeenCalledWith(
      `https://wa.me/243812345678?text=${encodeURIComponent(CONTEXT.default_message)}`,
      '_blank',
      'noopener,noreferrer',
    )
    expect(await screen.findByText(/joignez le fichier \(trombone › Document\)/)).toBeInTheDocument()
  })

  it('keeps the plain WhatsApp link when the PDF is unchecked', async () => {
    mockFetch([{ url: '/api/share/invitations/tok-1/', body: CONTEXT }])
    const user = userEvent.setup()
    renderDialog(async () => new Blob(['%PDF-1.7 test'], { type: 'application/pdf' }))

    await user.click(await screen.findByLabelText(/Joindre l’invitation en PDF/))
    expect(screen.queryByRole('button', { name: /avec le PDF/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Choisir le contact dans WhatsApp/ })).toBeInTheDocument()
  })

  it('reports a PDF build failure without sending anything', async () => {
    const api = mockFetch([{ url: '/api/share/invitations/tok-1/', body: CONTEXT }])
    const user = userEvent.setup()
    renderDialog(async () => {
      throw new Error('canvas tainted')
    })

    await user.click(await screen.findByRole('tab', { name: /E-mail/ }))
    await user.type(screen.getByLabelText('Adresse e-mail de l’invité'), 'invite@example.com')
    await user.click(screen.getByRole('button', { name: /Envoyer l’e-mail/ }))

    expect(await screen.findByText(/Le PDF de l’invitation n’a pas pu être préparé/)).toBeInTheDocument()
    expect(api.callsTo('/email/', 'POST')).toHaveLength(0)
  })
})
