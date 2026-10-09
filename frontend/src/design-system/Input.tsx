import {
  useState,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'

import { fr } from '../locales/fr.ts'
import { IconEye, IconEyeOff } from './icons.tsx'

function controlClasses(invalid: boolean | undefined, className: string): string {
  const border = invalid
    ? 'border-danger focus:border-danger focus:ring-danger/15'
    : 'border-line-strong hover:border-ink-faint/50 focus:border-ink/60 focus:ring-ink/8'
  return (
    'w-full min-w-0 rounded-md border bg-surface text-sm text-ink shadow-xs placeholder:text-ink-faint ' +
    'transition-[border-color,box-shadow] duration-150 focus:outline-none focus:ring-4 ' +
    'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-faint ' +
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
      className={controlClasses(
        invalid,
        `h-10 cursor-pointer appearance-none bg-[length:16px] bg-[right_0.6rem_center] bg-no-repeat pl-3 pr-9 ${className}`,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238e887f' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
      }}
      {...props}
    >
      {children}
    </select>
  )
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean
}

export function Textarea({ invalid, className = '', ...props }: TextareaProps) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={controlClasses(invalid, `px-3 py-2.5 leading-relaxed ${className}`)}
      {...props}
    />
  )
}
