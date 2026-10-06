/**
 * Template gallery (`/modeles`): browses the curated template catalog and
 * launches the event editor pre-styled with the chosen model.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import { Badge } from '../design-system/Badge.tsx'
import { Button } from '../design-system/Button.tsx'
import { Input } from '../design-system/Input.tsx'
import { EmptyState, ErrorState, LoadingState } from '../design-system/states.tsx'
import { templatesApi } from '../lib/api.ts'
import type { InvitationTemplate } from '../lib/types.ts'
import { fr } from '../locales/fr.ts'
import { getTemplate, sampleDraft } from '../templates/registry.tsx'

function TemplatePreview({ template }: { template: InvitationTemplate }) {
  const definition = getTemplate(template.key)
  return (
    <div
      className="aspect-[3/4] w-full overflow-hidden rounded-md border border-line bg-surface-muted"
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

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{fr.templates.title}</h1>
          <p className="mt-1 text-sm text-ink-soft">{fr.templates.subtitle}</p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full max-w-xs">
          <Input
            type="search"
            aria-label={fr.events.search}
            placeholder={fr.events.searchPlaceholder}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={category === '' ? 'primary' : 'secondary'}
            onClick={() => setCategory('')}
          >
            {fr.templates.all}
          </Button>
          {categories.map(([value, label]) => (
            <Button
              key={value}
              size="sm"
              variant={category === value ? 'primary' : 'secondary'}
              onClick={() => setCategory(value)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {query.isPending ? <LoadingState /> : null}
      {query.isError ? (
        <ErrorState
          title={fr.templates.error.title}
          description={fr.templates.error.description}
          onRetry={() => void query.refetch()}
        />
      ) : null}
      {query.isSuccess && visible.length === 0 ? (
        <EmptyState title={fr.templates.empty} />
      ) : null}

      {visible.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((template) => (
            <article key={template.key} className="flex flex-col gap-3">
              <TemplatePreview template={template} />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-ink">{template.name}</h2>
                  <p className="mt-0.5 text-xs text-ink-soft">{template.description}</p>
                </div>
                <Badge tone="brand">{template.category_label}</Badge>
              </div>
              <Link
                to={`/evenements/nouveau?modele=${encodeURIComponent(template.key)}`}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                {fr.templates.use}
              </Link>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  )
}
