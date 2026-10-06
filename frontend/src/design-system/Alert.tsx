import type { ReactNode } from 'react'

import { IconAlert, IconCheck, IconInfo } from './icons.tsx'

export type AlertTone = 'success' | 'danger' | 'warning' | 'info'

export interface AlertProps {
  tone: AlertTone
  children: ReactNode
}

const TONES: Record<AlertTone, string> = {
  success: 'border-success/25 bg-success-soft text-success',
  danger: 'border-danger/25 bg-danger-soft text-danger',
  warning: 'border-warning/25 bg-warning-soft text-warning',
  info: 'border-brand/25 bg-brand-soft text-brand-strong',
}

const ICONS: Record<AlertTone, typeof IconInfo> = {
  success: IconCheck,
  danger: IconAlert,
  warning: IconAlert,
  info: IconInfo,
}

export function Alert({ tone, children }: AlertProps) {
  const Icon = ICONS[tone]
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={`flex items-start gap-2.5 rounded-md border px-3.5 py-3 text-sm ${TONES[tone]}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  )
}
