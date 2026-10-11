/**
 * MalaikaEvents brand marks — derived from the official logo artwork
 * (`frontend/public/logo/logo-malaika-events.png`, gold & ivory on black):
 *
 * - `malaika-emblem.webp` — the gold monogram (invitation card + envelope
 *   ribbon) WITHOUT text, tightly cropped with the black backdrop keyed to
 *   transparency (enclosed black areas stay black), so on light surfaces it
 *   rides a dark plate (default); pass `plate={false}` on dark surfaces.
 * - `malaika-lockup.webp` — the full lockup (monogram + wordmark + tagline),
 *   displayed plateless on the dark band of the home page's final CTA.
 *
 * Each SVG maps its `viewBox` to the asset's own pixel size, so the real
 * logo is used at every size without redrawing it.
 */

const EMBLEM_SRC = '/logo/malaika-emblem.webp'
const LOCKUP_SRC = '/logo/malaika-lockup.webp'
const EMBLEM_SIZE = 430
const LOCKUP_WIDTH = 1174
const LOCKUP_HEIGHT = 649

/**
 * The gold monogram (no text) — the compact brand mark. The artwork is
 * transparent: on light surfaces it rides a dark plate (`plate`, default);
 * pass `plate={false}` on dark surfaces.
 */
export function LogoMark({
  className = 'h-8 w-8 rounded-md',
  plate = true,
}: {
  className?: string
  plate?: boolean
}) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden ${plate ? 'bg-black' : ''} ${className}`}
    >
      <svg
        viewBox={`0 0 ${EMBLEM_SIZE} ${EMBLEM_SIZE}`}
        className="h-full w-full"
        aria-hidden="true"
        focusable="false"
      >
        <image href={EMBLEM_SRC} width={EMBLEM_SIZE} height={EMBLEM_SIZE} />
      </svg>
    </span>
  )
}

/**
 * Compact lockup: monogram + "MalaikaEvents" wordmark in the logo's own
 * two-tone ("Malaika" ink/ivory, "Events" gold).
 */
export function BrandLockup({
  dark = false,
  compact = false,
}: {
  dark?: boolean
  compact?: boolean
}) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      {compact ? null : (
        <span className="font-display text-lg font-semibold tracking-tight">
          <span className={dark ? 'text-white' : 'text-ink'}>Malaika</span>
          <span className={dark ? 'text-gold' : 'text-brand'}>Events</span>
        </span>
      )}
    </span>
  )
}

/** The full logo lockup (monogram + wordmark + tagline) — transparent, no plate. */
export function LogoArtwork({ className = 'w-64' }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${LOCKUP_WIDTH} ${LOCKUP_HEIGHT}`}
      className={`h-auto ${className}`}
      role="img"
      aria-label="MalaikaEvents"
    >
      <image href={LOCKUP_SRC} width={LOCKUP_WIDTH} height={LOCKUP_HEIGHT} />
    </svg>
  )
}
