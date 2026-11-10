/** The guest's WhatsApp number as edited in forms, and its saved form. */
import { DEFAULT_COUNTRY, normalizePhone } from './share.ts'

export interface WhatsappValue {
  country: string
  number: string
}

export function emptyWhatsapp(): WhatsappValue {
  return { country: DEFAULT_COUNTRY, number: '' }
}

/** A stored number (« +243… ») shown back as typed; international, so the country is moot. */
export function whatsappFromStored(stored: string): WhatsappValue {
  return { country: DEFAULT_COUNTRY, number: stored }
}

/** `''` when empty, `+digits` when valid, `null` when it cannot be a number. */
export function whatsappPayload(value: WhatsappValue): string | null {
  const result = normalizePhone(value.number, value.country)
  if (result.ok) return `+${result.digits}`
  return result.reason === 'empty' ? '' : null
}
