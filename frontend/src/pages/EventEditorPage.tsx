/**
 * Event model editor (`/evenements/nouveau`, `/evenements/:id`).
 *
 * Edits the shared invitation model: content, design choices (template,
 * emphasis, cover) and preference questions. Changes propagate to every
 * invitation generated from this model (prompt §8) — the UI says so.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import QRCode from 'qrcode'

import { Alert } from '../design-system/Alert.tsx'
import { Button } from '../design-system/Button.tsx'
import { Card, CardBody, CardHeader } from '../design-system/Card.tsx'
import { Field } from '../design-system/Field.tsx'
import { Input, Select } from '../design-system/Input.tsx'
import { IconChevronLeft } from '../design-system/icons.tsx'
import { ErrorState, LoadingState } from '../design-system/states.tsx'
import { ApiError, eventsApi } from '../lib/api.ts'
import type {
  EventPayload,
  PreferenceQuestionPayload,
  ProgramItemPayload,
} from '../lib/types.ts'
import { fr } from '../locales/fr.ts'
import { InvitationDownloadButton } from '../templates/InvitationDownloadButton.tsx'
import { MESSAGE_FONTS } from '../templates/messageFonts.ts'
import { FONT_SIZES, fontScaleStyle } from '../templates/fontSizes.ts'
import { TEMPLATES, emptyDraft, getTemplate } from '../templates/registry.tsx'
import type { InvitationDraft } from '../templates/types.ts'

const COVER_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_COVER_BYTES = 4 * 1024 * 1024

interface QuestionDraft {
  id?: number
  label: string
  help_text: string
  input_type: 'single' | 'multiple'
  required: boolean
  is_active: boolean
  options: Array<{ id?: number; label: string }>
}

function blankQuestion(): QuestionDraft {
  return {
    label: '',
    help_text: '',
    input_type: 'single',
    required: false,
    is_active: true,
    options: [{ label: '' }],
  }
}

interface DressCodeRow {
  /** Set for server-stored images; absent for pending uploads. */
  id?: number
  /** Server URL, or a local object URL while the upload is pending. */
  url: string
  caption: string
  /** Pending file — uploaded when the event is saved. */
  file?: File
  /** Caption as stored server-side, to detect unsaved edits. */
  savedCaption?: string
}

interface ProgramRowDraft {
  id?: number
  /** `HH:mm` from the time input. */
  start_time: string
  /** `HH:mm` — empty means a single time, not a range. */
  end_time: string
  description: string
}

function emphasisLabel(field: string): string {
  const labels = fr.editor.emphasisFields as Record<string, string>
  return labels[field] ?? field
}

export function EventEditorPage() {
  const { id } = useParams()
  const eventId = id ? Number(id) : null
  const isEdit = eventId !== null && Number.isFinite(eventId)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()

  const [templateKey, setTemplateKey] = useState(
    () => searchParams.get('modele') ?? TEMPLATES[0].key,
  )
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [messageFont, setMessageFont] = useState('classique')
  const [fontSize, setFontSize] = useState('normale')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [timezone, setTimezone] = useState('Africa/Kinshasa')
  const [venueName, setVenueName] = useState('')
  const [venueAddress, setVenueAddress] = useState('')
  const [venueDetails, setVenueDetails] = useState('')
  const [emphasis, setEmphasis] = useState<string[]>([])
  const [questions, setQuestions] = useState<QuestionDraft[]>([])
  const [dressRows, setDressRows] = useState<DressCodeRow[]>([])
  const [removedDressIds, setRemovedDressIds] = useState<number[]>([])
  const [dressError, setDressError] = useState<string | null>(null)
  const [programRows, setProgramRows] = useState<ProgramRowDraft[]>([])
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [coverRemoved, setCoverRemoved] = useState(false)
  const [coverError, setCoverError] = useState<string | null>(null)
  const [coverText, setCoverText] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [previewDockOpen, setPreviewDockOpen] = useState(true)

  const eventQuery = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsApi.get(eventId as number),
    enabled: isEdit,
  })
  const hydrated = useRef(false)
  const previewCardRef = useRef<HTMLDivElement>(null)
  const [qrDataUrl, setQrDataUrl] = useState('')

  const template = getTemplate(templateKey) ?? TEMPLATES[0]

  useEffect(() => {
    const data = eventQuery.data
    if (!data || hydrated.current) return
    hydrated.current = true
    setTemplateKey(data.template)
    setTitle(data.title)
    setMessage(data.message)
    setMessageFont(data.message_font || 'classique')
    setFontSize(data.font_size || 'normale')
    setEventDate(data.event_date)
    setEventTime(data.event_time)
    setTimezone(data.timezone)
    setVenueName(data.venue_name)
    setVenueAddress(data.venue_address)
    setVenueDetails(data.venue_details)
    setCoverText(data.cover_title)
    setEmphasis(data.display_config.emphasis ?? [])
    setCoverRemoved(false)
    setQuestions(
      data.preference_questions.map((question) => ({
        id: question.id,
        label: question.label,
        help_text: question.help_text,
        input_type: question.input_type,
        required: question.required,
        is_active: question.is_active,
        options: question.options.map((option) => ({ id: option.id, label: option.label })),
      })),
    )
    setDressRows(
      data.dress_code.map((image) => ({
        id: image.id,
        url: image.url,
        caption: image.caption,
        savedCaption: image.caption,
      })),
    )
    setRemovedDressIds([])
    setProgramRows(
      data.program_items.map((item) => ({
        id: item.id,
        start_time: item.start_time.slice(0, 5),
        end_time: item.end_time ? item.end_time.slice(0, 5) : '',
        description: item.description,
      })),
    )
  }, [eventQuery.data])

  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(`${window.location.origin}/`, {
      width: 340,
      margin: 1,
      color: { dark: '#1a261f', light: '#ffffff' },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url)
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl('')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const previewDraft: InvitationDraft = useMemo(
    () =>
      emptyDraft({
        title: title || 'Titre de l’événement',
        message,
        messageFont,
        fontSize,
        event_date: eventDate,
        event_time: eventTime,
        timezone,
        venue_name: venueName,
        venue_address: venueAddress,
        venue_details: venueDetails,
        cover_url: coverPreview ?? (coverRemoved ? null : (eventQuery.data?.cover_url ?? null)),
        coverTitle: coverText,
        emphasis,
        dressCode: dressRows.map((row) => ({ url: row.url, caption: row.caption })),
        program: programRows
          .filter((row) => row.start_time && row.description.trim())
          .map((row) => ({
            start_time: `${row.start_time}:00`,
            end_time: row.end_time ? `${row.end_time}:00` : null,
            description: row.description,
          })),
      }),
    [
      title,
      message,
      messageFont,
      fontSize,
      eventDate,
      eventTime,
      timezone,
      venueName,
      venueAddress,
      venueDetails,
      coverPreview,
      coverRemoved,
      eventQuery.data?.cover_url,
      coverText,
      emphasis,
      dressRows,
      programRows,
    ],
  )

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: EventPayload = {
        template: templateKey,
        title: title.trim(),
        message: message.trim(),
        message_font: messageFont,
        font_size: fontSize,
        event_date: eventDate,
        event_time: eventTime,
        timezone: timezone.trim() || 'Africa/Kinshasa',
        venue_name: venueName.trim(),
        venue_address: venueAddress.trim(),
        venue_details: venueDetails.trim(),
        cover_title: coverText.trim(),
        display_config: { emphasis },
        preference_questions: questions.map(
          (question, index): PreferenceQuestionPayload => ({
            id: question.id,
            label: question.label.trim(),
            help_text: question.help_text.trim(),
            input_type: question.input_type,
            required: question.required,
            order: index,
            is_active: question.is_active,
            options: question.options
              .filter((option) => option.label.trim())
              .map((option) => ({ id: option.id, label: option.label.trim() })),
          }),
        ),
        program_items: programRows
          .filter((row) => row.start_time || row.end_time || row.description.trim())
          .map(
            (row, index): ProgramItemPayload => ({
              id: row.id,
              start_time: `${row.start_time}:00`,
              end_time: row.end_time ? `${row.end_time}:00` : null,
              description: row.description.trim(),
              order: index,
            }),
          ),
      }
      const saved = isEdit
        ? await eventsApi.update(eventId as number, payload)
        : await eventsApi.create(payload)
      if (coverFile) {
        await eventsApi.uploadCover(saved.id, coverFile)
      } else if (coverRemoved && (eventQuery.data?.cover_url ?? null)) {
        await eventsApi.removeCover(saved.id)
      }
      // Dress-code gallery: deletions first so orders stay unique, then new
      // uploads (each carries its caption), then caption edits on stored rows.
      for (const removedId of removedDressIds) {
        await eventsApi.removeDressCode(saved.id, removedId)
      }
      for (const [index, row] of dressRows.entries()) {
        if (row.file) {
          await eventsApi.uploadDressCode(saved.id, row.file, row.caption.trim(), index)
        } else if (row.id !== undefined && row.caption !== row.savedCaption) {
          await eventsApi.updateDressCode(saved.id, row.id, { caption: row.caption.trim() })
        }
      }
      return saved
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['events'] })
      void queryClient.invalidateQueries({ queryKey: ['event', eventId] })
      navigate('/evenements')
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        setFormError(error.message)
        setFieldErrors(error.fields)
      } else {
        setFormError(fr.common.unexpectedError)
      }
    },
  })

  function handleCoverChange(file: File | null) {
    setCoverError(null)
    if (!file) return
    if (!COVER_TYPES.includes(file.type)) {
      setCoverError(fr.editor.coverRejected)
      return
    }
    if (file.size > MAX_COVER_BYTES) {
      setCoverError(fr.editor.coverTooLarge)
      return
    }
    setCoverFile(file)
    setCoverRemoved(false)
    setCoverPreview((previous) => {
      if (previous) URL.revokeObjectURL(previous)
      return URL.createObjectURL(file)
    })
  }

  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview)
    }
  }, [coverPreview])

  function handleDressFiles(files: FileList | null) {
    setDressError(null)
    if (!files) return
    const accepted: DressCodeRow[] = []
    for (const file of Array.from(files)) {
      if (!COVER_TYPES.includes(file.type)) {
        setDressError(fr.editor.coverRejected)
        continue
      }
      if (file.size > MAX_COVER_BYTES) {
        setDressError(fr.editor.coverTooLarge)
        continue
      }
      accepted.push({ url: URL.createObjectURL(file), caption: '', file })
    }
    if (accepted.length > 0) {
      setDressRows((current) => [...current, ...accepted])
    }
  }

  function removeDressRow(index: number) {
    const row = dressRows[index]
    if (!row) return
    if (row.id !== undefined) {
      setRemovedDressIds((ids) => [...ids, row.id as number])
    }
    if (row.file) URL.revokeObjectURL(row.url)
    setDressRows((current) => current.filter((_, i) => i !== index))
  }

  function updateProgramRow(index: number, patch: Partial<ProgramRowDraft>) {
    setProgramRows((current) =>
      current.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    )
  }

  // Release pending dress-code previews when the editor unmounts.
  const dressRowsRef = useRef(dressRows)
  useEffect(() => {
    dressRowsRef.current = dressRows
  }, [dressRows])
  useEffect(() => {
    return () => {
      for (const row of dressRowsRef.current) {
        if (row.file) URL.revokeObjectURL(row.url)
      }
    }
  }, [])

  function selectTemplate(key: string) {
    setTemplateKey(key)
    const next = getTemplate(key)
    if (next) {
      setEmphasis((current) => current.filter((field) => next.emphasisFields.includes(field)))
    }
  }

  function toggleEmphasis(field: string) {
    setEmphasis((current) =>
      current.includes(field) ? current.filter((item) => item !== field) : [...current, field],
    )
  }

  function handleSubmit() {
    setFormError(null)
    setFieldErrors({})
    if (!title.trim()) {
      setFieldErrors({ title: [fr.common.requiredField] })
      return
    }
    if (!eventDate || !eventTime) {
      const errors: Record<string, string[]> = {}
      if (!eventDate) errors.event_date = [fr.common.requiredField]
      if (!eventTime) errors.event_time = [fr.common.requiredField]
      setFieldErrors(errors)
      return
    }
    // Programme rows: fully empty rows are dropped, half-filled rows block.
    const filledProgram = programRows.filter(
      (row) => row.start_time || row.end_time || row.description.trim(),
    )
    if (filledProgram.some((row) => !row.start_time || !row.description.trim())) {
      setFieldErrors({ program_items: [fr.editor.programIncomplete] })
      return
    }
    mutation.mutate()
  }

  if (isEdit && eventQuery.isPending) return <LoadingState />
  if (isEdit && eventQuery.isError) {
    return (
      <ErrorState
        title={fr.editor.loadError}
        onRetry={() => void eventQuery.refetch()}
      />
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">
            {isEdit ? fr.editor.editTitle : fr.editor.createTitle}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">{fr.editor.sharedNote}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/evenements"
            className="inline-flex h-10 items-center rounded-md border border-line-strong bg-surface px-4 text-sm font-medium text-ink transition-colors duration-150 hover:bg-surface-muted"
          >
            {fr.common.cancel}
          </Link>
          <Button loading={mutation.isPending} onClick={handleSubmit}>
            {mutation.isPending ? fr.editor.saving : isEdit ? fr.editor.save : fr.editor.create}
          </Button>
        </div>
      </header>

      {formError ? (
        <Alert tone="danger">
          <p>{formError}</p>
          {Object.keys(fieldErrors).length > 0 ? (
            <ul className="mt-1 list-inside list-disc">
              {Object.entries(fieldErrors).map(([key, messages]) => (
                <li key={key}>
                  {key}: {messages.join(' ')}
                </li>
              ))}
            </ul>
          ) : null}
        </Alert>
      ) : null}

      {/* Mobile live preview — stays in view while the form is filled. */}
      <div className="lg:hidden">
        <div className="sticky top-16 z-10 border-b border-line bg-paper/95 backdrop-blur">
          <button
            type="button"
            onClick={() => setPreviewDockOpen((open) => !open)}
            aria-expanded={previewDockOpen}
            className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium text-ink transition-colors duration-150 hover:bg-surface-muted"
          >
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-pill bg-brand" aria-hidden="true" />
              {fr.editor.previewLive}
            </span>
            <IconChevronLeft
              className={`h-4 w-4 text-ink-soft transition-transform duration-200 ${previewDockOpen ? '-rotate-90' : 'rotate-90'}`}
            />
          </button>
          {previewDockOpen ? (
            <div className="flex justify-center px-4 pb-4">
              <div className="max-h-[60vh] w-[min(52vw,200px)] overflow-y-auto rounded-md border border-line bg-surface-muted">
                <div className="flex w-full flex-col" style={fontScaleStyle(fontSize)}>
                  <template.Component draft={previewDraft} />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <div className="space-y-6">
          <Card>
            <CardHeader
              title={fr.editor.templateLabel}
              description={fr.editor.templateHint}
            />
            <CardBody>
              <Select
                aria-label={fr.editor.templateLabel}
                value={templateKey}
                onChange={(event) => selectTemplate(event.target.value)}
              >
                {TEMPLATES.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.name} — {item.categoryLabel}
                  </option>
                ))}
              </Select>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={fr.editor.contentTitle} />
            <CardBody className="space-y-4">
              <Field
                id="event-title"
                label={fr.editor.titleLabel}
                required
                error={fieldErrors.title?.[0]}
              >
                <Input
                  id="event-title"
                  value={title}
                  invalid={Boolean(fieldErrors.title)}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </Field>
              <Field
                id="event-message"
                label={fr.editor.messageLabel}
                error={fieldErrors.message?.[0]}
              >
                <textarea
                  id="event-message"
                  rows={4}
                  value={message}
                  className="w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  onChange={(event) => setMessage(event.target.value)}
                />
              </Field>
              <Field
                id="event-message-font"
                label={fr.editor.messageFontLabel}
                hint={fr.editor.messageFontHint}
              >
                <div
                  role="radiogroup"
                  aria-label={fr.editor.messageFontLabel}
                  className="flex flex-wrap gap-2"
                >
                  {MESSAGE_FONTS.map((font) => {
                    const selected = font.key === messageFont
                    return (
                      <button
                        key={font.key}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setMessageFont(font.key)}
                        className={`flex items-center gap-2 rounded-pill border px-3.5 py-2 text-sm transition-colors duration-150 ${
                          selected
                            ? 'border-brand bg-brand text-paper'
                            : 'border-line-strong text-ink-soft hover:border-brand/60 hover:text-ink'
                        }`}
                      >
                        <span
                          className="text-lg leading-none"
                          style={{ fontFamily: font.css }}
                          aria-hidden="true"
                        >
                          Aa
                        </span>
                        <span>{font.label}</span>
                      </button>
                    )
                  })}
                </div>
              </Field>
              <Field
                id="event-font-size"
                label={fr.editor.fontSizeLabel}
                hint={fr.editor.fontSizeHint}
              >
                <div
                  role="radiogroup"
                  aria-label={fr.editor.fontSizeLabel}
                  className="flex flex-wrap gap-2"
                >
                  {FONT_SIZES.map((size) => {
                    const selected = size.key === fontSize
                    return (
                      <button
                        key={size.key}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setFontSize(size.key)}
                        className={`flex items-center gap-2 rounded-pill border px-3.5 py-2 text-sm transition-colors duration-150 ${
                          selected
                            ? 'border-brand bg-brand text-paper'
                            : 'border-line-strong text-ink-soft hover:border-brand/60 hover:text-ink'
                        }`}
                      >
                        <span
                          className="leading-none"
                          style={{ fontSize: `${size.scale * 1.1}rem` }}
                          aria-hidden="true"
                        >
                          Aa
                        </span>
                        <span>{size.label}</span>
                      </button>
                    )
                  })}
                </div>
              </Field>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={fr.editor.scheduleTitle} />
            <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                id="event-date"
                label={fr.editor.dateLabel}
                required
                error={fieldErrors.event_date?.[0]}
              >
                <Input
                  id="event-date"
                  type="date"
                  value={eventDate}
                  invalid={Boolean(fieldErrors.event_date)}
                  onChange={(event) => setEventDate(event.target.value)}
                />
              </Field>
              <Field
                id="event-time"
                label={fr.editor.timeLabel}
                required
                error={fieldErrors.event_time?.[0]}
              >
                <Input
                  id="event-time"
                  type="time"
                  value={eventTime}
                  invalid={Boolean(fieldErrors.event_time)}
                  onChange={(event) => setEventTime(event.target.value)}
                />
              </Field>
              <Field
                id="event-timezone"
                label={fr.editor.timezoneLabel}
                hint={fr.editor.timezoneHint}
                error={fieldErrors.timezone?.[0]}
              >
                <Input
                  id="event-timezone"
                  value={timezone}
                  invalid={Boolean(fieldErrors.timezone)}
                  onChange={(event) => setTimezone(event.target.value)}
                />
              </Field>
              <Field
                id="event-venue-name"
                label={fr.editor.venueNameLabel}
                error={fieldErrors.venue_name?.[0]}
              >
                <Input
                  id="event-venue-name"
                  value={venueName}
                  onChange={(event) => setVenueName(event.target.value)}
                />
              </Field>
              <Field
                id="event-venue-address"
                label={fr.editor.venueAddressLabel}
                error={fieldErrors.venue_address?.[0]}
              >
                <Input
                  id="event-venue-address"
                  value={venueAddress}
                  onChange={(event) => setVenueAddress(event.target.value)}
                />
              </Field>
              <Field
                id="event-venue-details"
                label={fr.editor.venueDetailsLabel}
                error={fieldErrors.venue_details?.[0]}
              >
                <Input
                  id="event-venue-details"
                  value={venueDetails}
                  onChange={(event) => setVenueDetails(event.target.value)}
                />
              </Field>
            </CardBody>
          </Card>

          {template.supportsCover ? (
            <Card>
              <CardHeader title={fr.editor.coverTitle} description={fr.editor.coverHint} />
              <CardBody className="space-y-3">
                {previewDraft.cover_url ? (
                  <div className="flex items-center gap-4">
                    <img
                      src={previewDraft.cover_url}
                      alt=""
                      className="h-24 w-36 rounded-md border border-line object-cover"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setCoverFile(null)
                        setCoverRemoved(true)
                        setCoverPreview((previous) => {
                          if (previous) URL.revokeObjectURL(previous)
                          return null
                        })
                      }}
                    >
                      {fr.editor.coverRemove}
                    </Button>
                  </div>
                ) : (
                  <label className="inline-flex h-10 cursor-pointer items-center rounded-md border border-line-strong bg-surface px-4 text-sm font-medium text-ink transition-colors duration-150 hover:bg-surface-muted">
                    {fr.editor.coverUpload}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={(event) => handleCoverChange(event.target.files?.[0] ?? null)}
                    />
                  </label>
                )}
                {coverError ? (
                  <p role="alert" className="text-xs text-danger">
                    {coverError}
                  </p>
                ) : null}
                <Field
                  id="event-cover-text"
                  label={fr.editor.coverTextLabel}
                  hint={fr.editor.coverTextHelp}
                  error={fieldErrors.cover_title?.[0]}
                >
                  <Input
                    id="event-cover-text"
                    value={coverText}
                    placeholder={fr.editor.coverTextPlaceholder}
                    onChange={(event) => setCoverText(event.target.value)}
                  />
                </Field>
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardHeader
              title={fr.editor.dressCodeTitle}
              description={fr.editor.dressCodeHint}
              action={
                <label className="inline-flex h-9 cursor-pointer items-center rounded-md border border-line-strong bg-surface px-3 text-sm font-medium text-ink transition-colors duration-150 hover:bg-surface-muted">
                  {fr.editor.dressCodeUpload}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="sr-only"
                    onChange={(event) => {
                      handleDressFiles(event.target.files)
                      event.target.value = ''
                    }}
                  />
                </label>
              }
            />
            <CardBody className="space-y-3">
              {dressRows.length === 0 ? (
                <p className="text-sm text-ink-soft">{fr.editor.dressCodeHint}</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {dressRows.map((row, index) => (
                    <div
                      key={row.id ?? `new-${index}`}
                      className="space-y-2 rounded-md border border-line p-3"
                    >
                      <img
                        src={row.url}
                        alt=""
                        className="h-32 w-full rounded-md border border-line object-cover"
                      />
                      <Field
                        id={`dress-${index}-caption`}
                        label={fr.editor.dressCodeCaption}
                      >
                        <Input
                          id={`dress-${index}-caption`}
                          value={row.caption}
                          placeholder={fr.editor.dressCodeCaptionPlaceholder}
                          onChange={(event) =>
                            setDressRows((current) =>
                              current.map((item, i) =>
                                i === index ? { ...item, caption: event.target.value } : item,
                              ),
                            )
                          }
                        />
                      </Field>
                      <Button variant="ghost" size="sm" onClick={() => removeDressRow(index)}>
                        {fr.editor.dressCodeRemove}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {dressError ? (
                <p role="alert" className="text-xs text-danger">
                  {dressError}
                </p>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title={fr.editor.programTitle}
              description={fr.editor.programHint}
              action={
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setProgramRows((current) => [
                      ...current,
                      { start_time: '', end_time: '', description: '' },
                    ])
                  }
                >
                  {fr.editor.addProgramItem}
                </Button>
              }
            />
            <CardBody className="space-y-4">
              {programRows.length === 0 ? (
                <p className="text-sm text-ink-soft">{fr.editor.programHint}</p>
              ) : null}
              {programRows.map((row, index) => (
                <div
                  key={row.id ?? `new-${index}`}
                  className="space-y-3 rounded-md border border-line p-4"
                >
                  <div className="flex flex-wrap items-end gap-4">
                    <Field id={`program-${index}-start`} label={fr.editor.programStart} required>
                      <Input
                        id={`program-${index}-start`}
                        type="time"
                        value={row.start_time}
                        onChange={(event) => updateProgramRow(index, { start_time: event.target.value })}
                      />
                    </Field>
                    <Field id={`program-${index}-end`} label={fr.editor.programEnd}>
                      <Input
                        id={`program-${index}-end`}
                        type="time"
                        value={row.end_time}
                        onChange={(event) => updateProgramRow(index, { end_time: event.target.value })}
                      />
                    </Field>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setProgramRows((current) => current.filter((_, i) => i !== index))
                      }
                    >
                      {fr.editor.removeProgramItem}
                    </Button>
                  </div>
                  <Field
                    id={`program-${index}-description`}
                    label={fr.editor.programDescription}
                    required
                  >
                    <Input
                      id={`program-${index}-description`}
                      value={row.description}
                      placeholder={fr.editor.programDescriptionPlaceholder}
                      onChange={(event) =>
                        updateProgramRow(index, { description: event.target.value })
                      }
                    />
                  </Field>
                </div>
              ))}
              {fieldErrors.program_items ? (
                <p role="alert" className="text-xs text-danger">
                  {fieldErrors.program_items.join(' ')}
                </p>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={fr.editor.emphasisTitle} description={fr.editor.emphasisHint} />
            <CardBody className="flex flex-wrap gap-3">
              {template.emphasisFields.map((field) => (
                <label key={field} className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={emphasis.includes(field)}
                    onChange={() => toggleEmphasis(field)}
                  />
                  {emphasisLabel(field)}
                </label>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title={fr.editor.questionsTitle}
              description={fr.editor.questionsHint}
              action={
                <Button size="sm" variant="secondary" onClick={() => setQuestions((current) => [...current, blankQuestion()])}>
                  {fr.editor.addQuestion}
                </Button>
              }
            />
            <CardBody className="space-y-4">
              {questions.length === 0 ? (
                <p className="text-sm text-ink-soft">{fr.editor.questionsHint}</p>
              ) : null}
              {questions.map((question, index) => (
                <div key={question.id ?? `new-${index}`} className="space-y-3 rounded-md border border-line p-4">
                  <div className="flex items-start justify-between gap-3">
                    <Field
                      id={`question-${index}-label`}
                      label={fr.editor.questionLabel}
                      required
                      error={fieldErrors[`preference_questions.${index}.label`]?.[0]}
                    >
                      <Input
                        id={`question-${index}-label`}
                        value={question.label}
                        onChange={(event) =>
                          setQuestions((current) =>
                            current.map((item, i) =>
                              i === index ? { ...item, label: event.target.value } : item,
                            ),
                          )
                        }
                      />
                    </Field>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setQuestions((current) => current.filter((_, i) => i !== index))
                      }
                    >
                      {fr.editor.removeQuestion}
                    </Button>
                  </div>
                  <Field
                    id={`question-${index}-help`}
                    label={fr.editor.questionHelp}
                    error={fieldErrors[`preference_questions.${index}.help_text`]?.[0]}
                  >
                    <Input
                      id={`question-${index}-help`}
                      value={question.help_text}
                      onChange={(event) =>
                        setQuestions((current) =>
                          current.map((item, i) =>
                            i === index ? { ...item, help_text: event.target.value } : item,
                          ),
                        )
                      }
                    />
                  </Field>
                  <div className="flex flex-wrap items-end gap-4">
                    <Field id={`question-${index}-type`} label={fr.editor.questionType}>
                      <Select
                        id={`question-${index}-type`}
                        value={question.input_type}
                        onChange={(event) =>
                          setQuestions((current) =>
                            current.map((item, i) =>
                              i === index
                                ? {
                                    ...item,
                                    input_type: event.target.value as 'single' | 'multiple',
                                  }
                                : item,
                            ),
                          )
                        }
                      >
                        <option value="single">{fr.editor.questionSingle}</option>
                        <option value="multiple">{fr.editor.questionMultiple}</option>
                      </Select>
                    </Field>
                    <label className="flex h-10 items-center gap-2 text-sm text-ink">
                      <input
                        type="checkbox"
                        checked={question.required}
                        onChange={(event) =>
                          setQuestions((current) =>
                            current.map((item, i) =>
                              i === index ? { ...item, required: event.target.checked } : item,
                            ),
                          )
                        }
                      />
                      {fr.editor.questionRequired}
                    </label>
                    <label className="flex h-10 items-center gap-2 text-sm text-ink">
                      <input
                        type="checkbox"
                        checked={question.is_active}
                        onChange={(event) =>
                          setQuestions((current) =>
                            current.map((item, i) =>
                              i === index ? { ...item, is_active: event.target.checked } : item,
                            ),
                          )
                        }
                      />
                      {fr.editor.questionActive}
                    </label>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-ink">{fr.editor.optionsLabel}</p>
                    {question.options.map((option, optionIndex) => (
                      <div key={option.id ?? `new-${optionIndex}`} className="flex items-center gap-2">
                        <Input
                          aria-label={fr.editor.optionLabel}
                          value={option.label}
                          invalid={Boolean(
                            fieldErrors[`preference_questions.${index}.options`],
                          )}
                          onChange={(event) =>
                            setQuestions((current) =>
                              current.map((item, i) =>
                                i === index
                                  ? {
                                      ...item,
                                      options: item.options.map((opt, oi) =>
                                        oi === optionIndex
                                          ? { ...opt, label: event.target.value }
                                          : opt,
                                      ),
                                    }
                                  : item,
                              ),
                            )
                          }
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={question.options.length <= 1}
                          onClick={() =>
                            setQuestions((current) =>
                              current.map((item, i) =>
                                i === index
                                  ? {
                                      ...item,
                                      options: item.options.filter((_, oi) => oi !== optionIndex),
                                    }
                                  : item,
                              ),
                            )
                          }
                        >
                          {fr.editor.removeOption}
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setQuestions((current) =>
                          current.map((item, i) =>
                            i === index
                              ? { ...item, options: [...item.options, { label: '' }] }
                              : item,
                          ),
                        )
                      }
                    >
                      {fr.editor.addOption}
                    </Button>
                    {fieldErrors[`preference_questions.${index}.options`] ? (
                      <p role="alert" className="text-xs text-danger">
                        {fieldErrors[`preference_questions.${index}.options`].join(' ')}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
          {/* Submit at the end of the form — same action as the header button. */}
          <div className="flex flex-wrap items-center justify-end gap-2 rounded-md border border-line bg-surface p-4">
            <Link
              to="/evenements"
              className="inline-flex h-10 items-center rounded-md border border-line-strong bg-surface px-4 text-sm font-medium text-ink transition-colors duration-150 hover:bg-surface-muted"
            >
              {fr.common.cancel}
            </Link>
            <Button loading={mutation.isPending} onClick={handleSubmit}>
              {mutation.isPending ? fr.editor.saving : isEdit ? fr.editor.save : fr.editor.create}
            </Button>
          </div>        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader title={fr.editor.previewTitle} description={template.name} />
            <CardBody>
              <div className="max-h-[68vh] w-full overflow-y-auto rounded-md border border-line bg-surface-muted">
                <div ref={previewCardRef} className="flex w-full flex-col" style={fontScaleStyle(fontSize)}>
                  <template.Component draft={previewDraft} />
                </div>
              </div>
              <div className="mt-4 border-t border-line pt-4">
                <InvitationDownloadButton
                  targetRef={previewCardRef}
                  title={previewDraft.title}
                  qrDataUrl={qrDataUrl}
                />
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
