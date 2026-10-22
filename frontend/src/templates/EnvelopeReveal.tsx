/**
 * The opening of a guest's invitation: a sealed envelope addressed to the
 * guest, dressed in the template's palette, closed with a wax seal carrying
 * the couple's (or host's) initials. Pressing the seal lifts the flap, the
 * card rises out and the envelope steps aside — about one second, once per
 * visit (remembered for the browser session), skipped entirely for
 * prefers-reduced-motion users after a single plain fade.
 *
 * The invitation itself is already rendered underneath: the envelope only
 * delays the first look, never the content (no data waits on it).
 */
import { useEffect, useId, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

import { LuxePattern } from './luxeMotifs.tsx'
import type { PanelSkin } from './panelSkin.tsx'
import { monogramInitials } from './shared.tsx'

type Phase = 'sealed' | 'opening' | 'leaving' | 'gone'

const STORAGE_PREFIX = 'nickevents.opened.'

function alreadyOpened(token: string): boolean {
  try {
    return window.sessionStorage.getItem(STORAGE_PREFIX + token) === '1'
  } catch {
    return false
  }
}

function rememberOpened(token: string) {
  try {
    window.sessionStorage.setItem(STORAGE_PREFIX + token, '1')
  } catch {
    // Private mode / blocked storage: the envelope simply shows again.
  }
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Irregular wax-drip outline around a circle (deterministic). */
const SEAL_PATH = (() => {
  const points: string[] = []
  const bumps = [1, 0.94, 1.03, 0.97, 1.05, 0.95, 1.02, 0.96, 1.04, 0.93, 1.01, 0.98, 1.05, 0.95]
  const steps = 56
  for (let i = 0; i < steps; i += 1) {
    const angle = (i / steps) * Math.PI * 2
    const bump = bumps[Math.floor((i / steps) * bumps.length)]
    const wobble = 1 + Math.sin(angle * 9) * 0.012
    const r = 47 * bump * wobble
    points.push(`${(50 + Math.cos(angle) * r).toFixed(2)},${(50 + Math.sin(angle) * r).toFixed(2)}`)
  }
  return `M${points.join('L')}Z`
})()

export function EnvelopeReveal({
  token,
  templateKey,
  skin,
  dark,
  title,
  guestName,
  stage,
  onOpened,
}: {
  token: string
  templateKey: string
  skin: PanelSkin
  dark: boolean
  title: string
  guestName: string
  /** The page backdrop colour: the envelope lies on the same table. */
  stage: string
  onOpened: () => void
}) {
  const [phase, setPhase] = useState<Phase>(() => (alreadyOpened(token) ? 'gone' : 'sealed'))
  const sealRef = useRef<HTMLButtonElement>(null)
  const waxId = useId()
  const timers = useRef<number[]>([])

  useEffect(() => {
    if (phase === 'gone') {
      onOpened()
      return undefined
    }
    if (phase === 'sealed') sealRef.current?.focus({ preventScroll: true })
    return undefined
  }, [phase, onOpened])

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((id) => window.clearTimeout(id))
  }, [])

  // Lock page scroll only while the envelope is in front.
  useEffect(() => {
    if (phase === 'gone') return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [phase])

  if (phase === 'gone') return null

  function open() {
    if (phase !== 'sealed') return
    rememberOpened(token)
    const reduced = prefersReducedMotion()
    const later = (ms: number, next: Phase) => {
      timers.current.push(window.setTimeout(() => setPhase(next), ms))
    }
    if (reduced) {
      setPhase('leaving')
      later(220, 'gone')
      return
    }
    setPhase('opening')
    later(950, 'leaving')
    later(1450, 'gone')
  }

  const initials = monogramInitials(title)
  const opening = phase === 'opening' || phase === 'leaving'
  // Envelope stock: the template's paper pushed toward its accent, so the
  // envelope and the card inside read as one stationery suite.
  const paperBase = /#[0-9a-f]{6}/i.exec(skin.paper)?.[0] ?? '#F3EBDD'
  const envelope = `color-mix(in oklab, ${paperBase} 82%, ${skin.accent} 18%)`
  const waxLight = `color-mix(in oklab, ${skin.accent} 70%, white 30%)`
  const waxDark = `color-mix(in oklab, ${skin.accent} 70%, black 30%)`
  const fold: CSSProperties = { position: 'absolute', inset: 0 }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Invitation pour ${guestName}`}
      className="fixed inset-0 z-40 flex flex-col items-center justify-center px-5"
      style={{
        backgroundColor: stage,
        opacity: phase === 'leaving' ? 0 : 1,
        transition: 'opacity 480ms ease',
      }}
    >
      <p
        className="text-[0.72rem] uppercase"
        style={{ letterSpacing: '0.42em', color: dark ? 'rgba(255,248,236,0.62)' : 'rgba(43,38,32,0.55)' }}
      >
        Une invitation pour
      </p>
      <p
        className="mt-2 max-w-[22rem] text-center font-display text-[1.6rem] italic leading-tight sm:text-[1.9rem]"
        style={{ color: dark ? '#F6EEDF' : '#2B2620' }}
      >
        {guestName}
      </p>

      <div
        className="relative mt-9 w-[min(86vw,28rem)]"
        style={{ aspectRatio: '1.5 / 1', perspective: '1400px' }}
      >
        {/* The card waiting inside: it rises out as the flap opens. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-[6%] top-[6%] h-[88%] rounded-[2px]"
          style={{
            background: skin.paper,
            boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
            transform: opening ? 'translateY(-46%)' : 'translateY(0)',
            transition: 'transform 620ms cubic-bezier(0.22, 1, 0.36, 1) 330ms',
            zIndex: 1,
          }}
        >
          <div className="flex h-full flex-col items-center justify-center gap-2 pt-[6%]">
            <span className="block h-px w-1/3" style={{ backgroundColor: skin.accent, opacity: 0.6 }} />
            <span className="font-display text-[0.95rem] italic" style={{ color: skin.ink }}>
              {initials.join(' & ') || 'Invitation'}
            </span>
            <span className="block h-px w-1/3" style={{ backgroundColor: skin.accent, opacity: 0.6 }} />
          </div>
        </div>

        {/* Envelope body: back panel, then side and bottom folds over it. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-[3px]"
          style={{
            background: envelope,
            boxShadow:
              '0 1px 1px rgba(30,20,10,0.10), 0 10px 22px -8px rgba(30,20,10,0.28), 0 34px 60px -26px rgba(30,20,10,0.40)',
          }}
        />
        <svg aria-hidden="true" viewBox="0 0 150 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" style={{ ...fold, zIndex: 2 }}>
          {/* Side folds meet under the flap tip; the bottom fold overlaps
              both, each edge drawn as a hairline crease. */}
          <path d="M0 0 L75 53 L0 100 Z" fill={envelope} />
          <path d="M150 0 L75 53 L150 100 Z" fill={envelope} />
          <path d="M0 0 L75 53 L0 100 Z" fill="rgba(0,0,0,0.03)" />
          <path d="M150 0 L75 53 L150 100 Z" fill="rgba(0,0,0,0.055)" />
          <path d="M0 100 Q 40 64 75 47 Q 110 64 150 100 Z" fill={envelope} />
          <path d="M0 100 Q 40 64 75 47 Q 110 64 150 100 Z" fill="rgba(255,255,255,0.05)" />
          <path d="M0 100 Q 40 64 75 47 Q 110 64 150 100" fill="none" stroke="rgba(40,28,16,0.16)" strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
          <path d="M0 0 L75 53 L150 0" fill="none" stroke="rgba(40,28,16,0.08)" strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
        </svg>

        {/* Top flap with its patterned liner on the inside face. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[58%]"
          style={{
            transformOrigin: 'top center',
            transform: opening ? 'rotateX(180deg)' : 'rotateX(0deg)',
            transition: 'transform 560ms cubic-bezier(0.55, 0, 0.3, 1) 120ms',
            transformStyle: 'preserve-3d',
            zIndex: opening ? 0 : 3,
          }}
        >
          {/* The shadow lives on an unclipped wrapper: a filter on the clipped
              triangle itself would be cut away with it. */}
          <div
            className="absolute inset-0"
            style={{
              backfaceVisibility: 'hidden',
              filter: 'drop-shadow(0 1.5px 1.5px rgba(30,20,10,0.22)) drop-shadow(0 6px 10px rgba(30,20,10,0.10))',
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                // Lit from above: the top flap catches a touch more light.
                background: `linear-gradient(180deg, color-mix(in oklab, ${envelope} 88%, white 12%), ${envelope} 85%)`,
                clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
              }}
            />
          </div>
          <div
            className="absolute inset-0 overflow-hidden"
            style={{
              clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
              transform: 'rotateX(180deg)',
              backfaceVisibility: 'hidden',
              background: skin.paper,
              fontSize: '1rem',
            }}
          >
            <LuxePattern templateKey={templateKey} unit="rem" scale={0.5} />
            <div className="absolute inset-0" style={{ backgroundColor: skin.accent, opacity: 0.12 }} />
          </div>
        </div>

        {/* Wax seal — the one control on screen. */}
        <button
          ref={sealRef}
          type="button"
          onClick={open}
          aria-label="Ouvrir l’invitation"
          className="group absolute left-1/2 top-[58%] z-10 h-[5.4rem] w-[5.4rem] rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-4"
          style={{
            opacity: opening ? 0 : 1,
            transform: `translate(-50%, -50%) scale(${opening ? 0.86 : 1})`,
            transition: 'opacity 220ms ease, transform 220ms ease',
            // Ring colour for keyboard focus, in the template's accent.
            ['--tw-ring-color' as string]: skin.accent,
            ['--tw-ring-offset-color' as string]: envelope,
          }}
        >
          <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-[0_3px_4px_rgba(40,10,10,0.35)] transition-transform duration-200 group-hover:scale-[1.04]">
            <defs>
              <radialGradient id={waxId} cx="38%" cy="32%" r="75%">
                <stop offset="0%" stopColor={waxLight} />
                <stop offset="55%" stopColor={skin.accent} />
                <stop offset="100%" stopColor={waxDark} />
              </radialGradient>
            </defs>
            <path d={SEAL_PATH} fill={`url(#${waxId})`} />
            <circle cx="50" cy="50" r="33" fill="none" stroke={waxDark} strokeOpacity="0.55" strokeWidth="1.6" />
            <circle cx="50" cy="50" r="30" fill="none" stroke={waxLight} strokeOpacity="0.45" strokeWidth="0.8" />
          </svg>
          <span
            className="absolute inset-0 flex items-center justify-center font-display text-[1.5rem] italic"
            style={{
              color: waxDark,
              // Pressed into the wax: dark ink with a light lower lip.
              textShadow: `0 1px 0 ${waxLight}, 0 -1px 0 rgba(0,0,0,0.25)`,
            }}
          >
            {initials.length ? initials.join('') : '✦'}
          </span>
        </button>
      </div>

      <p
        className="mt-9 text-sm"
        style={{ color: dark ? 'rgba(255,248,236,0.66)' : 'rgba(43,38,32,0.62)', opacity: opening ? 0 : 1, transition: 'opacity 200ms ease' }}
      >
        Touchez le sceau pour ouvrir
      </p>
    </div>
  )
}
