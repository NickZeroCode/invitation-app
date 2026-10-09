/**
 * Event model list (`/evenements`): search, filter, paginate and delete
 * event invitation models.
 */
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  Alert,
  Badge,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  IconCalendar,
  IconEdit,
  IconEvents,
  IconPlus,
  IconSearch,
  IconTrash,
  IconUsers,
  Input,
  PageHeader,
  Pagination,
  Select,
  SkeletonRows,
  Toolbar,
  buttonClasses,
} from '../design-system/index.ts'
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

/** Calendar tile: day number over the abbreviated month. */
function DateTile({ iso }: { iso: string }) {
  if (!iso) {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-line bg-surface-muted text-ink-faint">
        <IconCalendar className="h-4.5 w-4.5" />
      </div>
    )
  }
  const date = new Date(`${iso}T12:00:00`)
  const day = new Intl.DateTimeFormat('fr-FR', { day: '2-digit' }).format(date)
  const month = new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(date).replace('.', '')
  return (
    <div
      aria-hidden="true"
      className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-md border border-line bg-surface-muted leading-none"
    >
      <span className="text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-brand">{month}</span>
      <span className="mt-1 text-lg font-semibold tracking-tight text-ink tabular-nums">{day}</span>
    </div>
  )
}

function EventRow({ event, onDeleted }: { event: EventModel; onDeleted: () => void }) {
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

  const invitations =
    event.invitations_count > 0
      ? `${event.invitations_count} ${fr.events.invitationsMany}`
      : fr.events.noInvitations

  return (
    <li className="group">
      <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:gap-5 sm:px-5">
        <Link
          to={`/evenements/${event.id}`}
          className="flex min-w-0 flex-1 items-center gap-4 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/35"
          aria-label={`${fr.events.edit} — ${event.title}`}
        >
          <DateTile iso={event.event_date} />
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <h2 className="truncate text-[0.9375rem] font-semibold tracking-tight text-ink group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">
                {event.title}
              </h2>
              {event.is_active ? null : <Badge>{fr.events.statusInactive}</Badge>}
            </div>
            <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 text-[0.8125rem] text-ink-soft">
              <Badge tone="brand">{event.template_detail.name}</Badge>
              <span className="whitespace-nowrap">
                {event.event_date ? formatDate(event.event_date) : fr.events.noDate}
              </span>
              <span aria-hidden="true" className="text-line-strong">
                ·
              </span>
              <span className="whitespace-nowrap">{invitations}</span>
            </div>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-1.5 sm:justify-end">
          <Link
            to={`/evenements/${event.id}/invitations`}
            className={buttonClasses('secondary', 'sm', 'flex-1 sm:flex-none')}
          >
            <IconUsers className="h-3.5 w-3.5" />
            {fr.events.guests}
          </Link>
          <Link
            to={`/evenements/${event.id}`}
            className={buttonClasses('secondary', 'sm', 'flex-1 sm:flex-none')}
          >
            <IconEdit className="h-3.5 w-3.5" />
            {fr.events.edit}
          </Link>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label={fr.events.delete}
            title={fr.events.delete}
            className={buttonClasses('danger-ghost', 'sm', 'w-8 px-0')}
          >
            <IconTrash className="h-4 w-4" />
          </button>
        </div>
      </div>
      {error ? (
        <div className="px-4 pb-4 sm:px-5">
          <p role="alert" className="text-[0.8125rem] text-danger">
            {error}
          </p>
        </div>
      ) : null}
      <ConfirmDialog
        open={confirming}
        title={fr.events.deleteTitle}
        message={fr.events.deleteConfirm}
        confirmLabel={fr.events.delete}
        loading={mutation.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={() => mutation.mutate()}
      />
    </li>
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
  const filtered = Boolean(q || category || isActive)

  return (
    <div className="space-y-6">
      <PageHeader
        title={fr.events.title}
        description={fr.events.subtitle}
        actions={
          <Link to="/evenements/nouveau" className={buttonClasses('primary', 'md')}>
            <IconPlus className="h-4 w-4" />
            {fr.events.create}
          </Link>
        }
      />

      {deleted ? <Alert tone="success">{fr.events.deleted}</Alert> : null}

      <Toolbar>
        <form
          role="search"
          className="relative min-w-0 flex-1"
          onSubmit={(e) => {
            e.preventDefault()
            setDeleted(false)
            updateParam('q', searchInput.trim())
          }}
        >
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <Input
            type="search"
            aria-label={fr.events.search}
            placeholder={fr.events.searchPlaceholder}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onBlur={() => {
              if (searchInput.trim() !== q) updateParam('q', searchInput.trim())
            }}
            className="border-transparent pl-9 shadow-none hover:border-transparent focus:border-line-strong"
          />
        </form>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
          <Select
            aria-label={fr.events.categoryLabel}
            value={category}
            onChange={(e) => updateParam('categorie', e.target.value)}
            className="sm:w-52"
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
            className="sm:w-40"
          >
            <option value="">{fr.events.statusAll}</option>
            <option value="true">{fr.events.statusActive}</option>
            <option value="false">{fr.events.statusInactive}</option>
          </Select>
        </div>
      </Toolbar>

      {query.isPending ? <SkeletonRows rows={4} /> : null}
      {query.isError ? (
        <Card>
          <ErrorState
            title={fr.events.error.title}
            description={fr.events.error.description}
            onRetry={() => void query.refetch()}
          />
        </Card>
      ) : null}
      {query.isSuccess && results.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconEvents className="h-5 w-5" />}
            title={fr.events.empty.title}
            description={fr.events.empty.description}
            action={
              filtered ? undefined : (
                <Link to="/evenements/nouveau" className={buttonClasses('primary', 'md')}>
                  <IconPlus className="h-4 w-4" />
                  {fr.events.create}
                </Link>
              )
            }
          />
        </Card>
      ) : null}

      {results.length > 0 ? (
        <div className="space-y-3">
          <p className="text-[0.8125rem] text-ink-faint">
            {(query.data?.count ?? 0) === 1
              ? fr.events.countOne
              : fr.events.count.replace('{count}', String(query.data?.count ?? 0))}
          </p>
          <Card className="overflow-hidden">
            <ul className="divide-y divide-line">
              {results.map((event) => (
                <EventRow key={event.id} event={event} onDeleted={() => setDeleted(true)} />
              ))}
            </ul>
          </Card>

          {totalPages > 1 ? (
            <Pagination
              page={page}
              totalPages={totalPages}
              hasNext={Boolean(query.data?.next)}
              onPrev={() => updateParam('page', String(page - 1))}
              onNext={() => updateParam('page', String(page + 1))}
              prevLabel={fr.events.prev}
              nextLabel={fr.events.next}
              pageLabel={fr.events.page}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
