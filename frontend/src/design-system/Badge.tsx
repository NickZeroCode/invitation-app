import type { ReactNode } from 'react'

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info'

export interface BadgeProps {
  tone?: BadgeTone
  /** Leading status dot (state badges). */
  dot?: boolean
  children: ReactNode
}

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-surface-muted text-ink-soft ring-line',
  brand: 'bg-brand-soft text-brand-strong ring-brand/15',
  success: 'bg-success-soft text-success ring-success/15',
  warning: 'bg-warning-soft text-warning ring-warning/15',
  danger: 'bg-danger-soft text-danger ring-danger/15',
  info: 'bg-surface text-ink-soft ring-line-strong',
}

const DOTS: Record<BadgeTone, string> = {
  neutral: 'bg-ink-faint',
  brand: 'bg-brand',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-ink-faint',
}

/** Compact label — never wraps, never breaks a word. */
export function Badge({ tone = 'neutral', dot = false, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex max-w-full shrink-0 items-center gap-1.5 whitespace-nowrap rounded-pill px-2 py-0.5 text-xs font-medium leading-5 ring-1 ring-inset ${TONES[tone]}`}
    >
      {dot ? <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-pill ${DOTS[tone]}`} /> : null}
      <span className="truncate">{children}</span>
    </span>
  )
}
