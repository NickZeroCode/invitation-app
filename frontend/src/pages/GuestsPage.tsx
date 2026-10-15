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
  IconQr,
  IconSearch,
  IconTrash,
  IconUsers,
  Input,
  Modal,
  PageHeader,
  Pagination,
  ProgressBar,
  Select,
  SkeletonRows,
  Spinner,
  Textarea,
  Toggle,
  Toolbar,
  buttonClasses,
  type BadgeTone,
} from '../design-system/index.ts'
import { ApiError, eventsApi, invitationsApi } from '../lib/api.ts'
import type { RefreshedImageUrls } from '../lib/pdfImages.ts'
import { ExportImagesError, exportInvitationPdf, yieldToBrowser } from '../lib/exportInvitationPdf.ts'
import { formatDate } from '../lib/format.ts'
import type {
  EventModel,
  EventTable,
  EventTablePayload,
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

/** Native date inputs validate against the local calendar day. */
function todayInputValue(): string {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/**
 * Picker guard against past days — while an already past stored value stays
 * saveable: an untouched date must never block an unrelated edit. The server
 * still re-validates any changed value and answers with a field error.
 */
function minInputValue(iso: string | null): string {
  const current = expiryInputValue(iso)
  const today = todayInputValue()
  return current && current < today ? current : today
}

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    // Field-level detail first (e.g. the expiry-date rejection reason) — the
    // generic envelope message alone hides which field was rejected.
    const fieldDetail = Object.values(err.fields ?? {})
      .flat()
      .find((message) => message.length > 0)
    return fieldDetail ?? err.message
  }
  return fr.common.unexpectedError
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

/**
 * Pick a table from the event's seating registry, or keep a free-text entry.
 * The value is the registry id as a string, `''` for "no table", or
 * `'custom'` to fall back to the manual number/text inputs (which keep any
 * existing textual table working untouched).
 */
const TABLE_CUSTOM = 'custom'

function tableSelectValue(tables: EventTable[], tableId: number | null, tableNumber: string): string {
  if (tableId != null && tables.some((table) => table.id === tableId)) return String(tableId)
  return tableNumber ? TABLE_CUSTOM : ''
}

function TableSelect({
  id,
  tables,
  value,
  onChange,
}: {
  id: string
  tables: EventTable[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">{fr.guests.tableSelectNone}</option>
      {tables.map((table) => (
        <option key={table.id} value={String(table.id)}>
          {table.text ? `${table.number} — ${table.text}` : `${fr.guests.tableBadge.replace('{number}', table.number)}`}
        </option>
      ))}
      <option value={TABLE_CUSTOM}>{fr.guests.tableSelectCustom}</option>
    </Select>
  )
}

/** One row of the rich bulk editor: name + formule d'appel + table. */
interface BulkRow {
  guest_name: string
  civility: InvitationCivility
  table: string // registry id as string, '' = none, TABLE_CUSTOM = manual
  table_number: string
  table_text: string
}

function emptyBulkRow(): BulkRow {
  return { guest_name: '', civility: 'none', table: '', table_number: '', table_text: '' }
}

/** Truthful progress of one PDF export batch (single or bulk). */
interface ExportProgressState {
  /** Overall percent across the whole batch (0–100). */
  percent: number
  current: number
  total: number
  /** Per-file percent of the invitation currently exporting (0–100). */
  filePercent: number
}

/**
 * Compose and download one invitation's PDF from FRESH server data (the
 * cached event can carry expired presigned image URLs). `onFileProgress`
 * receives the truthful 0–100 percent for this single file.
 *
 * `sourceOverride` lets a batch supply the event it already fetched once, so
 * N guests don't trigger N identical `GET /events/:id` round-trips.
 */
async function exportOneInvitation(
  event: EventModel,
  invitation: Invitation,
  onFileProgress?: (percent: number) => void,
  sourceOverride?: EventModel,
): Promise<void> {
  const fresh = sourceOverride ?? (await eventsApi.get(event.id).catch(() => null))
  const source = fresh ?? event
  const refreshExportImages = async (): Promise<RefreshedImageUrls | null> => {
    const latest = await eventsApi.get(event.id).catch(() => null)
    return latest
      ? {
          cover: latest.cover_url,
          dressCode: latest.dress_code.map((image) => ({ id: image.id, url: image.url })),
        }
      : null
  }
  await exportInvitationPdf({
    templateKey: source.template,
    draft: emptyDraft({
      title: source.title,
      message: source.message,
      messageFont: source.message_font,
      fontSize: source.font_size,
      event_date: source.event_date,
      event_time: source.event_time,
      timezone: source.timezone,
      venue_name: source.venue_name,
      venue_address: source.venue_address,
      venue_details: source.venue_details,
      note: source.note ?? '',
      cover_url: source.cover_url,
      coverTitle: source.cover_title,
      emphasis: source.display_config.emphasis ?? [],
      guestName: invitation.display_name,
      dressCode: [],
      program: [],
    }),
    dressCode: source.dress_code.map((image) => ({
      id: image.id,
      url: image.url,
      fileUrl: eventsApi.dressCodeFileUrl(source.id, image.id),
      caption: image.caption,
    })),
    program: source.program_items.map((item) => ({
      start_time: item.start_time,
      end_time: item.end_time,
      description: item.description,
    })),
    table: invitation.table_number
      ? { number: invitation.table_number, text: invitation.table_text }
      : undefined,
    title: source.title,
    guestName: invitation.display_name,
    qrText: `${window.location.origin}/i/${invitation.token}`,
    refresh: refreshExportImages,
    coverFileUrl: source.cover_url ? eventsApi.coverFileUrl(source.id) : undefined,
    onProgress: onFileProgress
      ? (progress) => onFileProgress(progress.percent)
      : undefined,
  })
}

/**
 * Export a batch of invitations sequentially (one PDF download per guest),
 * reporting truthful overall progress: each invitation is an equal slice of
 * the bar, advanced by its own real per-file percent.
 *
 * Kept strictly sequential and deliberately paced — never parallel. Each PDF
 * runs long synchronous DOM/canvas rasterization on the main thread, so the
 * batch (1) fetches the event once instead of per guest, (2) yields a full
 * frame to the browser between files so the tab keeps painting and the
 * progress bar stays alive, and (3) leaves a short gap after each download so
 * the browser doesn't stall on a burst of simultaneous file downloads.
 */
async function exportInvitationsBatch(
  event: EventModel,
  invitations: Invitation[],
  onProgress: (state: ExportProgressState) => void,
): Promise<void> {
  const total = invitations.length
  // One fetch for the whole batch — fresh presigned image URLs, no N× round-trip.
  const fresh = await eventsApi.get(event.id).catch(() => null)
  const source = fresh ?? event
  for (let index = 0; index < total; index += 1) {
    const base = (index / total) * 100
    const slice = 100 / total
    await exportOneInvitation(
      event,
      invitations[index],
      (filePercent) => {
        onProgress({
          percent: base + (filePercent / 100) * slice,
          current: index + 1,
          total,
          filePercent,
        })
      },
      source,
    )
    // Breathe between files: paint the UI, then a beat so the browser starts
    // the previous download before the next one is requested.
    if (index < total - 1) {
      await yieldToBrowser()
      await new Promise<void>((resolve) => setTimeout(resolve, 350))
    }
  }
}

function AddGuestForm({
  eventId,
  event,
  tables,
  autoExport,
  onExportStart,
  onSuccess,
}: {
  eventId: number
  /** Event model — needed to export the PDF when auto-export is on. */
  event: EventModel | undefined
  /** Seating registry for the quick table picker. */
  tables: EventTable[]
  autoExport: boolean
  onExportStart?: () => void
  onSuccess?: () => void
}) {
  const [name, setName] = useState('')
  const [civility, setCivility] = useState<InvitationCivility>('none')
  const [expiry, setExpiry] = useState('')
  const [tableChoice, setTableChoice] = useState('')
  const [tableNumber, setTableNumber] = useState('')
  const [tableText, setTableText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const queryClient = useQueryClient()

  function reset() {
    setName('')
    setCivility('none')
    setExpiry('')
    setTableChoice('')
    setTableNumber('')
    setTableText('')
  }

  const mutation = useMutation({
    mutationFn: (payload: InvitationPayload) => invitationsApi.create(eventId, payload),
    onSuccess: (invitation) => {
      reset()
      setError(null)
      setSuccess(true)
      onSuccess?.()
      void queryClient.invalidateQueries({ queryKey: ['invitations'] })
      void queryClient.invalidateQueries({ queryKey: ['event'] })
      if (autoExport && event) {
        onExportStart?.()
        void exportOneInvitation(event, invitation)
      }
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
    const payload: InvitationPayload = {
      guest_name: trimmed,
      civility,
      expires_at: expiryPayload(expiry),
    }
    if (tableChoice === TABLE_CUSTOM) {
      payload.table_number = tableNumber.trim()
      payload.table_text = tableText.trim()
    } else if (tableChoice !== '') {
      payload.table = Number(tableChoice)
    }
    mutation.mutate(payload)
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
            min={todayInputValue()}
            value={expiry}
            onChange={(event) => setExpiry(event.target.value)}
          />
        </Field>
        <Field id="guest-table-select" label={fr.guests.tableSelectLabel} hint={fr.guests.tableNumberHint}>
          <TableSelect id="guest-table-select" tables={tables} value={tableChoice} onChange={setTableChoice} />
        </Field>
        {tableChoice === TABLE_CUSTOM ? (
          <>
            <Field id="guest-table-number" label={fr.guests.tableNumberLabel}>
              <Input
                id="guest-table-number"
                placeholder={fr.guests.tableNumberPlaceholder}
                value={tableNumber}
                onChange={(event) => setTableNumber(event.target.value)}
              />
            </Field>
            <Field id="guest-table-text" label={fr.guests.tableTextLabel}>
              <Input
                id="guest-table-text"
                placeholder={fr.guests.tableTextPlaceholder}
                value={tableText}
                onChange={(event) => setTableText(event.target.value)}
              />
            </Field>
          </>
        ) : null}
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

function BulkAddForm({
  eventId,
  event,
  tables,
  autoExport,
  onExportStart,
  onExportProgress,
  onSuccess,
}: {
  eventId: number
  /** Event model — needed to export the PDFs when auto-export is on. */
  event: EventModel | undefined
  /** Seating registry for the per-row table picker. */
  tables: EventTable[]
  autoExport: boolean
  onExportStart?: () => void
  onExportProgress?: (state: ExportProgressState) => void
  onSuccess?: () => void
}) {
  const [lines, setLines] = useState('')
  const [rows, setRows] = useState<BulkRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [exporting, setExporting] = useState(false)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (invitations: InvitationPayload[]) => invitationsApi.bulkCreate(eventId, invitations),
    onSuccess: async (result) => {
      setLines('')
      setRows([])
      setError(null)
      setSuccess(true)
      void queryClient.invalidateQueries({ queryKey: ['invitations'] })
      void queryClient.invalidateQueries({ queryKey: ['event'] })
      const created = result.invitations ?? []
      if (autoExport && event && created.length > 0) {
        setExporting(true)
        onExportStart?.()
        try {
          await exportInvitationsBatch(event, created, (state) => onExportProgress?.(state))
        } finally {
          setExporting(false)
        }
      }
      onSuccess?.()
    },
    onError: (err: unknown) => {
      setSuccess(false)
      setError(errorMessage(err))
    },
  })

  function seedRows() {
    const seeded = lines
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((guest_name) => ({ ...emptyBulkRow(), guest_name }))
    setRows(seeded)
  }

  function updateRow(index: number, patch: Partial<BulkRow>) {
    setRows((current) => current.map((row, position) => (position === index ? { ...row, ...patch } : row)))
  }

  function removeRow(index: number) {
    setRows((current) => current.filter((_, position) => position !== index))
  }

  const count = rows.length

  function submit(event: FormEvent) {
    event.preventDefault()
    setSuccess(false)
    if (rows.length === 0) {
      setError(fr.guests.bulkEmpty)
      return
    }
    const blank = rows.findIndex((row) => !row.guest_name.trim())
    if (blank >= 0) {
      setError(fr.guests.bulkEmpty)
      return
    }
    setError(null)
    mutation.mutate(
      rows.map((row) => {
        const payload: InvitationPayload = { guest_name: row.guest_name.trim() }
        if (row.civility !== 'none') payload.civility = row.civility
        if (row.table === TABLE_CUSTOM) {
          if (row.table_number.trim()) payload.table_number = row.table_number.trim()
          if (row.table_text.trim()) payload.table_text = row.table_text.trim()
        } else if (row.table !== '') {
          payload.table = Number(row.table)
        }
        return payload
      }),
    )
  }

  const busy = mutation.isPending || exporting

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
        {rows.length === 0 ? (
          <Field id="guest-bulk" label={fr.guests.bulkLabel} hint={fr.guests.bulkHint}>
            <Textarea
              id="guest-bulk"
              rows={5}
              placeholder={fr.guests.bulkPlaceholder}
              value={lines}
              onChange={(event) => setLines(event.target.value)}
            />
          </Field>
        ) : null}

        {rows.length === 0 ? (
          <Button type="button" variant="secondary" onClick={seedRows} disabled={!lines.trim()}>
            {fr.guests.bulkSeedRows}
          </Button>
        ) : null}

        {rows.length > 0 ? (
          <div className="space-y-2">
            <ul className="space-y-2">
              {rows.map((row, index) => (
                <li
                  key={index}
                  className="grid grid-cols-1 items-end gap-2 rounded-card bg-surface-muted/60 p-3 ring-1 ring-inset ring-line sm:grid-cols-[minmax(0,1.4fr)_10rem_minmax(0,1fr)_auto]"
                >
                  <Field id={`bulk-row-${index}-name`} label={fr.guests.bulkGuestName} required>
                    <Input
                      id={`bulk-row-${index}-name`}
                      placeholder={fr.guests.addNamePlaceholder}
                      value={row.guest_name}
                      onChange={(event) => updateRow(index, { guest_name: event.target.value })}
                    />
                  </Field>
                  <Field id={`bulk-row-${index}-civility`} label={fr.guests.addCivilityLabel}>
                    <Select
                      id={`bulk-row-${index}-civility`}
                      value={row.civility}
                      onChange={(event) =>
                        updateRow(index, { civility: event.target.value as InvitationCivility })
                      }
                    >
                      {CIVILITIES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field id={`bulk-row-${index}-table`} label={fr.guests.tableSelectLabel}>
                    <TableSelect
                      id={`bulk-row-${index}-table`}
                      tables={tables}
                      value={row.table}
                      onChange={(value) => updateRow(index, { table: value })}
                    />
                  </Field>
                  <div className="flex justify-end">
                    <RowAction
                      label={fr.guests.bulkRemoveRow}
                      icon={<IconTrash className="h-4 w-4" />}
                      tone="danger"
                      onClick={() => removeRow(index)}
                    />
                  </div>
                  {row.table === TABLE_CUSTOM ? (
                    <div className="grid grid-cols-1 gap-2 sm:col-span-4 sm:grid-cols-2">
                      <Field id={`bulk-row-${index}-table-number`} label={fr.guests.tableNumberLabel}>
                        <Input
                          id={`bulk-row-${index}-table-number`}
                          placeholder={fr.guests.tableNumberPlaceholder}
                          value={row.table_number}
                          onChange={(event) => updateRow(index, { table_number: event.target.value })}
                        />
                      </Field>
                      <Field id={`bulk-row-${index}-table-text`} label={fr.guests.tableTextLabel}>
                        <Input
                          id={`bulk-row-${index}-table-text`}
                          placeholder={fr.guests.tableTextPlaceholder}
                          value={row.table_text}
                          onChange={(event) => updateRow(index, { table_text: event.target.value })}
                        />
                      </Field>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setRows((current) => [...current, emptyBulkRow()])}
            >
              <IconPlus className="h-4 w-4" />
              {fr.guests.bulkAddRow}
            </Button>
          </div>
        ) : null}

        {rows.length > 0 ? (
          <Button type="submit" variant="secondary" loading={busy}>
            {fr.guests.bulkSubmit}
          </Button>
        ) : null}
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
  tables,
}: {
  invitation: Invitation
  /** Event model — supplies the artwork for the PDF export. */
  event: EventModel | undefined
  /** Seating registry for the table picker. */
  tables: EventTable[]
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
  const [tableNumber, setTableNumber] = useState(invitation.table_number)
  const [tableText, setTableText] = useState(invitation.table_text)
  const [tableId, setTableId] = useState<number | null>(invitation.table)
  // Explicit select state ('' none / registry id / TABLE_CUSTOM) — NOT derived
  // from tableNumber, so clearing the manual number input can't flip the mode.
  const [tableMode, setTableMode] = useState<string>(() =>
    tableSelectValue(tables, invitation.table, invitation.table_number),
  )
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
  const [exportProgress, setExportProgress] = useState<ExportProgressState | null>(null)

  async function exportPdf() {
    if (!event || exporting) return
    setExporting(true)
    setExportProgress({ percent: 0, current: 1, total: 1, filePercent: 0 })
    setNotice(null)
    setError(null)
    try {
      await exportOneInvitation(event, invitation, (filePercent) =>
        setExportProgress({ percent: filePercent, current: 1, total: 1, filePercent }),
      )
      setNotice(fr.guests.exported)
    } catch (caught) {
      // An incomplete invitation is never downloaded: say so precisely.
      setError(caught instanceof ExportImagesError ? fr.common.exportImagesFailed : fr.guests.exportError)
    } finally {
      setExporting(false)
      setExportProgress(null)
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
    // PATCH partial: only send the date when it was edited — re-sending an
    // untouched (possibly already past) value would be re-validated and
    // rejected by the server even for an unrelated guest-name fix.
    const payload: Partial<InvitationPayload> = {
      guest_name: trimmed,
      civility,
      table_number: tableNumber.trim(),
      table_text: tableText.trim(),
    }
    // The table picker is authoritative for the link: a registry id copies
    // that table's values server-side; `null` clears the link; leaving the
    // field untouched keeps the existing strings (free text preserved).
    if (tableId !== invitation.table) {
      payload.table = tableId
    }
    if (expiry !== expiryInputValue(invitation.expires_at)) {
      payload.expires_at = expiryPayload(expiry)
    }
    updateMutation.mutate(payload)
  }

  function onEditTableSelect(value: string) {
    setTableMode(value)
    if (value === TABLE_CUSTOM) {
      setTableId(null)
      return
    }
    if (value === '') {
      setTableId(null)
      setTableNumber('')
      setTableText('')
      return
    }
    const picked = tables.find((table) => String(table.id) === value)
    if (picked) {
      setTableId(picked.id)
      setTableNumber(picked.number)
      setTableText(picked.text)
    }
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
            {invitation.presence_confirmed_at ? (
              <Badge tone="success" dot>
                {fr.guests.presenceBadge}
              </Badge>
            ) : null}
            {invitation.table_number ? (
              <Badge tone="neutral">
                {fr.guests.tableBadge.replace('{number}', invitation.table_number)}
              </Badge>
            ) : null}
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

      {/* While the edit dialog is open its own alert carries the message —
          keeping this one hidden avoids duplicate role="alert" announcements. */}
      {!editing && (notice || error || exportProgress) ? (
        <div className="space-y-2 px-4 pb-3 sm:pl-[4.25rem] sm:pr-5">
          {exportProgress ? (
            <ProgressBar
              value={exportProgress.percent}
              label={fr.guests.exportProgress}
              caption={fr.guests.exportProgressDone}
            />
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
              min={minInputValue(invitation.expires_at)}
              value={expiry}
              onChange={(event) => setExpiry(event.target.value)}
            />
          </Field>
          <Field
            id={`guest-${invitation.id}-table-select`}
            label={fr.guests.tableSelectLabel}
            hint={fr.guests.tableNumberHint}
            className="sm:col-span-2"
          >
            <TableSelect
              id={`guest-${invitation.id}-table-select`}
              tables={tables}
              value={tableMode}
              onChange={onEditTableSelect}
            />
          </Field>
          {tableMode === TABLE_CUSTOM ? (
            <>
              <Field
                id={`guest-${invitation.id}-table-number`}
                label={fr.guests.tableNumberLabel}
              >
                <Input
                  id={`guest-${invitation.id}-table-number`}
                  placeholder={fr.guests.tableNumberPlaceholder}
                  value={tableNumber}
                  onChange={(event) => setTableNumber(event.target.value)}
                />
              </Field>
              <Field id={`guest-${invitation.id}-table-text`} label={fr.guests.tableTextLabel}>
                <Input
                  id={`guest-${invitation.id}-table-text`}
                  placeholder={fr.guests.tableTextPlaceholder}
                  value={tableText}
                  onChange={(event) => setTableText(event.target.value)}
                />
              </Field>
            </>
          ) : null}
          <div className="flex flex-col-reverse gap-2 pt-1 sm:col-span-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
              {fr.common.cancel}
            </Button>
            <Button type="submit" loading={updateMutation.isPending}>
              {fr.guests.save}
            </Button>
          </div>
        </form>
        {error ? (
          <p role="alert" className="mt-3 text-sm text-danger">
            {error}
          </p>
        ) : null}
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

/** "Gérer les tables" — the seating registry (ajouter / supprimer une table). */
function TablesManager({ eventId }: { eventId: number }) {
  const [open, setOpen] = useState(false)
  const [number, setNumber] = useState('')
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const tablesQuery = useQuery({
    queryKey: ['event-tables', eventId],
    queryFn: () => eventsApi.listTables(eventId),
    enabled: Number.isFinite(eventId) && open,
  })

  const createMutation = useMutation({
    mutationFn: (payload: EventTablePayload) => eventsApi.createTable(eventId, payload),
    onSuccess: () => {
      setNumber('')
      setText('')
      setError(null)
      void queryClient.invalidateQueries({ queryKey: ['event-tables', eventId] })
    },
    onError: (err: unknown) => setError(errorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: (tableId: number) => eventsApi.removeTable(eventId, tableId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['event-tables', eventId] }),
  })

  const tables = tablesQuery.data ?? []

  function submit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    const trimmed = number.trim()
    if (!trimmed) {
      setError(fr.common.requiredField)
      return
    }
    createMutation.mutate({ number: trimmed, text: text.trim() })
  }

  return (
    <section aria-labelledby="tables-title">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 id="tables-title" className="text-sm font-semibold text-ink">
            {fr.guests.tablesTitle}
          </h3>
          <p className="mt-1 text-xs text-ink-faint">{fr.guests.tablesHint}</p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={() => setOpen((value) => !value)}>
          {open ? fr.common.close : fr.guests.manageTables}
        </Button>
      </div>

      {open ? (
        <div className="mt-4 space-y-4">
          <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={submit}>
            <div className="flex-1">
              <Field id="table-number" label={fr.guests.tablesNumberLabel} required>
                <Input
                  id="table-number"
                  placeholder={fr.guests.tablesNumberPlaceholder}
                  value={number}
                  onChange={(event) => setNumber(event.target.value)}
                />
              </Field>
            </div>
            <div className="flex-1">
              <Field id="table-text" label={fr.guests.tableTextLabel}>
                <Input
                  id="table-text"
                  placeholder={fr.guests.tableTextPlaceholder}
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                />
              </Field>
            </div>
            <Button type="submit" loading={createMutation.isPending}>
              {fr.guests.tablesAddSubmit}
            </Button>
          </form>
          {error ? (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          ) : null}
          {tablesQuery.isPending ? <SkeletonRows rows={3} /> : null}
          {tablesQuery.isSuccess && tables.length === 0 ? (
            <p className="text-sm text-ink-faint">{fr.guests.tablesEmpty}</p>
          ) : null}
          {tables.length > 0 ? (
            <ul className="divide-y divide-line rounded-card ring-1 ring-inset ring-line">
              {tables.map((table) => (
                <li key={table.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-ink">
                      {fr.guests.tableBadge.replace('{number}', table.number)}
                    </span>
                    {table.text ? <span className="ml-2 text-xs text-ink-faint">{table.text}</span> : null}
                  </div>
                  <RowAction
                    label={fr.guests.tablesDelete}
                    icon={<IconTrash className="h-4 w-4" />}
                    tone="danger"
                    loading={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate(table.id)}
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

export function GuestsPage() {
  const { id } = useParams()
  const eventId = Number(id)
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '')
  const [addOpen, setAddOpen] = useState(false)
  const [autoExport, setAutoExport] = useState(false)
  const [exportProgress, setExportProgress] = useState<ExportProgressState | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const q = searchParams.get('q') ?? ''
  const state = (searchParams.get('etat') ?? '') as InvitationState | ''
  const page = Number(searchParams.get('page') ?? '1') || 1

  const eventQuery = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsApi.get(eventId),
    enabled: Number.isFinite(eventId),
  })

  const tablesQuery = useQuery({
    queryKey: ['event-tables', eventId],
    queryFn: () => eventsApi.listTables(eventId),
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
  const tables = tablesQuery.data ?? []
  const totalPages = query.data ? Math.max(1, Math.ceil(query.data.count / 25)) : 1

  function closeModal() {
    setAddOpen(false)
    setExportProgress(null)
  }

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
              to={`/evenements/${eventId}/verification`}
              className={buttonClasses('accent', 'lg', 'flex-1 sm:flex-none')}
            >
              <IconQr className="h-5 w-5" />
              {fr.verify.scanner.title}
            </Link>
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
        onClose={closeModal}
        ariaLabel={fr.guests.addTitle}
        title={fr.guests.addTitle}
        description={fr.guests.addModalHint}
        size="lg"
      >
        <div className="space-y-6">
          <Toggle
            id="auto-export"
            checked={autoExport}
            onChange={setAutoExport}
            label={fr.guests.autoExportLabel}
          />
          {exportProgress ? (
            <ProgressBar
              value={exportProgress.percent}
              label={fr.guests.exportProgress}
              caption={fr.guests.exportProgressGuest
                .replace('{current}', String(exportProgress.current))
                .replace('{total}', String(exportProgress.total))}
            />
          ) : null}
          <AddGuestForm
            eventId={eventId}
            event={eventQuery.data}
            tables={tables}
            autoExport={autoExport}
            onSuccess={() => {
              closeModal()
              setNotice(fr.guests.addSuccess)
            }}
          />
          <div className="h-px bg-line" />
          <BulkAddForm
            eventId={eventId}
            event={eventQuery.data}
            tables={tables}
            autoExport={autoExport}
            onExportStart={() => setExportProgress({ percent: 0, current: 1, total: 1, filePercent: 0 })}
            onExportProgress={setExportProgress}
            onSuccess={() => {
              closeModal()
              setNotice(fr.guests.bulkSuccess)
            }}
          />
        </div>
      </Modal>

      <Card>
        <TablesManager eventId={eventId} />
      </Card>

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
                <GuestRow key={invitation.id} invitation={invitation} event={eventQuery.data} tables={tables} />
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
