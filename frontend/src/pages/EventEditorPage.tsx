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

import { Alert } from '../design-system/Alert.tsx'
import { Button } from '../design-system/Button.tsx'
import { Field } from '../design-system/Field.tsx'
import { Input, Select } from '../design-system/Input.tsx'
import { IconChevronLeft } from '../design-system/icons.tsx'
import { SectionTitle } from '../design-system/layout.tsx'
import { ErrorState, LoadingState } from '../design-system/states.tsx'
import { ApiError, eventsApi } from '../lib/api.ts'
import { DESKTOP_QUERY, useMediaQuery } from '../lib/useMediaQuery.ts'
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

type MobileTab = 'contenu' | 'design' | 'apercu'

const MOBILE_TABS: ReadonlyArray<{ key: MobileTab; label: string }> = [
  { key: 'contenu', label: fr.editor.tabContent },
  { key: 'design', label: fr.editor.tabDesign },
  { key: 'apercu', label: fr.editor.tabPreview },
]

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
  const [mobileTab, setMobileTab] = useState<MobileTab>('contenu')

  const eventQuery = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsApi.get(eventId as number),
    enabled: isEdit,
  })
  const hydrated = useRef(false)
  const previewCardRef = useRef<HTMLDivElement>(null)

  const template = getTemplate(templateKey) ?? TEMPLATES[0]
  const isDesktop = useMediaQuery(DESKTOP_QUERY, true)

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
    <div className="flex min-h-svh flex-col bg-paper lg:h-svh lg:overflow-hidden">
      {/* Command bar — title + global actions, always within reach. */}
      <header className="shrink-0 border-b border-line bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to="/evenements"
              aria-label={fr.editor.back}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line text-ink-soft transition-colors duration-150 hover:bg-surface-muted hover:text-ink"
            >
              <IconChevronLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-[0.9375rem] font-semibold tracking-tight text-ink">
                {isEdit ? fr.editor.editTitle : fr.editor.createTitle}
              </h1>
              <p className="truncate text-xs text-ink-faint">{fr.editor.sharedNote}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/evenements"
              className="inline-flex h-10 items-center whitespace-nowrap rounded-md border border-line-strong bg-surface px-4 text-sm font-medium text-ink transition-colors duration-150 hover:bg-surface-muted"
            >
              {fr.common.cancel}
            </Link>
            <Button loading={mutation.isPending} onClick={handleSubmit}>
              {mutation.isPending ? fr.editor.saving : isEdit ? fr.editor.save : fr.editor.create}
            </Button>
          </div>
        </div>
        {formError ? (
          <div className="border-t border-line px-4 py-3 lg:px-6">
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
          </div>
        ) : null}
      </header>

      {/* Phone & tablet: jump between the three work areas. Desktop shows them
          side by side, so the switcher only exists at small widths. */}
      {!isDesktop ? (
        <nav aria-label={fr.editor.tabsLabel} className="shrink-0 border-b border-line bg-surface px-3 py-2">
          <div className="flex gap-1">
            {MOBILE_TABS.map((tab) => {
              const active = mobileTab === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setMobileTab(tab.key)}
                  className={`flex-1 whitespace-nowrap rounded-pill px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                    active
                      ? 'bg-ink text-paper shadow-xs'
                      : 'text-ink-soft hover:bg-surface-muted hover:text-ink'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </nav>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[19rem_1fr_20rem] xl:grid-cols-[21rem_1fr_22rem]">
        {/* LEFT — what the invitation says. */}
        <section
          aria-label={fr.editor.tabContent}
          className={`min-h-0 flex-1 border-line bg-surface max-lg:pb-[4.75rem] lg:overflow-y-auto lg:border-r ${
            isDesktop || mobileTab === 'contenu' ? '' : 'hidden'
          }`}
        >
          <div className="space-y-7 px-4 py-5 lg:px-4">
            <section className="space-y-4">
              <SectionTitle>{fr.editor.contentTitle}</SectionTitle>
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
            </section>

            <section className="space-y-4">
              <SectionTitle>{fr.editor.scheduleTitle}</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
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
              </div>
              <div className="grid grid-cols-1 gap-3">
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
              </div>
            </section>

            <section className="space-y-4">
              <SectionTitle
                action={
                  <label className="relative inline-flex h-9 cursor-pointer items-center whitespace-nowrap rounded-md border border-line-strong bg-surface px-3 text-sm font-medium text-ink transition-colors duration-150 hover:bg-surface-muted">
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
              >
                {fr.editor.dressCodeTitle}
              </SectionTitle>
              <p className="text-xs leading-relaxed text-ink-faint">{fr.editor.dressCodeHint}</p>
              {dressRows.length === 0 ? null : (
                <div className="grid grid-cols-1 gap-3">
                  {dressRows.map((row, index) => (
                    <div
                      key={row.id ?? `new-${index}`}
                      className="space-y-2 rounded-lg border border-line bg-surface-muted/40 p-3"
                    >
                      <img
                        src={row.url}
                        alt=""
                        className="h-24 w-full rounded-md border border-line object-cover"
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
            </section>

            <section className="space-y-4">
              <SectionTitle
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
              >
                {fr.editor.programTitle}
              </SectionTitle>
              {programRows.length === 0 ? (
                <p className="text-xs leading-relaxed text-ink-faint">{fr.editor.programHint}</p>
              ) : null}
              {programRows.map((row, index) => (
                <div
                  key={row.id ?? `new-${index}`}
                  className="space-y-3 rounded-lg border border-line bg-surface-muted/40 p-4"
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
            </section>

            <section className="space-y-4">
              <SectionTitle
                action={
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setQuestions((current) => [...current, blankQuestion()])}
                  >
                    {fr.editor.addQuestion}
                  </Button>
                }
              >
                {fr.editor.questionsTitle}
              </SectionTitle>
              {questions.length === 0 ? (
                <p className="text-xs leading-relaxed text-ink-faint">{fr.editor.questionsHint}</p>
              ) : null}
              {questions.map((question, index) => (
                <div
                  key={question.id ?? `new-${index}`}
                  className="space-y-3 rounded-lg border border-line bg-surface-muted/40 p-4"
                >
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
                        className="h-4 w-4 rounded border-line-strong accent-ink"
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
                        className="h-4 w-4 rounded border-line-strong accent-ink"
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
            </section>
          </div>
          {/* Submit at the end of the form — same action as the header button. */}
          <div className="sticky bottom-[4.75rem] flex items-center justify-end gap-2 border-t border-line bg-surface px-4 py-3 lg:bottom-0 lg:px-4">
            <Link
              to="/evenements"
              className="inline-flex h-10 items-center whitespace-nowrap rounded-md border border-line-strong bg-surface px-4 text-sm font-medium text-ink transition-colors duration-150 hover:bg-surface-muted"
            >
              {fr.common.cancel}
            </Link>
            <Button loading={mutation.isPending} onClick={handleSubmit}>
              {mutation.isPending ? fr.editor.saving : isEdit ? fr.editor.save : fr.editor.create}
            </Button>
          </div>
        </section>

        {/* CENTER — the invitation itself, staged like a piece on a drafting canvas. */}
        <section
          aria-label={fr.editor.tabPreview}
          className={`canvas-grid flex min-h-0 flex-1 flex-col max-lg:pb-[4.75rem] lg:overflow-y-auto ${
            isDesktop || mobileTab === 'apercu' ? '' : 'hidden'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3 lg:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-1.5 w-1.5 shrink-0 rounded-pill bg-brand" aria-hidden="true" />
              <p className="truncate text-sm font-medium text-ink">{fr.editor.previewLive}</p>
              <p className="truncate text-xs text-ink-faint">{template.name}</p>
            </div>
            <InvitationDownloadButton
              targetRef={previewCardRef}
              title={previewDraft.title}
              templateKey={templateKey}
              dressCode={previewDraft.dressCode}
              program={previewDraft.program}
              qrText={`${window.location.origin}/`}
            />
          </div>
          <div className="flex flex-1 justify-center px-4 py-6 lg:px-10 lg:py-10">
            <div className="w-full max-w-[26rem] overflow-hidden rounded-lg bg-surface shadow-canvas ring-1 ring-line-strong xl:max-w-[30rem] 2xl:max-w-[34rem]">
              <div
                ref={previewCardRef}
                className="flex w-full flex-col"
                style={fontScaleStyle(fontSize)}
              >
                <template.Component draft={previewDraft} />
              </div>
            </div>
          </div>
          <p className="px-4 pb-6 text-center text-xs text-ink-faint lg:px-8">
            {fr.editor.previewNote}
          </p>
        </section>

        {/* RIGHT — how the invitation looks. */}
        <section
          aria-label={fr.editor.tabDesign}
          className={`min-h-0 flex-1 border-line bg-surface max-lg:pb-[4.75rem] lg:overflow-y-auto lg:border-l ${
            isDesktop || mobileTab === 'design' ? '' : 'hidden'
          }`}
        >
          <div className="space-y-7 px-4 py-5 lg:px-4">
            <section className="space-y-3">
              <SectionTitle>{fr.editor.templateLabel}</SectionTitle>
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
              <p className="text-xs leading-relaxed text-ink-faint">{fr.editor.templateHint}</p>
              <p className="text-xs text-ink-soft">
                {template.name} — {template.categoryLabel}
              </p>
            </section>

            <section className="space-y-4">
              <SectionTitle>{fr.editor.typographyTitle}</SectionTitle>
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
                        className={`flex items-center gap-2 whitespace-nowrap rounded-pill border px-3 py-1.5 text-sm transition-colors duration-150 ${
                          selected
                            ? 'border-ink bg-ink text-paper'
                            : 'border-line-strong text-ink-soft hover:border-ink/40 hover:text-ink'
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
                        className={`flex items-center gap-2 whitespace-nowrap rounded-pill border px-3 py-1.5 text-sm transition-colors duration-150 ${
                          selected
                            ? 'border-ink bg-ink text-paper'
                            : 'border-line-strong text-ink-soft hover:border-ink/40 hover:text-ink'
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
            </section>

            <section className="space-y-3">
              <SectionTitle>{fr.editor.emphasisTitle}</SectionTitle>
              <p className="text-xs leading-relaxed text-ink-faint">{fr.editor.emphasisHint}</p>
              <div className="flex flex-col gap-2.5">
                {template.emphasisFields.map((field) => (
                  <label key={field} className="flex items-center gap-2.5 text-sm text-ink">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-line-strong accent-ink"
                      checked={emphasis.includes(field)}
                      onChange={() => toggleEmphasis(field)}
                    />
                    {emphasisLabel(field)}
                  </label>
                ))}
              </div>
            </section>

            {template.supportsCover ? (
              <section className="space-y-3">
                <SectionTitle>{fr.editor.coverTitle}</SectionTitle>
                <p className="text-xs leading-relaxed text-ink-faint">{fr.editor.coverHint}</p>
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
                  <label className="relative inline-flex h-10 cursor-pointer items-center whitespace-nowrap rounded-md border border-line-strong bg-surface px-4 text-sm font-medium text-ink transition-colors duration-150 hover:bg-surface-muted">
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
              </section>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  )
}
