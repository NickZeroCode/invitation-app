import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { LoadingState } from '../design-system/index.ts'
import { useAuth } from './AuthContext.tsx'

/** Gates organizer-only routes: loading → spinner, anonymous → login. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <LoadingState />
      </div>
    )
  }
  if (status === 'anonymous') {
    return <Navigate to="/connexion" replace state={{ from: location.pathname }} />
  }
  return <>{children}</>
}

/** Login page shell: authenticated visitors go straight to their workspace. */
export function GuestRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/accueil'

  if (status === 'loading') {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <LoadingState />
      </div>
    )
  }
  if (status === 'authenticated') {
    return <Navigate to={from} replace />
  }
  return <>{children}</>
}
