/**
 * When the landing page may move.
 *
 * The 3D and shader effects are a pleasure on a good phone and a burden on a
 * weak one, or on a metered connection — common for our visitors. They run
 * only when the visitor has not asked for less motion, is not saving data,
 * and the device is not plainly low-end. Every effect also has a still
 * fallback that looks finished on its own.
 */
import { useEffect, useState } from 'react'

interface NetworkInformationLike {
  saveData?: boolean
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
}

/** Data saver on, or a clearly low-end device (≤ 2 GB memory or ≤ 2 cores). */
export function isLowPowerDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  const connection = (navigator as Navigator & { connection?: NetworkInformationLike }).connection
  if (connection?.saveData) return true
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  if (typeof memory === 'number' && memory <= 2) return true
  const cores = navigator.hardwareConcurrency
  return typeof cores === 'number' && cores > 0 && cores <= 2
}

/** Live `prefers-reduced-motion` (it can change while the page is open). */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(prefersReducedMotion)
  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!query) return undefined
    const update = () => setReduced(query.matches)
    query.addEventListener?.('change', update)
    return () => query.removeEventListener?.('change', update)
  }, [])
  return reduced
}

/** Full motion allowed: no reduced-motion wish and not a low-power device. */
export function useRichMotion(): boolean {
  const reduced = useReducedMotion()
  const [lowPower] = useState(isLowPowerDevice)
  return !reduced && !lowPower
}

/** Clamp helper shared by the scroll-driven pieces. */
export function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value))
}
