/**
 * End-to-end workflow tests (§19) — the complete real invitation workflow:
 *
 *   log in → create an event model → create a guest invitation → open its
 *   unique link → verify its QR code → download the invitation image →
 *   follow the scanned QR payload → submit guest preferences → confirm the
 *   response in the organizer dashboard → revoke the invitation → verify
 *   that subsequent access is handled correctly.
 *
 * A stateful in-memory backend mirrors the Django API: revoking flips the
 * invitation state, submitted answers are recorded and reported back to the
 * organizer report. Each step is therefore verified against the outcome of
 * the previous one, not against canned, disconnected responses.
 *
 * QR "scanning": jsdom cannot optically decode a PNG. The QR payload (what a
 * scanner decodes) is captured at generation time and followed instead,
 * proving the round trip unique link → QR code → decoded link → verified
 * invitation. A physical camera scan of the exported image stays a manual
 * step and is reported as such.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createMemoryRouter, type RouteObject } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import QRCode from 'qrcode'
import { toJpeg } from 'html-to-image'

vi.mock('html-to-image', () => ({
  toJpeg: vi.fn(async () => 'data:image/jpeg;base64,JPEGDATA'),
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

import { AuthProvider } from '../auth/AuthContext.tsx'
import { GuestRoute, ProtectedRoute } from '../auth/ProtectedRoute.tsx'
import { AppShell } from '../layout/AppShell.tsx'
import type {
  EventModel,
  EventPayload,
  GuestResponsePayload,
  GuestResponseSubmission,
  Invitation,
  InvitationCivility,
  InvitationTemplate,
  PreferenceQuestion,
} from '../lib/types.ts'
import { EventEditorPage } from '../pages/EventEditorPage.tsx'
import { EventsPage } from '../pages/EventsPage.tsx'
import { GuestsPage } from '../pages/GuestsPage.tsx'
import { LandingPage } from '../pages/LandingPage.tsx'
import { LoginPage } from '../pages/LoginPage.tsx'
import { NotFoundPage } from '../pages/NotFoundPage.tsx'
import { OverviewPage } from '../pages/OverviewPage.tsx'
import { PublicInvitationPage } from '../pages/PublicInvitationPage.tsx'
import { ResponsesPage } from '../pages/ResponsesPage.tsx'
import { SettingsPage } from '../pages/SettingsPage.tsx'
import { TemplatesPage } from '../pages/TemplatesPage.tsx'
import { clearCookies } from '../test/mockFetch.ts'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ORGANIZER = {
  id: 1,
  email: 'organisateur@nickevents.cd',
  first_name: 'Néhémie',
  last_name: 'Kabongo',
  full_name: 'Néhémie Kabongo',
  timezone: 'Africa/Kinshasa',
  date_joined: '2026-10-01T08:00:00Z',
}

const NOW = '2026-10-07T10:00:00Z'

const CATALOG: InvitationTemplate[] = [
  {
    key: 'heritage-luxe',
    name: 'Héritage',
    category: 'wedding',
    category_label: 'Mariage',
    description: 'Composition classique et centrée.',
    version: 1,
    supports_cover: true,
    config: { supports_cover: true, sections: ['title', 'message', 'date', 'venue'], emphasis_fields: ['title', 'date', 'venue'] },
  },
  {
    key: 'jardin-floral',
    name: 'Jardin',
    category: 'anniversary',
    category_label: 'Anniversaire de mariage',
    description: 'Pétales et jardin en fleurs.',
    version: 1,
    supports_cover: true,
    config: { supports_cover: true, sections: ['title', 'message', 'date', 'venue'], emphasis_fields: ['title', 'date'] },
  },
  {
    key: 'ligne-moderne',
    name: 'Ligne moderne',
    category: 'corporate',
    category_label: 'Entreprise',
    description: 'Grille nette et contemporaine.',
    version: 1,
    supports_cover: false,
    config: { supports_cover: false, sections: ['title', 'message', 'date', 'venue'], emphasis_fields: ['title'] },
  },
  {
    key: 'confetti',
    name: 'Confetti',
    category: 'birthday',
    category_label: 'Anniversaire',
    description: 'Fête, couleurs et bonne humeur.',
    version: 1,
    supports_cover: true,
    config: { supports_cover: true, sections: ['title', 'message', 'date', 'venue'], emphasis_fields: ['title', 'date'] },
  },
  {
    key: 'sceau-academique',
    name: 'Sceau académique',
    category: 'graduation',
    category_label: 'Remise de diplômes',
    description: 'Sobre et solennel.',
    version: 1,
    supports_cover: true,
    config: { supports_cover: true, sections: ['title', 'message', 'date', 'venue'], emphasis_fields: ['title', 'date'] },
  },
  {
    key: 'soiree-formelle',
    name: 'Soirée',
    category: 'reception',
    category_label: 'Réception / cérémonie',
    description: 'Élégance du soir.',
    version: 1,
    supports_cover: true,
    config: { supports_cover: true, sections: ['title', 'message', 'date', 'venue'], emphasis_fields: ['title', 'date', 'venue'] },
  },
  {
    key: 'memoire',
    name: 'Mémoire',
    category: 'memorial',
    category_label: 'Hommage',
    description: 'Recueillement et souvenirs.',
    version: 1,
    supports_cover: true,
    config: { supports_cover: true, sections: ['title', 'message', 'date'], emphasis_fields: ['title'] },
  },
]

const SEEDED_EVENT: EventModel = {
  id: 7,
  template: 'confetti',
  template_detail: CATALOG[3],
  title: 'Les 30 ans de Sarah',
  message: 'Une soirée festive vous attend.',
  event_date: '2026-12-12',
  event_time: '15:00:00',
  timezone: 'Africa/Kinshasa',
  venue_name: 'Le Palmier',
  venue_address: '',
  venue_details: '',
  cover_url: null,
  cover_title: '',
  display_config: { emphasis: ['title'] },
  preference_questions: [],
  program_items: [],
  dress_code: [],
  invitations_count: 0,
  is_active: true,
  created_at: NOW,
  updated_at: NOW,
}

const PARTICIPATION_QUESTION: PreferenceQuestion = {
  id: 21,
  label: 'Participerez-vous ?',
  help_text: '',
  input_type: 'single',
  required: true,
  order: 1,
  is_active: true,
  options: [
    { id: 31, label: 'Oui', order: 1 },
    { id: 32, label: 'Non', order: 2 },
  ],
}

const CIVILITY_PREFIX: Record<InvitationCivility, string> = {
  none: '',
  m: 'M.',
  mme: 'Mme',
  mlle: 'Mlle',
  couple: 'M. & Mme',
}

// ---------------------------------------------------------------------------
// Stateful in-memory backend
// ---------------------------------------------------------------------------

interface PublicFixture {
  token: string
  status: 'active' | 'expired' | 'revoked'
  invitation: {
    guest_name: string
    civility: InvitationCivility
    display_name: string
    issued_at: string
    expires_at: string | null
  }
  event: EventModel
  questions: PreferenceQuestion[]
  response: GuestResponsePayload | null
  /** When set, POST response/ is rejected with this validation message. */
  rejectSubmit?: string
}

interface BackendState {
  loggedIn: boolean
  events: EventModel[]
  invitations: Invitation[]
  responses: GuestResponsePayload[]
  fixtures: Map<string, PublicFixture>
}

interface Backend {
  fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
  calls: Array<{ method: string; url: string; body: unknown }>
  state: BackendState
}

function json(status: number, body?: unknown): Response {
  if (body === undefined || status === 204) {
    return new Response(null, { status })
  }
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function notFound(): Response {
  return json(404, { error: { code: 'not_found', message: 'Introuvable.' } })
}

function publicPayload(fixture: PublicFixture): unknown {
  const event = fixture.event
  return {
    status: fixture.status,
    is_valid: fixture.status === 'active',
    invitation: fixture.invitation,
    event: {
      title: event.title,
      message: event.message,
      event_date: event.event_date,
      event_time: event.event_time,
      timezone: event.timezone,
      venue_name: event.venue_name,
      venue_address: event.venue_address,
      venue_details: event.venue_details,
      cover_url: event.cover_url,
      cover_title: event.cover_title,
      display_config: event.display_config,
      template: {
        key: event.template,
        name: event.template_detail.name,
        config: {
          supports_cover: event.template_detail.supports_cover,
          sections: event.template_detail.config.sections,
          emphasis_fields: event.template_detail.config.emphasis_fields,
        },
      },
    },
    preferences: {
      enabled: fixture.questions.some((question) => question.is_active),
      questions: fixture.questions,
    },
    response: fixture.response,
  }
}

interface Handler {
  method: string
  pattern: RegExp
  handle: (match: RegExpMatchArray, body: unknown) => Response
}

function createBackend(initialFixtures: Record<string, PublicFixture> = {}): Backend {
  const calls: Backend['calls'] = []
  const state: BackendState = {
    loggedIn: false,
    events: [],
    invitations: [],
    responses: [],
    fixtures: new Map(Object.entries(initialFixtures)),
  }

  const findEvent = (match: RegExpMatchArray) =>
    state.events.find((event) => event.id === Number(match[1]))

  const handlers: Handler[] = [
    {
      method: 'GET',
      pattern: /^\/api\/auth\/me\/$/,
      handle: () =>
        state.loggedIn
          ? json(200, ORGANIZER)
          : json(401, { error: { code: 'not_authenticated', message: 'Authentification requise.' } }),
    },
    {
      method: 'POST',
      pattern: /^\/api\/auth\/login\/$/,
      handle: () => {
        state.loggedIn = true
        return json(200, ORGANIZER)
      },
    },
    {
      method: 'GET',
      pattern: /^\/api\/auth\/csrf\/$/,
      handle: () => {
        document.cookie = 'csrftoken=e2e-token; path=/'
        return json(200, null)
      },
    },
    {
      method: 'GET',
      pattern: /^\/api\/dashboard\/overview\/$/,
      handle: () =>
        json(200, {
          events: { total: state.events.length, upcoming: state.events.length },
          invitations: {
            total: state.invitations.length,
            active: state.invitations.filter((i) => i.status === 'active').length,
            expired: state.invitations.filter((i) => i.status === 'expired').length,
            revoked: state.invitations.filter((i) => i.status === 'revoked').length,
          },
          responses: { total: state.responses.length },
          generated_at: NOW,
        }),
    },
    {
      method: 'GET',
      pattern: /^\/api\/templates\/$/,
      handle: () => json(200, CATALOG),
    },
    {
      method: 'POST',
      pattern: /^\/api\/events\/$/,
      handle: (_match, body) => {
        const payload = body as EventPayload
        const template = CATALOG.find((entry) => entry.key === payload.template) ?? CATALOG[0]
        const event: EventModel = {
          id: 7,
          template: payload.template,
          template_detail: template,
          title: payload.title,
          message: payload.message,
          event_date: payload.event_date,
          event_time: payload.event_time,
          timezone: payload.timezone,
          venue_name: payload.venue_name,
          venue_address: payload.venue_address,
          venue_details: payload.venue_details,
          cover_url: null,
          cover_title: '',
          display_config: payload.display_config,
          preference_questions: payload.preference_questions.map((question, index) => ({
            ...question,
            id: 11 + index,
            options: question.options.map((option, position) => ({
              ...option,
              id: 21 + index * 10 + position,
              order: position + 1,
            })),
          })),
          program_items: (payload.program_items ?? []).map((item, index) => ({
            ...item,
            id: 41 + index,
            end_time: item.end_time ?? null,
            order: item.order ?? index,
          })),
          dress_code: [],
          invitations_count: 0,
          is_active: payload.is_active ?? true,
          created_at: NOW,
          updated_at: NOW,
        }
        state.events.push(event)
        return json(201, event)
      },
    },
    {
      method: 'GET',
      pattern: /^\/api\/events\/(\d+)\/responses\/$/,
      handle: (match) => {
        const event = findEvent(match)
        if (!event) return notFound()
        const results = state.responses
        return json(200, {
          count: results.length,
          next: null,
          previous: null,
          results,
          summary: {
            invitations: state.invitations.length,
            responses: results.length,
            questions: event.preference_questions.map((question) => ({
              id: question.id,
              label: question.label,
              input_type: question.input_type,
              options: question.options.map((option) => ({
                id: option.id,
                label: option.label,
                count: results.filter((response) =>
                  response.answers.some(
                    (answer) =>
                      answer.question === question.id &&
                      answer.options.some((chosen) => chosen.id === option.id),
                  ),
                ).length,
              })),
            })),
          },
        })
      },
    },
    {
      method: 'GET',
      pattern: /^\/api\/events\/(\d+)\/invitations\/$/,
      handle: (match) => {
        const event = findEvent(match)
        if (!event) return notFound()
        const results = state.invitations.filter((invitation) => invitation.event === event.id)
        return json(200, { count: results.length, next: null, previous: null, results })
      },
    },
    {
      method: 'POST',
      pattern: /^\/api\/events\/(\d+)\/invitations\/$/,
      handle: (match, body) => {
        const event = findEvent(match)
        if (!event) return notFound()
        const payload = body as { guest_name: string; civility?: InvitationCivility; expires_at?: string | null }
        const civility = payload.civility ?? 'none'
        const displayName = [CIVILITY_PREFIX[civility], payload.guest_name].filter(Boolean).join(' ')
        const invitation: Invitation = {
          id: 41,
          event: event.id,
          event_title: event.title,
          guest_name: payload.guest_name,
          civility,
          display_name: displayName,
          token: 'tok-e2e-001',
          issued_at: NOW,
          expires_at: payload.expires_at ?? null,
          state: 'active',
          status: 'active',
          is_valid: true,
          has_response: false,
          created_at: NOW,
          updated_at: NOW,
        }
        state.invitations.push(invitation)
        state.fixtures.set(invitation.token, {
          token: invitation.token,
          status: 'active',
          invitation: {
            guest_name: invitation.guest_name,
            civility,
            display_name: displayName,
            issued_at: NOW,
            expires_at: invitation.expires_at,
          },
          event,
          questions: event.preference_questions,
          response: null,
        })
        return json(201, invitation)
      },
    },
    {
      method: 'GET',
      pattern: /^\/api\/events\/(\d+)\/$/,
      handle: (match) => {
        const event = findEvent(match)
        return event ? json(200, event) : notFound()
      },
    },
    {
      method: 'GET',
      pattern: /^\/api\/events\/$/,
      handle: () =>
        json(200, {
          count: state.events.length,
          next: null,
          previous: null,
          results: state.events,
        }),
    },
    {
      method: 'POST',
      pattern: /^\/api\/invitations\/(\d+)\/revoke\/$/,
      handle: (match) => {
        const invitation = state.invitations.find((entry) => entry.id === Number(match[1]))
        if (!invitation) return notFound()
        invitation.state = 'revoked'
        invitation.status = 'revoked'
        invitation.is_valid = false
        invitation.updated_at = '2026-10-07T12:00:00Z'
        const fixture = state.fixtures.get(invitation.token)
        if (fixture) fixture.status = 'revoked'
        return json(200, invitation)
      },
    },
    {
      method: 'GET',
      pattern: /^\/api\/public\/invitations\/([^/]+)\/verify\/$/,
      handle: (match) => {
        const fixture = state.fixtures.get(match[1])
        if (!fixture) return notFound()
        return json(200, {
          result: fixture.status === 'active' ? 'valid' : fixture.status,
          is_valid: fixture.status === 'active',
          verified_at: '2026-10-07T12:30:00Z',
          guest_name: fixture.invitation.display_name,
          event_title: fixture.event.title,
        })
      },
    },
    {
      method: 'POST',
      pattern: /^\/api\/public\/invitations\/([^/]+)\/response\/$/,
      handle: (match, body) => {
        const fixture = state.fixtures.get(match[1])
        if (!fixture) return notFound()
        if (fixture.rejectSubmit) {
          return json(400, {
            error: { code: 'validation_error', message: fixture.rejectSubmit, fields: {} },
          })
        }
        const submission = body as GuestResponseSubmission
        const response: GuestResponsePayload = {
          id: 88,
          invitation: 41,
          guest_name: fixture.invitation.guest_name,
          display_name: fixture.invitation.display_name,
          invitation_status: fixture.status,
          submitted_at: '2026-10-07T12:05:00Z',
          updated_at: '2026-10-07T12:05:00Z',
          answers: submission.answers.map((answer) => {
            const question = fixture.questions.find((entry) => entry.id === answer.question)
            return {
              question: answer.question,
              question_label: question?.label ?? '',
              input_type: question?.input_type ?? 'single',
              options: (question?.options ?? [])
                .filter((option) => answer.options.includes(option.id))
                .map((option) => ({ id: option.id, label: option.label })),
            }
          }),
        }
        fixture.response = response
        state.responses.push(response)
        const invitation = state.invitations.find((entry) => entry.token === fixture.token)
        if (invitation) invitation.has_response = true
        return json(201, response)
      },
    },
    {
      method: 'GET',
      pattern: /^\/api\/public\/invitations\/([^/]+)\/$/,
      handle: (match) => {
        const fixture = state.fixtures.get(match[1])
        return fixture ? json(200, publicPayload(fixture)) : notFound()
      },
    },
  ]

  const fetchImpl = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const raw =
      typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    const url = raw.replace(/^https?:\/\/[^/]+/, '')
    const method = (init?.method ?? 'GET').toUpperCase()
    let body: unknown = null
    if (typeof init?.body === 'string') {
      body = JSON.parse(init.body)
    }
    calls.push({ method, url, body })

    for (const handler of handlers) {
      if (handler.method !== method) continue
      const match = url.match(handler.pattern)
      if (match) return handler.handle(match, body)
    }
    return notFound()
  }

  return { fetch: fetchImpl, calls, state }
}

// ---------------------------------------------------------------------------
// App harness (mirrors the route table of App.tsx with a memory router)
// ---------------------------------------------------------------------------

const ROUTES: RouteObject[] = [
  { path: '/', element: <LandingPage /> },
  {
    path: '/connexion',
    element: (
      <GuestRoute>
        <LoginPage />
      </GuestRoute>
    ),
  },
  { path: '/i/:token', element: <PublicInvitationPage /> },
  {
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { path: '/accueil', element: <OverviewPage /> },
      { path: '/evenements', element: <EventsPage /> },
      { path: '/evenements/nouveau', element: <EventEditorPage /> },
      { path: '/evenements/:id', element: <EventEditorPage /> },
      { path: '/evenements/:id/invitations', element: <GuestsPage /> },
      { path: '/evenements/:id/reponses', element: <ResponsesPage /> },
      { path: '/modeles', element: <TemplatesPage /> },
      { path: '/parametres', element: <SettingsPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]

function renderApp(initialEntry: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const router = createMemoryRouter(ROUTES, { initialEntries: [initialEntry] })
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  )
  return router
}

function byId(id: string): HTMLElement {
  const element = document.getElementById(id)
  if (!element) throw new Error(`Élément #${id} introuvable.`)
  return element
}

afterEach(() => {
  vi.unstubAllGlobals()
  clearCookies()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Parcours complet (E2E)', () => {
  it(
    'de la connexion à la révocation : la chaîne invitation complète',
    async () => {
      const user = userEvent.setup()
      const backend = createBackend()
      vi.stubGlobal('fetch', backend.fetch)

      const writeText = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })

      const downloads: Array<{ download: string; href: string }> = []
      const clickSpy = vi
        .spyOn(HTMLAnchorElement.prototype, 'click')
        .mockImplementation(function (this: HTMLAnchorElement) {
          downloads.push({ download: this.download, href: this.href })
        })
      // Keep the real QR generation; capture the encoded payload (what a
      // scanner decodes) to follow it later in the chain.
      const qrSpy = vi.spyOn(QRCode, 'toDataURL')

      const router = renderApp('/connexion')

      // 1. The organizer logs in and lands on their dashboard.
      await user.type(await screen.findByLabelText(/^Adresse e-mail/), ORGANIZER.email)
      await user.type(screen.getByLabelText(/^Mot de passe/), 'mot-de-passe')
      await user.click(screen.getByRole('button', { name: 'Se connecter' }))
      await waitFor(() => expect(router.state.location.pathname).toBe('/accueil'))
      expect(await screen.findByText('Événements créés')).toBeInTheDocument()

      // 2. Pick a real template from the showcase → prefilled editor.
      await user.click(screen.getByRole('link', { name: 'Modèles' }))
      await waitFor(() => expect(router.state.location.pathname).toBe('/modeles'))
      const useLinks = await screen.findAllByRole('link', { name: 'Utiliser ce modèle' })
      const confettiLink = useLinks.find((link) =>
        link.getAttribute('href')?.includes('modele=confetti'),
      )
      if (!confettiLink) throw new Error('Lien « Utiliser ce modèle » introuvable.')
      await user.click(confettiLink)
      await waitFor(() => expect(router.state.location.pathname).toBe('/evenements/nouveau'))

      // 3. Create the event model with one required preference question.
      fireEvent.change(await screen.findByLabelText(/^Titre de l/), {
        target: { value: 'Mariage de Grâce et Éric' },
      })
      fireEvent.change(screen.getByLabelText(/^Message/), {
        target: { value: 'Nous serions honorés de votre présence.' },
      })
      fireEvent.change(byId('event-date') as HTMLInputElement, { target: { value: '2026-12-12' } })
      fireEvent.change(byId('event-time') as HTMLInputElement, { target: { value: '15:00' } })
      fireEvent.change(screen.getByLabelText(/^Nom du lieu/), {
        target: { value: 'Cathédrale Notre-Dame' },
      })

      await user.click(screen.getByRole('button', { name: 'Ajouter une question' }))
      fireEvent.change(byId('question-0-label') as HTMLInputElement, {
        target: { value: 'Quel menu préférez-vous ?' },
      })
      fireEvent.change(screen.getAllByLabelText("Libellé de l'option")[0], {
        target: { value: 'Poisson' },
      })
      await user.click(screen.getByRole('button', { name: 'Ajouter une option' }))
      fireEvent.change(screen.getAllByLabelText("Libellé de l'option")[1], {
        target: { value: 'Viande' },
      })
      await user.click(screen.getByRole('checkbox', { name: 'Réponse obligatoire' }))

      await user.click(screen.getAllByRole('button', { name: "Créer l'événement" })[0])
      await waitFor(() => expect(router.state.location.pathname).toBe('/evenements'))
      expect(await screen.findByText('Mariage de Grâce et Éric')).toBeInTheDocument()

      const createdEvent = backend.calls.find(
        (call) => call.method === 'POST' && call.url === '/api/events/',
      )
      expect(createdEvent?.body).toMatchObject({
        template: 'confetti',
        title: 'Mariage de Grâce et Éric',
      })

      // 4. Open the event's guest list.
      await user.click(await screen.findByRole('link', { name: 'Invités' }))
      await waitFor(() => expect(router.state.location.pathname).toBe('/evenements/7/invitations'))
      expect(await screen.findByText('Aucun invité pour le moment')).toBeInTheDocument()

      // 5. Create the guest invitation (from the add-guest modal).
      await user.click(await screen.findByRole('button', { name: 'Ajouter un invité' }))
      fireEvent.change(byId('guest-name') as HTMLInputElement, {
        target: { value: 'Éric Mukendi' },
      })
      fireEvent.change(byId('guest-civility') as HTMLSelectElement, { target: { value: 'm' } })
      await user.click(screen.getByRole('button', { name: "Créer l'invitation" }))
      expect(await screen.findByText('Invitation créée.')).toBeInTheDocument()
      expect((await screen.findAllByText('M. Éric Mukendi')).length).toBeGreaterThan(0)

      // 6. Copy the unique invitation link.
      await user.click(screen.getByRole('button', { name: 'Copier le lien' }))
      await waitFor(() => expect(writeText).toHaveBeenCalled())
      const copiedLink = String(writeText.mock.calls.at(-1)?.[0] ?? '')
      expect(copiedLink).toContain('/i/tok-e2e-001')

      // 7. The guest opens the unique link.
      await router.navigate(new URL(copiedLink, window.location.origin).pathname)
      await waitFor(() => expect(router.state.location.pathname).toBe('/i/tok-e2e-001'))
      expect((await screen.findAllByText('Mariage de Grâce et Éric')).length).toBeGreaterThan(0)
      expect((await screen.findAllByText('M. Éric Mukendi')).length).toBeGreaterThan(0)

      // 8. QR verification: the panel checks the invitation on the server.
      expect((await screen.findAllByText('Valide')).length).toBeGreaterThan(0)
      expect(screen.getByAltText('QR code de vérification')).toBeInTheDocument()
      expect(await screen.findByText('Cette invitation est actuellement valide.')).toBeInTheDocument()
      expect(backend.calls.some((call) => call.url.includes('/verify/'))).toBe(true)

      // 9. Download the invitation as a PDF.
      await user.click(screen.getByRole('button', { name: "Télécharger l’invitation" }))
      await waitFor(() => expect(downloads).toHaveLength(1))
      expect(downloads[0].download).toMatch(/^invitation-.*\.pdf$/)
      expect(downloads[0].href).toContain('data:application/pdf')
      expect(toJpeg).toHaveBeenCalledTimes(2)

      // 10. "Scan" the QR code: follow its decoded payload back to the
      //     invitation (the PDF itself cannot be optically decoded in jsdom).
      const encoded = qrSpy.mock.calls.at(-1)?.[0] ?? ''
      const scanned = typeof encoded === 'string' ? encoded : ''
      expect(scanned).toContain('/i/tok-e2e-001')
      await router.navigate(new URL(scanned).pathname)
      expect((await screen.findAllByText('M. Éric Mukendi')).length).toBeGreaterThan(0)
      expect((await screen.findAllByText('Valide')).length).toBeGreaterThan(0)

      // 11. The guest submits their preferences.
      await user.click(screen.getByLabelText('Poisson'))
      await user.click(screen.getByRole('button', { name: 'Envoyer ma réponse' }))
      expect(await screen.findByText('Réponse enregistrée.')).toBeInTheDocument()
      expect(backend.state.responses).toHaveLength(1)
      expect(backend.state.responses[0].answers[0]?.options[0]?.label).toBe('Poisson')

      // 12. The response shows up in the organizer dashboard.
      await router.navigate('/evenements/7/reponses')
      expect(await screen.findByText('Réponses reçues')).toBeInTheDocument()
      expect((await screen.findAllByText('M. Éric Mukendi')).length).toBeGreaterThan(0)
      expect((await screen.findAllByText('Poisson')).length).toBeGreaterThan(0)
      expect(
        backend.calls.some((call) => call.url.includes('/api/events/7/responses/')),
      ).toBe(true)

      // 13. Back to the guest list → revoke the invitation.
      await user.click(screen.getByRole('link', { name: 'Retour aux invités' }))
      await waitFor(() => expect(router.state.location.pathname).toBe('/evenements/7/invitations'))
      await user.click(await screen.findByRole('button', { name: 'Révoquer' }))
      expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      await user.click(screen.getAllByRole('button', { name: 'Révoquer' })[1])
      expect(await screen.findByText('Invitation révoquée.')).toBeInTheDocument()
      expect(backend.state.invitations[0]?.status).toBe('revoked')

      // 14. Subsequent access through the same link is handled correctly.
      await router.navigate('/i/tok-e2e-001')
      expect((await screen.findAllByText('Révoquée')).length).toBeGreaterThan(0)
      expect(await screen.findByText('Cette invitation a été révoquée.')).toBeInTheDocument()

      clickSpy.mockRestore()
      qrSpy.mockRestore()
    },
    30_000,
  )
})

describe('Scénarios d’échec (E2E)', () => {
  it('refuse l’accès à un lien inconnu', async () => {
    const backend = createBackend()
    vi.stubGlobal('fetch', backend.fetch)
    renderApp('/i/tok-inconnu')

    expect(await screen.findByText('Invitation introuvable')).toBeInTheDocument()
    expect(
      screen.getByText('Ce lien n’existe plus, a été révoqué ou n’est pas valide.'),
    ).toBeInTheDocument()
  })

  it('signale clairement une invitation expirée', async () => {
    const backend = createBackend({
      'tok-expired': {
        token: 'tok-expired',
        status: 'expired',
        invitation: {
          guest_name: 'Nadine Kanku',
          civility: 'mme',
          display_name: 'Mme Nadine Kanku',
          issued_at: NOW,
          expires_at: '2026-10-01T00:00:00Z',
        },
        event: SEEDED_EVENT,
        questions: [],
        response: null,
      },
    })
    vi.stubGlobal('fetch', backend.fetch)
    renderApp('/i/tok-expired')

    expect((await screen.findAllByText('Expirée')).length).toBeGreaterThan(0)
    expect(await screen.findByText('Cette invitation a expiré.')).toBeInTheDocument()
    expect(backend.state.responses).toHaveLength(0)
  })

  it('affiche le refus du serveur lors de la soumission des préférences', async () => {
    const user = userEvent.setup()
    const backend = createBackend({
      'tok-reject': {
        token: 'tok-reject',
        status: 'active',
        invitation: {
          guest_name: 'Éric Mukendi',
          civility: 'm',
          display_name: 'M. Éric Mukendi',
          issued_at: NOW,
          expires_at: null,
        },
        event: SEEDED_EVENT,
        questions: [PARTICIPATION_QUESTION],
        response: null,
        rejectSubmit: 'Veuillez répondre à toutes les questions obligatoires.',
      },
    })
    vi.stubGlobal('fetch', backend.fetch)
    renderApp('/i/tok-reject')

    await screen.findByText('Participerez-vous ?')
    await user.click(screen.getByLabelText('Oui'))
    await user.click(screen.getByRole('button', { name: 'Envoyer ma réponse' }))

    expect(
      await screen.findByText('Veuillez répondre à toutes les questions obligatoires.'),
    ).toBeInTheDocument()
    expect(backend.state.responses).toHaveLength(0)
  })
})
