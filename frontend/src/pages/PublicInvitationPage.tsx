import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import QRCode from 'qrcode'

import { Button } from '../design-system/Button.tsx'
import { LogoMark } from '../design-system/Logo.tsx'
import { InvitationDownloadButton } from '../templates/InvitationDownloadButton.tsx'
import { ErrorState, LoadingState } from '../design-system/states.tsx'
import { ApiError, publicApi } from '../lib/api.ts'
import type {
  GuestResponseSubmission,
  PublicInvitationPayload,
  PublicInvitationVerification,
} from '../lib/types.ts'
import { fontScaleStyle } from '../templates/fontSizes.ts'
import { getTemplate } from '../templates/registry.tsx'
import { formatEventDate, formatEventTime } from '../templates/shared.tsx'
import { themeFor } from '../templates/themes.ts'
import type { TemplateTheme } from '../templates/themes.ts'
import type { InvitationDraft } from '../templates/types.ts'

const STATUS_TONE: Record<string, string> = {
  valid: 'bg-success-soft text-success',
  expired: 'bg-warning-soft text-warning',
  revoked: 'bg-danger-soft text-danger',
  invalid: 'bg-surface-muted text-ink-soft',
  active: 'bg-success-soft text-success',
  deleted: 'bg-surface-muted text-ink-soft',
}

const STATUS_LABEL: Record<string, string> = {
  valid: 'Valide',
  expired: 'Expirée',
  revoked: 'Révoquée',
  invalid: 'Invalide',
  active: 'Active',
  deleted: 'Supprimée',
}

/**
 * One guest-side panel dressed in the selected template's palette: tinted
 * paper surface, accent display title and a hairline rule — the sidebar
 * follows the invitation's identity instead of generic chrome.
 */
function PanelCard({
  theme,
  title,
  action,
  children,
}: {
  theme: TemplateTheme
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section
      className="rounded-[1.75rem] border p-5 shadow-[0_18px_40px_rgba(28,25,23,0.06)]"
      style={{ backgroundColor: theme.surface, borderColor: theme.line }}
    >
      <div className="flex items-center justify-between gap-3">
        <p
          className={`text-[0.72rem] font-semibold uppercase tracking-[0.25em] ${theme.titleClass}`}
          style={{ color: theme.accent }}
        >
          {title}
        </p>
        {action}
      </div>
      <span
        className="mt-3 block h-px w-full"
        style={{ backgroundColor: theme.line }}
        aria-hidden="true"
      />
      {children}
    </section>
  )
}

export function PublicInvitationPage() {
  const { token } = useParams<{ token: string }>()
  const publicToken = token ?? ''
  const queryClient = useQueryClient()

  const publicQuery = useQuery({
    queryKey: ['public-invitation', publicToken],
    queryFn: () => publicApi.invitation(publicToken),
    enabled: publicToken.length > 0,
    retry: false,
  })

  const verifyQuery = useQuery({
    queryKey: ['public-invitation-verify', publicToken],
    queryFn: () => publicApi.verify(publicToken),
    enabled: publicToken.length > 0,
    retry: false,
  })

  const [qrDataUrl, setQrDataUrl] = useState('')
  const [answerOverrides, setAnswerOverrides] = useState<Record<number, number[]> | null>(null)
  const [submitMessage, setSubmitMessage] = useState('')
  const [submitError, setSubmitError] = useState('')
  const cardRef = useRef<HTMLDivElement>(null)

  // Saved answers seed the form; guest edits layer on top as explicit
  // overrides (derived during render — no effect, no cascading updates).
  const defaultSelection: Record<number, number[]> = {}
  for (const answer of publicQuery.data?.response?.answers ?? []) {
    defaultSelection[answer.question] = answer.options.map((option) => option.id)
  }
  const selectedOptions = answerOverrides ?? defaultSelection

  const submitMutation = useMutation({
    mutationFn: (payload: GuestResponseSubmission) =>
      publicApi.submitResponse(publicToken, payload),
    onSuccess: async () => {
      setSubmitError('')
      setSubmitMessage('Réponse enregistrée.')
      setAnswerOverrides(null)
      await queryClient.invalidateQueries({ queryKey: ['public-invitation', publicToken] })
    },
    onError: (error: unknown) => {
      setSubmitMessage('')
      if (error instanceof ApiError) {
        setSubmitError(error.message)
      } else {
        setSubmitError('La réponse n’a pas pu être enregistrée.')
      }
    },
  })

  useEffect(() => {
    if (!publicToken) return
    let cancelled = false

    QRCode.toDataURL(`${window.location.origin}/i/${publicToken}`, {
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
  }, [publicToken])

  if (publicQuery.isPending || verifyQuery.isPending) {
    return <LoadingState label="Chargement de l’invitation…" />
  }

  if (publicQuery.isError || !publicQuery.data) {
    return (
      <ErrorState
        title="Invitation introuvable"
        description="Ce lien n’existe plus, a été révoqué ou n’est pas valide."
      />
    )
  }

  const data = publicQuery.data as PublicInvitationPayload
  const verification = (verifyQuery.data ?? {
    result: data.is_valid ? 'valid' : 'expired',
    is_valid: data.is_valid,
    // Fallback only (verification call failed): no server check happened.
    verified_at: '',
    guest_name: data.invitation.display_name,
    event_title: data.event.title,
  }) as PublicInvitationVerification

  const templateDef = getTemplate(data.event.template.key)
  const TemplateComponent = templateDef?.Component
  const theme = themeFor(data.event.template.key)

  // Content-gated sections: an unfilled section is hidden, never rendered empty.
  const dressCode = data.dress_code?.images ?? []
  const program = data.program?.items ?? []

  const draft: InvitationDraft = {
    title: data.event.title,
    message: data.event.message,
    messageFont: data.event.message_font,
    fontSize: data.event.font_size,
    event_date: data.event.event_date,
    event_time: data.event.event_time,
    timezone: data.event.timezone,
    venue_name: data.event.venue_name,
    venue_address: data.event.venue_address,
    venue_details: data.event.venue_details,
    cover_url: data.event.cover_url,
    emphasis: data.event.display_config.emphasis ?? data.event.template.config.emphasis_fields,
    guestName: data.invitation.display_name,
    dressCode: dressCode.map((image) => ({ url: image.url, caption: image.caption })),
    program: program.map((item) => ({
      start_time: item.start_time,
      end_time: item.end_time,
      description: item.description,
    })),
  }

  const statusKey = verification.result ?? (data.is_valid ? 'valid' : 'expired')

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(212,162,75,0.18),_transparent_38%),linear-gradient(135deg,#f7f4ee_0%,#f1efe8_32%,#f7f5f1_100%)] px-2 py-6 text-ink sm:px-4 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4 px-1">
          <div>
            <p className="flex items-center gap-2.5 text-xs font-medium uppercase tracking-[0.35em] text-ink-faint">
              <LogoMark className="h-7 w-7 rounded-md" />
              NickEvents
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-ink md:text-3xl">Invitation</h1>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${STATUS_TONE[statusKey] ?? 'bg-surface-muted text-ink-soft'}`}
          >
            {STATUS_LABEL[statusKey] ?? 'Valide'}
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,0.7fr)]">
          <div className="min-w-0 rounded-[1.4rem] border border-line bg-white/75 p-1.5 shadow-[0_18px_60px_rgba(25,32,28,0.08)] ring-1 ring-white/70 backdrop-blur-sm [overflow-wrap:anywhere] sm:rounded-[2rem] sm:p-3">
            <div className="overflow-hidden rounded-[1.1rem] border border-line bg-white sm:rounded-[1.5rem]">
              <div ref={cardRef} style={fontScaleStyle(data.event.font_size)}>
                {TemplateComponent ? (
                  <TemplateComponent draft={draft} />
                ) : (
                  <div className="flex min-h-[28rem] items-center justify-center p-8 text-center text-ink-soft">
                    Modèle de mise en page indisponible.
                  </div>
                )}
              </div>
            </div>
          </div>

          <aside className="min-w-0 space-y-5 [overflow-wrap:anywhere]">
            <PanelCard theme={theme} title="Détails de l’invitation">
              <div className="mt-4 space-y-2 text-sm" style={{ color: theme.inkSoft }}>
                <p>
                  <span className="font-semibold" style={{ color: theme.accent }}>Invité :</span>{' '}
                  <span style={{ color: theme.ink }}>{data.invitation.display_name}</span>
                </p>
                <p>
                  <span className="font-semibold" style={{ color: theme.accent }}>Événement :</span>{' '}
                  <span style={{ color: theme.ink }}>{data.event.title}</span>
                </p>
                <p>
                  <span className="font-semibold" style={{ color: theme.accent }}>Date :</span>{' '}
                  <span style={{ color: theme.ink }}>{formatEventDate(data.event.event_date)}</span>
                </p>
                {data.event.event_time ? (
                  <p>
                    <span className="font-semibold" style={{ color: theme.accent }}>Heure :</span>{' '}
                    <span style={{ color: theme.ink }}>{formatEventTime(data.event.event_time)}</span>
                  </p>
                ) : null}
                {data.event.venue_name ? (
                  <p>
                    <span className="font-semibold" style={{ color: theme.accent }}>Lieu :</span>{' '}
                    <span style={{ color: theme.ink }}>{data.event.venue_name}</span>
                  </p>
                ) : null}
              </div>
            </PanelCard>

            <PanelCard
              theme={theme}
              title="Vérification QR"
              action={
                <span className={`rounded-full px-2 py-1 text-[0.65rem] font-semibold ${STATUS_TONE[statusKey] ?? 'bg-surface-muted text-ink-soft'}`}>
                  {STATUS_LABEL[statusKey] ?? 'Valide'}
                </span>
              }
            >
              <div
                className="mt-4 flex items-center justify-center rounded-[1.4rem] p-4"
                style={{ backgroundColor: theme.line, opacity: 0.9 }}
              >
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR code de vérification"
                    className="h-40 w-40 rounded-xl bg-white p-2 shadow-sm"
                    style={{ border: `1px solid ${theme.accent}55` }}
                  />
                ) : (
                  <div className="flex h-40 w-40 items-center justify-center rounded-xl bg-white text-xs text-ink-faint">
                    QR
                  </div>
                )}
              </div>

              <p className="mt-4 text-sm" style={{ color: theme.inkSoft }}>
                <span className="font-semibold" style={{ color: theme.accent }}>Vérification :</span>{' '}
                <span style={{ color: theme.ink }}>
                  {verification.result === 'valid' ? 'Cette invitation est actuellement valide.' : verification.result === 'expired' ? 'Cette invitation a expiré.' : verification.result === 'revoked' ? 'Cette invitation a été révoquée.' : 'Ce lien est invalide.'}
                </span>
              </p>
            </PanelCard>

            {data.preferences.enabled ? (
              <PanelCard theme={theme} title="Préférences">
                <form
                  className="mt-4 space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault()
                    const answers = data.preferences.questions.map((question) => ({
                      question: question.id,
                      options: selectedOptions[question.id] ?? [],
                    }))
                    setSubmitError('')
                    setSubmitMessage('')
                    submitMutation.mutate({ answers })
                  }}
                >
                  {data.preferences.questions.map((question) => {
                    const currentSelection = selectedOptions[question.id] ?? []
                    const isSingle = question.input_type === 'single'

                    return (
                      <fieldset
                        key={question.id}
                        className="rounded-xl border p-3"
                        style={{ borderColor: theme.line, backgroundColor: `${theme.line}55` }}
                      >
                        <legend className="text-sm font-medium" style={{ color: theme.ink }}>{question.label}</legend>
                        {question.help_text ? (
                          <p className="mt-1 text-[0.7rem] text-ink-soft">{question.help_text}</p>
                        ) : null}

                        <div className="mt-3 space-y-2">
                          {question.options.map((option) => {
                            const checked = currentSelection.includes(option.id)
                            const optionId = `${question.id}-${option.id}`

                            return (
                              <label
                                key={option.id}
                                htmlFor={optionId}
                                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-ink-soft transition hover:bg-white/60"
                              >
                                <input
                                  id={optionId}
                                  name={String(question.id)}
                                  type={isSingle ? 'radio' : 'checkbox'}
                                  value={option.id}
                                  checked={checked}
                                  onChange={() => {
                                    setAnswerOverrides((previous) => {
                                      const next = { ...(previous ?? defaultSelection) }
                                      const selected = new Set(next[question.id] ?? [])

                                      if (isSingle) {
                                        next[question.id] = [option.id]
                                        return next
                                      }

                                      if (selected.has(option.id)) {
                                        selected.delete(option.id)
                                      } else {
                                        selected.add(option.id)
                                      }
                                      next[question.id] = Array.from(selected)
                                      return next
                                    })
                                  }}
                                  className="h-4 w-4"
                                  style={{ accentColor: theme.accent }}
                                />
                                <span>{option.label}</span>
                              </label>
                            )
                          })}
                        </div>
                      </fieldset>
                    )
                  })}

                  {submitMessage ? (
                    <p role="status" className="text-sm font-medium text-success">
                      {submitMessage}
                    </p>
                  ) : null}
                  {submitError ? (
                    <p role="alert" className="text-sm font-medium text-danger">
                      {submitError}
                    </p>
                  ) : null}

                  <Button
                    variant="primary"
                    size="md"
                    type="submit"
                    loading={submitMutation.isPending}
                    disabled={submitMutation.isPending}
                    style={{ backgroundColor: theme.accent, borderColor: theme.accent }}
                  >
                    Envoyer ma réponse
                  </Button>
                </form>
              </PanelCard>
            ) : null}

            <PanelCard theme={theme} title="Actions">
              <div className="mt-4 space-y-3">
                <InvitationDownloadButton
                  targetRef={cardRef}
                  title={data.event.title}
                  guestName={data.invitation.display_name}
                  qrDataUrl={qrDataUrl}
                />
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => window.print()}
                    style={{ borderColor: theme.accent, color: theme.accent }}
                  >
                    Imprimer
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => navigator.clipboard.writeText(window.location.href)}
                    style={{ color: theme.accent }}
                  >
                    Copier le lien
                  </Button>
                </div>
              </div>
            </PanelCard>
          </aside>
        </div>
      </div>
    </div>
  )
}
