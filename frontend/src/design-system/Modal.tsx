/**
 * Modal dialog — dimmed overlay, floating panel, Escape or overlay click to
 * close. Used for focused flows (e.g. adding guests) without leaving the page.
 */
import { useEffect, type ReactNode } from 'react'

import { IconClose } from './icons.tsx'
import { fr } from '../locales/fr.ts'

export function Modal({
  open,
  onClose,
  ariaLabel,
  children,
}: {
  open: boolean
  onClose: () => void
  /** Accessible name when the panel carries no visible title bar. */
  ariaLabel: string
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return undefined
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-ink/40"
        onClick={onClose}
        data-testid="modal-overlay"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className="relative z-10 w-full max-w-2xl rounded-lg border border-line-strong bg-surface shadow-xl"
      >
        <div className="flex justify-end px-3 pt-3">
          <button
            type="button"
            aria-label={fr.common.close}
            onClick={onClose}
            className="rounded-md p-1.5 text-ink-soft transition-colors duration-150 hover:bg-surface-muted hover:text-ink"
          >
            <IconClose />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 pb-5">{children}</div>
      </div>
    </div>
  )
}
