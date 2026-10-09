/**
 * Dialog primitives.
 *
 * - `Modal`: centered panel on desktop, bottom sheet on phones. Escape or
 *   overlay click closes it; page scroll is locked while open.
 * - `ConfirmDialog`: compact destructive confirmation (`role="alertdialog"`).
 */
import { useEffect, type ReactNode } from 'react'

import { fr } from '../locales/fr.ts'
import { Button } from './Button.tsx'
import { IconClose } from './icons.tsx'

function useDialogBehaviour(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return undefined
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])
}

export function Modal({
  open,
  onClose,
  ariaLabel,
  title,
  description,
  size = 'md',
  children,
}: {
  open: boolean
  onClose: () => void
  /** Accessible name (defaults to the visible title). */
  ariaLabel: string
  title?: string
  description?: string
  size?: 'md' | 'lg'
  children: ReactNode
}) {
  useDialogBehaviour(open, onClose)
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-ink/35 backdrop-blur-[2px]"
        onClick={onClose}
        data-testid="modal-overlay"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={`relative z-10 flex max-h-[92svh] w-full flex-col rounded-t-xl border border-line bg-surface shadow-pop sm:max-h-[86vh] sm:rounded-xl ${
          size === 'lg' ? 'sm:max-w-3xl' : 'sm:max-w-xl'
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            {title ? (
              <h2 className="text-base font-semibold tracking-tight text-ink">{title}</h2>
            ) : null}
            {description ? <p className="mt-0.5 text-[0.8125rem] text-ink-soft">{description}</p> : null}
          </div>
          <button
            type="button"
            aria-label={fr.common.close}
            onClick={onClose}
            className="-mr-1.5 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-soft transition-colors duration-150 hover:bg-surface-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/35"
          >
            <IconClose className="h-4.5 w-4.5" />
          </button>
        </div>
        <div className="scroll-quiet min-h-0 flex-1 overflow-y-auto px-5 py-5 pb-safe">{children}</div>
      </div>
    </div>
  )
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  loading = false,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}) {
  useDialogBehaviour(open, onCancel)
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div aria-hidden="true" className="fixed inset-0 bg-ink/35 backdrop-blur-[2px]" onClick={onCancel} />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 w-full rounded-t-xl border border-line bg-surface p-5 pb-safe shadow-pop sm:max-w-md sm:rounded-xl sm:pb-5"
      >
        <h2 className="text-base font-semibold tracking-tight text-ink">{title}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{message}</p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel} className="w-full sm:w-auto">
            {fr.common.cancel}
          </Button>
          <Button variant="danger" loading={loading} onClick={onConfirm} className="w-full sm:w-auto">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
