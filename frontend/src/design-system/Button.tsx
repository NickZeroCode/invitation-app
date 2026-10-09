import type { ButtonHTMLAttributes } from 'react'

import { Spinner } from './Spinner.tsx'

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

/**
 * Shared button anatomy. Labels never wrap or break mid-word
 * (`whitespace-nowrap`); long labels shrink their container instead.
 */
export const BUTTON_BASE =
  'inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium ' +
  'transition-[background-color,border-color,color,box-shadow] duration-150 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/35 focus-visible:ring-offset-2 focus-visible:ring-offset-paper ' +
  'disabled:cursor-not-allowed disabled:opacity-50'

export const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  // Ink is the product's confident primary; gold stays an accent.
  primary: 'bg-ink text-white shadow-xs hover:bg-ink/88 active:bg-ink',
  accent: 'bg-brand text-white shadow-xs hover:bg-brand-strong',
  secondary:
    'border border-line-strong bg-surface text-ink shadow-xs hover:border-ink-faint/60 hover:bg-surface-muted',
  ghost: 'text-ink-soft hover:bg-surface-muted hover:text-ink',
  danger: 'bg-danger text-white shadow-xs hover:bg-danger-strong',
  'danger-ghost': 'text-danger hover:bg-danger-soft',
}

export const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[0.8125rem]',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-[0.9375rem]',
}

/** Class string for links styled as buttons (keeps one source of truth). */
export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className = '',
): string {
  return `${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  type = 'button',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses(variant, size, className)}
      {...props}
    >
      {loading ? <Spinner className="h-4 w-4" /> : null}
      {children}
    </button>
  )
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible name — icon-only buttons must always carry one. */
  label: string
  variant?: 'ghost' | 'secondary' | 'danger-ghost'
  size?: 'sm' | 'md'
  /** Show the label as a tooltip on hover (default true). */
  tooltip?: boolean
}

/** Square icon-only button with an accessible name and native tooltip. */
export function IconButton({
  label,
  variant = 'ghost',
  size = 'md',
  tooltip = true,
  type = 'button',
  className = '',
  children,
  ...props
}: IconButtonProps) {
  const box = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9'
  return (
    <button
      type={type}
      aria-label={label}
      title={tooltip ? label : undefined}
      className={`${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${box} px-0 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
