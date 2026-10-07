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
import { Card, CardBody, CardHeader } from '../design-system/Card.tsx'
import { Field } from '../design-system/Field.tsx'
import { Input, Select } from '../design-system/Input.tsx'
import { ErrorState, LoadingState } from '../design-system/states.tsx'
import { ApiError, eventsApi } from '../lib/api.ts'
import type {
  EventPayload,
  PreferenceQuestionPayload,
} from '../lib/types.ts'
import { fr } from '../locales/fr.ts'
import { InvitationExportButtons } from '../templates/InvitationExportButtons.tsx'
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
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [timezone, setTimezone] = useState('Africa/Kinshasa')
  const [venueName, setVenueName] = useState('')
  const [venueAddress, setVenueAddress] = useState('')
  const [venueDetails, setVenueDetails] = useState('')
  const [emphasis, setEmphasis] = useState<string[]>([])
  const [questions, setQuestions] = useState<QuestionDraft[]>([])
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [coverRemoved, setCoverRemoved] = useState(false)
  const [coverError, setCoverError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const eventQuery = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsApi.get(eventId as number),
    enabled: isEdit,
  })
  const hydrated = useRef(false)
  const previewCardRef = useRef<HTMLDivElement>(null)

  const template = getTemplate(templateKey) ?? TEMPLATES[0]

  useEffect(() => {
    const data = eventQuery.data
    if (!data || hydrated.current) return
    hydrated.current = true
    setTemplateKey(data.template)
    setTitle(data.title)
    setMessage(data.message)
    setEventDate(data.event_date)
    setEventTime(data.event_time)
    setTimezone(data.timezone)
    setVenueName(data.venue_name)
    setVenueAddress(data.venue_address)
    setVenueDetails(data.venue_details)
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
  }, [eventQuery.data])

  const previewDraft: InvitationDraft = useMemo(
    () =>
      emptyDraft({
        title: title || 'Titre de l’événement',
        message,
        event_date: eventDate,
        event_time: eventTime,
        timezone,
        venue_name: venueName,
        venue_address: venueAddress,
        venue_details: venueDetails,
        cover_url: coverPreview ?? (coverRemoved ? null : (eventQuery.data?.cover_url ?? null)),
        emphasis,
      }),
    [
      title,
      message,
      eventDate,
      eventTime,
      timezone,
      venueName,
      venueAddress,
      venueDetails,
      coverPreview,
      coverRemoved,
      eventQuery.data?.cover_url,
      emphasis,
    ],
  )

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: EventPayload = {
        template: templateKey,
        title: title.trim(),
        message: message.trim(),
        event_date: eventDate,
        event_time: eventTime,
        timezone: timezone.trim() || 'Africa/Kinshasa',
        venue_name: venueName.trim(),
        venue_address: venueAddress.trim(),
        venue_details: venueDetails.trim(),
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
      }
      const saved = isEdit
        ? await eventsApi.update(eventId as number, payload)
        : await eventsApi.create(payload)
      if (coverFile) {
        await eventsApi.uploadCover(saved.id, coverFile)
      } else if (coverRemoved && (eventQuery.data?.cover_url ?? null)) {
        await eventsApi.removeCover(saved.id)
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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
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
              </CardBody>
            </Card>
          ) : null}

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
        </div>

        <div className="xl:sticky xl:top-6 xl:self-start">
          <Card>
            <CardHeader title={fr.editor.previewTitle} description={template.name} />
            <CardBody>
              <div className="aspect-[3/4] w-full overflow-hidden rounded-md border border-line bg-surface-muted">
                <div ref={previewCardRef} className="flex h-full w-full flex-col">
                  <template.Component draft={previewDraft} />
                </div>
              </div>
              <div className="mt-4 border-t border-line pt-4">
                <InvitationExportButtons targetRef={previewCardRef} title={previewDraft.title} />
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
