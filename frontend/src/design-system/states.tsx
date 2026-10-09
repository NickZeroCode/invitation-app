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
    <div role="status" className="flex min-h-48 items-center justify-center gap-2.5 text-ink-faint">
      <Spinner className="h-4 w-4" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

/** Shimmering placeholder blocks while a list loads. */
export function SkeletonRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="h-[4.5rem] animate-pulse rounded-lg border border-line bg-surface" />
      ))}
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
    <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-pill border border-line bg-surface-muted text-ink-soft">
        {icon ?? <IconInbox className="h-5 w-5" />}
      </div>
      <p className="mt-4 text-[0.9375rem] font-semibold tracking-tight text-ink">{title}</p>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-soft">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
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
      className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-pill border border-danger/15 bg-danger-soft text-danger">
        <IconAlert className="h-5 w-5" />
      </div>
      <p className="mt-4 text-[0.9375rem] font-semibold tracking-tight text-ink">{title}</p>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-soft">{description}</p>
      {onRetry ? (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry}>
          {fr.common.retry}
        </Button>
      ) : null}
    </div>
  )
}
