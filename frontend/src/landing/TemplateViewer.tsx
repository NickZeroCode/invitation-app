/**
 * A template, held in the hand. The invitation opens over a dark room as a
 * physical card in 3D: drag it (mouse or finger) to turn it, let go and it
 * settles on its face or on its back — an ivory verso sealed with the house
 * monogram. Left alone it breathes slightly. Flat colour, no sheen: the
 * depth is the card's own turn and shadow. Arrows and the keyboard move through the
 * collection; Escape closes.
 *
 * A modal dialog: focus moves in, stays in, and returns to the card that
 * opened it. One requestAnimationFrame loop writes the card's transform; with
 * reduced motion the card turns only when asked and never sways.
 */
import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import type { GalleryItem } from './TemplateGallery.tsx'

export interface ViewerLabels {
  dialog: string
  close: string
  previous: string
  next: string
  flip: string
  drag: string
  customize: string
  verso: string
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function TemplateViewer({
  items,
  index,
  onIndex,
  onClose,
  renderCard,
  animate,
  brand,
  labels,
}: {
  items: GalleryItem[]
  index: number
  onIndex: (index: number) => void
  onClose: () => void
  renderCard: (key: string) => ReactNode
  animate: boolean
  brand: string
  labels: ViewerLabels
}) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const shadowRef = useRef<HTMLDivElement>(null)
  const spin = useRef({ ry: 0, rx: 0, velocity: 0, dragging: false, lastX: 0, lastY: 0, target: 0 as number | null })
  const item = items[index]
  const count = items.length
  const go = (step: number) => onIndex((index + step + count) % count)

  // Modal behaviour: focus in, focus trapped, page scroll locked, focus back.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
      opener?.focus?.({ preventScroll: true })
    }
  }, [])

  // Each template arrives with a little turn, as if laid down on the table.
  useEffect(() => {
    const s = spin.current
    s.velocity = 0
    s.ry = animate ? -32 : 0
    s.rx = animate ? 8 : 0
    s.target = 0
  }, [index, animate])

  useEffect(() => {
    const card = cardRef.current
    if (!card) return undefined
    const s = spin.current
    const apply = (time: number) => {
      const sway = animate && !s.dragging && s.target === null ? Math.sin(time / 1400) * 5 : 0
      const ry = s.ry + sway
      const rx = s.rx + (animate && !s.dragging ? Math.sin(time / 1900) * 2 : 0)
      card.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`
      const facing = Math.abs(Math.cos((ry * Math.PI) / 180))
      if (shadowRef.current) shadowRef.current.style.transform = `scaleX(${(0.35 + 0.65 * facing).toFixed(3)})`
    }
    let frame = 0
    const loop = (time: number) => {
      frame = requestAnimationFrame(loop)
      if (!s.dragging) {
        if (s.target !== null) {
          const delta = s.target - s.ry
          if (!animate || Math.abs(delta) < 0.05) {
            s.ry = s.target
            s.target = null
          } else {
            s.ry += delta * 0.1
          }
        } else if (Math.abs(s.velocity) > 0.05) {
          s.ry += s.velocity
          s.velocity *= 0.93
        } else if (s.velocity !== 0) {
          s.velocity = 0
          // Settle on whichever side is nearer: the face, or the verso.
          s.target = Math.round(s.ry / 180) * 180
        }
        s.rx += (0 - s.rx) * 0.08
      }
      apply(time)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [animate])

  const flip = () => {
    const s = spin.current
    s.velocity = 0
    const base = Math.round((s.target ?? s.ry) / 180) * 180
    s.target = base + 180
  }

  if (!item) return null

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="theme-seal fixed inset-0 z-50 overflow-y-auto bg-paper text-ink animate-fade-up"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation()
          onClose()
        } else if (event.key === 'ArrowRight' && count > 1) {
          go(1)
        } else if (event.key === 'ArrowLeft' && count > 1) {
          go(-1)
        } else if (event.key === 'Tab') {
          const nodes = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
          if (nodes.length === 0) return
          const first = nodes[0]
          const last = nodes[nodes.length - 1]
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault()
            last.focus()
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault()
            first.focus()
          }
        }
      }}
    >

      <div className="relative mx-auto grid min-h-full w-full max-w-[84rem] items-center gap-8 px-5 pb-10 pt-20 sm:px-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-14 lg:px-14 lg:py-16">
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={labels.close}
          className="fixed right-4 top-4 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-line-strong bg-paper text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink sm:right-6 sm:top-6"
        >
          <span aria-hidden="true" className="relative block h-4 w-4">
            <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 rotate-45 bg-current" />
            <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 -rotate-45 bg-current" />
          </span>
        </button>

        {/* The card, in the hand. */}
        <div
          className="relative flex touch-none select-none items-center justify-center py-6 [perspective:1800px] cursor-grab active:cursor-grabbing"
          onPointerDown={(event) => {
            const s = spin.current
            s.dragging = true
            s.velocity = 0
            s.target = null
            s.lastX = event.clientX
            s.lastY = event.clientY
            event.currentTarget.setPointerCapture?.(event.pointerId)
          }}
          onPointerMove={(event) => {
            const s = spin.current
            if (!s.dragging) return
            const dx = event.clientX - s.lastX
            const dy = event.clientY - s.lastY
            s.lastX = event.clientX
            s.lastY = event.clientY
            s.ry += dx * 0.45
            s.rx = Math.max(-22, Math.min(22, s.rx - dy * 0.25))
            s.velocity = dx * 0.45
          }}
          onPointerUp={() => {
            const s = spin.current
            s.dragging = false
            if (!animate || Math.abs(s.velocity) <= 0.05) {
              s.velocity = 0
              s.target = Math.round(s.ry / 180) * 180
            }
          }}
          onPointerCancel={() => {
            spin.current.dragging = false
            spin.current.target = Math.round(spin.current.ry / 180) * 180
          }}
        >
          <div
            ref={shadowRef}
            aria-hidden="true"
            className="absolute bottom-0 left-1/2 h-10 w-[min(70vw,26rem)] -translate-x-1/2 rounded-[50%] bg-black/35 blur-2xl"
          />
          <div
            ref={cardRef}
            className="relative aspect-[3/4] w-[min(80vw,calc(60svh*0.75),30rem)] [transform-style:preserve-3d] lg:w-[min(40vw,calc(76svh*0.75),32rem)]"
          >
            {/* Recto: the real invitation. */}
            <div className="absolute inset-0 overflow-hidden rounded-[4px] shadow-[0_2px_8px_rgba(0,0,0,0.4),0_60px_100px_-40px_rgba(0,0,0,0.95)] [backface-visibility:hidden]">
              {renderCard(item.key)}
            </div>
            {/* Verso: ivory stock, the house seal. */}
            <div
              aria-hidden="true"
              className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-[4px] [backface-visibility:hidden] [transform:rotateY(180deg)]"
              style={{
                background: '#F3EFE7',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4), 0 60px 100px -40px rgba(0,0,0,0.95)',
              }}
            >
              <span className="absolute inset-[5%] rounded-[2px] border border-[#0E5A43]/30" />
              <span
                className="flex h-[22%] w-[29%] items-center justify-center rounded-full"
                style={{
                  background: '#C8432B',
                  boxShadow: '0 8px 16px -4px rgba(60,12,4,0.45), inset 0 0 0 5px #A9351F',
                }}
              >
                <span className="font-brand text-[clamp(1.75rem,5vw,3rem)] leading-none text-[#F5F2EC]">M</span>
              </span>
              <span className="mt-[8%] font-label text-[clamp(0.5rem,1.2vw,0.6875rem)] font-semibold uppercase tracking-[0.4em] text-[#0E5A43]">{brand}</span>
              <span className="mt-2 font-brand text-[clamp(1rem,2.4vw,1.5rem)] text-[#0F1714]">{item.name}</span>
              <span className="absolute bottom-[8%] font-label text-[clamp(0.5rem,1vw,0.625rem)] uppercase tracking-[0.3em] text-[#848C87]">{labels.verso}</span>
            </div>
          </div>
        </div>

        {/* The label beside the piece. */}
        <div className="relative max-w-[30rem]">
          <p className="flex items-baseline gap-3">
            <span className="statement text-[3.5rem] text-ink sm:text-[4.5rem]">{String(index + 1).padStart(2, '0')}</span>
            <span className="font-label text-[0.6875rem] font-semibold tracking-[0.2em] text-ink-faint">/ {String(count).padStart(2, '0')}</span>
          </p>
          <p className="mark-label mt-6 text-ink-soft">{item.categoryLabel}</p>
          <h2 id={titleId} className="mt-3 font-brand text-[2.75rem] uppercase leading-[0.98] tracking-[0.005em] text-ink sm:text-[3.75rem]">
            {item.name}
          </h2>
          <p className="sr-only">{labels.dialog}</p>
          <p className="mt-5 text-[1rem] leading-relaxed text-ink-soft">{item.description}</p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              to="/inscription"
              className="group inline-flex h-[3.25rem] items-center gap-3 rounded-full bg-malachite pl-6 pr-2 text-[0.9375rem] font-semibold text-jade transition-colors hover:bg-malachite-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
            >
              {labels.customize}
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-jade text-malachite transition-transform group-hover:translate-x-0.5">
                <span aria-hidden="true">→</span>
              </span>
            </Link>
            <button
              type="button"
              onClick={flip}
              className="inline-flex h-[3.25rem] items-center rounded-full border border-line-strong px-5 text-[0.875rem] font-medium text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
            >
              {labels.flip}
            </button>
          </div>

          <div className="mt-10 flex items-center justify-between gap-4 border-t border-line pt-6">
            <p className="text-[0.8125rem] text-ink-faint">{labels.drag}</p>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => go(-1)}
                disabled={count <= 1}
                aria-label={labels.previous}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-line-strong text-ink transition-colors hover:border-ink disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
              >
                <span aria-hidden="true">←</span>
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                disabled={count <= 1}
                aria-label={labels.next}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-malachite text-jade transition-colors hover:bg-malachite-deep disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
              >
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
