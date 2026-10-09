import type { ReactNode } from 'react'

export interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <section className={`rounded-lg border border-line bg-surface shadow-card ${className}`}>
      {children}
    </section>
  )
}

export interface CardHeaderProps {
  title: string
  description?: string
  action?: ReactNode
}

export function CardHeader({ title, description, action }: CardHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 border-b border-line px-5 py-4">
      <div className="min-w-0">
        <h2 className="text-[0.9375rem] font-semibold tracking-tight text-ink">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-ink-soft">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

export function CardBody({ children, className = '' }: CardProps) {
  return <div className={`px-5 py-5 ${className}`}>{children}</div>
}
