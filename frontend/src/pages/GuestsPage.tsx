/**
 * Guest invitation management (`/evenements/:id/invitations`).
 *
 * Individual guest invitations (product brief Section 9): search and filter
 * the guest list, issue single or batch invitations, copy individual links,
 * edit guest details, export the invitation PDF, revoke and delete (soft)
 * invitations.
 */
import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  IconBan,
  IconChart,
  IconCheck,
  IconDownload,
  IconEdit,
  IconLink,
  IconPlus,
  IconSearch,
  IconTrash,
  IconUsers,
  Input,
  Modal,
  PageHeader,
  Pagination,
  Select,
  SkeletonRows,
  Spinner,
  Textarea,
  Toolbar,
  buttonClasses,
  type BadgeTone,
} from '../design-system/index.ts'
import { ApiError, eventsApi, invitationsApi } from '../lib/api.ts'
import { exportInvitationPdf } from '../lib/exportInvitationPdf.ts'
import { formatDate } from '../lib/format.ts'
import type {
  EventModel,
  Invitation,
  InvitationCivility,
  InvitationPayload,
  InvitationState,
} from '../lib/types.ts'
import { fr } from '../locales/fr.ts'
import { emptyDraft } from '../templates/registry.tsx'

const CIVILITIES: Array<{ value: InvitationCivility; label: string }> = [
  { value: 'none', label: fr.guests.civility.none },
  { value: 'm', label: fr.guests.civility.m },
  { value: 'mme', label: fr.guests.civility.mme },
  { value: 'mlle', label: fr.guests.civility.mlle },
  { value: 'couple', label: fr.guests.civility.couple },
]

const STATUS_TONES: Record<InvitationState, BadgeTone> = {
  active: 'success',
  expired: 'warning',
  revoked: 'danger',
  deleted: 'neutral',
}

const STATUS_LABELS: Record<InvitationState, string> = {
  active: fr.guests.status.active,
  expired: fr.guests.status.expired,
  revoked: fr.guests.status.revoked,
  deleted: fr.guests.status.deleted,
}

/** Date inputs carry `YYYY-MM-DD`; the API takes full ISO instants. */
function expiryInputValue(iso: string | null): string {
  return iso ? iso.slice(0, 10) : ''
}

function expiryPayload(value: string): string | null {
  // End of the chosen day: the invitation stays valid through that date.
  return value ? new Date(`${value}T23:59:59`).toISOString() : null
}

function errorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : fr.common.unexpectedError
}

function guestInitials(name: string): string {
  return name
    .replace(/^(M\.|Mme|Mlle|M\. & Mme)\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function AddGuestForm({ eventId, onSuccess }: { eventId: number; onSuccess?: () => void }) {
  const [name, setName] = useState('')
  const [civility, setCivility] = useState<InvitationCivility>('none')
  const [expiry, setExpiry] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (payload: InvitationPayload) => invitationsApi.create(eventId, payload),
    onSuccess: () => {
      setName('')
      setCivility('none')
      setExpiry('')
      setError(null)
      setSuccess(true)
      onSuccess?.()
      void queryClient.invalidateQueries({ queryKey: ['invitations'] })
      void queryClient.invalidateQueries({ queryKey: ['event'] })
    },
    onError: (err: unknown) => {
      setSuccess(false)
      setError(errorMessage(err))
    },
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    setSuccess(false)
    const trimmed = name.trim()
    if (!trimmed) {
      setError(fr.common.requiredField)
      return
    }
    setError(null)
    mutation.mutate({ guest_name: trimmed, civility, expires_at: expiryPayload(expiry) })
  }

  return (
    <section aria-labelledby="add-guest-title">
      <h3 id="add-guest-title" className="text-sm font-semibold text-ink">
        {fr.guests.singleTitle}
      </h3>
      <form className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]" onSubmit={submit}>
        <Field id="guest-name" label={fr.guests.addNameLabel} required>
          <Input
            id="guest-name"
            placeholder={fr.guests.addNamePlaceholder}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field id="guest-civility" label={fr.guests.addCivilityLabel}>
          <Select
            id="guest-civility"
            value={civility}
            onChange={(event) => setCivility(event.target.value as InvitationCivility)}
          >
            {CIVILITIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="guest-expiry" label={fr.guests.addExpiryLabel} hint={fr.guests.addExpiryHint}>
          <Input
            id="guest-expiry"
            type="date"
            value={expiry}
            onChange={(event) => setExpiry(event.target.value)}
          />
        </Field>
        <div className="flex items-start sm:pt-[1.625rem]">
          <Button type="submit" loading={mutation.isPending} className="w-full">
            {fr.guests.addSubmit}
          </Button>
        </div>
      </form>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      ) : null}
      {success ? (
        <div className="mt-3">
          <Alert tone="success">{fr.guests.addSuccess}</Alert>
        </div>
      ) : null}
    </section>
  )
}

function BulkAddForm({ eventId, onSuccess }: { eventId: number; onSuccess?: () => void }) {
  const [lines, setLines] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (invitations: InvitationPayload[]) => invitationsApi.bulkCreate(eventId, invitations),
    onSuccess: () => {
      setLines('')
      setError(null)
      setSuccess(true)
      onSuccess?.()
      void queryClient.invalidateQueries({ queryKey: ['invitations'] })
      void queryClient.invalidateQueries({ queryKey: ['event'] })
    },
    onError: (err: unknown) => {
      setSuccess(false)
      setError(errorMessage(err))
    },
  })

  const count = lines.split('\n').filter((line) => line.trim()).length

  function submit(event: FormEvent) {
    event.preventDefault()
    setSuccess(false)
    const names = lines
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
    if (names.length === 0) {
      setError(fr.guests.bulkEmpty)
      return
    }
    setError(null)
    mutation.mutate(names.map((guest_name) => ({ guest_name })))
  }

  return (
    <section aria-labelledby="bulk-guest-title">
      <div className="flex items-baseline justify-between gap-3">
        <h3 id="bulk-guest-title" className="text-sm font-semibold text-ink">
          {fr.guests.bulkTitle}
        </h3>
        {count > 0 ? (
          <span className="text-xs tabular-nums text-ink-faint">
            {count === 1 ? fr.guests.countOne : fr.guests.count.replace('{count}', String(count))}
          </span>
        ) : null}
      </div>
      <form className="mt-3 space-y-3" onSubmit={submit}>
        <Field id="guest-bulk" label={fr.guests.bulkLabel} hint={fr.guests.bulkHint}>
          <Textarea
            id="guest-bulk"
            rows={5}
            placeholder={fr.guests.bulkPlaceholder}
            value={lines}
            onChange={(event) => setLines(event.target.value)}
          />
        </Field>
        <Button type="submit" variant="secondary" loading={mutation.isPending}>
          {fr.guests.bulkSubmit}
        </Button>
      </form>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      ) : null}
      {success ? (
        <div className="mt-3">
          <Alert tone="success">{fr.guests.bulkSuccess}</Alert>
        </div>
      ) : null}
    </section>
  )
}

/** Labeled icon action: icon-only on phones, icon + label from `sm` up. */
function RowAction({
  label,
  icon,
  onClick,
  loading = false,
  disabled = false,
  tone = 'default',
}: {
  label: string
  icon: ReactNode
  onClick: () => void
  loading?: boolean
  disabled?: boolean
  tone?: 'default' | 'danger'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      title={label}
      className={buttonClasses(
        tone === 'danger' ? 'danger-ghost' : 'ghost',
        'sm',
        'h-9 w-9 px-0 xl:w-auto xl:px-2.5',
      )}
    >
      {loading ? <Spinner className="h-4 w-4" /> : icon}
      <span className="sr-only xl:not-sr-only">{label}</span>
    </button>
  )
}

function GuestRow({
  invitation,
  event,
}: {
  invitation: Invitation
  /** Event model — supplies the artwork for the PDF export. */
  event: EventModel | undefined
}) {
  const [editing, setEditing] = useState(false)
  const [confirmingRevoke, setConfirmingRevoke] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [copied, setCopied] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState(invitation.guest_name)
  const [civility, setCivility] = useState<InvitationCivility>(invitation.civility)
  const [expiry, setExpiry] = useState(expiryInputValue(invitation.expires_at))
  const queryClient = useQueryClient()

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ['invitations'] })
    void queryClient.invalidateQueries({ queryKey: ['event'] })
  }

  function fail(err: unknown) {
    setNotice(null)
    setError(errorMessage(err))
  }

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<InvitationPayload>) => invitationsApi.update(invitation.id, payload),
    onSuccess: () => {
      setEditing(false)
      setError(null)
      setNotice(fr.guests.saved)
      invalidate()
    },
    onError: fail,
  })

  const [exporting, setExporting] = useState(false)

  async function exportPdf() {
    if (!event || exporting) return
    setExporting(true)
    setNotice(null)
    setError(null)
    try {
      await exportInvitationPdf({
        templateKey: event.template,
        draft: emptyDraft({
          title: event.title,
          message: event.message,
          messageFont: event.message_font,
          fontSize: event.font_size,
          event_date: event.event_date,
          event_time: event.event_time,
          timezone: event.timezone,
          venue_name: event.venue_name,
          venue_address: event.venue_address,
          venue_details: event.venue_details,
          cover_url: event.cover_url,
          coverTitle: event.cover_title,
          emphasis: event.display_config.emphasis ?? [],
          guestName: invitation.display_name,
          dressCode: [],
          program: [],
        }),
        dressCode: event.dress_code.map((image) => ({ url: image.url, caption: image.caption })),
        program: event.program_items.map((item) => ({
          start_time: item.start_time,
          end_time: item.end_time,
          description: item.description,
        })),
        title: event.title,
        guestName: invitation.display_name,
        qrText: `${window.location.origin}/i/${invitation.token}`,
      })
      setNotice(fr.guests.exported)
    } catch {
      setError(fr.guests.exportError)
    } finally {
      setExporting(false)
    }
  }

  const revokeMutation = useMutation({
    mutationFn: () => invitationsApi.revoke(invitation.id),
    onSuccess: () => {
      setConfirmingRevoke(false)
      setError(null)
      setNotice(fr.guests.revoked)
      invalidate()
    },
    onError: (err: unknown) => {
      setConfirmingRevoke(false)
      fail(err)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => invitationsApi.remove(invitation.id),
    onSuccess: () => {
      setConfirmingDelete(false)
      setError(null)
      setNotice(fr.guests.deleted)
      invalidate()
    },
    onError: (err: unknown) => {
      setConfirmingDelete(false)
      fail(err)
    },
  })

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/i/${invitation.token}`)
      setCopied(true)
      setError(null)
      window.setTimeout(() => setCopied(false), 2400)
    } catch {
      setError(fr.common.unexpectedError)
    }
  }

  function saveEdit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError(fr.common.requiredField)
      return
    }
    updateMutation.mutate({
      guest_name: trimmed,
      civility,
      expires_at: expiryPayload(expiry),
    })
  }

  return (
    <li>
      <div className="flex items-center gap-3 px-4 py-3.5 sm:gap-4 sm:px-5">
        <span
          aria-hidden="true"
          className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-surface-muted text-xs font-semibold text-ink-soft ring-1 ring-inset ring-line sm:flex"
        >
          {guestInitials(invitation.display_name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="truncate text-sm font-semibold text-ink">{invitation.display_name}</h2>
            <Badge tone={STATUS_TONES[invitation.status]} dot>
              {STATUS_LABELS[invitation.status]}
            </Badge>
            {invitation.has_response ? <Badge tone="brand">{fr.guests.responseBadge}</Badge> : null}
          </div>
          <p className="mt-1 truncate text-xs text-ink-faint">
            {fr.guests.issued.replace('{date}', formatDate(invitation.issued_at))}
            {' · '}
            {invitation.expires_at
              ? fr.guests.expires.replace('{date}', formatDate(invitation.expires_at))
              : fr.guests.noExpiry}
          </p>
        </div>

        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={() => void copyLink()}
            title={copied ? fr.guests.linkCopied : fr.guests.copyLink}
            className={buttonClasses(
              'secondary',
              'sm',
              `mr-1 h-9 w-9 px-0 sm:w-auto sm:px-3 ${copied ? 'text-success' : ''}`,
            )}
          >
            {copied ? <IconCheck className="h-4 w-4" /> : <IconLink className="h-4 w-4" />}
            <span className="sr-only sm:not-sr-only">
              {copied ? fr.guests.linkCopied : fr.guests.copyLink}
            </span>
          </button>
          <RowAction
            label={fr.guests.export}
            icon={<IconDownload className="h-4 w-4" />}
            loading={exporting}
            disabled={!event}
            onClick={() => void exportPdf()}
          />
          <RowAction
            label={fr.guests.edit}
            icon={<IconEdit className="h-4 w-4" />}
            onClick={() => setEditing(true)}
          />
          {invitation.status === 'active' ? (
            <RowAction
              label={fr.guests.revoke}
              icon={<IconBan className="h-4 w-4" />}
              onClick={() => setConfirmingRevoke(true)}
            />
          ) : null}
          <RowAction
            label={fr.guests.delete}
            icon={<IconTrash className="h-4 w-4" />}
            tone="danger"
            onClick={() => setConfirmingDelete(true)}
          />
        </div>
      </div>

      {notice || error ? (
        <div className="px-4 pb-3 sm:pl-[4.25rem] sm:pr-5">
          {notice ? (
            <p role="status" className="text-xs text-ink-soft">
              {notice}
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="text-xs text-danger">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        ariaLabel={fr.guests.editTitle}
        title={fr.guests.editTitle}
        description={invitation.display_name}
      >
        <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={saveEdit}>
          <Field
            id={`guest-${invitation.id}-name`}
            label={fr.guests.addNameLabel}
            required
            className="sm:col-span-2"
          >
            <Input
              id={`guest-${invitation.id}-name`}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
          <Field id={`guest-${invitation.id}-civility`} label={fr.guests.addCivilityLabel}>
            <Select
              id={`guest-${invitation.id}-civility`}
              value={civility}
              onChange={(event) => setCivility(event.target.value as InvitationCivility)}
            >
              {CIVILITIES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field id={`guest-${invitation.id}-expiry`} label={fr.guests.addExpiryLabel}>
            <Input
              id={`guest-${invitation.id}-expiry`}
              type="date"
              value={expiry}
              onChange={(event) => setExpiry(event.target.value)}
            />
          </Field>
          <div className="flex flex-col-reverse gap-2 pt-1 sm:col-span-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
              {fr.common.cancel}
            </Button>
            <Button type="submit" loading={updateMutation.isPending}>
              {fr.guests.save}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmingRevoke}
        title={fr.guests.revokeTitle}
        message={fr.guests.revokeConfirm}
        confirmLabel={fr.guests.revoke}
        loading={revokeMutation.isPending}
        onCancel={() => setConfirmingRevoke(false)}
        onConfirm={() => revokeMutation.mutate()}
      />
      <ConfirmDialog
        open={confirmingDelete}
        title={fr.guests.deleteTitle}
        message={fr.guests.deleteConfirm}
        confirmLabel={fr.guests.delete}
        loading={deleteMutation.isPending}
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
      />
    </li>
  )
}

export function GuestsPage() {
  const { id } = useParams()
  const eventId = Number(id)
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '')
  const [addOpen, setAddOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const q = searchParams.get('q') ?? ''
  const state = (searchParams.get('etat') ?? '') as InvitationState | ''
  const page = Number(searchParams.get('page') ?? '1') || 1

  const eventQuery = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsApi.get(eventId),
    enabled: Number.isFinite(eventId),
  })

  const query = useQuery({
    queryKey: ['invitations', eventId, { q, state, page }],
    queryFn: () => invitationsApi.listForEvent(eventId, { q, state, page }),
    enabled: Number.isFinite(eventId),
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
      <PageHeader
        back={{ to: '/evenements', label: fr.guests.back }}
        eyebrow={eventQuery.data?.title}
        title={fr.guests.title}
        description={fr.guests.subtitle}
        actions={
          <>
            <Link
              to={`/evenements/${eventId}/reponses`}
              className={buttonClasses('secondary', 'md', 'flex-1 sm:flex-none')}
            >
              <IconChart className="h-4 w-4" />
              {fr.guests.viewResponses}
            </Link>
            <Button
              className="flex-1 sm:flex-none"
              onClick={() => {
                setNotice(null)
                setAddOpen(true)
              }}
            >
              <IconPlus className="h-4 w-4" />
              {fr.guests.addTitle}
            </Button>
          </>
        }
      />

      {eventQuery.isError ? <Alert tone="danger">{fr.guests.loadEventError}</Alert> : null}

      {notice ? <Alert tone="success">{notice}</Alert> : null}

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        ariaLabel={fr.guests.addTitle}
        title={fr.guests.addTitle}
        description={fr.guests.addModalHint}
        size="lg"
      >
        <div className="space-y-6">
          <AddGuestForm
            eventId={eventId}
            onSuccess={() => {
              setAddOpen(false)
              setNotice(fr.guests.addSuccess)
            }}
          />
          <div className="h-px bg-line" />
          <BulkAddForm
            eventId={eventId}
            onSuccess={() => {
              setAddOpen(false)
              setNotice(fr.guests.bulkSuccess)
            }}
          />
        </div>
      </Modal>

      <Toolbar>
        <form
          role="search"
          className="relative min-w-0 flex-1"
          onSubmit={(event) => {
            event.preventDefault()
            updateParam('q', searchInput.trim())
          }}
        >
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <Input
            type="search"
            aria-label={fr.guests.search}
            placeholder={fr.guests.searchPlaceholder}
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onBlur={() => {
              if (searchInput.trim() !== q) updateParam('q', searchInput.trim())
            }}
            className="border-transparent pl-9 shadow-none hover:border-transparent focus:border-line-strong"
          />
        </form>
        <Select
          aria-label={fr.guests.stateLabel}
          value={state}
          onChange={(event) => updateParam('etat', event.target.value)}
          className="sm:w-44"
        >
          <option value="">{fr.guests.stateAll}</option>
          <option value="active">{fr.guests.stateActive}</option>
          <option value="expired">{fr.guests.stateExpired}</option>
          <option value="revoked">{fr.guests.stateRevoked}</option>
        </Select>
      </Toolbar>

      {query.isPending ? <SkeletonRows rows={5} /> : null}
      {query.isError ? (
        <Card>
          <ErrorState
            title={fr.guests.error.title}
            description={fr.guests.error.description}
            onRetry={() => void query.refetch()}
          />
        </Card>
      ) : null}
      {query.isSuccess && results.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconUsers className="h-5 w-5" />}
            title={fr.guests.empty.title}
            description={fr.guests.empty.description}
          />
        </Card>
      ) : null}

      {results.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold text-ink">{fr.guests.listTitle}</h2>
            <span className="text-[0.8125rem] tabular-nums text-ink-faint">
              {(query.data?.count ?? 0) === 1
                ? fr.guests.countOne
                : fr.guests.count.replace('{count}', String(query.data?.count ?? 0))}
            </span>
          </div>
          <Card className="overflow-hidden">
            <ul className="divide-y divide-line">
              {results.map((invitation) => (
                <GuestRow key={invitation.id} invitation={invitation} event={eventQuery.data} />
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
              prevLabel={fr.guests.prev}
              nextLabel={fr.guests.next}
              pageLabel={fr.guests.page}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
