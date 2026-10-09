import type { ReactNode } from 'react'

export interface FieldProps {
  id: string
  label: string
  hint?: string
  error?: string
  required?: boolean
  /** Visually hide the label (it stays the accessible name). */
  hideLabel?: boolean
  className?: string
  children: ReactNode
}

export function Field({
  id,
  label,
  hint,
  error,
  required,
  hideLabel,
  className = '',
  children,
}: FieldProps) {
  return (
    <div className={`min-w-0 space-y-1.5 ${className}`}>
      <label
        htmlFor={id}
        className={hideLabel ? 'sr-only' : 'block text-[0.8125rem] font-medium text-ink'}
      >
        {label}
        {required ? (
          <span className="text-ink-faint" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs leading-relaxed text-ink-faint">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
