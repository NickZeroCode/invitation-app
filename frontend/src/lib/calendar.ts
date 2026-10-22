/**
 * Guest conveniences on the public invitation: an « Ajouter au calendrier »
 * .ics file (built in the browser, nothing sent anywhere) and a directions
 * link for the venue.
 */

export interface CalendarEvent {
  title: string
  /** ISO date `YYYY-MM-DD`. */
  date: string
  /** `HH:mm` or `HH:mm:ss`; empty = all-day. */
  time: string
  /** IANA zone the organizer chose, e.g. `Africa/Kinshasa`. */
  timezone: string
  location: string
  description: string
  url: string
}

/** Minutes east of UTC for `timezone` at the given UTC instant. */
function zoneOffsetMinutes(timezone: string, at: Date): number {
  try {
    const part = new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'longOffset' })
      .formatToParts(at)
      .find((entry) => entry.type === 'timeZoneName')?.value
    const match = /GMT([+-])(\d{2}):?(\d{2})?/.exec(part ?? '')
    if (!match) return 0
    const minutes = Number(match[2]) * 60 + Number(match[3] ?? 0)
    return match[1] === '-' ? -minutes : minutes
  } catch {
    return 0
  }
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function utcStamp(date: Date): string {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}00Z`
}

/** RFC 5545 text escaping plus 75-octet-ish line folding. */
function escapeText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

function fold(line: string): string {
  const chunks: string[] = []
  let rest = line
  while (rest.length > 72) {
    chunks.push(rest.slice(0, 72))
    rest = ` ${rest.slice(72)}`
  }
  chunks.push(rest)
  return chunks.join('\r\n')
}

/** Build the .ics body; the start is converted from the event's zone to UTC. */
export function buildIcs(event: CalendarEvent, now: Date = new Date()): string | null {
  const [year, month, day] = event.date.split('-').map(Number)
  if (!year || !month || !day) return null

  let start: string[]
  if (event.time) {
    const [hours = 0, minutes = 0] = event.time.split(':').map(Number)
    const wallClockAsUtc = Date.UTC(year, month - 1, day, hours, minutes)
    const offset = zoneOffsetMinutes(event.timezone, new Date(wallClockAsUtc))
    const startUtc = new Date(wallClockAsUtc - offset * 60_000)
    const endUtc = new Date(startUtc.getTime() + 3 * 60 * 60_000)
    start = [`DTSTART:${utcStamp(startUtc)}`, `DTEND:${utcStamp(endUtc)}`]
  } else {
    const next = new Date(Date.UTC(year, month - 1, day + 1))
    start = [
      `DTSTART;VALUE=DATE:${year}${pad(month)}${pad(day)}`,
      `DTEND;VALUE=DATE:${next.getUTCFullYear()}${pad(next.getUTCMonth() + 1)}${pad(next.getUTCDate())}`,
    ]
  }

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NickEvents//Invitation//FR',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${encodeURIComponent(event.url)}@nickevents`,
    `DTSTAMP:${utcStamp(now)}`,
    ...start,
    `SUMMARY:${escapeText(event.title)}`,
    event.location ? `LOCATION:${escapeText(event.location)}` : '',
    `DESCRIPTION:${escapeText(`${event.description}\n\n${event.url}`.trim())}`,
    `URL:${event.url}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean)
  return lines.map(fold).join('\r\n') + '\r\n'
}

/** Trigger the download of the .ics file (guest-initiated). */
export function downloadIcs(event: CalendarEvent): void {
  const body = buildIcs(event)
  if (!body) return
  const blob = new Blob([body], { type: 'text/calendar;charset=utf-8' })
  const href = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = 'invitation.ics'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(href), 1000)
}

/** Google Maps search for the venue (opens the app on phones). */
export function directionsUrl(venueName: string, venueAddress: string): string | null {
  const query = [venueName, venueAddress].map((part) => part.trim()).filter(Boolean).join(', ')
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : null
}
