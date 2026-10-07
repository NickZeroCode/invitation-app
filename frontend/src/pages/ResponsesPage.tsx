/**
 * Organizer response management (`/evenements/:id/reponses`).
 *
 * Product brief §13: the organizer reviews everything guests submitted through
 * their unique link — aggregate tallies per preference question (summary) and
 * each guest's individual answers. Backed by
 * `GET /api/events/{id}/responses/`, which is organizer-scoped and paginated.
 */
import { useQuery } from '@tanstack/react-query'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import { Badge, type BadgeTone } from '../design-system/Badge.tsx'
import { Button } from '../design-system/Button.tsx'
import { Card, CardBody, CardHeader } from '../design-system/Card.tsx'
import { Stat } from '../design-system/Stat.tsx'
import { EmptyState, ErrorState, LoadingState } from '../design-system/states.tsx'
import { eventsApi } from '../lib/api.ts'
import { formatDateTime, formatNumber } from '../lib/format.ts'
import type {
  GuestResponsePayload,
  InvitationState,
  ResponseQuestionTally,
} from '../lib/types.ts'
import { fr } from '../locales/fr.ts'

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

/** Per-option tallies as slim proportional bars (share of responding guests). */
function QuestionTally({ question, total }: { question: ResponseQuestionTally; total: number }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink">{question.label}</h3>
        <span className="text-xs text-ink-faint">
          {question.input_type === 'single'
            ? fr.responses.inputType.single
            : fr.responses.inputType.multiple}
        </span>
      </div>
      <ul className="space-y-2">
        {question.options.map((option) => {
          const percent = total > 0 ? Math.round((option.count / total) * 100) : 0
          return (
            <li key={option.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="text-sm text-ink-soft">{option.label}</span>
                <span className="text-xs tabular-nums text-ink-faint">
                  {(option.count <= 1 ? fr.responses.votesOne : fr.responses.votes).replace(
                    '{count}',
                    formatNumber(option.count),
                  )}{' '}
                  · {percent} %
                </span>
              </div>
              <div className="mt-1 h-1.5 rounded-pill bg-surface-muted">
                <div
                  className="h-full rounded-pill bg-brand transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** One guest's submission: identity, invitation state and every answer. */
function ResponseRow({ response }: { response: GuestResponsePayload }) {
  const updated = response.updated_at !== response.submitted_at
  return (
    <Card>
      <CardHeader
        title={response.display_name}
        description={
          updated
            ? `${fr.responses.answeredOn.replace('{date}', formatDateTime(response.submitted_at))} · ${fr.responses.updatedOn.replace('{date}', formatDateTime(response.updated_at))}`
            : fr.responses.answeredOn.replace('{date}', formatDateTime(response.submitted_at))
        }
        action={
          <Badge tone={STATUS_TONES[response.invitation_status]}>
            {STATUS_LABELS[response.invitation_status]}
          </Badge>
        }
      />
      <CardBody>
        {response.answers.length === 0 ? (
          <p className="text-sm text-ink-soft">{fr.responses.noAnswers}</p>
        ) : (
          <dl className="space-y-2">
            {response.answers.map((answer) => (
              <div key={answer.question} className="flex flex-wrap gap-x-2 gap-y-1">
                <dt className="text-sm font-medium text-ink">{answer.question_label}</dt>
                <dd className="text-sm text-ink-soft">
                  {answer.options.map((option) => option.label).join(', ')}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </CardBody>
    </Card>
  )
}

export function ResponsesPage() {
  const { id } = useParams()
  const eventId = Number(id)
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1') || 1

  const eventQuery = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsApi.get(eventId),
    enabled: Number.isFinite(eventId),
  })

  const query = useQuery({
    queryKey: ['event-responses', eventId, { page }],
    queryFn: () => eventsApi.responses(eventId, { page }),
    enabled: Number.isFinite(eventId),
  })

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setSearchParams(next)
  }

  const data = query.data
  const summary = data?.summary
  const results = data?.results ?? []
  const totalPages = data ? Math.max(1, Math.ceil(data.count / 25)) : 1

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{fr.responses.title}</h1>
          <p className="mt-1 text-sm text-ink-soft">{fr.responses.subtitle}</p>
          {eventQuery.data ? (
            <p className="mt-1 text-xs text-ink-faint">{eventQuery.data.title}</p>
          ) : null}
        </div>
        <Link
          to={`/evenements/${eventId}/invitations`}
          className="inline-flex h-10 items-center rounded-md border border-line-strong bg-surface px-4 text-sm font-medium text-ink transition-colors duration-150 hover:bg-surface-muted"
        >
          {fr.responses.back}
        </Link>
      </header>

      {query.isLoading ? <LoadingState /> : null}

      {query.isError ? (
        <ErrorState
          title={fr.responses.error.title}
          description={fr.responses.error.description}
          onRetry={() => query.refetch()}
        />
      ) : null}

      {summary ? (
        <Card>
          <CardHeader title={fr.responses.summaryTitle} />
          <CardBody className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:max-w-xs">
              <Stat
                label={fr.responses.received}
                value={formatNumber(summary.responses)}
                hint={fr.responses.ofInvitations.replace(
                  '{count}',
                  formatNumber(summary.invitations),
                )}
                emphasis={summary.responses > 0 ? 'success' : 'default'}
              />
            </div>
            {summary.questions.length > 0 ? (
              <div className="space-y-6">
                <h2 className="text-sm font-semibold text-ink">{fr.responses.questionsTitle}</h2>
                {summary.questions.map((question) => (
                  <QuestionTally
                    key={question.id}
                    question={question}
                    total={summary.responses}
                  />
                ))}
              </div>
            ) : null}
          </CardBody>
        </Card>
      ) : null}

      {data && results.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-ink">{fr.responses.listTitle}</h2>
          {results.map((response) => (
            <ResponseRow key={response.id} response={response} />
          ))}

          {totalPages > 1 ? (
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => updateParam('page', String(page - 1))}
              >
                {fr.responses.prev}
              </Button>
              <span className="text-xs text-ink-soft">
                {fr.responses.page.replace('{page}', `${page} / ${totalPages}`)}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={!data.next}
                onClick={() => updateParam('page', String(page + 1))}
              >
                {fr.responses.next}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {data && results.length === 0 ? (
        <EmptyState title={fr.responses.empty.title} description={fr.responses.empty.description} />
      ) : null}
    </div>
  )
}
