/** fr-FR formatting helpers (dates honour the organizer's timezone). */

export function formatDate(iso: string, timeZone?: string): string {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone }).format(new Date(iso))
}

export function formatDateTime(iso: string, timeZone?: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone,
  }).format(new Date(iso))
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value)
}
