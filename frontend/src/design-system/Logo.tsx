/**
 * NickEvents brand marks — cropped views of the official logo artwork
 * (`frontend/public/logo/`, gold & ivory):
 *
 * - `nickevents-emblem.webp` — the gold "N" emblem WITHOUT text (ribbon
 *   effect, transparent), the compact brand mark. It needs a dark plate
 *   behind it to read, so the mark renders on black.
 * - `nickevents-logo.webp` — the full lockup (emblem + wordmark + tagline)
 *   on its own black plate, displayed big on the home page.
 *
 * The SVG `viewBox` windows the source bitmap (1536×1024) to the exact
 * region needed, so the real logo is used at every size without redrawing
 * it or shipping extra binary assets.
 */

const EMBLEM_SRC = '/logo/nickevents-emblem.webp'
const LOGO_SRC = '/logo/nickevents-logo.webp'

/** The gold "N" emblem (no text) on its dark plate — the compact brand mark. */
export function LogoMark({ className = 'h-8 w-8 rounded-md' }: { className?: string }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden bg-black ${className}`}
    >
      <svg viewBox="283 23 970 970" className="h-full w-full" aria-hidden="true" focusable="false">
        <image href={EMBLEM_SRC} width="1536" height="1024" />
      </svg>
    </span>
  )
}

/**
 * Compact lockup: monogram + "NickEvents" wordmark in the logo's own
 * two-tone ("Nick" ink/ivory, "Events" gold).
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
          <span className={dark ? 'text-white' : 'text-ink'}>Nick</span>
          <span className={dark ? 'text-gold' : 'text-brand'}>Events</span>
        </span>
      )}
    </span>
  )
}

/** The full logo lockup (emblem + wordmark + tagline) on its black plate. */
export function LogoArtwork({ className = 'w-64' }: { className?: string }) {
  return (
    <svg
      viewBox="310 210 920 630"
      className={`h-auto overflow-hidden rounded-2xl bg-black ${className}`}
      role="img"
      aria-label="NickEvents"
    >
      <image href={LOGO_SRC} width="1536" height="1024" />
    </svg>
  )
}
