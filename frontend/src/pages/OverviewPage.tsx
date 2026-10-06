import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'

import { useAuth } from '../auth/AuthContext.tsx'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  ErrorState,
  IconRefresh,
  LoadingState,
  Stat,
} from '../design-system/index.ts'
import { ApiError, dashboardApi } from '../lib/api.ts'
import { formatDateTime, formatNumber } from '../lib/format.ts'
import { fr } from '../locales/fr.ts'

export function OverviewPage() {
  const { user, markAnonymous } = useAuth()
  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: dashboardApi.overview,
    staleTime: 15_000,
  })

  // A 401 here means the session expired mid-use: flip to anonymous so the
  // protected router takes the organizer back to the login page.
  useEffect(() => {
    if (isError && error instanceof ApiError && error.status === 401) {
      markAnonymous()
    }
  }, [isError, error, markAnonymous])

  return (
    <div>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{fr.overview.title}</h1>
          <p className="mt-1 text-sm text-ink-soft">{fr.overview.subtitle}</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => refetch()}
          loading={isFetching && !isPending}
        >
          <IconRefresh className="h-4 w-4" />
          {fr.common.refresh}
        </Button>
      </header>

      {isPending ? (
        <LoadingState />
      ) : isError ? (
        <Card className="mt-8">
          <ErrorState onRetry={() => refetch()} />
        </Card>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader title={fr.overview.events.title} />
              <CardBody>
                <dl className="grid grid-cols-2 gap-4">
                  <Stat label={fr.overview.events.total} value={formatNumber(data.events.total)} />
                  <Stat
                    label={fr.overview.events.upcoming}
                    value={formatNumber(data.events.upcoming)}
                  />
                </dl>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title={fr.overview.invitations.title} />
              <CardBody>
                <dl className="grid grid-cols-2 gap-4">
                  <Stat
                    label={fr.overview.invitations.total}
                    value={formatNumber(data.invitations.total)}
                  />
                  <Stat
                    label={fr.overview.invitations.active}
                    value={formatNumber(data.invitations.active)}
                    emphasis="success"
                  />
                  <Stat
                    label={fr.overview.invitations.expired}
                    value={formatNumber(data.invitations.expired)}
                    emphasis="warning"
                  />
                  <Stat
                    label={fr.overview.invitations.revoked}
                    value={formatNumber(data.invitations.revoked)}
                    emphasis="danger"
                  />
                </dl>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title={fr.overview.responses.title} />
              <CardBody>
                <dl>
                  <Stat
                    label={fr.overview.responses.total}
                    value={formatNumber(data.responses.total)}
                    hint={fr.overview.responses.hint}
                  />
                </dl>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title={fr.overview.lastUpdated} />
              <CardBody>
                <p className="text-sm text-ink-soft">
                  {formatDateTime(data.generated_at, user?.timezone)}
                </p>
              </CardBody>
            </Card>
          </div>

          {data.events.total === 0 ? (
            <Card className="mt-4">
              <EmptyState
                title={fr.overview.empty.title}
                description={fr.overview.empty.description}
              />
            </Card>
          ) : null}
        </>
      )}
    </div>
  )
}
