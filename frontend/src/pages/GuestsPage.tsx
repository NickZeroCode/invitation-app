/**
 * Guest invitation management (`/evenements/:id/invitations`).
 *
 * Individual guest invitations (product brief Section 9): search and filter
 * the guest list, issue single or batch invitations, copy individual links,
 * edit guest details, duplicate, revoke and delete (soft) invitations.
 */
import { useState, type FormEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { Alert } from '../design-system/Alert.tsx'
import { Badge, type BadgeTone } from '../design-system/Badge.tsx'
import { Button } from '../design-system/Button.tsx'
import { Card, CardBody, CardHeader } from '../design-system/Card.tsx'
import { Field } from '../design-system/Field.tsx'
import { Input, Select } from '../design-system/Input.tsx'
import { EmptyState, ErrorState, LoadingState } from '../design-system/states.tsx'
import { ApiError, eventsApi, invitationsApi } from '../lib/api.ts'
import { formatDate } from '../lib/format.ts'
import type {
  Invitation,
  InvitationCivility,
  InvitationPayload,
  InvitationState,
} from '../lib/types.ts'
import { fr } from '../locales/fr.ts'

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

function AddGuestForm({ eventId }: { eventId: number }) {
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
    <Card>
      <CardHeader title={fr.guests.addTitle} />
      <CardBody>
        <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={submit}>
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
          <div className="flex items-end">
            <Button type="submit" loading={mutation.isPending}>
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
      </CardBody>
    </Card>
  )
}

function BulkAddForm({ eventId }: { eventId: number }) {
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
    <Card>
      <CardHeader title={fr.guests.bulkTitle} description={fr.guests.bulkHint} />
      <CardBody>
        <form className="space-y-3" onSubmit={submit}>
          <Field id="guest-bulk" label={fr.guests.bulkLabel}>
            <textarea
              id="guest-bulk"
              rows={4}
              placeholder={fr.guests.bulkPlaceholder}
              value={lines}
              className="w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
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
      </CardBody>
    </Card>
  )
}

function GuestRow({ invitation }: { invitation: Invitation }) {
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

  const duplicateMutation = useMutation({
    mutationFn: () => invitationsApi.duplicate(invitation.id),
    onSuccess: () => {
      setError(null)
      setNotice(fr.guests.duplicated)
      invalidate()
    },
    onError: fail,
  })

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
    <Card>
      <CardBody className="space-y-3 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-sm font-semibold text-ink">{invitation.display_name}</h2>
              <Badge tone={STATUS_TONES[invitation.status]}>
                {STATUS_LABELS[invitation.status]}
              </Badge>
              {invitation.has_response ? (
                <Badge tone="brand">{fr.guests.responseBadge}</Badge>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-ink-soft">
              {fr.guests.issued.replace('{date}', formatDate(invitation.issued_at))}
              {' · '}
              {invitation.expires_at
                ? fr.guests.expires.replace('{date}', formatDate(invitation.expires_at))
                : fr.guests.noExpiry}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => void copyLink()}>
              {copied ? fr.guests.linkCopied : fr.guests.copyLink}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setEditing((value) => !value)}>
              {fr.guests.edit}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              loading={duplicateMutation.isPending}
              onClick={() => duplicateMutation.mutate()}
            >
              {fr.guests.duplicate}
            </Button>
            {invitation.status === 'active' ? (
              <Button variant="secondary" size="sm" onClick={() => setConfirmingRevoke(true)}>
                {fr.guests.revoke}
              </Button>
            ) : null}
            <Button variant="danger" size="sm" onClick={() => setConfirmingDelete(true)}>
              {fr.guests.delete}
            </Button>
          </div>
        </div>

        {editing ? (
          <form className="grid grid-cols-1 gap-3 sm:grid-cols-3" onSubmit={saveEdit}>
            <Field id={`guest-${invitation.id}-name`} label={fr.guests.addNameLabel} required>
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
            <div className="flex items-center gap-2 sm:col-span-3">
              <Button type="submit" size="sm" loading={updateMutation.isPending}>
                {fr.guests.save}
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => setEditing(false)}>
                {fr.common.cancel}
              </Button>
            </div>
          </form>
        ) : null}

        {confirmingRevoke ? (
          <div
            role="alertdialog"
            aria-label={fr.guests.revokeTitle}
            className="rounded-md border border-danger/30 bg-danger-soft p-3"
          >
            <p className="text-xs text-danger">{fr.guests.revokeConfirm}</p>
            <div className="mt-2 flex justify-end gap-2">
              <Button size="sm" variant="secondary" onClick={() => setConfirmingRevoke(false)}>
                {fr.common.cancel}
              </Button>
              <Button
                size="sm"
                variant="danger"
                loading={revokeMutation.isPending}
                onClick={() => revokeMutation.mutate()}
              >
                {fr.guests.revoke}
              </Button>
            </div>
          </div>
        ) : null}

        {confirmingDelete ? (
          <div
            role="alertdialog"
            aria-label={fr.guests.deleteTitle}
            className="rounded-md border border-danger/30 bg-danger-soft p-3"
          >
            <p className="text-xs text-danger">{fr.guests.deleteConfirm}</p>
            <div className="mt-2 flex justify-end gap-2">
              <Button size="sm" variant="secondary" onClick={() => setConfirmingDelete(false)}>
                {fr.common.cancel}
              </Button>
              <Button
                size="sm"
                variant="danger"
                loading={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
              >
                {fr.guests.delete}
              </Button>
            </div>
          </div>
        ) : null}

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
      </CardBody>
    </Card>
  )
}

export function GuestsPage() {
  const { id } = useParams()
  const eventId = Number(id)
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '')

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
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{fr.guests.title}</h1>
          <p className="mt-1 text-sm text-ink-soft">{fr.guests.subtitle}</p>
          {eventQuery.data ? (
            <p className="mt-1 text-xs text-ink-faint">{eventQuery.data.title}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to={`/evenements/${eventId}/reponses`}
            className="inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-strong"
          >
            {fr.guests.viewResponses}
          </Link>
          <Link
            to="/evenements"
            className="inline-flex h-10 items-center rounded-md border border-line-strong bg-surface px-4 text-sm font-medium text-ink transition-colors duration-150 hover:bg-surface-muted"
          >
            {fr.guests.back}
          </Link>
        </div>
      </header>

      {eventQuery.isError ? (
        <Alert tone="danger">{fr.guests.loadEventError}</Alert>
      ) : null}

      <AddGuestForm eventId={eventId} />
      <BulkAddForm eventId={eventId} />

      <form
        className="flex flex-wrap items-center gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          updateParam('q', searchInput.trim())
        }}
      >
        <div className="w-full max-w-xs">
          <Input
            type="search"
            aria-label={fr.guests.search}
            placeholder={fr.guests.searchPlaceholder}
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
        <Select
          aria-label={fr.guests.stateLabel}
          value={state}
          onChange={(event) => updateParam('etat', event.target.value)}
        >
          <option value="">{fr.guests.stateAll}</option>
          <option value="active">{fr.guests.stateActive}</option>
          <option value="expired">{fr.guests.stateExpired}</option>
          <option value="revoked">{fr.guests.stateRevoked}</option>
        </Select>
        <Button type="submit" variant="secondary">
          {fr.common.search}
        </Button>
      </form>

      {query.isPending ? <LoadingState /> : null}
      {query.isError ? (
        <ErrorState
          title={fr.guests.error.title}
          description={fr.guests.error.description}
          onRetry={() => void query.refetch()}
        />
      ) : null}
      {query.isSuccess && results.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState title={fr.guests.empty.title} description={fr.guests.empty.description} />
          </CardBody>
        </Card>
      ) : null}

      {results.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-ink">{fr.guests.listTitle}</h2>
          {results.map((invitation) => (
            <GuestRow key={invitation.id} invitation={invitation} />
          ))}

          {totalPages > 1 ? (
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => updateParam('page', String(page - 1))}
              >
                {fr.guests.prev}
              </Button>
              <span className="text-xs text-ink-soft">
                {fr.guests.page.replace('{page}', `${page} / ${totalPages}`)}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={!query.data?.next}
                onClick={() => updateParam('page', String(page + 1))}
              >
                {fr.guests.next}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
