/**
 * Text sizes — scale the whole invitation typography uniformly.
 *
 * The organizer picks one per event in the editor. `InvitationPaper` applies
 * it as a multiplier on the paper's base font size via the `--invitation-scale`
 * custom property, so every `em`-based measure in the templates (type, rhythm,
 * ornaments) scales together and the download matches the screen.
 *
 * Keys mirror `FONT_SIZE_KEYS` in `backend/events/models.py`.
 */
import type { CSSProperties } from 'react'

export interface FontSizeOption {
  key: string
  label: string
  /** Multiplier on the paper's base font size. */
  scale: number
}

export const FONT_SIZES: FontSizeOption[] = [
  { key: 'petite', label: 'Petite', scale: 0.9 },
  { key: 'normale', label: 'Normale', scale: 1 },
  { key: 'grande', label: 'Grande', scale: 1.12 },
  { key: 'tres-grande', label: 'Très grande', scale: 1.26 },
]

/** Scale multiplier for a stored size key. Unknown/empty keys → 1. */
export function fontScale(key: string | undefined): number {
  return FONT_SIZES.find((size) => size.key === key)?.scale ?? 1
}

/**
 * Style carrying the scale as a CSS custom property. Put it on the wrapper
 * around the template so `InvitationPaper` picks it up — and so image exports,
 * which capture that subtree, keep the chosen size.
 */
export function fontScaleStyle(key: string | undefined): CSSProperties {
  return { '--invitation-scale': fontScale(key) } as CSSProperties
}
