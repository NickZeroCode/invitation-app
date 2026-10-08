import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError, authApi } from './api.ts'
import { clearCookies, mockFetch } from '../test/mockFetch.ts'

const ORGANIZER = {
  id: 1,
  email: 'organisateur@nickevents.cd',
  first_name: 'Néhémie',
  last_name: 'Kabongo',
  full_name: 'Néhémie Kabongo',
  timezone: 'Africa/Kinshasa',
  date_joined: '2026-10-01T08:00:00Z',
}

afterEach(() => {
  vi.unstubAllGlobals()
  clearCookies()
})

describe('api client', () => {
  it('returns parsed JSON on success', async () => {
    mockFetch([{ url: '/api/auth/me/', body: ORGANIZER }])

    const user = await authApi.me()
    expect(user.email).toBe('organisateur@nickevents.cd')
    expect(user.full_name).toBe('Néhémie Kabongo')
  })

  it('resolves to void on 204 responses', async () => {
    document.cookie = 'csrftoken=token-abc'
    mockFetch([{ method: 'POST', url: '/api/auth/logout/', status: 204 }])

    await expect(authApi.logout()).resolves.toBeUndefined()
  })

  it('registers a new organizer and posts the signup payload', async () => {
    document.cookie = 'csrftoken=token-abc'
    const mock = mockFetch([
      { method: 'POST', url: '/api/auth/register/', status: 201, body: ORGANIZER },
    ])

    const user = await authApi.register({
      email: 'organisateur@nickevents.cd',
      password: 'mot-de-passe-secret',
      confirm_password: 'mot-de-passe-secret',
      first_name: 'Néhémie',
      last_name: 'Kabongo',
    })
    expect(user.email).toBe('organisateur@nickevents.cd')
    expect(mock.callsTo('/api/auth/register/', 'POST')[0].body).toEqual({
      email: 'organisateur@nickevents.cd',
      password: 'mot-de-passe-secret',
      confirm_password: 'mot-de-passe-secret',
      first_name: 'Néhémie',
      last_name: 'Kabongo',
    })
  })

  it('surfaces the backend error envelope as ApiError', async () => {
    document.cookie = 'csrftoken=token-abc'
    mockFetch([
      {
        method: 'POST',
        url: '/api/auth/login/',
        status: 400,
        body: {
          error: {
            code: 'validation_error',
            message: 'Les données envoyées sont invalides.',
            fields: { email: ['Ce champ est obligatoire.'] },
          },
        },
      },
    ])

    try {
      await authApi.login({ email: '', password: '' })
      expect.unreachable('login should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError)
      const apiError = error as ApiError
      expect(apiError.code).toBe('validation_error')
      expect(apiError.status).toBe(400)
      expect(apiError.message).toBe('Les données envoyées sont invalides.')
      expect(apiError.fields.email).toEqual(['Ce champ est obligatoire.'])
    }
  })

  it('maps envelope-less 401 responses to a safe French message', async () => {
    mockFetch([{ url: '/api/auth/me/', status: 401, body: null }])

    try {
      await authApi.me()
      expect.unreachable('me should have thrown')
    } catch (error) {
      const apiError = error as ApiError
      expect(apiError.code).toBe('not_authenticated')
      expect(apiError.message).toBe('Authentification requise.')
      expect(apiError.fields).toEqual({})
    }
  })

  it('wraps network failures as ApiError with code network', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('NetworkError'))),
    )

    try {
      await authApi.me()
      expect.unreachable('me should have thrown')
    } catch (error) {
      const apiError = error as ApiError
      expect(apiError.code).toBe('network')
      expect(apiError.status).toBe(0)
    }
  })

  it('sends the CSRF cookie value in the X-CSRFToken header', async () => {
    document.cookie = 'csrftoken=token-abc'
    const mock = mockFetch([{ method: 'POST', url: '/api/auth/login/', body: ORGANIZER }])

    await authApi.login({ email: 'a@b.cd', password: 'x' })

    const postCalls = mock.callsTo('/api/auth/login/', 'POST')
    expect(postCalls).toHaveLength(1)
    expect(postCalls[0].headers['x-csrftoken']).toBe('token-abc')
    // Cookie was present — no bootstrap round-trip needed.
    expect(mock.callsTo('/api/auth/csrf/')).toHaveLength(0)
  })

  it('fetches the CSRF cookie before the first unsafe request', async () => {
    const mock = mockFetch([
      {
        url: '/api/auth/csrf/',
        status: 204,
        onRequest: () => {
          document.cookie = 'csrftoken=fresh-token'
        },
      },
      { method: 'POST', url: '/api/auth/login/', body: ORGANIZER },
    ])

    await authApi.login({ email: 'a@b.cd', password: 'x' })

    expect(mock.calls[0].url).toContain('/api/auth/csrf/')
    expect(mock.calls[1].url).toContain('/api/auth/login/')
    expect(mock.calls[1].headers['x-csrftoken']).toBe('fresh-token')
  })
})
