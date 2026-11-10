/**
 * The time in Kinshasa, ticking in the margin like a printer's mark
 * (« KINSHASA, CD_14:02:11 »). Decorative: hidden from assistive tech, and
 * only this tiny component re-renders each second.
 */
import { useEffect, useState } from 'react'

const FORMAT = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Africa/Kinshasa',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

export function KinshasaClock({ city, className = '' }: { city: string; className?: string }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])
  return (
    <span aria-hidden="true" className={`tabular-nums ${className}`}>
      {city}_{FORMAT.format(now)}
    </span>
  )
}
