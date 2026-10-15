export interface ProgressBarProps {
  /** Truthful completion in the 0–100 range (clamped). */
  value: number
  /** Accessible name for the bar. */
  label?: string
  /** Optional visible caption beside the percentage. */
  caption?: string
  className?: string
}

/**
 * Determinate progress bar driven by a *real* measured value — it never
 * animates on its own, so what the user sees is the export's actual progress.
 * The fill uses the brand accent (a state, not decoration).
 */
export function ProgressBar({ value, label, caption, className = '' }: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, Math.round(value)))
  return (
    <div className={className}>
      {caption ? (
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          <span className="truncate text-xs text-ink-soft">{caption}</span>
          <span className="shrink-0 text-xs font-semibold tabular-nums text-ink">{percent}%</span>
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 w-full overflow-hidden rounded-pill bg-surface-muted ring-1 ring-inset ring-line"
      >
        <div
          className="h-full rounded-pill bg-brand transition-[width] duration-150 ease-linear"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
