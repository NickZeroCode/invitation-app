/**
 * The hero's invitation, photographed as a still life: the real invitation
 * card lying on a stone table with its open envelope, the guest's printed
 * access card and a wax seal, in soft window light.
 *
 * What makes it read as real rather than as a render:
 *  - the table is seen from above at an angle (CSS 3D), so every object
 *    sits ON a surface, foreshortened like a photograph of a desk;
 *  - each object casts two shadows — a tight contact shadow and a soft cast
 *    shadow thrown away from the window — and the card's edge shows its
 *    thickness;
 *  - paper carries a fine fibre grain;
 *  - window-light shadows (mullions and leaves) fall across everything and
 *    drift slowly, as daylight does.
 * The pointer turns the table a little; scrolling lifts the card, and its
 * shadow softens and moves away as a lifted card's would. One
 * requestAnimationFrame loop writes transforms straight to the DOM. With
 * reduced motion the scene holds one composed, still pose.
 */
import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

import { clamp } from './motion.ts'

/** Light comes from the upper left of the table: shadows fall down and right. */
const SHADOW = { x: 16, y: 22 }

function Shadows({ lift = 0 }: { lift?: number }) {
  // Contact (tight, dark) + cast (soft, offset). `lift` is applied live by the loop.
  return (
    <>
      <span
        aria-hidden="true"
        data-cast
        className="absolute inset-0 rounded-[3px] bg-[rgba(52,40,28,0.30)]"
        style={{ transform: `translate(${SHADOW.x * (1 + lift)}px, ${SHADOW.y * (1 + lift)}px)`, filter: 'blur(14px)' }}
      />
      <span aria-hidden="true" className="absolute inset-0 rounded-[3px] bg-[rgba(40,30,20,0.38)]" style={{ transform: 'translate(1px, 2px)', filter: 'blur(1.5px)' }} />
    </>
  )
}

/**
 * Window light: blurred mullions and a few leaves, multiplied over the
 * room. Placed on the whole hero (not just the table) so it never shows an
 * edge; the hero fades it out toward the copy.
 */
export function WindowLight({ animate }: { animate: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 400"
      preserveAspectRatio="xMidYMid slice"
      className={`pointer-events-none absolute -left-[15%] -top-[15%] h-[130%] w-[130%] ${animate ? 'animate-[window-drift_38s_ease-in-out_infinite_alternate]' : ''}`}
    >
      <defs>
        <filter id="still-life-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      <g filter="url(#still-life-soft)" fill="#5d5145">
        {/* The window frame: two broad diagonal bands and a crossbar. */}
        <path d="M-40 150 L440 40 L440 78 L-40 188 Z" />
        <path d="M-40 290 L440 180 L440 210 L-40 320 Z" />
        <path d="M150 -40 L210 -40 L330 440 L270 440 Z" />
        {/* Leaves from a plant outside. */}
        <ellipse cx="70" cy="70" rx="46" ry="16" transform="rotate(-32 70 70)" />
        <ellipse cx="110" cy="40" rx="38" ry="12" transform="rotate(18 110 40)" />
        <ellipse cx="40" cy="120" rx="34" ry="11" transform="rotate(-62 40 120)" />
        <ellipse cx="350" cy="350" rx="44" ry="14" transform="rotate(30 350 350)" />
      </g>
    </svg>
  )
}

export function StillLife({
  card,
  accessCard,
  animate,
  label,
}: {
  /** The real invitation (template component). */
  card: ReactNode
  /** Contents of the printed access card. */
  accessCard: ReactNode
  animate: boolean
  label: string
}) {
  const stageRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stage = stageRef.current
    const table = tableRef.current
    const cardNode = cardRef.current
    if (!stage || !table || !cardNode) return undefined
    const cast = cardNode.querySelector<HTMLElement>('[data-cast]')

    const pose = { rx: 36, rz: -8, lift: animate ? 0 : 0.3 }
    const target = { rx: 36, rz: -8, lift: pose.lift }
    const apply = () => {
      table.style.transform = `rotateX(${pose.rx.toFixed(2)}deg) rotateZ(${pose.rz.toFixed(2)}deg)`
      cardNode.style.transform = `translateZ(${(4 + pose.lift * 46).toFixed(1)}px) rotateZ(${(5 - pose.lift * 3).toFixed(2)}deg) rotateX(${(-pose.lift * 6).toFixed(2)}deg)`
      if (cast) {
        const k = 1 + pose.lift * 2.4
        cast.style.transform = `translate(${(SHADOW.x * k).toFixed(1)}px, ${(SHADOW.y * k).toFixed(1)}px)`
        cast.style.filter = `blur(${(14 + pose.lift * 16).toFixed(1)}px)`
        cast.style.opacity = (1 - pose.lift * 0.35).toFixed(3)
      }
    }
    apply()
    if (!animate) return undefined

    const onPointer = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      const x = event.clientX / window.innerWidth - 0.5
      const y = event.clientY / window.innerHeight - 0.5
      target.rz = -8 + x * 6
      target.rx = 36 - y * 6
    }
    const readScroll = () => {
      const rect = stage.getBoundingClientRect()
      const viewport = window.innerHeight || 1
      target.lift = clamp((viewport * 0.55 - rect.top) / (viewport * 1.1))
    }
    let frame = 0
    const loop = () => {
      frame = requestAnimationFrame(loop)
      if (document.hidden) return
      pose.rx += (target.rx - pose.rx) * 0.06
      pose.rz += (target.rz - pose.rz) * 0.06
      pose.lift += (target.lift - pose.lift) * 0.08
      apply()
    }
    readScroll()
    window.addEventListener('pointermove', onPointer, { passive: true })
    window.addEventListener('scroll', readScroll, { passive: true })
    window.addEventListener('resize', readScroll)
    frame = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('scroll', readScroll)
      window.removeEventListener('resize', readScroll)
    }
  }, [animate])

  return (
    <div ref={stageRef} role="group" aria-label={label} className="relative aspect-[1/1] w-full select-none [perspective:1700px] [perspective-origin:50%_30%]">
      <div ref={tableRef} className="absolute inset-[2%] [transform-style:preserve-3d]" style={{ transform: 'rotateX(36deg) rotateZ(-8deg)' }}>
        {/* The envelope, lying open: its flap folded back shows the liner. */}
        <div className="absolute left-[-8%] top-[52%] h-[44%] w-[78%] [transform-style:preserve-3d] [transform:translateZ(1px)_rotateZ(-6deg)]">
          <Shadows />
          <div className="paper-grain absolute inset-0 rounded-[3px] bg-[#F7F3EC]" />
          {/* Folded seams of the back. */}
          <svg aria-hidden="true" viewBox="0 0 100 60" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
            <path d="M0 60 L50 26 L100 60" fill="none" stroke="rgba(90,74,56,0.18)" strokeWidth="0.35" />
            <path d="M0 0 L38 32 M100 0 L62 32" fill="none" stroke="rgba(90,74,56,0.12)" strokeWidth="0.3" />
          </svg>
          {/* The open flap, lying flat above the envelope: its inside is the liner. */}
          <div className="absolute bottom-full left-0 h-[62%] w-full" style={{ clipPath: 'polygon(0 100%, 50% 0, 100% 100%)' }}>
            <div className="paper-grain absolute inset-0 bg-[#EFE9DF]" />
            <div
              className="absolute inset-[7%_9%_0]"
              style={{
                clipPath: 'polygon(0 100%, 50% 4%, 100% 100%)',
                backgroundColor: '#1b1d21',
                backgroundImage: 'repeating-linear-gradient(60deg, rgba(236,228,214,0.16) 0 1px, transparent 1px 9px), repeating-linear-gradient(-60deg, rgba(236,228,214,0.16) 0 1px, transparent 1px 9px)',
              }}
            />
          </div>
          {/* Wax seal, pressed where the flap meets the envelope. */}
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-[-6%] flex aspect-square w-[15%] -translate-x-1/2 items-center justify-center rounded-full [transform:translateZ(3px)]"
            style={{
              background: 'radial-gradient(circle at 38% 34%, #d65a40 0%, #c8432b 42%, #9e2f1c 100%)',
              boxShadow: '2px 3px 3px rgba(60,20,10,0.35), inset 0 0 0 0.35em rgba(120,30,16,0.35), inset 1px 1px 2px rgba(255,220,200,0.35)',
            }}
          >
            <span className="text-[clamp(0.85rem,1.6vw,1.25rem)] font-medium leading-none text-[#f6d9cf] [text-shadow:-1px_-1px_0_rgba(90,20,10,0.55)]">M</span>
          </span>
        </div>

        {/* The printed access card. */}
        <div className="absolute left-[64%] top-[62%] w-[29%] [transform-style:preserve-3d] [transform:translateZ(2px)_rotateZ(-13deg)]">
          <Shadows />
          <div className="paper-grain relative rounded-[3px] bg-[#FBF9F5] shadow-[0_1px_0_#e4ddd1,0_2px_0_#d8d0c2]">{accessCard}</div>
        </div>

        {/* The invitation itself, on top — it lifts as you scroll. */}
        <div ref={cardRef} className="absolute left-[28%] top-[-10%] w-[56%] [transform-style:preserve-3d]" style={{ transform: 'translateZ(4px) rotateZ(5deg)' }}>
          <Shadows />
          <div className="relative overflow-hidden rounded-[2px] shadow-[0_1px_0_#e9e3d8,0_2px_0_#ded6c9,0_3px_0_#d2c9ba]">
            {card}
            <span aria-hidden="true" className="paper-grain pointer-events-none absolute inset-0" />
          </div>
        </div>

      </div>
    </div>
  )
}
