/**
 * Page-level layout primitives shared by every dashboard screen: a consistent
 * page header (eyebrow / title / description / actions), a section title and
 * a toolbar surface. One rhythm everywhere is what makes the product feel
 * designed rather than assembled.
 */
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { IconChevronLeft } from './icons.tsx'

export interface PageHeaderProps {
  title: string
  description?: string
  /** Small line above the title (e.g. the parent event's name). */
  eyebrow?: ReactNode
  /** Back link rendered above the title. */
  back?: { to: string; label: string }
  actions?: ReactNode
}

export function PageHeader({ title, description, eyebrow, back, actions }: PageHeaderProps) {
  // Top-level pages open on a cream introduction card; sub-pages (with a
  // back link) keep a plain header so the content stays close.
  if (!back) {
    return (
      <header className="rounded-lg bg-cream px-6 py-7 sm:px-9 sm:py-9">
        {eyebrow ? <p className="mb-2 truncate text-[0.8125rem] text-ink-soft">{eyebrow}</p> : null}
        <h1 className="text-[2rem] font-normal leading-tight tracking-[-0.01em] text-ink sm:text-[2.25rem]">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-[0.9375rem] font-light leading-relaxed text-ink-soft">{description}</p>
        ) : null}
        {actions ? <div className="mt-6 flex flex-wrap items-center gap-2">{actions}</div> : null}
      </header>
    )
  }
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back ? (
          <Link
            to={back.to}
            className="mb-3 inline-flex items-center gap-1 rounded-full text-[0.8125rem] text-ink-soft transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
          >
            <IconChevronLeft className="h-4 w-4" />
            {back.label}
          </Link>
        ) : null}
        {eyebrow ? (
          <p className="mb-1.5 truncate text-[0.8125rem] font-medium text-ink-faint">{eyebrow}</p>
        ) : null}
        <h1 className="text-[1.75rem] font-normal leading-tight tracking-[-0.01em] text-ink sm:text-[2rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-soft">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  )
}

export function SectionTitle({
  children,
  action,
  as: Tag = 'h2',
}: {
  children: ReactNode
  action?: ReactNode
  as?: 'h2' | 'h3'
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Tag className="text-[1.125rem] font-normal text-ink">
        {children}
      </Tag>
      {action}
    </div>
  )
}

/** Horizontal filter / search surface above lists. */
export function Toolbar({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`flex flex-col gap-2 rounded-lg border border-line bg-surface p-2 sm:flex-row sm:items-center ${className}`}
    >
      {children}
    </div>
  )
}

/** Compact "Previous · Page x / y · Next" control. */
export function Pagination({
  page,
  totalPages,
  hasNext,
  onPrev,
  onNext,
  prevLabel,
  nextLabel,
  pageLabel,
}: {
  page: number
  totalPages: number
  hasNext: boolean
  onPrev: () => void
  onNext: () => void
  prevLabel: string
  nextLabel: string
  pageLabel: string
}) {
  const base =
    'inline-flex h-9 items-center whitespace-nowrap rounded-full border border-line-strong bg-surface px-4 text-[0.8125rem] font-medium text-ink transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-45'
  return (
    <nav className="flex items-center justify-between gap-3 pt-2" aria-label="Pagination">
      <button type="button" className={base} disabled={page <= 1} onClick={onPrev}>
        {prevLabel}
      </button>
      <span className="text-xs tabular-nums text-ink-soft">
        {pageLabel.replace('{page}', `${page} / ${totalPages}`)}
      </span>
      <button type="button" className={base} disabled={!hasNext} onClick={onNext}>
        {nextLabel}
      </button>
    </nav>
  )
}
