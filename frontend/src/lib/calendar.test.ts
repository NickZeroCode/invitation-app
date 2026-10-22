import { describe, expect, it } from 'vitest'

import { buildIcs, directionsUrl } from './calendar.ts'

const EVENT = {
  title: 'Mariage de Grâce, et Éric',
  date: '2026-12-12',
  time: '15:00:00',
  timezone: 'Africa/Kinshasa',
  location: 'Cathédrale; Kinshasa',
  description: 'Nous serions honorés.',
  url: 'https://www.nickevents.com/i/abc',
}

describe('buildIcs', () => {
  it('converts the start from the event time zone to UTC (Kinshasa is UTC+1)', () => {
    const ics = buildIcs(EVENT, new Date(Date.UTC(2026, 9, 1)))!
    expect(ics).toContain('DTSTART:20261212T140000Z')
    expect(ics).toContain('DTEND:20261212T170000Z')
    expect(ics).toContain('SUMMARY:Mariage de Grâce\\, et Éric')
    expect(ics).toContain('LOCATION:Cathédrale\\; Kinshasa')
    expect(ics.endsWith('\r\n')).toBe(true)
  })

  it('falls back to an all-day event without a time', () => {
    const ics = buildIcs({ ...EVENT, time: '' })!
    expect(ics).toContain('DTSTART;VALUE=DATE:20261212')
    expect(ics).toContain('DTEND;VALUE=DATE:20261213')
  })

  it('returns null for a missing date', () => {
    expect(buildIcs({ ...EVENT, date: '' })).toBeNull()
  })
})

describe('directionsUrl', () => {
  it('searches the venue name and address', () => {
    expect(directionsUrl('Salle', 'Av. de la Paix')).toBe(
      'https://www.google.com/maps/search/?api=1&query=Salle%2C%20Av.%20de%20la%20Paix',
    )
    expect(directionsUrl('', ' ')).toBeNull()
  })
})
