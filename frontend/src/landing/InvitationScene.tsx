/**
 * The hero's invitation suite in 3D: an ivory envelope with a gold-foil
 * liner and a wax seal, the real invitation card rising out of it, and the
 * guest's reply and access card floating at their own depths.
 *
 * Built with CSS 3D (perspective + preserve-3d) so the invitation stays the
 * real, crisp template component. One requestAnimationFrame loop writes
 * transforms straight to the DOM — no React re-render per frame:
 *   - the pointer tilts the whole suite (eased),
 *   - scrolling through the hero lifts the card out of the envelope.
 * With reduced motion the suite holds one composed, still pose.
 */
import { useEffect, useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'

import { clamp } from './motion.ts'

export interface FloatingChip {
  key: string
  content: ReactNode
  /** Position within the stage, as CSS (percentages of the stage). */
  style: CSSProperties
  /** Depth in px toward the viewer: deeper chips drift more with the tilt. */
  depth: number
}

/** Card offset (as % of stage height) when tucked in, and when lifted out. */
const CARD_TUCKED = 21
const CARD_LIFTED = 2

export function InvitationScene({
  card,
  chips,
  animate,
  label,
}: {
  card: ReactNode
  chips: FloatingChip[]
  animate: boolean
  label: string
}) {
  const stageRef = useRef<HTMLDivElement>(null)
  const suiteRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const sheenRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stage = stageRef.current
    const suite = suiteRef.current
    const cardNode = cardRef.current
    if (!stage || !suite || !cardNode) return undefined

    const pose = { rx: 0, ry: 0, lift: animate ? 0 : 0.55 }
    const target = { rx: 7, ry: -14, lift: pose.lift }
    let entered = !animate
    const apply = () => {
      suite.style.transform = `rotateX(${pose.rx.toFixed(2)}deg) rotateY(${pose.ry.toFixed(2)}deg)`
      const offset = CARD_TUCKED + (CARD_LIFTED - CARD_TUCKED) * pose.lift
      cardNode.style.transform = `translate3d(-50%, ${offset.toFixed(2)}%, 14px) rotateX(${(-4 * pose.lift).toFixed(2)}deg)`
      if (sheenRef.current) {
        sheenRef.current.style.backgroundPosition = `${(50 + pose.ry * 2.4).toFixed(1)}% 50%`
      }
    }

    if (!animate) {
      pose.rx = 7
      pose.ry = -14
      apply()
      return undefined
    }

    // A slow entrance: the suite turns in while the card begins to rise.
    pose.rx = 18
    pose.ry = -34
    apply()
    const enterTimer = window.setTimeout(() => {
      entered = true
    }, 60)

    const onPointer = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      const rect = stage.getBoundingClientRect()
      const x = clamp((event.clientX - rect.left) / rect.width, -0.5, 1.5) - 0.5
      const y = clamp((event.clientY - rect.top) / rect.height, -0.5, 1.5) - 0.5
      target.ry = -14 + x * 22
      target.rx = 7 - y * 14
    }
    const onLeave = () => {
      target.ry = -14
      target.rx = 7
    }
    const readScroll = () => {
      const rect = stage.getBoundingClientRect()
      const viewport = window.innerHeight || 1
      // 0 when the stage sits in view, 1 once it has scrolled half away.
      const progress = clamp((viewport * 0.62 - rect.top) / (viewport * 0.9))
      target.lift = 0.18 + progress * 0.82
    }

    let frame = 0
    const loop = () => {
      frame = requestAnimationFrame(loop)
      if (document.hidden) return
      const ease = entered ? 0.07 : 0
      pose.rx += (target.rx - pose.rx) * ease
      pose.ry += (target.ry - pose.ry) * ease
      pose.lift += (target.lift - pose.lift) * (entered ? 0.08 : 0)
      apply()
    }

    readScroll()
    window.addEventListener('pointermove', onPointer, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    window.addEventListener('scroll', readScroll, { passive: true })
    window.addEventListener('resize', readScroll)
    frame = requestAnimationFrame(loop)
    return () => {
      window.clearTimeout(enterTimer)
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onPointer)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('scroll', readScroll)
      window.removeEventListener('resize', readScroll)
    }
  }, [animate])

  return (
    <div
      ref={stageRef}
      role="group"
      aria-label={label}
      className="relative mx-auto aspect-[4/5] w-full max-w-[30rem] select-none [perspective:1400px]"
    >
      {/* Soft contact shadow on the "table". */}
      <div
        aria-hidden="true"
        className="absolute inset-x-[10%] bottom-[1%] h-[9%] rounded-[50%] bg-black/60 blur-2xl"
      />
      <div ref={suiteRef} className="absolute inset-0 [transform-style:preserve-3d]" style={{ transform: 'rotateX(7deg) rotateY(-14deg)' }}>
        {/* Envelope back panel with its foil liner. */}
        <div
          aria-hidden="true"
          className="absolute left-[5%] top-[46%] h-[50%] w-[90%] rounded-[6px] [transform:translateZ(0px)]"
          style={{
            background: 'linear-gradient(160deg, #EDE3D1 0%, #E1D3BA 100%)',
            boxShadow: '0 30px 60px -20px rgba(0,0,0,0.6)',
          }}
        >
          <div
            className="absolute inset-[5%] rounded-[3px]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, rgba(176,138,69,0.22) 0 2px, transparent 2px 9px), linear-gradient(135deg, #3A1D22, #5E2A33 55%, #3A1D22)',
            }}
          />
        </div>
        {/* Open flap, folded back behind the card. */}
        <div
          aria-hidden="true"
          className="absolute left-[5%] top-[22%] h-[24.5%] w-[90%] origin-bottom [transform:translateZ(-2px)_rotateX(-14deg)]"
          style={{
            clipPath: 'polygon(0 100%, 50% 4%, 100% 100%)',
            background: 'linear-gradient(180deg, #E3D6BF, #EFE6D6)',
          }}
        />

        {/* The real invitation card. */}
        <div
          ref={cardRef}
          className="absolute left-1/2 top-0 w-[72%] [transform-style:preserve-3d]"
          style={{ transform: `translate3d(-50%, ${CARD_TUCKED}%, 14px)` }}
        >
          <div className="overflow-hidden rounded-[3px] shadow-[0_2px_4px_rgba(0,0,0,0.25),0_40px_70px_-30px_rgba(0,0,0,0.85)]">
            {card}
          </div>
        </div>

        {/* Front pocket: covers the card's foot, lit by a moving sheen. */}
        <div
          aria-hidden="true"
          className="absolute left-[5%] top-[46%] h-[50%] w-[90%] [transform:translateZ(26px)]"
          style={{ clipPath: 'polygon(0 0, 50% 46%, 100% 0, 100% 100%, 0 100%)' }}
        >
          <div className="absolute inset-0" style={{ background: 'linear-gradient(170deg, #F4ECDD 0%, #E8DCC6 60%, #DCCDB2 100%)' }} />
          <div
            ref={sheenRef}
            className="absolute inset-0 mix-blend-soft-light"
            style={{
              backgroundImage: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.7) 50%, transparent 70%)',
              backgroundSize: '260% 100%',
              backgroundPosition: '50% 50%',
            }}
          />
          {/* Folded seams from the corners to the point of the V. */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top right, transparent 49.6%, rgba(120,95,60,0.18) 50%, transparent 50.4%), linear-gradient(to top left, transparent 49.6%, rgba(120,95,60,0.18) 50%, transparent 50.4%)' }} />
        </div>

        {/* Wax seal at the point of the V. */}
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-[66%] flex h-[13%] w-[13%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full [transform:translateZ(32px)]"
          style={{
            background: 'radial-gradient(circle at 35% 30%, #B4434F, #7A1F2B 55%, #4E0F19)',
            boxShadow: '0 6px 14px rgba(40,5,10,0.55), inset 0 2px 3px rgba(255,255,255,0.25), inset 0 -3px 6px rgba(0,0,0,0.35)',
          }}
        >
          <span className="font-brand text-[clamp(1rem,3.4vw,1.6rem)] font-semibold leading-none text-[#F3D9A4] [text-shadow:0_1px_1px_rgba(0,0,0,0.45)]">
            M
          </span>
        </div>

        {/* Product chips floating at their own depths. */}
        {chips.map((chip) => (
          <div key={chip.key} className="absolute" style={{ ...chip.style, transform: `translateZ(${chip.depth}px)` }}>
            {chip.content}
          </div>
        ))}
      </div>
    </div>
  )
}
