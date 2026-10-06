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

export function Stat({ label, value, hint, emphasis = 'default' }: StatProps) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-soft">{label}</dt>
      <dd className={`mt-1 text-2xl font-semibold tabular-nums ${EMPHASIS[emphasis]}`}>{value}</dd>
      {hint ? <dd className="mt-1 text-xs text-ink-faint">{hint}</dd> : null}
    </div>
  )
}
