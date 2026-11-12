/**
 * MalaikaEvents brand marks — the PNG logo set in `public/logo/` (vector
 * masters in `docs/brand/`).
 *
 * The mark: an « M » whose outer strokes are a pair of feathered wings —
 * *malaika* is « angel » in Swahili — and whose middle is an envelope's flap,
 * sealed with vermilion wax where it folds: an angel carrying an invitation.
 * The wordmark is « MalaikaEvents » in Overused Grotesk Medium, « Malaika »
 * in ink and « Events » in vermilion.
 *
 * - `LogoMark`: the app icon (ink tile) by default, or the bare mark
 *   (`plate={false}`, light or `tone="dark"`).
 * - `BrandLockup`: mark + wordmark, for headers; `dark` on dark grounds.
 * - `LogoArtwork`: the lockup with the house line, for large spaces.
 */

const SRC = {
  icon: '/logo/malaikaevents-icon.png',
  mark: '/logo/malaikaevents-mark.png',
  markDark: '/logo/malaikaevents-mark-dark.png',
  lockup: '/logo/malaikaevents-lockup.png',
  lockupDark: '/logo/malaikaevents-lockup-dark.png',
}

/** Lockup width-to-height ratio (429 × 96 artboard). */
const LOCKUP_RATIO = 429 / 96

export function LogoMark({
  className = 'h-8 w-8',
  plate = true,
  tone = 'light',
}: {
  className?: string
  /** The ink app-icon tile (default); `false` for the bare mark. */
  plate?: boolean
  /** Bare mark colour: ink for light grounds, paper for dark ones. */
  tone?: 'light' | 'dark'
}) {
  const src = plate ? SRC.icon : tone === 'dark' ? SRC.markDark : SRC.mark
  return <img src={src} alt="" aria-hidden="true" draggable={false} className={`shrink-0 select-none object-contain ${className}`} />
}

/** Mark + wordmark, for headers and navigation. */
export function BrandLockup({ dark = false, compact = false }: { dark?: boolean; compact?: boolean }) {
  if (compact) return <LogoMark className="h-8 w-8" />
  return (
    <img
      src={dark ? SRC.lockupDark : SRC.lockup}
      alt="MalaikaEvents"
      draggable={false}
      width={Math.round(32 * LOCKUP_RATIO)}
      height={32}
      className="h-8 w-auto shrink-0 select-none"
    />
  )
}

/** The lockup with the house line, for large spaces. */
export function LogoArtwork({ className = 'w-64', dark = false }: { className?: string; dark?: boolean }) {
  return (
    <div role="img" aria-label="MalaikaEvents" className={`flex flex-col items-center text-center ${className}`}>
      <img src={dark ? SRC.lockupDark : SRC.lockup} alt="" aria-hidden="true" draggable={false} className="h-auto w-full select-none" />
      <span className={`mt-4 font-label text-[0.625rem] font-semibold uppercase tracking-[0.42em] ${dark ? 'text-white/70' : 'text-ink-faint'}`}>
        Créez · Invitez · Partagez
      </span>
    </div>
  )
}
