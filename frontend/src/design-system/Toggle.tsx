import type { ReactNode } from 'react'

export interface ToggleProps {
  id?: string
  /** Controlled on/off state. */
  checked: boolean
  onChange: (checked: boolean) => void
  /** Visible label beside the switch. */
  label?: ReactNode
  /** Supporting line under the label. */
  hint?: ReactNode
  disabled?: boolean
  className?: string
}

/**
 * Accessible on/off switch (a real checkbox under the hood, so it works with
 * keyboards, screen readers and forms). The track uses the brand accent only
 * for the active state — the project's Orange Rule.
 */
export function Toggle({ id, checked, onChange, label, hint, disabled = false, className = '' }: ToggleProps) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-start gap-3 ${disabled ? 'cursor-not-allowed opacity-60' : ''} ${className}`}
    >
      <span className="relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center">
        <input
          id={id}
          type="checkbox"
          role="switch"
          aria-checked={checked}
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-pill bg-line-strong transition-colors peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface"
        />
        <span
          aria-hidden="true"
          className={`absolute left-0.5 h-4 w-4 rounded-pill bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`}
        />
      </span>
      {label || hint ? (
        <span className="min-w-0">
          {label ? <span className="block text-sm font-medium text-ink">{label}</span> : null}
          {hint ? <span className="mt-0.5 block text-xs text-ink-faint">{hint}</span> : null}
        </span>
      ) : null}
    </label>
  )
}
