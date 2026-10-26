import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '../auth/AuthContext.tsx'
import { clearCookies, mockFetch } from '../test/mockFetch.ts'
import { GuestListExportDialog } from './GuestListExportDialog.tsx'

const ORGANIZER = { id: 1, email: 'organisateur@example.com', first_name: 'Nadine', last_name: 'Kabeya' }
const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const CSRF = { url: '/api/auth/csrf/', status: 204, onRequest: () => (document.cookie = 'csrftoken=tok') }

function renderDialog() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <GuestListExportDialog eventId={7} open onClose={() => {}} />
      </AuthProvider>
    </QueryClientProvider>,
  )
}

function captureDownloads() {
  const downloads: string[] = []
  vi.stubGlobal('URL', Object.assign(globalThis.URL, { createObjectURL: vi.fn(() => 'blob:xlsx'), revokeObjectURL: vi.fn() }))
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    downloads.push(this.download)
  })
  return { downloads, restore: () => click.mockRestore() }
}

describe('GuestListExportDialog', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    clearCookies()
  })

  it('downloads the workbook under the name the server gives it', async () => {
    const api = mockFetch([
      { url: '/api/auth/me/', body: ORGANIZER },
      {
        url: '/api/events/7/guests/export/',
        bytes: new Uint8Array([80, 75, 3, 4]),
        contentType: XLSX,
        headers: { 'Content-Disposition': 'attachment; filename="invites-mariage-2026-12-12.xlsx"' },
      },
    ])
    const { downloads, restore } = captureDownloads()
    const user = userEvent.setup()
    renderDialog()

    await user.click(await screen.findByRole('button', { name: /Télécharger le fichier Excel/ }))

    expect(await screen.findByText(/Fichier « invites-mariage-2026-12-12.xlsx » téléchargé/)).toBeInTheDocument()
    expect(downloads).toEqual(['invites-mariage-2026-12-12.xlsx'])
    expect(api.callsTo('/guests/export/', 'GET')).toHaveLength(1)
    restore()
  })

  it('e-mails the workbook, to the organizer by default', async () => {
    const api = mockFetch([
      { url: '/api/auth/me/', body: ORGANIZER },
      { url: '/api/events/7/guests/export/email/', method: 'POST', body: { status: 'accepted' } },
      CSRF,
    ])
    const user = userEvent.setup()
    renderDialog()

    const recipient = await screen.findByLabelText('Adresse e-mail du destinataire')
    await screen.findByDisplayValue('organisateur@example.com')
    await user.clear(recipient)
    await user.type(recipient, 'traiteur@example.com')
    await user.type(screen.getByLabelText('Message (facultatif)'), 'Pour le plan de table.')
    await user.click(screen.getByRole('button', { name: /Envoyer le fichier/ }))

    expect(await screen.findByText(/E-mail remis au service d’envoi pour traiteur@example.com/)).toBeInTheDocument()
    const [call] = api.callsTo('/guests/export/email/', 'POST')
    expect(call.body).toEqual({ recipient: 'traiteur@example.com', message: 'Pour le plan de table.' })
    expect(screen.getByRole('button', { name: /Envoyé/ })).toBeDisabled()
  })

  it('says so when e-mail delivery is not configured', async () => {
    mockFetch([
      { url: '/api/auth/me/', body: ORGANIZER },
      {
        url: '/api/events/7/guests/export/email/',
        method: 'POST',
        status: 503,
        body: { error: { code: 'email_unavailable', message: 'L’envoi d’e-mails n’est pas configuré.', fields: {} } },
      },
      CSRF,
    ])
    const user = userEvent.setup()
    renderDialog()

    await screen.findByDisplayValue('organisateur@example.com')
    await user.click(screen.getByRole('button', { name: /Envoyer le fichier/ }))

    expect(await screen.findByText('L’envoi d’e-mails n’est pas configuré.')).toBeInTheDocument()
    expect(screen.queryByText(/remis au service d’envoi/)).not.toBeInTheDocument()
  })

  it('will not send to an invalid address', async () => {
    mockFetch([{ url: '/api/auth/me/', body: ORGANIZER }])
    const user = userEvent.setup()
    renderDialog()

    const recipient = await screen.findByLabelText('Adresse e-mail du destinataire')
    await screen.findByDisplayValue('organisateur@example.com')
    await user.clear(recipient)
    await user.type(recipient, 'pas-une-adresse')
    await user.tab()
    expect(screen.getByText('Adresse e-mail invalide.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Envoyer le fichier/ })).toBeDisabled()
  })
})
