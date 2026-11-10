/**
 * The collection as a flight through space. The section is tall; while it
 * scrolls past, a sticky stage stays on screen and the camera travels down a
 * corridor of real invitation templates: each one emerges from the dark on
 * alternating sides, glides to the centre as it reaches you, then flies past
 * over your shoulder. The pointer leans the whole world a little.
 *
 * Scrolling is the page's own (no scroll hijacking): the corridor only reads
 * how far the section has travelled. One requestAnimationFrame loop eases
 * toward that position and writes transforms straight to the DOM; cards far
 * away or behind the camera are not painted. The cards stay a plain list of
 * buttons (`ul` / `li`) for keyboard and assistive tech: focusing one brings
 * it to the centre, activating it opens the 3D viewer.
 *
 * Without rich motion (reduced motion, data saver, low-end device) the same
 * list is laid out as a calm grid.
 */
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import { clamp } from './motion.ts'

export interface GalleryItem {
  key: string
  name: string
  categoryLabel: string
  description: string
}

/** Depth between two cards, in px. */
const GAP = 620
/** Scroll distance per card, in small-viewport heights. */
const SCROLL_PER_CARD = 34

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

export function TemplateGallery({
  items,
  renderCard,
  animate,
  trackLabel,
  openLabel,
  detailLabel,
  scrollHint,
  backdropWord,
  cursorLabel,
  filters,
  onOpen,
}: {
  items: GalleryItem[]
  renderCard: (key: string) => ReactNode
  animate: boolean
  trackLabel: string
  /** Accessible name of a card's button; `{name}` is replaced. */
  openLabel: string
  detailLabel: string
  scrollHint: string
  backdropWord: string
  /** Shown beside the pointer over the card facing the viewer (desktop). */
  cursorLabel: string
  filters?: ReactNode
  onOpen: (index: number) => void
}) {
  const count = items.length
  const runwayRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<HTMLUListElement>(null)
  const progressRef = useRef<HTMLSpanElement>(null)
  const wordRef = useRef<HTMLParagraphElement>(null)
  const cursorRef = useRef<HTMLSpanElement>(null)
  const [front, setFront] = useState(0)
  const frontRef = useRef(0)

  // Where the page must be scrolled for card `index` to face the viewer.
  const scrollTopFor = (index: number): number | null => {
    const runway = runwayRef.current
    if (!runway) return null
    const top = runway.getBoundingClientRect().top + window.scrollY
    const travel = Math.max(0, runway.offsetHeight - window.innerHeight)
    return top + (count > 1 ? (index / (count - 1)) * travel : 0)
  }

  // A new set (filters): if the visitor is inside the corridor, start it over.
  const firstSet = useRef(true)
  useEffect(() => {
    if (firstSet.current) {
      firstSet.current = false
      return
    }
    frontRef.current = 0
    setFront(0)
    const runway = runwayRef.current
    if (!animate || !runway) return
    if (runway.getBoundingClientRect().top < 0) {
      const top = scrollTopFor(0)
      if (top !== null) window.scrollTo({ top })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  useEffect(() => {
    if (!animate) return undefined
    const runway = runwayRef.current
    const stage = stageRef.current
    const world = worldRef.current
    if (!runway || !stage || !world) return undefined

    let visible = typeof IntersectionObserver === 'undefined'
    const observer =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(
            ([entry]) => {
              visible = entry?.isIntersecting ?? true
            },
            { rootMargin: '200px 0px' },
          )
    observer?.observe(runway)

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 }
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      pointer.tx = event.clientX / window.innerWidth - 0.5
      pointer.ty = event.clientY / window.innerHeight - 0.5
    }
    window.addEventListener('pointermove', onPointer, { passive: true })

    const readTarget = () => {
      const rect = runway.getBoundingClientRect()
      const travel = Math.max(1, rect.height - window.innerHeight)
      return clamp(-rect.top / travel) * Math.max(0, count - 1)
    }
    let current = readTarget()
    let written = ''

    const write = () => {
      const width = stage.clientWidth
      const height = stage.clientHeight
      const narrow = width < 640
      const spread = narrow ? width * 0.3 : Math.min(width * 0.25, 380)
      const cards = world.children
      for (let index = 0; index < cards.length; index += 1) {
        const card = cards[index] as HTMLElement
        const u = index - current // > 0: still ahead, < 0: already passed
        const ahead = Math.max(0, u)
        const past = Math.max(0, -u)
        const side = index % 2 === 0 ? -1 : 1
        const lane = Math.min(1, ahead)
        const x = side * spread * (lane + past * 3.2)
        const lift = ((((index * 53) % 5) - 2) / 2) * height * 0.05
        const y = lift * lane - past * height * 0.08
        const z = -u * GAP
        const rotateY = -side * 26 * lane + side * 22 * Math.min(1, past)
        const rotateZ = side * 2.5 * lane
        let opacity = clamp((7.5 - ahead) / 2.5) * clamp(1 - past * 2.6)
        if (count === 1) opacity = 1
        const shown = opacity > 0.01
        // Far or passed cards are not painted, but their buttons stay in the
        // keyboard and screen-reader path (focusing one flies to it).
        card.dataset.far = shown ? 'false' : 'true'
        if (!shown) continue
        card.style.opacity = opacity.toFixed(3)
        card.style.transform = `translate3d(calc(-50% + ${x.toFixed(1)}px), calc(-50% + ${y.toFixed(1)}px), ${z.toFixed(1)}px) rotateY(${rotateY.toFixed(2)}deg) rotateZ(${rotateZ.toFixed(2)}deg)`
        // Only the card facing the viewer can be clicked; the rest are scenery.
        card.style.pointerEvents = Math.abs(u) < 0.5 ? 'auto' : 'none'
      }
      world.style.transform = `rotateX(${(-pointer.y * 5).toFixed(2)}deg) rotateY(${(pointer.x * 7).toFixed(2)}deg)`
      const progress = count > 1 ? current / (count - 1) : 1
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress.toFixed(4)})`
      if (wordRef.current) wordRef.current.style.transform = `translate3d(${(-progress * 18).toFixed(2)}%, 0, 0)`
      const nearest = Math.min(count - 1, Math.max(0, Math.round(current)))
      if (nearest !== frontRef.current) {
        frontRef.current = nearest
        setFront(nearest)
      }
    }

    let frame = 0
    const loop = () => {
      frame = requestAnimationFrame(loop)
      if (!visible || document.hidden) return
      const target = readTarget()
      current += (target - current) * 0.09
      if (Math.abs(target - current) < 0.0005) current = target
      pointer.x += (pointer.tx - pointer.x) * 0.05
      pointer.y += (pointer.ty - pointer.y) * 0.05
      const key = `${current.toFixed(4)}|${pointer.x.toFixed(3)}|${pointer.y.toFixed(3)}|${stage.clientWidth}`
      if (key === written) return
      written = key
      write()
    }
    write()
    frame = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(frame)
      observer?.disconnect()
      window.removeEventListener('pointermove', onPointer)
    }
  }, [animate, count, items])

  const cardButton = (item: GalleryItem, index: number, className: string) => (
    <button
      type="button"
      aria-label={openLabel.replace('{name}', item.name)}
      onClick={() => onOpen(index)}
      onFocus={() => {
        if (!animate) return
        const top = scrollTopFor(index)
        if (top !== null && Math.abs(window.scrollY - top) > 4) window.scrollTo({ top })
      }}
      className={`group block w-full rounded-[4px] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jade focus-visible:ring-offset-4 focus-visible:ring-offset-malachite ${className}`}
    >
      <span className="corridor-face block overflow-hidden rounded-[3px] shadow-[0_2px_6px_rgba(0,0,0,0.35),0_50px_80px_-30px_rgba(0,0,0,0.9)]">
        {renderCard(item.key)}
      </span>
    </button>
  )

  /* ---------------------------------------------------- calm grid (still) */
  if (!animate) {
    return (
      <div className="mx-auto w-full max-w-[76rem] px-5 pb-6 sm:px-8 lg:px-10">
        {filters}
        <ul aria-label={trackLabel} className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
          {items.map((item, index) => (
            <li key={item.key}>
              {cardButton(item, index, 'transition-transform duration-300 hover:-translate-y-1')}
              <p className="mt-4 font-brand text-[1.125rem] leading-tight text-ink">{item.name}</p>
              <p className="mt-1 font-label text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-ink-faint">{item.categoryLabel}</p>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  /* ------------------------------------------------------ the 3D corridor */
  const current = items[front]
  return (
    <div
      ref={runwayRef}
      className="relative"
      style={{ height: `calc(100svh + ${Math.max(0, count - 1) * SCROLL_PER_CARD}svh)` }}
    >
      <div
        className="sticky top-0 h-[100svh] overflow-hidden"
        onPointerMove={(event) => {
          const cursor = cursorRef.current
          if (!cursor || event.pointerType !== 'mouse') return
          const card = (event.target as Element).closest('.corridor-card') as HTMLElement | null
          const over = Boolean(card && card.style.pointerEvents === 'auto')
          const rect = event.currentTarget.getBoundingClientRect()
          cursor.style.transform = `translate3d(${event.clientX - rect.left}px, ${event.clientY - rect.top}px, 0) translate(-50%, -50%) scale(${over ? 1 : 0})`
        }}
        onPointerLeave={() => {
          if (cursorRef.current) cursorRef.current.style.transform += ' scale(0)'
        }}
      >
        {/* The collection's name, set far behind in a tone of the ground itself. */}
        <p
          ref={wordRef}
          aria-hidden="true"
          className="pointer-events-none absolute left-[4%] top-1/2 -translate-y-1/2 statement whitespace-nowrap text-[clamp(6rem,21vw,20rem)] text-[#111318]"
        >
          {backdropWord}
        </p>

        <div ref={stageRef} className="absolute inset-0 [perspective:1100px] [perspective-origin:50%_44%]">
          <ul ref={worldRef} aria-label={trackLabel} className="absolute left-1/2 top-[44%] [transform-style:preserve-3d]">
            {items.map((item, index) => (
              <li
                key={item.key}
                data-far={index < 6 ? 'false' : 'true'}
                className="corridor-card absolute left-0 top-0 w-[min(58vw,calc(44svh*0.75),16rem)] sm:w-[min(26vw,calc(46svh*0.75),23rem)] [backface-visibility:hidden] will-change-transform"
              >
                {cardButton(item, index, '[@media(pointer:fine)]:cursor-none')}
                <p className="corridor-name mt-4 text-center font-brand text-[1rem] text-ink-soft sm:text-[1.0625rem]">{item.name}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* A lime disc names the action under the pointer: open this card. */}
        <span
          ref={cursorRef}
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 z-20 flex h-20 w-20 items-center justify-center rounded-full bg-brand mark-label text-paper transition-transform duration-300 ease-out"
          style={{ transform: 'scale(0)' }}
        >
          {cursorLabel}
        </span>

        {/* Filters ride along at the top of the stage. */}
        {filters ? (
          <div className="absolute inset-x-0 top-[5.25rem] z-10 sm:top-[6.5rem]">
            <div className="mx-auto w-full max-w-[84rem] px-5 sm:px-10 lg:px-14">{filters}</div>
          </div>
        ) : null}

        {/* The card facing you, named like a museum label. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10">
          <div className="mx-auto flex w-full max-w-[84rem] items-end justify-between gap-6 px-5 pb-5 pt-5 sm:px-10 sm:pb-7 sm:pt-6 lg:px-14">
            {current ? (
              <div className="min-w-0">
                <p className="flex items-baseline gap-3">
                  <span className="statement text-[3rem] text-ink sm:text-[4.5rem]">{pad(front + 1)}</span>
                  <span className="font-label text-[0.6875rem] font-semibold tracking-[0.2em] text-ink-faint">/ {pad(count)}</span>
                </p>
                <p className="mt-2 truncate font-brand text-[1.5rem] leading-tight text-ink sm:text-[2rem]">{current.name}</p>
                <p className="mark-label mt-1.5 text-ink-soft">{current.categoryLabel}</p>
                <p className="mt-2 hidden max-w-[30rem] text-[0.875rem] leading-relaxed text-ink-soft sm:block">{current.description}</p>
              </div>
            ) : null}
            <div className="pointer-events-auto flex shrink-0 flex-col items-end gap-4">
              <button
                type="button"
                onClick={() => onOpen(front)}
                className="btn-outline"
              >
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand" />
                {detailLabel}
              </button>
              <span aria-hidden="true" className="hidden h-px w-40 overflow-hidden bg-line sm:block">
                <span ref={progressRef} className="block h-full w-full origin-left bg-jade" style={{ transform: 'scaleX(0)' }} />
              </span>
              <span className="hidden text-[0.75rem] text-ink-faint sm:block">{scrollHint}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
