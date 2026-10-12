import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Field,
  IconCheck,
  IconExternal,
  IconLink,
  IconRefresh,
  Input,
  LoadingState,
  PageHeader,
  SectionTitle,
  Spinner,
  buttonClasses,
} from '../design-system/index.ts'
import { ApiError, eventsApi, verificationApi } from '../lib/api.ts'
import { formatDate } from '../lib/format.ts'
import type { VerificationLink, VerificationLinkPayload, VerificationScanResult } from '../lib/types.ts'
import { fr } from '../locales/fr.ts'
import { QrScanner } from '../verification/QrScanner.tsx'
import { VerificationResultCard } from '../verification/VerificationResultCard.tsx'

/** Authorization codes never contain ambiguous glyphs (O/0, I/1…). */
function generateAuthCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const values = new Uint32Array(8)
  crypto.getRandomValues(values)
  return Array.from(values, (value) => alphabet[value % alphabet.length]).join('')
}

/** Local calendar day (YYYY-MM-DD) for the expiry date minimum. */
const TODAY_ISO = new Date().toISOString().slice(0, 10)

const STATUS_TONE = {
  active: 'success',
  expired: 'neutral',
  revoked: 'danger',
} as const

/**
 * Organizer verification hub (`/evenements/:id/verification`): door-side QR
 * authenticity checks for the owner, plus delegated verification links —
 * each with its own authorization code and expiry, revocable at any time.
 */
export function EventVerificationPage() {
  const { id } = useParams()
  const eventId = Number(id)
  const queryClient = useQueryClient()

  const eventQuery = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsApi.get(eventId),
    enabled: Number.isFinite(eventId),
    retry: false,
  })

  const linksQuery = useQuery({
    queryKey: ['verification-links', eventId],
    queryFn: () => verificationApi.listForEvent(eventId),
    enabled: Number.isFinite(eventId),
    retry: false,
  })

  // --- Owner-side scanner ---
  const [result, setResult] = useState<VerificationScanResult | null>(null)
  const [scanError, setScanError] = useState('')

  const scanMutation = useMutation({
    mutationFn: (content: string) => verificationApi.scanForEvent(eventId, content),
    onSuccess: (data) => {
      setResult(data)
      setScanError('')
    },
    onError: (error: unknown) => {
      setScanError(error instanceof ApiError ? error.message : fr.verify.landing.invalidLink)
    },
  })

  // --- Delegated link creation ---
  const [label, setLabel] = useState('')
  const [code, setCode] = useState(() => generateAuthCode())
  const [expires, setExpires] = useState('')
  const [createError, setCreateError] = useState('')
  const [created, setCreated] = useState<{ link: VerificationLink; code: string } | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [revoking, setRevoking] = useState<VerificationLink | null>(null)

  const createMutation = useMutation({
    mutationFn: () => {
      const payload: VerificationLinkPayload = {
        code,
        expires_at: new Date(`${expires}T23:59:59`).toISOString(),
      }
      if (label.trim()) payload.label = label.trim()
      return verificationApi.create(eventId, payload)
    },
    onSuccess: (link) => {
      setCreated({ link, code })
      setCreateError('')
      setLabel('')
      setCode(generateAuthCode())
      setExpires('')
      void queryClient.invalidateQueries({ queryKey: ['verification-links', eventId] })
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.fields) {
        const first = Object.values(error.fields)[0]?.[0]
        setCreateError(first || fr.verify.owner.errorTitle)
      } else {
        setCreateError(error instanceof ApiError ? error.message : fr.verify.owner.errorTitle)
      }
    },
  })

  const revokeMutation = useMutation({
    mutationFn: (link: VerificationLink) => verificationApi.revoke(link.id),
    onSuccess: () => {
      setRevoking(null)
      void queryClient.invalidateQueries({ queryKey: ['verification-links', eventId] })
    },
    onError: (error: unknown) => {
      setCreateError(error instanceof ApiError ? error.message : fr.verify.owner.errorTitle)
      setRevoking(null)
    },
  })

  function submitCreate(event: FormEvent) {
    event.preventDefault()
    if (!expires || createMutation.isPending) return
    createMutation.mutate()
  }

  async function copyToClipboard(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedKey(key)
      window.setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 2000)
    } catch {
      setCopiedKey(null)
    }
  }

  if (!Number.isFinite(eventId)) {
    return <LoadingState label={fr.common.loading} />
  }

  const links = linksQuery.data?.results ?? []
  const linkUrl = (link: VerificationLink) => `${window.location.origin}/verification/${link.token}`

  return (
    <div>
      <PageHeader
        eyebrow={eventQuery.data?.title}
        title={fr.verify.owner.title}
        description={fr.verify.owner.subtitle}
        actions={
          <Link to={`/evenements/${eventId}/invitations`} className={buttonClasses('secondary', 'md')}>
            {fr.guests.title}
          </Link>
        }
      />

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <SectionTitle as="h2">{fr.verify.scanner.title}</SectionTitle>
            {result ? (
              <Button variant="ghost" size="sm" onClick={() => setResult(null)}>
                <IconRefresh className="h-4 w-4" />
                {fr.verify.scanner.next}
              </Button>
            ) : null}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">{fr.verify.scanner.hint}</p>

          <div className="mt-4">
            {result ? (
              <VerificationResultCard result={result} />
            ) : (
              <>
                <QrScanner
                  verifying={scanMutation.isPending}
                  onResult={(content) => scanMutation.mutate(content)}
                />
                {scanMutation.isPending ? (
                  <p className="mt-3 flex items-center gap-2 text-sm font-medium text-ink-soft">
                    <Spinner className="h-4 w-4" />
                    {fr.verify.scanner.verifying}
                  </p>
                ) : null}
                {scanError ? (
                  <p role="alert" className="mt-3 text-sm font-medium text-danger">
                    {scanError}
                  </p>
                ) : null}
              </>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <SectionTitle as="h2">{fr.verify.owner.createTitle}</SectionTitle>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">{fr.verify.owner.linksHint}</p>
            <form className="mt-4 space-y-4" onSubmit={submitCreate}>
              <Field id="verify-link-label" label={fr.verify.owner.labelField}>
                <Input
                  id="verify-link-label"
                  value={label}
                  placeholder={fr.verify.owner.labelPlaceholder}
                  onChange={(event) => setLabel(event.target.value)}
                />
              </Field>
              <Field id="verify-link-code" label={fr.verify.owner.codeField} hint={fr.verify.owner.codeHint} required>
                <div className="flex gap-2">
                  <Input
                    id="verify-link-code"
                    value={code}
                    autoComplete="off"
                    onChange={(event) => setCode(event.target.value)}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setCode(generateAuthCode())}
                    title={fr.verify.owner.codeGenerate}
                  >
                    <IconRefresh className="h-4 w-4" />
                    {fr.verify.owner.codeGenerate}
                  </Button>
                </div>
              </Field>
              <Field id="verify-link-expiry" label={fr.verify.owner.expiryField} required>
                <Input
                  id="verify-link-expiry"
                  type="date"
                  min={TODAY_ISO}
                  value={expires}
                  onChange={(event) => setExpires(event.target.value)}
                />
              </Field>
              {createError ? (
                <p role="alert" className="text-sm font-medium text-danger">
                  {createError}
                </p>
              ) : null}
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                loading={createMutation.isPending}
                disabled={createMutation.isPending || !expires}
              >
                {fr.verify.owner.createSubmit}
              </Button>
            </form>

            {created ? (
              <div
                role="status"
                className="mt-5 rounded-2xl border border-success/30 bg-success/8 p-4"
              >
                <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <IconCheck className="h-5 w-5 text-success" />
                  {fr.verify.owner.createdTitle}
                </p>
                <p className="mt-2 break-all rounded-xl bg-white px-3 py-2 font-mono text-sm text-ink">
                  {linkUrl(created.link)}
                </p>
                <p className="mt-2 break-all text-sm font-semibold text-ink">
                  {fr.verify.owner.createdCode.replace('{code}', created.code)}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-ink-soft">{fr.verify.owner.createdWarning}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => copyToClipboard('created-link', linkUrl(created.link))}
                  >
                    <IconLink className="h-4 w-4" />
                    {copiedKey === 'created-link' ? fr.verify.owner.copied : fr.verify.owner.copyLink}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => copyToClipboard('created-code', created.code)}
                  >
                    {copiedKey === 'created-code' ? fr.verify.owner.copied : fr.verify.owner.codeField}
                  </Button>
                </div>
              </div>
            ) : null}
          </Card>

          <Card className="p-5 sm:p-6">
            <SectionTitle as="h2">{fr.verify.owner.linksTitle}</SectionTitle>
            {linksQuery.isPending ? (
              <p className="mt-4 flex items-center gap-2 text-sm text-ink-soft">
                <Spinner className="h-4 w-4" />
                {fr.common.loading}
              </p>
            ) : linksQuery.isError ? (
              <p role="alert" className="mt-4 text-sm font-medium text-danger">
                {fr.verify.owner.errorTitle}
              </p>
            ) : links.length === 0 ? (
              <p className="mt-4 text-sm text-ink-soft">{fr.verify.owner.empty}</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.id} className="rounded-2xl border border-line p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
                        {link.label || linkUrl(link)}
                      </span>
                      <Badge tone={STATUS_TONE[link.status]} dot>
                        {fr.verify.owner.status[link.status]}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-ink-soft">
                      {fr.verify.owner.expires.replace('{date}', formatDate(link.expires_at))}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => copyToClipboard(`link-${link.id}`, linkUrl(link))}
                      >
                        <IconLink className="h-4 w-4" />
                        {copiedKey === `link-${link.id}` ? fr.verify.owner.copied : fr.verify.owner.copyLink}
                      </Button>
                      <a
                        href={linkUrl(link)}
                        target="_blank"
                        rel="noreferrer"
                        className={buttonClasses('secondary', 'sm')}
                      >
                        <IconExternal className="h-4 w-4" />
                        {fr.verify.landing.eyebrow}
                      </a>
                      {link.status !== 'revoked' ? (
                        <Button variant="ghost" size="sm" onClick={() => setRevoking(link)}>
                          {fr.verify.owner.revoke}
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={revoking !== null}
        title={fr.verify.owner.revokeTitle}
        message={fr.verify.owner.revokeConfirm}
        confirmLabel={fr.verify.owner.revoke}
        loading={revokeMutation.isPending}
        onCancel={() => setRevoking(null)}
        onConfirm={() => revoking && revokeMutation.mutate(revoking)}
      />
    </div>
  )
}
