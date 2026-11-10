/**
 * The guest's WhatsApp number: a country picker and the number as typed.
 * Local numbers take the country's dialling code (« 0812 345 678 » in RD
 * Congo → « +243812345678 »); international ones (« +… », « 00… ») are kept.
 * The same rules as the send dialog (lib/share), so a number saved here opens
 * the right chat there.
 */
import { useState } from 'react'

import { Field } from '../design-system/Field.tsx'
import { Input, Select } from '../design-system/Input.tsx'
import { COUNTRY_DIAL_CODES, DEFAULT_COUNTRY, normalizePhone } from '../lib/share.ts'
import { fr } from '../locales/fr.ts'

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

const ERRORS: Record<string, string> = {
  invalid_chars: fr.guests.whatsappInvalidChars,
  too_short: fr.guests.whatsappTooShort,
  too_long: fr.guests.whatsappTooLong,
}

export function WhatsappNumberField({
  id,
  value,
  onChange,
  showErrors = false,
  compact = false,
  className = '',
}: {
  id: string
  value: WhatsappValue
  onChange: (value: WhatsappValue) => void
  /** Show a malformed number's error before the field is left (e.g. on submit). */
  showErrors?: boolean
  /** Number only, without the country picker (dense rows). */
  compact?: boolean
  className?: string
}) {
  const [touched, setTouched] = useState(false)
  const result = normalizePhone(value.number, value.country)
  const error = (touched || showErrors) && !result.ok && result.reason !== 'empty' ? ERRORS[result.reason] : undefined
  const hint = result.ok ? fr.guests.whatsappSavedAs.replace('{number}', result.display) : fr.guests.whatsappHint

  const number = (
    <Field id={id} label={fr.guests.whatsappLabel} error={error} hint={compact ? undefined : hint}>
      <Input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="off"
        placeholder="081 234 5678"
        value={value.number}
        invalid={Boolean(error)}
        onChange={(event) => onChange({ ...value, number: event.target.value })}
        onBlur={() => setTouched(true)}
      />
    </Field>
  )
  if (compact) return <div className={className}>{number}</div>

  return (
    <div className={`grid gap-3 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)] ${className}`}>
      <Field id={`${id}-country`} label={fr.guests.whatsappCountry}>
        <Select id={`${id}-country`} value={value.country} onChange={(event) => onChange({ ...value, country: event.target.value })}>
          {COUNTRY_DIAL_CODES.map((entry) => (
            <option key={entry.iso} value={entry.iso}>
              {entry.label} (+{entry.dial})
            </option>
          ))}
        </Select>
      </Field>
      {number}
    </div>
  )
}
