import type { ReactNode } from 'react'

import { fr } from '../locales/fr.ts'
import { Button } from './Button.tsx'
import { IconAlert, IconInbox } from './icons.tsx'
import { Spinner } from './Spinner.tsx'

export interface LoadingStateProps {
  label?: string
}

export function LoadingState({ label = fr.common.loading }: LoadingStateProps) {
  return (
    <div
      role="status"
      className="flex min-h-48 items-center justify-center gap-3 text-ink-soft"
    >
      <Spinner className="h-5 w-5" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
  icon?: ReactNode
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center px-6 py-10 text-center">
      <div className="text-ink-faint">{icon ?? <IconInbox className="h-7 w-7" />}</div>
      <p className="mt-3 text-sm font-semibold text-ink">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-sm text-ink-soft">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
}

export function ErrorState({
  title = fr.overview.error.title,
  description = fr.overview.error.description,
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex min-h-48 flex-col items-center justify-center px-6 py-10 text-center"
    >
      <div className="text-danger">
        <IconAlert className="h-7 w-7" />
      </div>
      <p className="mt-3 text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-ink-soft">{description}</p>
      {onRetry ? (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          {fr.common.retry}
        </Button>
      ) : null}
    </div>
  )
}
