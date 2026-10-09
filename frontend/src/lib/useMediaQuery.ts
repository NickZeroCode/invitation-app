import { useEffect, useState } from 'react'

/** Desktop breakpoint shared by the shell and the editor workspace (Tailwind `lg`). */
export const DESKTOP_QUERY = '(min-width: 1024px)'

function read(query: string, fallback: boolean): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return fallback
  return window.matchMedia(query).matches
}

/**
 * Live media-query match. Environments without `matchMedia` (jsdom tests,
 * SSR) get `fallback`, so layouts render one deterministic variant.
 */
export function useMediaQuery(query: string, fallback = true): boolean {
  const [matches, setMatches] = useState(() => read(query, fallback))

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined
    const list = window.matchMedia(query)
    const update = () => setMatches(list.matches)
    update()
    list.addEventListener('change', update)
    return () => list.removeEventListener('change', update)
  }, [query])

  return matches
}
