import { IconAlert, IconBan, IconCheck, IconClock } from '../design-system/index.ts'
import { formatDate, formatDateTime } from '../lib/format.ts'
import type { VerificationScanResult, VerificationScanResultCode } from '../lib/types.ts'
import { fr } from '../locales/fr.ts'

const TONE: Record<VerificationScanResultCode, { icon: typeof IconCheck; ring: string }> = {
  valid: { icon: IconCheck, ring: 'bg-success/12 text-success' },
  expired: { icon: IconClock, ring: 'bg-warning/12 text-warning' },
  revoked: { icon: IconBan, ring: 'bg-danger/12 text-danger' },
  invalid: { icon: IconBan, ring: 'bg-danger/12 text-danger' },
  wrong_event: { icon: IconAlert, ring: 'bg-warning/12 text-warning' },
}

const TITLES: Record<VerificationScanResultCode, string> = {
  valid: fr.verify.result.valid,
  expired: fr.verify.result.expired,
  revoked: fr.verify.result.revoked,
  invalid: fr.verify.result.invalid,
  wrong_event: fr.verify.result.wrongEvent,
}

/**
 * Door-side verdict for one scanned invitation. Authentic invitations get a
 * green confirmation plus the operational summary (guest, table, validity);
 * everything else gets an explicit, non-leaking refusal state.
 */
export function VerificationResultCard({ result }: { result: VerificationScanResult }) {
  const style = TONE[result.result] ?? TONE.invalid
  const Icon = style.icon
  const summary = result.summary

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-2xl border border-line bg-white p-6 shadow-[0_18px_50px_rgba(25,32,28,0.10)]"
      data-verification-result={result.result}
    >
      <div className="flex items-start gap-4">
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${style.ring}`}>
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-tight text-ink">
            {TITLES[result.result] ?? TITLES.invalid}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">{result.message}</p>
        </div>
      </div>

      {summary ? (
        <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-3 border-t border-line pt-5 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-[0.18em] text-ink-faint">{fr.verify.result.guest}</dt>
            <dd className="mt-0.5 font-semibold text-ink">{summary.display_name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-[0.18em] text-ink-faint">{fr.verify.result.event}</dt>
            <dd className="mt-0.5 font-semibold text-ink">{summary.event_title}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-[0.18em] text-ink-faint">{fr.verify.result.date}</dt>
            <dd className="mt-0.5 text-ink-soft">
              {formatDate(summary.event_date)}
              {summary.event_time ? ` · ${summary.event_time}` : ''}
            </dd>
          </div>
          {summary.venue_name ? (
            <div>
              <dt className="text-xs font-medium uppercase tracking-[0.18em] text-ink-faint">{fr.verify.result.venue}</dt>
              <dd className="mt-0.5 text-ink-soft">{summary.venue_name}</dd>
            </div>
          ) : null}
          {summary.table_number ? (
            <div>
              <dt className="text-xs font-medium uppercase tracking-[0.18em] text-ink-faint">{fr.verify.result.table}</dt>
              <dd className="mt-0.5 text-ink-soft">
                {summary.table_number}
                {summary.table_text ? ` — ${summary.table_text}` : ''}
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="text-xs font-medium uppercase tracking-[0.18em] text-ink-faint">{fr.verify.result.issued}</dt>
            <dd className="mt-0.5 text-ink-soft">{formatDateTime(summary.issued_at)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-[0.18em] text-ink-faint">{fr.verify.result.presence}</dt>
            <dd className={`mt-0.5 font-medium ${summary.presence_confirmed ? 'text-success' : 'text-ink-soft'}`}>
              {summary.presence_confirmed ? fr.verify.result.presenceConfirmed : fr.verify.result.presenceMissing}
            </dd>
          </div>
        </dl>
      ) : null}
    </div>
  )
}
