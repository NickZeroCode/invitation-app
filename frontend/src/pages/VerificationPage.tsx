import { useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  Button,
  IconCheck,
  IconQr,
  Input,
  LogoMark,
  LoadingState,
} from '../design-system/index.ts'
import { ApiError, publicVerificationApi } from '../lib/api.ts'
import type { VerificationScanResult } from '../lib/types.ts'
import { fr } from '../locales/fr.ts'
import { QrScanner } from '../verification/QrScanner.tsx'
import { VerificationResultCard } from '../verification/VerificationResultCard.tsx'

/**
 * Public, delegated door-verification page (`/verification/:token`).
 *
 * Flow: link status → authorization code exchange → QR verdicts. The signed
 * session is scoped to this link's event and expires with the link — a dead
 * link (expired, revoked, unknown) never reaches the scanner.
 */
export function VerificationPage() {
  const { token = '' } = useParams<{ token: string }>()
  const [session, setSession] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [authError, setAuthError] = useState('')
  const [scanError, setScanError] = useState('')
  const [sessionNote, setSessionNote] = useState('')
  const [result, setResult] = useState<VerificationScanResult | null>(null)

  const linkQuery = useQuery({
    queryKey: ['public-verify-link', token],
    queryFn: () => publicVerificationApi.link(token),
    enabled: token.length > 0,
    retry: false,
  })

  const authorizeMutation = useMutation({
    mutationFn: () => publicVerificationApi.authorize(token, code.trim()),
    onSuccess: (data) => {
      setSession(data.session)
      setAuthError('')
      setSessionNote('')
    },
    onError: (error: unknown) => {
      setAuthError(
        error instanceof ApiError ? error.message : fr.verify.landing.invalidLink,
      )
    },
  })

  const scanMutation = useMutation({
    mutationFn: (content: string) =>
      publicVerificationApi.scan(token, session ?? '', content),
    onSuccess: (data) => {
      setResult(data)
      setScanError('')
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.code === 'verification_session_expired') {
        setSession(null)
        setResult(null)
        setCode('')
        setSessionNote(fr.verify.sessionExpired)
        return
      }
      setScanError(
        error instanceof ApiError ? error.message : fr.verify.scanner.verifying,
      )
    },
  })

  function submitCode(event: FormEvent) {
    event.preventDefault()
    if (!code.trim() || authorizeMutation.isPending) return
    authorizeMutation.mutate()
  }

  const link = linkQuery.data
  const statusBlock = (() => {
    if (linkQuery.isPending) {
      return <LoadingState label={fr.verify.scanner.verifying} />
    }
    if (linkQuery.isError || !link) {
      return (
        <StatusScreen
          tone="danger"
          title={fr.verify.landing.title}
          description={
            linkQuery.error instanceof ApiError
              ? linkQuery.error.message
              : fr.verify.landing.invalidLink
          }
        />
      )
    }
    if (link.status === 'expired') {
      return (
        <StatusScreen
          tone="warning"
          title={fr.verify.landing.expiredLink}
          description={link.event_title}
        />
      )
    }
    if (link.status === 'revoked') {
      return (
        <StatusScreen
          tone="danger"
          title={fr.verify.landing.revokedLink}
          description={link.event_title}
        />
      )
    }
    return null
  })()

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(212,162,75,0.18),_transparent_38%),linear-gradient(135deg,#f7f4ee_0%,#f1efe8_32%,#f7f5f1_100%)] px-2 py-6 text-ink sm:px-4 sm:py-10">
      <div className="mx-auto max-w-xl">
        <header className="mb-6 px-1">
          <p className="flex items-center gap-2.5 text-xs font-medium uppercase tracking-[0.35em] text-ink-faint">
            <LogoMark className="h-7 w-7 rounded-md" />
            MalaikaEvents
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-ink md:text-3xl">
            {fr.verify.landing.title}
          </h1>
          {link?.event_title ? (
            <p className="mt-1 text-sm text-ink-soft">
              {fr.verify.landing.eventLabel} · {link.event_title}
            </p>
          ) : null}
        </header>

        {statusBlock ?? (
          <div className="rounded-[1.4rem] border border-line bg-white/85 p-6 shadow-[0_18px_60px_rgba(25,32,28,0.10)] backdrop-blur-sm sm:p-8">
            {!session ? (
              <form onSubmit={submitCode} className="space-y-4">
                <p className="text-sm leading-relaxed text-ink-soft">{fr.verify.landing.intro}</p>
                {sessionNote ? (
                  <p role="alert" className="rounded-xl bg-warning/10 px-4 py-3 text-sm font-medium text-warning">
                    {sessionNote}
                  </p>
                ) : null}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-ink" htmlFor="verification-code">
                    {fr.verify.landing.codeLabel}
                  </label>
                  <Input
                    id="verification-code"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    placeholder={fr.verify.landing.codePlaceholder}
                    autoComplete="off"
                    autoFocus
                    disabled={authorizeMutation.isPending}
                  />
                </div>
                {authError ? (
                  <p role="alert" className="text-sm font-medium text-danger">
                    {authError}
                  </p>
                ) : null}
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  loading={authorizeMutation.isPending}
                  disabled={authorizeMutation.isPending || !code.trim()}
                >
                  {fr.verify.landing.submit}
                </Button>
              </form>
            ) : result ? (
              <div className="space-y-4">
                <VerificationResultCard result={result} />
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => setResult(null)}
                >
                  <IconQr className="h-4 w-4" />
                  {fr.verify.scanner.next}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink">
                    <IconCheck className="h-5 w-5 text-success" />
                    {fr.verify.scanner.title}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">{fr.verify.scanner.hint}</p>
                </div>
                <QrScanner
                  verifying={scanMutation.isPending}
                  onResult={(content) => scanMutation.mutate(content)}
                />
                {scanMutation.isPending ? (
                  <p className="text-sm font-medium text-ink-soft">{fr.verify.scanner.verifying}</p>
                ) : null}
                {scanError ? (
                  <p role="alert" className="text-sm font-medium text-danger">
                    {scanError}
                  </p>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusScreen({
  tone,
  title,
  description,
}: {
  tone: 'warning' | 'danger'
  title: string
  description: string
}) {
  return (
    <div
      role="status"
      className="rounded-[1.4rem] border border-line bg-white/85 p-8 text-center shadow-[0_18px_60px_rgba(25,32,28,0.10)] backdrop-blur-sm"
    >
      <span
        className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
          tone === 'danger' ? 'bg-danger/12 text-danger' : 'bg-warning/12 text-warning'
        }`}
      >
        <IconQr className="h-7 w-7" />
      </span>
      <h2 className="mt-4 text-xl font-semibold tracking-tight text-ink">{title}</h2>
      {description ? <p className="mt-2 text-sm leading-relaxed text-ink-soft">{description}</p> : null}
    </div>
  )
}
