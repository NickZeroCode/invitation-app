/**
 * The collection as a 3D orbit: the real invitation templates stand on a
 * ring you turn by dragging (mouse or finger), with a horizontal wheel or
 * trackpad swipe, the arrow buttons or the keyboard. Released, the ring
 * glides on and settles facing a card; left alone it drifts slowly.
 *
 * The cards stay a plain list (`ul` / `li`) for assistive tech and tests;
 * 3D is presentation only. One requestAnimationFrame loop writes transforms
 * and visibility straight to the DOM (no React re-render per frame): cards
 * turned away from the viewer are not painted, and those nearer the front
 * are brighter. With reduced motion the ring snaps instead of gliding and
 * never drifts.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

export interface OrbitItem {
  key: string
  name: string
  categoryLabel: string
  description: string
}

const DRIFT = 0.012 // degrees per frame while idle
const FRICTION = 0.93
const DRAG_GAIN = 0.22 // degrees per pixel dragged

function wrap(angle: number): number {
  return ((((angle + 180) % 360) + 360) % 360) - 180
}

export function TemplateOrbit({
  items,
  renderCard,
  animate,
  trackLabel,
  previousLabel,
  nextLabel,
  footer,
}: {
  items: OrbitItem[]
  renderCard: (key: string) => ReactNode
  animate: boolean
  trackLabel: string
  previousLabel: string
  nextLabel: string
  footer?: ReactNode
}) {
  const count = items.length
  const step = 360 / Math.max(1, count)
  const viewportRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLUListElement>(null)
  const state = useRef({ angle: 0, velocity: 0, target: null as number | null, dragging: false, hovered: false, lastX: 0, moved: 0 })
  const [front, setFront] = useState(0)
  const frontRef = useRef(0)

  // The ring's radius keeps neighbouring cards from touching.
  const layout = useCallback(() => {
    const viewport = viewportRef.current
    const ring = ringRef.current
    if (!viewport || !ring) return { radius: 0 }
    const card = Math.min(300, Math.max(180, viewport.clientWidth * 0.26))
    ring.style.setProperty('--card', `${card}px`)
    const radius = count <= 1 ? 0 : Math.max(card * 0.95, ((card + 36) * count) / (2 * Math.PI))
    ring.style.setProperty('--radius', `${radius}px`)
    return { radius }
  }, [count])

  const render = useCallback(() => {
    const ring = ringRef.current
    if (!ring) return
    const { angle } = state.current
    ring.style.transform = `translateZ(calc(var(--radius) * -1)) rotateY(${angle.toFixed(3)}deg)`
    const children = ring.children
    for (let index = 0; index < children.length; index += 1) {
      const element = children[index] as HTMLElement
      const world = wrap(index * step + angle)
      const facing = Math.cos((world * Math.PI) / 180)
      // Hidden once turned more than ~100° away: never painted, never focused.
      const shown = count <= 1 || facing > -0.17
      element.style.visibility = shown ? 'visible' : 'hidden'
      element.style.opacity = shown ? String(0.35 + 0.65 * Math.max(0, facing) ** 1.5) : '0'
    }
    const nearest = ((Math.round(-angle / step) % count) + count) % count
    if (nearest !== frontRef.current) {
      frontRef.current = nearest
      setFront(nearest)
    }
  }, [count, step])

  // Re-layout and face the first card whenever the set changes (filters).
  useEffect(() => {
    state.current.angle = 0
    state.current.velocity = 0
    state.current.target = null
    frontRef.current = -1
    layout()
    render()
    const viewport = viewportRef.current
    if (!viewport || typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(() => {
      layout()
      render()
    })
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [items, layout, render])

  // The motion loop: glide, settle, drift.
  useEffect(() => {
    if (count <= 1) return undefined
    let frame = 0
    let visible = true
    const viewport = viewportRef.current
    const observer =
      viewport && typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(([entry]) => {
            visible = entry?.isIntersecting ?? true
          })
        : null
    if (viewport) observer?.observe(viewport)
    const loop = () => {
      frame = requestAnimationFrame(loop)
      if (!visible || document.hidden) return
      const s = state.current
      if (s.dragging) return
      if (s.target !== null) {
        const delta = s.target - s.angle
        if (!animate || Math.abs(delta) < 0.05) {
          s.angle = s.target
          s.target = null
        } else {
          s.angle += delta * 0.12
        }
      } else if (Math.abs(s.velocity) > 0.02) {
        s.angle += s.velocity
        s.velocity *= FRICTION
        if (Math.abs(s.velocity) <= 0.02) {
          s.velocity = 0
          s.target = Math.round(s.angle / step) * step
        }
      } else if (animate && !s.hovered) {
        s.angle -= DRIFT
      } else {
        return
      }
      render()
    }
    frame = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(frame)
      observer?.disconnect()
    }
  }, [animate, count, render, step])

  const turn = (cards: number) => {
    const s = state.current
    s.velocity = 0
    const base = s.target ?? Math.round(s.angle / step) * step
    s.target = base - cards * step
    if (!animate) {
      s.angle = s.target
      s.target = null
      render()
    }
  }

  const faceCard = (index: number) => {
    const s = state.current
    const current = Math.round(-s.angle / step)
    const offset = wrap((index - (((current % count) + count) % count)) * step) / step
    turn(Math.round(offset))
  }

  return (
    <div className="relative">
      <div
        ref={viewportRef}
        tabIndex={0}
        aria-roledescription="carrousel"
        aria-label={trackLabel}
        className="relative h-[29rem] cursor-grab touch-pan-y select-none overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 active:cursor-grabbing sm:h-[33rem] lg:h-[37rem] [perspective:1500px]"
        onPointerEnter={() => {
          state.current.hovered = true
        }}
        onPointerLeave={() => {
          state.current.hovered = false
        }}
        onPointerDown={(event) => {
          if (count <= 1) return
          const s = state.current
          s.dragging = true
          s.velocity = 0
          s.target = null
          s.lastX = event.clientX
          s.moved = 0
          event.currentTarget.setPointerCapture?.(event.pointerId)
        }}
        onPointerMove={(event) => {
          const s = state.current
          if (!s.dragging) return
          const dx = event.clientX - s.lastX
          s.lastX = event.clientX
          s.moved += Math.abs(dx)
          s.angle += dx * DRAG_GAIN
          s.velocity = dx * DRAG_GAIN
          render()
        }}
        onPointerUp={() => {
          const s = state.current
          s.dragging = false
          if (!animate) {
            s.velocity = 0
            s.target = Math.round(s.angle / step) * step
            s.angle = s.target
            s.target = null
            render()
          }
        }}
        onPointerCancel={() => {
          state.current.dragging = false
        }}
        onWheel={(event) => {
          // Horizontal wheels and trackpad swipes turn the ring; vertical
          // scrolling stays the page's.
          if (count <= 1 || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return
          const s = state.current
          s.target = null
          s.velocity = -event.deltaX * 0.03
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') {
            event.preventDefault()
            turn(1)
          } else if (event.key === 'ArrowLeft') {
            event.preventDefault()
            turn(-1)
          }
        }}
      >
        {/* A floor of light the ring stands on. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-[8%] bottom-[6%] h-24 rounded-[50%] bg-[radial-gradient(closest-side,rgba(176,138,69,0.22),transparent)] blur-md" />
        <ul
          ref={ringRef}
          aria-label={trackLabel}
          className="absolute left-1/2 top-[45%] [transform-style:preserve-3d]"
          style={{ ['--card' as string]: '240px', ['--radius' as string]: '0px' }}
        >
          {items.map((item, index) => (
            <li
              key={item.key}
              className="absolute w-[var(--card)] [backface-visibility:hidden] [transform-style:preserve-3d]"
              style={{
                transform: `translate(-50%, -50%) rotateY(${index * step}deg) translateZ(var(--radius))`,
              }}
              onClick={() => {
                if (state.current.moved < 6 && index !== frontRef.current) faceCard(index)
              }}
            >
              <div className="overflow-hidden rounded-[4px] shadow-[0_2px_4px_rgba(26,24,21,0.12),0_40px_60px_-30px_rgba(26,24,21,0.55)]">
                {renderCard(item.key)}
              </div>
              <p className="mt-3 text-center font-brand text-[1.25rem] font-semibold leading-tight text-ink">{item.name}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* The card facing the viewer, described in words. */}
      <div className="mt-2 flex flex-col items-start gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div aria-live="polite" className="min-h-[4.5rem] max-w-[34rem]">
          {items[front] ? (
            <>
              <p className="font-label text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-brand">
                {String(front + 1).padStart(2, '0')} / {String(count).padStart(2, '0')} · {items[front].categoryLabel}
              </p>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">{items[front].description}</p>
            </>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => turn(-1)}
            disabled={count <= 1}
            aria-label={previousLabel}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-line-strong bg-surface text-ink transition-colors hover:border-ink disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <span aria-hidden="true" className="text-lg">←</span>
          </button>
          <button
            type="button"
            onClick={() => turn(1)}
            disabled={count <= 1}
            aria-label={nextLabel}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-ink bg-ink text-white transition-colors hover:bg-ink/85 disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <span aria-hidden="true" className="text-lg">→</span>
          </button>
          {footer}
        </div>
      </div>
    </div>
  )
}
