/**
 * Organizer response management (`/evenements/:id/reponses`).
 *
 * Product brief §13: the organizer reviews everything guests submitted through
 * their unique link — aggregate tallies per preference question (summary) and
 * each guest's individual answers. Backed by
 * `GET /api/events/{id}/responses/`, which is organizer-scoped and paginated.
 */
import { useQuery } from '@tanstack/react-query'
import { useParams, useSearchParams } from 'react-router-dom'

import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  IconInbox,
  MetricCard,
  PageHeader,
  Pagination,
  SkeletonRows,
  type BadgeTone,
} from '../design-system/index.ts'
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
  const leader = Math.max(0, ...question.options.map((option) => option.count))
  return (
    <div className="p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="text-sm font-semibold text-ink">{question.label}</h3>
        <span className="text-xs text-ink-faint">
          {question.input_type === 'single'
            ? fr.responses.inputType.single
            : fr.responses.inputType.multiple}
        </span>
      </div>
      <ul className="mt-4 space-y-3">
        {question.options.map((option) => {
          const percent = total > 0 ? Math.round((option.count / total) * 100) : 0
          const top = option.count > 0 && option.count === leader
          return (
            <li key={option.id}>
              <div className="flex items-baseline justify-between gap-x-3">
                <span className={`min-w-0 truncate text-sm ${top ? 'font-medium text-ink' : 'text-ink-soft'}`}>
                  {option.label}
                </span>
                <span className="shrink-0 text-xs tabular-nums text-ink-faint">
                  {(option.count <= 1 ? fr.responses.votesOne : fr.responses.votes).replace(
                    '{count}',
                    formatNumber(option.count),
                  )}{' '}
                  · {percent} %
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-pill bg-surface-muted">
                <div
                  className={`h-full rounded-pill transition-[width] duration-500 ${top ? 'bg-ink' : 'bg-ink-faint/60'}`}
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
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-ink">{response.display_name}</h3>
          <p className="mt-0.5 text-xs text-ink-faint">
            {updated
              ? `${fr.responses.answeredOn.replace('{date}', formatDateTime(response.submitted_at))} · ${fr.responses.updatedOn.replace('{date}', formatDateTime(response.updated_at))}`
              : fr.responses.answeredOn.replace('{date}', formatDateTime(response.submitted_at))}
          </p>
        </div>
        <Badge tone={STATUS_TONES[response.invitation_status]} dot>
          {STATUS_LABELS[response.invitation_status]}
        </Badge>
      </div>
      {response.answers.length === 0 ? (
        <p className="mt-3 text-sm text-ink-soft">{fr.responses.noAnswers}</p>
      ) : (
        <dl className="mt-3 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
          {response.answers.map((answer) => (
            <div key={answer.question} className="min-w-0 rounded-md bg-surface-muted/70 px-3 py-2">
              <dt className="text-xs text-ink-faint">{answer.question_label}</dt>
              <dd className="mt-0.5 text-sm font-medium text-ink">
                {answer.options.map((option) => option.label).join(', ')}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </li>
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
  const rate =
    summary && summary.invitations > 0
      ? Math.round((summary.responses / summary.invitations) * 100)
      : null

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ to: `/evenements/${eventId}/invitations`, label: fr.responses.back }}
        eyebrow={eventQuery.data?.title}
        title={fr.responses.title}
        description={fr.responses.subtitle}
      />

      {query.isLoading ? <SkeletonRows rows={3} /> : null}

      {query.isError ? (
        <Card>
          <ErrorState
            title={fr.responses.error.title}
            description={fr.responses.error.description}
            onRetry={() => void query.refetch()}
          />
        </Card>
      ) : null}

      {summary ? (
        <>
          <dl className="grid grid-cols-2 gap-3 lg:max-w-2xl lg:gap-4">
            <MetricCard
              label={fr.responses.received}
              value={formatNumber(summary.responses)}
              footer={fr.responses.ofInvitations.replace('{count}', formatNumber(summary.invitations))}
            />
            <MetricCard
              label={fr.responses.rateLabel}
              value={rate === null ? '—' : `${rate} %`}
            />
          </dl>

          <section className="space-y-3" aria-labelledby="responses-questions">
            <h2 id="responses-questions" className="text-sm font-semibold text-ink">
              {fr.responses.questionsTitle}
            </h2>
            {summary.questions.length > 0 ? (
              <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
                {summary.questions.map((question) => (
                  <Card key={question.id}>
                    <QuestionTally question={question} total={summary.responses} />
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-soft">{fr.responses.noQuestions}</p>
            )}
          </section>
        </>
      ) : null}

      {data && results.length > 0 ? (
        <section className="space-y-3" aria-labelledby="responses-list">
          <h2 id="responses-list" className="text-sm font-semibold text-ink">
            {fr.responses.listTitle}
          </h2>
          <Card className="overflow-hidden">
            <ul className="divide-y divide-line">
              {results.map((response) => (
                <ResponseRow key={response.id} response={response} />
              ))}
            </ul>
          </Card>

          {totalPages > 1 ? (
            <Pagination
              page={page}
              totalPages={totalPages}
              hasNext={Boolean(data.next)}
              onPrev={() => updateParam('page', String(page - 1))}
              onNext={() => updateParam('page', String(page + 1))}
              prevLabel={fr.responses.prev}
              nextLabel={fr.responses.next}
              pageLabel={fr.responses.page}
            />
          ) : null}
        </section>
      ) : null}

      {data && results.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconInbox className="h-5 w-5" />}
            title={fr.responses.empty.title}
            description={fr.responses.empty.description}
          />
        </Card>
      ) : null}
    </div>
  )
}
