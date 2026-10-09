/**
 * Template gallery (`/modeles`): browses the curated template catalog and
 * launches the event editor pre-styled with the chosen model.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import {
  EmptyState,
  ErrorState,
  IconArrowRight,
  IconSearch,
  Input,
  PageHeader,
  buttonClasses,
} from '../design-system/index.ts'
import { templatesApi } from '../lib/api.ts'
import type { InvitationTemplate } from '../lib/types.ts'
import { fr } from '../locales/fr.ts'
import { getTemplate, sampleDraft } from '../templates/registry.tsx'

function TemplatePreview({ template }: { template: InvitationTemplate }) {
  const definition = getTemplate(template.key)
  return (
    <div
      className="pointer-events-none aspect-[3/4] w-full overflow-hidden bg-surface-muted"
      aria-label={fr.templates.previewLabel}
    >
      {definition ? (
        <definition.Component draft={sampleDraft(template.key)} />
      ) : (
        <div className="flex h-full items-center justify-center p-4 text-center text-xs text-ink-faint">
          {template.name}
        </div>
      )}
    </div>
  )
}

function GallerySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-lg border border-line bg-surface">
          <div className="aspect-[3/4] animate-pulse bg-surface-muted" />
          <div className="h-[4.5rem]" />
        </div>
      ))}
    </div>
  )
}

export function TemplatesPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')

  const query = useQuery({ queryKey: ['templates'], queryFn: templatesApi.list })

  const categories = useMemo(() => {
    const seen = new Map<string, string>()
    for (const template of query.data ?? []) {
      if (!seen.has(template.category)) seen.set(template.category, template.category_label)
    }
    return [...seen.entries()]
  }, [query.data])

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return (query.data ?? []).filter((template) => {
      if (category && template.category !== category) return false
      if (!needle) return true
      return (
        template.name.toLowerCase().includes(needle) ||
        template.description.toLowerCase().includes(needle)
      )
    })
  }, [query.data, search, category])

  const chip = (active: boolean) =>
    `inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-pill px-3.5 text-[0.8125rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/35 ${
      active
        ? 'bg-ink text-white'
        : 'border border-line-strong bg-surface text-ink-soft hover:border-ink-faint/60 hover:text-ink'
    }`

  return (
    <div className="space-y-6">
      <PageHeader title={fr.templates.title} description={fr.templates.subtitle} />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Category chips scroll horizontally on phones instead of wrapping into a wall. */}
        <div className="scroll-quiet -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
          <button type="button" className={chip(category === '')} onClick={() => setCategory('')}>
            {fr.templates.all}
          </button>
          {categories.map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={chip(category === value)}
              aria-pressed={category === value}
              onClick={() => setCategory(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative w-full lg:max-w-xs">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <Input
            type="search"
            aria-label={fr.events.search}
            placeholder={fr.events.searchPlaceholder}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {query.isPending ? <GallerySkeleton /> : null}
      {query.isError ? (
        <ErrorState
          title={fr.templates.error.title}
          description={fr.templates.error.description}
          onRetry={() => void query.refetch()}
        />
      ) : null}
      {query.isSuccess && visible.length === 0 ? <EmptyState title={fr.templates.empty} /> : null}

      {visible.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {visible.map((template) => (
            <article
              key={template.key}
              className="group flex flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-card transition-shadow duration-200 hover:shadow-raised"
            >
              <div className="relative overflow-hidden border-b border-line">
                <div className="transition-transform duration-500 ease-out group-hover:scale-[1.015]">
                  <TemplatePreview template={template} />
                </div>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="min-w-0 truncate text-[0.9375rem] font-semibold tracking-tight text-ink">
                    {template.name}
                  </h2>
                  <span className="shrink-0 whitespace-nowrap text-xs text-ink-faint">
                    {template.category_label}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-[0.8125rem] leading-relaxed text-ink-soft">
                  {template.description}
                </p>
                <Link
                  to={`/evenements/nouveau?modele=${encodeURIComponent(template.key)}`}
                  className={buttonClasses('secondary', 'md', 'mt-4 w-full group-hover:border-ink group-hover:bg-ink group-hover:text-white')}
                >
                  {fr.templates.use}
                  <IconArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  )
}
