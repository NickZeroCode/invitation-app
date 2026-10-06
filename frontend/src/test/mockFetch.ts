import { vi } from 'vitest'

export interface MockCall {
  url: string
  method: string
  headers: Record<string, string>
  body: unknown
}

export interface MockRoute {
  method?: string
  /** Substring, or predicate matched against the request URL. */
  url: string | ((url: string) => boolean)
  status?: number
  body?: unknown
  /** Consume the route after the first match (for call sequencing). */
  once?: boolean
  /** Runs when the route is hit (e.g. to set cookies as Django would). */
  onRequest?: () => void
}

export interface MockFetch {
  calls: MockCall[]
  callsTo: (urlPart: string, method?: string) => MockCall[]
}

function jsonResponse(status: number, body: unknown): Response {
  if (body === undefined || status === 204) {
    return new Response(null, { status })
  }
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export function mockFetch(routes: MockRoute[]): MockFetch {
  const calls: MockCall[] = []
  const consumed = new Set<MockRoute>()

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    const method = (init?.method ?? 'GET').toUpperCase()
    const headers: Record<string, string> = {}
    new Headers(init?.headers).forEach((value, key) => {
      headers[key.toLowerCase()] = value
    })
    let body: unknown = null
    if (typeof init?.body === 'string') {
      body = JSON.parse(init.body)
    }
    calls.push({ url, method, headers, body })

    const route = routes.find((candidate) => {
      if (consumed.has(candidate)) return false
      const methodOk = (candidate.method ?? 'GET').toUpperCase() === method
      const urlOk =
        typeof candidate.url === 'function' ? candidate.url(url) : url.includes(candidate.url)
      return methodOk && urlOk
    })
    if (!route) {
      return jsonResponse(404, { error: { code: 'not_found', message: 'Introuvable.' } })
    }
    if (route.once) consumed.add(route)
    route.onRequest?.()
    return jsonResponse(route.status ?? 200, route.body)
  })

  vi.stubGlobal('fetch', fetchMock)

  return {
    calls,
    callsTo: (urlPart, method) =>
      calls.filter(
        (call) =>
          call.url.includes(urlPart) &&
          (method === undefined || call.method === method.toUpperCase()),
      ),
  }
}

export function clearCookies() {
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.split('=')[0]?.trim()
    if (name) {
      document.cookie = `${name}=; Max-Age=0; path=/`
    }
  }
}
