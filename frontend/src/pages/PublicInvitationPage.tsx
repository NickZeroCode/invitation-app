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
import { TemplateOrnament } from '../templates/ornaments.tsx'
import { DARK_PANEL_KEYS, PanelDecor, panelSkinFor } from '../templates/panelSkin.tsx'
import type { PanelSkin } from '../templates/panelSkin.tsx'
import { getTemplate } from '../templates/registry.tsx'
import { formatEventDate, formatEventTime, formatProgramRange } from '../templates/shared.tsx'
import { panelRadiusFor } from '../templates/themes.ts'
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
  skin,
  templateKey,
  title,
  action,
  ornament,
  children,
}: {
  skin: PanelSkin
  templateKey: string
  /** Omit when the panel's blocks carry their own titles. */
  title?: string
  action?: ReactNode
  /** Template motif under the title; light utility panels opt out. */
  ornament?: boolean
  children: ReactNode
}) {
  const hasHeader = Boolean(title) || Boolean(action)
  return (
    <section
      className={`relative overflow-hidden border p-5 shadow-[0_18px_40px_rgba(28,25,23,0.06)] ${templateKey === 'confetti' ? 'pt-9' : ''}`}
      style={{
        background: skin.paper,
        borderColor: skin.line,
        borderRadius: panelRadiusFor(templateKey),
        color: skin.ink,
      }}
    >
      <PanelDecor templateKey={templateKey} />
      <div className="relative z-10">
        {hasHeader ? (
        <div className="flex flex-col items-center text-center">
          {title ? (
            <p
              className={`text-[0.78rem] font-medium uppercase ${skin.titleClass}`}
              style={{ letterSpacing: '0.38em', color: skin.accent }}
            >
              {title}
            </p>
          ) : null}
          {title && ornament !== false ? (
            <TemplateOrnament
              templateKey={templateKey}
              color={skin.accent}
              className="mx-auto mt-2.5 block h-auto w-32"
            />
          ) : null}
          {action ? <div className="mt-3 flex justify-center">{action}</div> : null}
        </div>
        ) : null}
        {children}
      </div>
    </section>
  )
}

/**
 * A revoked or expired link never opens the invitation again: the guest only
 * sees the state of the link — the server remains the authority — so no
 * invitation content, response form or actions leak through.
 */
function LifecycleStateScreen({ lifecycle }: { lifecycle: 'expired' | 'revoked' }) {
  const expired = lifecycle === 'expired'
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(212,162,75,0.18),_transparent_38%),linear-gradient(135deg,#f7f4ee_0%,#f1efe8_32%,#f7f5f1_100%)] px-4 py-10">
      <div className="w-full max-w-md rounded-[1.6rem] border border-line bg-white/85 p-8 text-center shadow-[0_24px_70px_rgba(25,32,28,0.12)] ring-1 ring-white/70 backdrop-blur-sm">
        <p className="flex items-center justify-center gap-2.5 text-xs font-medium uppercase tracking-[0.35em] text-ink-faint">
          <LogoMark className="h-7 w-7 rounded-md" />
          NickEvents
        </p>
        <span
          className={`mt-6 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${expired ? 'bg-warning-soft text-warning' : 'bg-danger-soft text-danger'}`}
        >
          {expired ? 'Expirée' : 'Révoquée'}
        </span>
        <h1 className="mt-4 text-2xl font-semibold text-ink">
          {expired ? 'Invitation expirée' : 'Invitation révoquée'}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          {expired ? 'Cette invitation a expiré.' : 'Cette invitation a été révoquée.'}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-faint">
          {expired
            ? 'Ce lien ne donne plus accès à l’invitation. Contactez l’organisateur pour recevoir une nouvelle invitation.'
            : 'Ce lien ne donne plus accès à l’invitation. Contactez l’organisateur pour toute question.'}
        </p>
      </div>
    </div>
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
  const skin = panelSkinFor(data.event.template.key)
  const onDarkPaper = DARK_PANEL_KEYS.has(data.event.template.key)

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
    coverTitle: data.event.cover_title,
    emphasis: data.event.display_config.emphasis ?? data.event.template.config.emphasis_fields,
    guestName: data.invitation.display_name,
    // Dress code and programme are presented in their own sidebar panel, so
    // the paper stays focused on the invitation message (empty hides them).
    dressCode: [],
    program: [],
  }

  const statusKey = verification.result ?? (data.is_valid ? 'valid' : 'expired')

  // Revoked or expired links never open the invitation: the guest lands on a
  // designed state screen instead (mirrors the server's public verdict).
  const lifecycle: 'valid' | 'expired' | 'revoked' =
    data.status === 'revoked' || statusKey === 'revoked'
      ? 'revoked'
      : data.status === 'expired' || statusKey === 'expired' || !data.is_valid
        ? 'expired'
        : 'valid'

  if (lifecycle !== 'valid') {
    return <LifecycleStateScreen lifecycle={lifecycle} />
  }

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
            <PanelCard skin={skin} templateKey={data.event.template.key} title="Détails de l’invitation">
              <div className="mt-4 space-y-2 text-sm" style={{ color: skin.inkSoft }}>
                <p>
                  <span className="font-semibold" style={{ color: skin.accent }}>Invité :</span>{' '}
                  <span style={{ color: skin.ink }}>{data.invitation.display_name}</span>
                </p>
                <p>
                  <span className="font-semibold" style={{ color: skin.accent }}>Événement :</span>{' '}
                  <span style={{ color: skin.ink }}>{data.event.title}</span>
                </p>
                <p>
                  <span className="font-semibold" style={{ color: skin.accent }}>Date :</span>{' '}
                  <span style={{ color: skin.ink }}>{formatEventDate(data.event.event_date)}</span>
                </p>
                {data.event.event_time ? (
                  <p>
                    <span className="font-semibold" style={{ color: skin.accent }}>Heure :</span>{' '}
                    <span style={{ color: skin.ink }}>{formatEventTime(data.event.event_time)}</span>
                  </p>
                ) : null}
                {data.event.venue_name ? (
                  <p>
                    <span className="font-semibold" style={{ color: skin.accent }}>Lieu :</span>{' '}
                    <span style={{ color: skin.ink }}>{data.event.venue_name}</span>
                  </p>
                ) : null}
              </div>
            </PanelCard>

            {dressCode.length > 0 || program.length > 0 ? (
              <PanelCard skin={skin} templateKey={data.event.template.key}>
                {dressCode.length > 0 ? (
                  <div>
                    <p
                      className={`text-center text-[0.78rem] font-medium uppercase ${skin.titleClass}`}
                      style={{ letterSpacing: '0.38em', color: skin.accent }}
                    >
                      Dress code
                    </p>
                    <TemplateOrnament
                      templateKey={data.event.template.key}
                      color={skin.accent}
                      className="mx-auto mt-2.5 block h-auto w-32"
                    />
                    <div className="mt-3 flex flex-wrap items-start justify-center gap-3">
                      {dressCode.map((image, index) => (
                        <figure key={`${image.url}-${index}`} className="w-[7.75rem]">
                          <img
                            src={image.url}
                            alt={image.caption || 'Tenue proposée'}
                            className="h-28 w-full rounded-xl object-cover"
                            style={{ border: `1px solid ${skin.line}` }}
                          />
                          {image.caption ? (
                            <figcaption
                              className="mt-1.5 text-center text-xs"
                              style={{ color: skin.inkSoft }}
                            >
                              {image.caption}
                            </figcaption>
                          ) : null}
                        </figure>
                      ))}
                    </div>
                  </div>
                ) : null}

                {program.length > 0 ? (
                  <div className={dressCode.length > 0 ? 'mt-6' : undefined}>
                    <p
                      className={`text-center text-[0.78rem] font-medium uppercase ${skin.titleClass}`}
                      style={{ letterSpacing: '0.38em', color: skin.accent }}
                    >
                      Programme
                    </p>
                    <TemplateOrnament
                      templateKey={data.event.template.key}
                      color={skin.accent}
                      className="mx-auto mt-2.5 block h-auto w-32"
                    />
                    <div className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2.5 text-sm">
                      {program.map((item, index) => (
                        <div key={index} className="contents">
                          <span
                            className="whitespace-nowrap font-semibold uppercase"
                            style={{ color: skin.accent, letterSpacing: '0.12em' }}
                          >
                            {formatProgramRange(item.start_time, item.end_time)}
                          </span>
                          <span style={{ color: skin.ink }}>{item.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </PanelCard>
            ) : null}

            {/* Decorative section for the QR code: the panel is dressed in the
                template palette, and the QR keeps only its own white box on
                that paper — no intermediate pad stacking behind it. */}
            <PanelCard
              skin={skin}
              templateKey={data.event.template.key}
              title="Vérification QR"
              ornament={false}
              action={
                <span
                  className="inline-flex items-center rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold"
                  style={{ backgroundColor: skin.chipBg, borderColor: skin.line, color: skin.ink }}
                >
                  {STATUS_LABEL[statusKey] ?? 'Valide'}
                </span>
              }
            >
              <div className="mt-4 flex flex-col items-center text-center">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR code de vérification"
                    className="h-40 w-40 rounded-xl bg-white p-2 shadow-sm"
                    style={{ border: `1px solid ${skin.accent}55` }}
                  />
                ) : (
                  <div className="flex h-40 w-40 items-center justify-center rounded-xl bg-white text-xs text-ink-faint">
                    QR
                  </div>
                )}
                <p className="mt-4 text-sm" style={{ color: skin.inkSoft }}>
                  <span className="font-semibold" style={{ color: skin.accent }}>Vérification :</span>{' '}
                  <span style={{ color: skin.ink }}>
                    {verification.result === 'valid' ? 'Cette invitation est actuellement valide.' : verification.result === 'expired' ? 'Cette invitation a expiré.' : verification.result === 'revoked' ? 'Cette invitation a été révoquée.' : 'Ce lien est invalide.'}
                  </span>
                </p>
              </div>
            </PanelCard>

            {data.preferences.enabled ? (
              <PanelCard skin={skin} templateKey={data.event.template.key} title="Préférences" ornament={false}>
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
                        style={{ borderColor: skin.line, backgroundColor: skin.softBg }}
                      >
                        <legend className="text-sm font-medium" style={{ color: skin.ink }}>{question.label}</legend>
                        {question.help_text ? (
                          <p className="mt-1 text-[0.7rem]" style={{ color: skin.inkSoft }}>{question.help_text}</p>
                        ) : null}

                        <div className="mt-3 space-y-2">
                          {question.options.map((option) => {
                            const checked = currentSelection.includes(option.id)
                            const optionId = `${question.id}-${option.id}`

                            return (
                              <label
                                key={option.id}
                                htmlFor={optionId}
                                className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition ${onDarkPaper ? 'hover:bg-white/10' : 'hover:bg-white/60'}`}
                                style={{ color: skin.inkSoft }}
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
                                  style={{ accentColor: skin.accent }}
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
                    <p
                      role="status"
                      className="text-sm font-medium text-success"
                      style={onDarkPaper ? { color: '#9EE6BC' } : undefined}
                    >
                      {submitMessage}
                    </p>
                  ) : null}
                  {submitError ? (
                    <p
                      role="alert"
                      className="text-sm font-medium text-danger"
                      style={onDarkPaper ? { color: '#FFB4A8' } : undefined}
                    >
                      {submitError}
                    </p>
                  ) : null}

                  <div className="flex justify-center">
                    <Button
                      variant="primary"
                      size="md"
                      type="submit"
                      loading={submitMutation.isPending}
                      disabled={submitMutation.isPending}
                      style={{ backgroundColor: skin.accent, borderColor: skin.accent, color: skin.onAccent }}
                    >
                      Envoyer ma réponse
                    </Button>
                  </div>
                </form>
              </PanelCard>
            ) : null}

            <PanelCard skin={skin} templateKey={data.event.template.key} title="Actions">
              <div className="mt-4 flex justify-center">
                <InvitationDownloadButton
                  targetRef={cardRef}
                  title={data.event.title}
                  guestName={data.invitation.display_name}
                  templateKey={data.event.template.key}
                  dressCode={(data.dress_code?.images ?? []).map((image) => ({
                    url: image.url,
                    caption: image.caption,
                  }))}
                  program={(data.program?.items ?? []).map((item) => ({
                    start_time: item.start_time,
                    end_time: item.end_time,
                    description: item.description,
                  }))}
                  qrText={`${window.location.origin}/i/${publicToken}`}
                  style={{ backgroundColor: skin.accent, borderColor: skin.accent, color: skin.onAccent }}
                />
              </div>
            </PanelCard>
          </aside>
        </div>
      </div>
    </div>
  )
}
