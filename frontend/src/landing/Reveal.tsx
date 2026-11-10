/**
 * Sections ease in as they enter the viewport (a short rise and fade).
 * Content is never hidden from assistive tech, and it shows at once when
 * motion is reduced or IntersectionObserver is unavailable.
 */
import { useEffect, useRef, useState } from 'react'
import type { ElementType, ReactNode } from 'react'

import { useReducedMotion } from './motion.ts'

export function Reveal({
  as: Tag = 'div',
  delay = 0,
  className = '',
  children,
}: {
  as?: ElementType
  delay?: number
  className?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const [shown, setShown] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    if (shown || reduced) return undefined
    const node = ref.current
    if (!node) return undefined
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -12% 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [reduced, shown])

  return (
    <Tag
      ref={ref}
      data-reveal={shown || reduced ? 'shown' : 'pending'}
      className={`reveal ${className}`}
      style={{ ['--reveal-delay' as string]: `${delay}ms` }}
    >
      {children}
    </Tag>
  )
}
