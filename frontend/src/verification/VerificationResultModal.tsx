/**
 * Door-side verdict — an appearing modal that turns one scan into a clear,
 * designed moment: a deep green confirmation for an authentic invitation, a
 * remarkably red refusal otherwise. The operational summary (guest, table,
 * validity) lives on the paper half of the panel, and the primary action is
 * always to scan the next invitation.
 */
import { useEffect } from 'react'

import {
  Button,
  IconAlert,
  IconBan,
  IconCheck,
  IconClose,
  IconClock,
  IconQr,
} from '../design-system/index.ts'
import { formatDate, formatDateTime } from '../lib/format.ts'
import type { VerificationScanResult, VerificationScanResultCode } from '../lib/types.ts'
import { fr } from '../locales/fr.ts'

/** Escape + scroll lock while a verdict is on screen. */
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

const VERDICT: Record<VerificationScanResultCode, { icon: typeof IconCheck; hero: string }> = {
  valid: {
    icon: IconCheck,
    hero: 'radial-gradient(120% 130% at 50% -12%, rgba(212, 162, 75, 0.34) 0%, rgba(212, 162, 75, 0) 48%), linear-gradient(163deg, #0a8f57 0%, #067647 44%, #04412a 100%)',
  },
  expired: {
    icon: IconClock,
    hero: 'radial-gradient(120% 130% at 50% -12%, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0) 48%), linear-gradient(163deg, #d97706 0%, #b54708 46%, #7c2d05 100%)',
  },
  revoked: {
    icon: IconBan,
    hero: 'radial-gradient(120% 130% at 50% -12%, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0) 48%), linear-gradient(163deg, #d1402f 0%, #b42318 46%, #71130c 100%)',
  },
  invalid: {
    icon: IconBan,
    hero: 'radial-gradient(120% 130% at 50% -12%, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0) 48%), linear-gradient(163deg, #d1402f 0%, #b42318 46%, #71130c 100%)',
  },
  wrong_event: {
    icon: IconAlert,
    hero: 'radial-gradient(120% 130% at 50% -12%, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0) 48%), linear-gradient(163deg, #d1402f 0%, #b42318 46%, #71130c 100%)',
  },
}

const TITLES: Record<VerificationScanResultCode, string> = {
  valid: fr.verify.result.valid,
  expired: fr.verify.result.expired,
  revoked: fr.verify.result.revoked,
  invalid: fr.verify.result.invalid,
  wrong_event: fr.verify.result.wrongEvent,
}

export function VerificationResultModal({
  result,
  onClose,
}: {
  /** The verdict to present — null keeps the modal closed. */
  result: VerificationScanResult | null
  /** Dismisses the verdict and returns to the scanner. */
  onClose: () => void
}) {
  useDialogBehaviour(result !== null, onClose)
  if (!result) return null

  const style = VERDICT[result.result] ?? VERDICT.invalid
  const Icon = style.icon
  const summary = result.summary

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-ink/55 backdrop-blur-[3px]"
        onClick={onClose}
        data-testid="verdict-overlay"
      />
      <div
        role="status"
        aria-live="polite"
        data-verification-result={result.result}
        className="relative z-10 flex max-h-[92svh] w-full max-w-lg flex-col overflow-hidden rounded-t-[1.75rem] bg-surface shadow-canvas animate-verdict-pop motion-reduce:animate-none sm:max-h-[86vh] sm:rounded-[1.75rem]"
      >
        {/* Verdict hero — full colour, gold-lit on success. */}
        <div className="relative shrink-0 px-6 pb-7 pt-6 text-center text-white sm:px-8" style={{ background: style.hero }}>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(ellipse 70% 55% at 50% 0%, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0) 70%)',
            }}
          />
          <button
            type="button"
            aria-label={fr.common.close}
            onClick={onClose}
            className="absolute right-3.5 top-3.5 flex h-9 w-9 items-center justify-center rounded-pill text-white/80 transition-colors duration-150 hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <IconClose className="h-4.5 w-4.5" />
          </button>

          <span className="mx-auto flex h-[4.6rem] w-[4.6rem] items-center justify-center rounded-full border border-white/30 bg-white/15 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.55)] backdrop-blur-sm animate-verdict-pop motion-reduce:animate-none">
            <Icon className="h-9 w-9" />
          </span>
          <h2 className="mt-3.5 font-display text-[1.85rem] leading-[1.15] text-white">
            {TITLES[result.result] ?? TITLES.invalid}
          </h2>
          <p className="mx-auto mt-2 max-w-[26rem] text-[0.95rem] leading-relaxed text-white/85">
            {result.message}
          </p>
        </div>

        {/* Operational summary on paper. */}
        {summary ? (
          <dl className="scroll-quiet min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <div>
                <dt className="text-[0.68rem] font-medium uppercase tracking-[0.18em] text-ink-faint">
                  {fr.verify.result.guest}
                </dt>
                <dd className="mt-1 text-[0.95rem] font-semibold text-ink">{summary.display_name}</dd>
              </div>
              <div>
                <dt className="text-[0.68rem] font-medium uppercase tracking-[0.18em] text-ink-faint">
                  {fr.verify.result.event}
                </dt>
                <dd className="mt-1 text-[0.95rem] font-semibold text-ink">{summary.event_title}</dd>
              </div>
              <div>
                <dt className="text-[0.68rem] font-medium uppercase tracking-[0.18em] text-ink-faint">
                  {fr.verify.result.date}
                </dt>
                <dd className="mt-1 text-[0.95rem] text-ink-soft">
                  {formatDate(summary.event_date)}
                  {summary.event_time ? ` · ${summary.event_time}` : ''}
                </dd>
              </div>
              {summary.venue_name ? (
                <div>
                  <dt className="text-[0.68rem] font-medium uppercase tracking-[0.18em] text-ink-faint">
                    {fr.verify.result.venue}
                  </dt>
                  <dd className="mt-1 text-[0.95rem] text-ink-soft">{summary.venue_name}</dd>
                </div>
              ) : null}
              {summary.table_number ? (
                <div>
                  <dt className="text-[0.68rem] font-medium uppercase tracking-[0.18em] text-ink-faint">
                    {fr.verify.result.table}
                  </dt>
                  <dd className="mt-1 text-[0.95rem] text-ink-soft">
                    {summary.table_number}
                    {summary.table_text ? ` — ${summary.table_text}` : ''}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="text-[0.68rem] font-medium uppercase tracking-[0.18em] text-ink-faint">
                  {fr.verify.result.issued}
                </dt>
                <dd className="mt-1 text-[0.95rem] text-ink-soft">{formatDateTime(summary.issued_at)}</dd>
              </div>
              <div>
                <dt className="text-[0.68rem] font-medium uppercase tracking-[0.18em] text-ink-faint">
                  {fr.verify.result.presence}
                </dt>
                <dd
                  className={`mt-1 text-[0.95rem] font-medium ${
                    summary.presence_confirmed ? 'text-success' : 'text-ink-soft'
                  }`}
                >
                  {summary.presence_confirmed
                    ? fr.verify.result.presenceConfirmed
                    : fr.verify.result.presenceMissing}
                </dd>
              </div>
            </div>
          </dl>
        ) : null}

        {/* One clear action: keep the line moving. */}
        <div className="shrink-0 border-t border-line bg-surface px-6 pb-safe pt-4">
          <Button variant="accent" size="lg" className="w-full" onClick={onClose}>
            <IconQr className="h-5 w-5" />
            {fr.verify.scanner.next}
          </Button>
        </div>
      </div>
    </div>
  )
}
