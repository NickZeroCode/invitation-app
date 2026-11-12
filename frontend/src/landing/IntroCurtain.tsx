/**
 * The opening of the house: a flat malachite curtain carrying the mark and
 * the name, a count from 00 to 100 along a hairline, then the curtain lifts
 * onto the hero — whose own entrance is held back to play just as it is
 * revealed (see `html[data-intro]` in index.css).
 *
 * Shown once per visit, only with rich motion, never longer than about a
 * second and a half, and it never blocks the page: it is decorative
 * (`aria-hidden`) and lets every click through.
 */
import { useLayoutEffect, useRef, useState } from 'react'

import { LogoArtwork } from '../design-system/Logo.tsx'

const KEY = 'malaikaevents:intro'
const COUNT_MS = 900

function alreadySeen(): boolean {
  try {
    return window.sessionStorage.getItem(KEY) === '1'
  } catch {
    return true
  }
}

export function IntroCurtain({ enabled }: { enabled: boolean }) {
  const [show, setShow] = useState(() => enabled && typeof window !== 'undefined' && !alreadySeen())
  const [lifting, setLifting] = useState(false)
  const countRef = useRef<HTMLSpanElement>(null)
  const lineRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    if (!show) return undefined
    const root = document.documentElement
    root.dataset.intro = 'on'
    try {
      window.sessionStorage.setItem(KEY, '1')
    } catch {
      /* private mode: the curtain simply shows again next time */
    }
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / COUNT_MS)
      const eased = 1 - (1 - progress) ** 3
      if (countRef.current) countRef.current.textContent = String(Math.round(eased * 100)).padStart(2, '0')
      if (lineRef.current) lineRef.current.style.transform = `scaleX(${eased.toFixed(3)})`
      if (progress < 1) frame = requestAnimationFrame(tick)
      else setLifting(true)
    }
    frame = requestAnimationFrame(tick)
    const done = window.setTimeout(() => setShow(false), COUNT_MS + 900)
    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(done)
    }
  }, [show])

  // The hero's delayed entrance stays scheduled for the page's lifetime.
  useLayoutEffect(() => () => {
    delete document.documentElement.dataset.intro
  }, [])

  if (!show) return null
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] flex flex-col items-center justify-center bg-malachite text-paper-on-dark transition-transform duration-[800ms] ease-[cubic-bezier(0.76,0,0.24,1)]"
      style={{ transform: lifting ? 'translateY(-100%)' : 'none' }}
    >
      <LogoArtwork className="w-[min(78vw,22rem)]" />
      <div className="absolute inset-x-5 bottom-8 flex items-end justify-between gap-6 sm:inset-x-10">
        <span className="relative block h-px flex-1 bg-paper-on-dark/15">
          <span ref={lineRef} className="absolute inset-0 origin-left bg-jade" style={{ transform: 'scaleX(0)' }} />
        </span>
        <span ref={countRef} className="font-label text-[0.75rem] font-semibold tabular-nums tracking-[0.2em] text-paper-on-dark/70">
          00
        </span>
      </div>
    </div>
  )
}
