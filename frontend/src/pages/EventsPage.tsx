/**
 * Event model list (`/evenements`): search, filter, paginate and delete
 * event invitation models.
 */
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { Alert } from '../design-system/Alert.tsx'
import { Badge } from '../design-system/Badge.tsx'
import { Button } from '../design-system/Button.tsx'
import { Card, CardBody } from '../design-system/Card.tsx'
import { Input, Select } from '../design-system/Input.tsx'
import { EmptyState, ErrorState, LoadingState } from '../design-system/states.tsx'
import { ApiError, eventsApi } from '../lib/api.ts'
import { formatDate } from '../lib/format.ts'
import type { EventModel, TemplateCategory } from '../lib/types.ts'
import { fr } from '../locales/fr.ts'

const CATEGORIES: Array<{ value: TemplateCategory | ''; label: string }> = [
  { value: '', label: fr.events.categoryAll },
  { value: 'wedding', label: 'Mariage' },
  { value: 'birthday', label: 'Anniversaire' },
  { value: 'graduation', label: 'Remise de diplômes' },
  { value: 'reception', label: 'Réception / cérémonie' },
  { value: 'anniversary', label: 'Anniversaire de mariage' },
  { value: 'memorial', label: 'Hommage' },
  { value: 'corporate', label: 'Entreprise' },
  { value: 'other', label: 'Autre' },
]

function DeleteButton({ event, onDeleted }: { event: EventModel; onDeleted: () => void }) {
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => eventsApi.remove(event.id),
    onSuccess: () => {
      setConfirming(false)
      onDeleted()
      void queryClient.invalidateQueries({ queryKey: ['events'] })
    },
    onError: (err: unknown) => {
      setConfirming(false)
      setError(
        err instanceof ApiError && err.code === 'event_has_invitations'
          ? fr.events.deleteBlocked
          : fr.common.unexpectedError,
      )
    },
  })

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <Link
          to={`/evenements/${event.id}`}
          className="inline-flex h-8 items-center rounded-md border border-line-strong bg-surface px-3 text-xs font-medium text-ink transition-colors duration-150 hover:bg-surface-muted"
        >
          {fr.events.edit}
        </Link>
        <Button variant="danger" size="sm" onClick={() => setConfirming(true)}>
          {fr.events.delete}
        </Button>
      </div>
      {confirming ? (
        <div
          role="alertdialog"
          aria-label={fr.events.deleteTitle}
          className="rounded-md border border-danger/30 bg-danger-soft p-3 text-right"
        >
          <p className="text-xs text-danger">{fr.events.deleteConfirm}</p>
          <div className="mt-2 flex justify-end gap-2">
            <Button size="sm" variant="secondary" onClick={() => setConfirming(false)}>
              {fr.common.cancel}
            </Button>
            <Button
              size="sm"
              variant="danger"
              loading={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {fr.events.delete}
            </Button>
          </div>
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="max-w-xs text-right text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '')
  const [deleted, setDeleted] = useState(false)

  const q = searchParams.get('q') ?? ''
  const category = (searchParams.get('categorie') ?? '') as TemplateCategory | ''
  const isActive = searchParams.get('statut') ?? ''
  const page = Number(searchParams.get('page') ?? '1') || 1

  const query = useQuery({
    queryKey: ['events', { q, category, isActive, page }],
    queryFn: () => eventsApi.list({ q, category, is_active: isActive as 'true' | 'false' | '', page }),
  })

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setSearchParams(next)
  }

  const results = query.data?.results ?? []
  const totalPages = query.data ? Math.max(1, Math.ceil(query.data.count / 25)) : 1

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{fr.events.title}</h1>
          <p className="mt-1 text-sm text-ink-soft">{fr.events.subtitle}</p>
        </div>
        <Link
          to="/evenements/nouveau"
          className="inline-flex h-10 items-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          {fr.events.create}
        </Link>
      </header>

      {deleted ? <Alert tone="success">{fr.events.deleted}</Alert> : null}

      <form
        className="flex flex-wrap items-center gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          setDeleted(false)
          updateParam('q', searchInput.trim())
        }}
      >
        <div className="w-full max-w-xs">
          <Input
            type="search"
            aria-label={fr.events.search}
            placeholder={fr.events.searchPlaceholder}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Select
          aria-label={fr.events.categoryLabel}
          value={category}
          onChange={(e) => updateParam('categorie', e.target.value)}
        >
          {CATEGORIES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select
          aria-label={fr.events.statusLabel}
          value={isActive}
          onChange={(e) => updateParam('statut', e.target.value)}
        >
          <option value="">{fr.events.statusAll}</option>
          <option value="true">{fr.events.statusActive}</option>
          <option value="false">{fr.events.statusInactive}</option>
        </Select>
        <Button type="submit" variant="secondary">
          {fr.common.search}
        </Button>
      </form>

      {query.isPending ? <LoadingState /> : null}
      {query.isError ? (
        <ErrorState
          title={fr.events.error.title}
          description={fr.events.error.description}
          onRetry={() => void query.refetch()}
        />
      ) : null}
      {query.isSuccess && results.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              title={fr.events.empty.title}
              description={fr.events.empty.description}
              action={
                <Link
                  to="/evenements/nouveau"
                  className="inline-flex h-9 items-center rounded-md bg-brand px-4 text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-strong"
                >
                  {fr.events.create}
                </Link>
              }
            />
          </CardBody>
        </Card>
      ) : null}

      {results.length > 0 ? (
        <div className="space-y-3">
          {results.map((event) => (
            <Card key={event.id}>
              <CardBody className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-sm font-semibold text-ink">{event.title}</h2>
                    <Badge tone="brand">{event.template_detail.name}</Badge>
                    {event.is_active ? null : <Badge>{fr.events.statusInactive}</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-ink-soft">
                    {event.event_date ? formatDate(event.event_date) : '—'}
                    {' · '}
                    {event.invitations_count > 0
                      ? `${event.invitations_count} ${fr.events.invitationsMany}`
                      : fr.events.noInvitations}
                  </p>
                </div>
                <DeleteButton event={event} onDeleted={() => setDeleted(true)} />
              </CardBody>
            </Card>
          ))}

          {totalPages > 1 ? (
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => updateParam('page', String(page - 1))}
              >
                {fr.events.prev}
              </Button>
              <span className="text-xs text-ink-soft">
                {fr.events.page.replace('{page}', `${page} / ${totalPages}`)}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={!query.data?.next}
                onClick={() => updateParam('page', String(page + 1))}
              >
                {fr.events.next}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
