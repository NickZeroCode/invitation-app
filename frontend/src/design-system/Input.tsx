import { useState, type InputHTMLAttributes, type SelectHTMLAttributes } from 'react'

import { fr } from '../locales/fr.ts'
import { IconEye, IconEyeOff } from './icons.tsx'

function controlClasses(invalid: boolean | undefined, className: string): string {
  const border = invalid
    ? 'border-danger focus:border-danger focus:ring-danger/20'
    : 'border-line-strong focus:border-brand focus:ring-brand/20'
  return (
    'w-full rounded-md border bg-surface text-sm text-ink placeholder:text-ink-faint ' +
    'transition-colors duration-150 focus:outline-none focus:ring-2 ' +
    `${border} ${className}`
  )
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
}

export function Input({ invalid, className = '', ...props }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={controlClasses(invalid, `h-10 px-3 ${className}`)}
      {...props}
    />
  )
}

export function PasswordInput({ invalid, className = '', ...props }: InputProps) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        aria-invalid={invalid || undefined}
        className={controlClasses(invalid, `h-10 pl-3 pr-11 ${className}`)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? fr.common.hidePassword : fr.common.showPassword}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-ink-faint transition-colors duration-150 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        {visible ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
      </button>
    </div>
  )
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean
}

export function Select({ invalid, className = '', children, ...props }: SelectProps) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={controlClasses(invalid, `h-10 px-3 ${className}`)}
      {...props}
    >
      {children}
    </select>
  )
}
