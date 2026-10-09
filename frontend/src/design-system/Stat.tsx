import type { ReactNode } from 'react'

export interface StatProps {
  label: string
  value: string
  hint?: string
  emphasis?: 'default' | 'success' | 'warning' | 'danger'
}

const EMPHASIS: Record<NonNullable<StatProps['emphasis']>, string> = {
  default: 'text-ink',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
}

/** Inline label / value pair (inside a `<dl>`). */
export function Stat({ label, value, hint, emphasis = 'default' }: StatProps) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-[0.8125rem] font-medium text-ink-soft">{label}</dt>
      <dd
        className={`mt-1 text-[1.625rem] font-semibold leading-none tracking-[-0.02em] tabular-nums ${EMPHASIS[emphasis]}`}
      >
        {value}
      </dd>
      {hint ? <dd className="mt-2 text-xs text-ink-faint">{hint}</dd> : null}
    </div>
  )
}

export interface MetricCardProps {
  label: string
  value: string
  icon?: ReactNode
  /** Secondary line under the value (context, ratio, trend). */
  footer?: ReactNode
}

/** KPI tile for dashboards: label, big number, quiet context line. */
export function MetricCard({ label, value, icon, footer }: MetricCardProps) {
  return (
    <div className="flex min-w-0 flex-col rounded-lg border border-line bg-surface p-4 shadow-card sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <dt className="min-w-0 text-[0.8125rem] font-medium leading-snug text-ink-soft">{label}</dt>
        {icon ? <span className="mt-px hidden shrink-0 text-ink-faint sm:inline">{icon}</span> : null}
      </div>
      <dd className="mt-3 text-[1.75rem] font-semibold leading-none tracking-[-0.03em] text-ink tabular-nums sm:text-[2rem]">
        {value}
      </dd>
      {footer ? <div className="mt-3 text-xs leading-relaxed text-ink-faint">{footer}</div> : null}
    </div>
  )
}
