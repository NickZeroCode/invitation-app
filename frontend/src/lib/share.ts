/**
 * Invitation delivery helpers: international phone normalisation and the
 * official WhatsApp click-to-chat link (https://wa.me/<number>?text=…).
 *
 * Rules for numbers (never silently rewrite a valid international number):
 * - « +32 470 12 34 56 » or « 0032 470… » is already international: kept as
 *   typed, whatever country is selected.
 * - A national number (« 081 234 5678 ») takes the selected country's code;
 *   its trunk « 0 » is dropped only where the national plan uses one.
 * - The result must hold 8–15 digits (E.164); otherwise it is rejected with a
 *   precise reason instead of being guessed.
 */

export interface CountryDialCode {
  /** ISO 3166-1 alpha-2, also the option value. */
  iso: string
  label: string
  dial: string
  /** National numbers start with a trunk « 0 » to drop (most of Africa/EU). */
  trunkZero: boolean
}

/** Curated for NickEvents' audience: DRC first, then the region and diaspora. */
export const COUNTRY_DIAL_CODES: CountryDialCode[] = [
  { iso: 'CD', label: 'RD Congo', dial: '243', trunkZero: true },
  { iso: 'CG', label: 'Congo-Brazzaville', dial: '242', trunkZero: false },
  { iso: 'AO', label: 'Angola', dial: '244', trunkZero: false },
  { iso: 'RW', label: 'Rwanda', dial: '250', trunkZero: true },
  { iso: 'BI', label: 'Burundi', dial: '257', trunkZero: false },
  { iso: 'UG', label: 'Ouganda', dial: '256', trunkZero: true },
  { iso: 'TZ', label: 'Tanzanie', dial: '255', trunkZero: true },
  { iso: 'ZM', label: 'Zambie', dial: '260', trunkZero: true },
  { iso: 'KE', label: 'Kenya', dial: '254', trunkZero: true },
  { iso: 'ZA', label: 'Afrique du Sud', dial: '27', trunkZero: true },
  { iso: 'CM', label: 'Cameroun', dial: '237', trunkZero: false },
  { iso: 'CI', label: 'Côte d’Ivoire', dial: '225', trunkZero: false },
  { iso: 'SN', label: 'Sénégal', dial: '221', trunkZero: false },
  { iso: 'BE', label: 'Belgique', dial: '32', trunkZero: true },
  { iso: 'FR', label: 'France', dial: '33', trunkZero: true },
  { iso: 'CH', label: 'Suisse', dial: '41', trunkZero: true },
  { iso: 'GB', label: 'Royaume-Uni', dial: '44', trunkZero: true },
  { iso: 'CA', label: 'Canada / États-Unis', dial: '1', trunkZero: false },
]

export const DEFAULT_COUNTRY = 'CD'

export type PhoneResult =
  | { ok: true; digits: string; display: string }
  | { ok: false; reason: 'empty' | 'invalid_chars' | 'too_short' | 'too_long' }

/**
 * Normalise what the organizer typed into E.164 digits (no « + »), using the
 * selected country only for national numbers.
 */
export function normalizePhone(raw: string, countryIso: string): PhoneResult {
  const trimmed = raw.trim()
  if (!trimmed) return { ok: false, reason: 'empty' }
  // Spaces, dots, dashes and brackets are formatting; anything else is not.
  if (!/^[+\d\s().-]+$/.test(trimmed)) return { ok: false, reason: 'invalid_chars' }

  const compact = trimmed.replace(/[\s().-]/g, '')
  let digits: string
  if (compact.startsWith('+')) {
    digits = compact.slice(1)
  } else if (compact.startsWith('00')) {
    digits = compact.slice(2)
  } else {
    const country = COUNTRY_DIAL_CODES.find((entry) => entry.iso === countryIso) ?? COUNTRY_DIAL_CODES[0]
    const national = country.trunkZero ? compact.replace(/^0/, '') : compact
    digits = `${country.dial}${national}`
  }
  if (!/^\d+$/.test(digits)) return { ok: false, reason: 'invalid_chars' }
  if (digits.length < 8) return { ok: false, reason: 'too_short' }
  if (digits.length > 15) return { ok: false, reason: 'too_long' }
  return { ok: true, digits, display: `+${digits}` }
}

/**
 * WhatsApp's official click-to-chat link. With a number it opens that chat;
 * without, WhatsApp asks which contact to send to. wa.me hands off to the app
 * on phones and to WhatsApp Web / Desktop on computers.
 */
export function whatsappLink(message: string, digits?: string): string {
  const text = encodeURIComponent(message)
  return digits ? `https://wa.me/${digits}?text=${text}` : `https://wa.me/?text=${text}`
}

/** `mailto:` fallback for when the server has no e-mail provider configured. */
export function mailtoLink(recipient: string, subject: string, body: string): string {
  const params = new URLSearchParams({ subject, body })
  // URLSearchParams encodes spaces as « + », which mail clients show
  // literally: RFC 6068 wants %20.
  return `mailto:${encodeURIComponent(recipient)}?${params.toString().replace(/\+/g, '%20')}`
}

/** Pragmatic client-side check; the server is the authority. */
export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
}
