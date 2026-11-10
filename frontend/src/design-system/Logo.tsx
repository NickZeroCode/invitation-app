/**
 * MalaikaEvents brand marks — flat, drawn in code (no raster, no gradient).
 *
 * The mark is an envelope drawn in one continuous line whose sides and flap
 * also spell an « M »; a vermilion wax dot seals the fold. It sits on a
 * malachite tile (default) or, with `plate={false}`, is drawn alone in the
 * current text colour for dark grounds. The wordmark is always the full
 * name, « MalaikaEvents », set in the house serif: « Malaika » in ink,
 * « Events » in malachite (jade on dark).
 *
 * The same geometry is used for the favicons (`public/favicon.svg` and the
 * PNG sizes), so the brand is one drawing everywhere.
 */

/** Envelope-M strokes on a 64 × 64 grid. */
const M_PATH = 'M17 45V21l15 14 15-14v24H17'

/** The compact brand mark. */
export function LogoMark({
  className = 'h-8 w-8',
  plate = true,
}: {
  className?: string
  /** Malachite tile behind the mark; turn off on dark grounds. */
  plate?: boolean
}) {
  return (
    <svg viewBox="0 0 64 64" className={`shrink-0 ${className}`} aria-hidden="true" focusable="false">
      {plate ? <rect width="64" height="64" rx="15" fill="var(--color-brand)" /> : null}
      <path
        d={M_PATH}
        fill="none"
        stroke={plate ? '#F5F2EC' : 'currentColor'}
        strokeWidth="4.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx="32" cy="35" r="3.6" fill="var(--color-seal)" />
    </svg>
  )
}

/** The full name, set as a wordmark. */
export function Wordmark({ dark = false, className = '' }: { dark?: boolean; className?: string }) {
  return (
    <span className={`font-brand font-medium leading-none tracking-[-0.01em] ${className}`}>
      <span className={dark ? 'text-paper-on-dark' : 'text-ink'}>Malaika</span>
      <span className={dark ? 'text-jade' : 'text-brand'}>Events</span>
    </span>
  )
}

/** Mark + wordmark, for headers and navigation. */
export function BrandLockup({ dark = false, compact = false }: { dark?: boolean; compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark className={`h-8 w-8 ${dark ? 'text-paper-on-dark' : ''}`} plate={!dark} />
      {compact ? null : <Wordmark dark={dark} className="text-[1.3125rem]" />}
    </span>
  )
}

/** The stacked signature (mark above the name and the house line), for large spaces. */
export function LogoArtwork({ className = 'w-64', dark = true }: { className?: string; dark?: boolean }) {
  return (
    <div role="img" aria-label="MalaikaEvents" className={`flex flex-col items-center text-center ${className}`}>
      <LogoMark className={`h-[28%] w-[28%] min-h-14 min-w-14 ${dark ? 'text-paper-on-dark' : ''}`} plate={!dark} />
      <Wordmark dark={dark} className="mt-5 text-[clamp(1.75rem,4vw,2.5rem)]" />
      <span className={`mt-3 font-label text-[0.625rem] font-semibold uppercase tracking-[0.42em] ${dark ? 'text-jade' : 'text-ink-faint'}`}>
        Créez · Invitez · Partagez
      </span>
    </div>
  )
}
