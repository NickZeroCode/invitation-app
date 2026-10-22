/**
 * The guest-facing domain encoded in QR codes and invitation links.
 *
 * Always the brand domain (www.malaikaevent.com), whatever host the
 * organizer happens to be using, so a printed or shared QR code never points
 * at a preview or legacy URL. Override with VITE_PUBLIC_SITE_URL (e.g. a
 * staging domain). The door scanner reads only the `/i/<token>` path, so
 * codes printed with an older domain keep verifying.
 */
export const PUBLIC_SITE_URL = (
  (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined) || 'https://www.malaikaevent.com'
).replace(/\/+$/, '')

/** Public page of one guest's invitation. */
export function invitationUrl(token: string): string {
  return `${PUBLIC_SITE_URL}/i/${token}`
}
