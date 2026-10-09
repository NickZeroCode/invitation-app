/**
 * Organizer dashboard (`/accueil`): headline KPIs, invitation status
 * breakdown and direct paths to the next useful action.
 */
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import { useAuth } from '../auth/AuthContext.tsx'
import {
  Card,
  ErrorState,
  IconArrowRight,
  IconChart,
  IconEvents,
  IconInbox,
  IconMail,
  IconPlus,
  IconTemplates,
  IconUsers,
  MetricCard,
  PageHeader,
  SectionTitle,
  buttonClasses,
} from '../design-system/index.ts'
import { ApiError, dashboardApi } from '../lib/api.ts'
import { formatDateTime, formatNumber } from '../lib/format.ts'
import type { DashboardOverview } from '../lib/types.ts'
import { fr } from '../locales/fr.ts'

function OverviewSkeleton() {
  return (
    <div className="mt-8 space-y-6" role="status" aria-label={fr.common.loading}>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-[8.25rem] animate-pulse rounded-lg border border-line bg-surface" />
        ))}
      </div>
      <div className="h-56 animate-pulse rounded-lg border border-line bg-surface" />
    </div>
  )
}

const STATUS_SEGMENTS = [
  { key: 'active', label: fr.overview.invitations.active, bar: 'bg-success', dot: 'bg-success' },
  { key: 'expired', label: fr.overview.invitations.expired, bar: 'bg-warning', dot: 'bg-warning' },
  { key: 'revoked', label: fr.overview.invitations.revoked, bar: 'bg-danger', dot: 'bg-danger' },
] as const

function InvitationStatus({ invitations }: { invitations: DashboardOverview['invitations'] }) {
  const total = invitations.active + invitations.expired + invitations.revoked
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-[0.9375rem] font-semibold tracking-tight text-ink">{fr.overview.statusTitle}</h2>
      </div>
      {total > 0 ? (
        <div
          className="mt-5 flex h-2.5 w-full overflow-hidden rounded-pill bg-surface-muted"
          aria-hidden="true"
        >
          {STATUS_SEGMENTS.map((segment) => {
            const value = invitations[segment.key]
            if (!value) return null
            return (
              <div
                key={segment.key}
                className={`${segment.bar} h-full first:rounded-l-pill last:rounded-r-pill`}
                style={{ width: `${(value / total) * 100}%` }}
              />
            )
          })}
        </div>
      ) : (
        <p className="mt-3 text-sm text-ink-soft">{fr.overview.statusEmpty}</p>
      )}
      <dl className="mt-5 grid grid-cols-3 gap-3 sm:gap-6">
        {STATUS_SEGMENTS.map((segment) => (
          <div key={segment.key} className="min-w-0">
            <dt className="flex items-center gap-2 truncate text-[0.8125rem] text-ink-soft">
              <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-pill ${segment.dot}`} />
              {segment.label}
            </dt>
            <dd className="mt-1.5 text-xl font-semibold tracking-tight text-ink tabular-nums">
              {formatNumber(invitations[segment.key])}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}

const QUICK_LINKS = [
  { to: '/evenements/nouveau', title: fr.overview.quickCreate, text: fr.overview.quickCreateText, icon: IconPlus },
  { to: '/evenements', title: fr.overview.quickEvents, text: fr.overview.quickEventsText, icon: IconUsers },
  { to: '/modeles', title: fr.overview.quickTemplates, text: fr.overview.quickTemplatesText, icon: IconTemplates },
]

function QuickActions() {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-line px-5 py-4">
        <h2 className="text-[0.9375rem] font-semibold tracking-tight text-ink">{fr.overview.quickTitle}</h2>
      </div>
      <ul className="divide-y divide-line">
        {QUICK_LINKS.map((item) => (
          <li key={item.to}>
            {/* aria-label keeps each shortcut's accessible name unique and
                distinct from the main navigation links. */}
            <Link
              to={item.to}
              aria-label={item.title}
              className="group flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-surface-muted/60 focus-visible:bg-surface-muted focus-visible:outline-none"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line bg-surface text-ink-soft">
                <item.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink">{item.title}</span>
                <span className="line-clamp-2 block text-xs text-ink-faint">{item.text}</span>
              </span>
              <IconArrowRight className="h-4 w-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export function OverviewPage() {
  const { user, markAnonymous } = useAuth()
  const { data, isPending, isError, error, refetch } = useQuery({
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

  const firstName = user?.first_name?.trim()
  const responseRate =
    data && data.invitations.total > 0
      ? Math.round((data.responses.total / data.invitations.total) * 100)
      : null

  return (
    <div>
      <PageHeader
        eyebrow={firstName ? fr.overview.greeting.replace('{name}', firstName) : undefined}
        title={fr.overview.title}
        description={fr.overview.subtitle}
        actions={
          <Link to="/evenements/nouveau" className={buttonClasses('primary', 'md')}>
            <IconPlus className="h-4 w-4" />
            {fr.nav.newEvent}
          </Link>
        }
      />

      {isPending ? (
        <OverviewSkeleton />
      ) : isError ? (
        <Card className="mt-8">
          <ErrorState onRetry={() => void refetch()} />
        </Card>
      ) : (
        <>
          <dl className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <MetricCard
              label={fr.overview.events.total}
              value={formatNumber(data.events.total)}
              icon={<IconEvents className="h-4 w-4" />}
              footer={fr.overview.upcomingCount.replace('{count}', formatNumber(data.events.upcoming))}
            />
            <MetricCard
              label={fr.overview.invitations.total}
              value={formatNumber(data.invitations.total)}
              icon={<IconMail className="h-4 w-4" />}
              footer={fr.overview.invitations.title}
            />
            <MetricCard
              label={fr.overview.responses.total}
              value={formatNumber(data.responses.total)}
              icon={<IconInbox className="h-4 w-4" />}
              footer={fr.overview.responses.title}
            />
            <MetricCard
              label={fr.overview.rateTitle}
              value={responseRate === null ? '—' : `${responseRate} %`}
              icon={<IconChart className="h-4 w-4" />}
              footer={
                responseRate === null
                  ? fr.overview.responses.rateEmpty
                  : fr.overview.rateOf.replace('{count}', formatNumber(data.invitations.total))
              }
            />
          </dl>
          <p className="mt-3 text-xs text-ink-faint">
            {fr.overview.updatedAt.replace('{date}', formatDateTime(data.generated_at, user?.timezone))}
          </p>

          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start lg:gap-6">
            <InvitationStatus invitations={data.invitations} />
            <QuickActions />
          </div>

          {data.events.total === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-line-strong bg-surface/60 px-6 py-10 text-center">
              <SectionTitle as="h3">{fr.overview.events.title}</SectionTitle>
              <p className="mt-3 text-base font-semibold tracking-tight text-ink">{fr.overview.empty.title}</p>
              <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-ink-soft">
                {fr.overview.empty.description}
              </p>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
