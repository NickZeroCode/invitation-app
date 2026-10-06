import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { authApi } from '../lib/api.ts'
import type { LoginPayload, Organizer } from '../lib/types.ts'

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

export interface AuthContextValue {
  user: Organizer | null
  status: AuthStatus
  login: (payload: LoginPayload) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  /** Marks the session as gone (e.g. after a 401) so protected routes can react. */
  markAnonymous: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Organizer | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  useEffect(() => {
    let cancelled = false
    authApi
      .me()
      .then((organizer) => {
        if (!cancelled) {
          setUser(organizer)
          setStatus('authenticated')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null)
          setStatus('anonymous')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (payload: LoginPayload) => {
    const organizer = await authApi.login(payload)
    setUser(organizer)
    setStatus('authenticated')
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      setUser(null)
      setStatus('anonymous')
    }
  }, [])

  const refreshUser = useCallback(async () => {
    const organizer = await authApi.me()
    setUser(organizer)
    setStatus('authenticated')
  }, [])

  const markAnonymous = useCallback(() => {
    setUser(null)
    setStatus('anonymous')
  }, [])

  const value = useMemo(
    () => ({ user, status, login, logout, refreshUser, markAnonymous }),
    [user, status, login, logout, refreshUser, markAnonymous],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Context hook lives next to its provider by convention; fast refresh is
// unaffected in practice because both are co-located in this module.
// oxlint-disable-next-line react/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth doit être utilisé dans AuthProvider.')
  }
  return context
}
