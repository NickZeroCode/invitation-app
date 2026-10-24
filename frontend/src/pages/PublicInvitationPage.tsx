/**
 * The guest's invitation page — the product's most important surface.
 *
 * Staged like a stationery suite on a table rather than a web dashboard: the
 * invitation sheet lies on a linen backdrop tinted by its own palette, opened
 * from a sealed envelope addressed to the guest, with its companion cards
 * (reply card, practical details, programme, access card) set beside it in
 * the same paper and accent. Data flow and every guest interaction (preference
 * answers, presence confirmation, QR verification) are unchanged.
 */
import { useCallback, useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import QRCode from 'qrcode'

import { Button } from '../design-system/Button.tsx'
import { IconCalendar, IconCheck } from '../design-system/icons.tsx'
import { LogoMark } from '../design-system/Logo.tsx'
import { ErrorState, LoadingState } from '../design-system/states.tsx'
import { ApiError, publicApi } from '../lib/api.ts'
import { downloadIcs } from '../lib/calendar.ts'
import { invitationUrl } from '../lib/publicUrl.ts'
import type {
  GuestResponseSubmission,
  PublicInvitationPayload,
  PublicInvitationVerification,
} from '../lib/types.ts'
import { EnvelopeReveal } from '../templates/EnvelopeReveal.tsx'
import { fontScaleStyle } from '../templates/fontSizes.ts'
import { TemplateOrnament } from '../templates/ornaments.tsx'
import { DARK_PANEL_KEYS, panelSkinFor } from '../templates/panelSkin.tsx'
import type { PanelSkin } from '../templates/panelSkin.tsx'
import { getTemplate } from '../templates/registry.tsx'
import { formatEventDate, formatEventTime, formatProgramRange, groupDressCode } from '../templates/shared.tsx'
import { LuxuryTable } from '../templates/tableScene.tsx'
import type { InvitationDraft } from '../templates/types.ts'

const STATUS_LABEL: Record<string, string> = {
  valid: 'Valide',
  expired: 'Expirée',
  revoked: 'Révoquée',
  invalid: 'Invalide',
  active: 'Active',
  deleted: 'Supprimée',
}

/** The table the suite lies on: warm linen, nudged toward the card's accent. */
function stageFor(skin: PanelSkin, dark: boolean): { color: string; texture: string } {
  const base = dark ? '#1A1714' : '#E8E1D5'
  const color = `color-mix(in oklab, ${skin.accent} ${dark ? 8 : 5}%, ${base})`
  // Linen: slubbed weft, faint warp — irregular pitches so it never reads
  // as a grid.
  const weft = dark ? 'rgba(255,255,255,0.018)' : 'rgba(80,60,30,0.026)'
  const warp = dark ? 'rgba(255,255,255,0.01)' : 'rgba(80,60,30,0.012)'
  const texture = [
    `repeating-linear-gradient(0deg, ${weft} 0 1px, transparent 1px 3px, ${warp} 3px 4px, transparent 4px 7px)`,
    `repeating-linear-gradient(90deg, ${warp} 0 1px, transparent 1px 5px)`,
    dark
      ? 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.06), transparent 60%)'
      : 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.55), transparent 62%)',
  ].join(', ')
  return { color, texture }
}

/** Physical paper on a table: hairline contact shadow + soft ambient lift. */
const SHEET_SHADOW =
  '0 1px 1px rgba(30,22,14,0.10), 0 2px 4px rgba(30,22,14,0.06), 0 14px 28px -10px rgba(30,22,14,0.22), 0 40px 70px -30px rgba(30,22,14,0.30)'

/** Staggered entrance once the envelope opens (see `.suite-rise` in
 * index.css — disabled for reduced motion). */
function rise(revealed: boolean, index: number): { className: string; style: CSSProperties } {
  return {
    className: revealed ? 'suite-rise' : 'suite-wait',
    style: { ['--rise-delay' as string]: `${120 + index * 90}ms` },
  }
}

/**
 * One companion card of the suite, printed on the template's paper: small
 * capitals title, the template's own ornament, generous margins.
 */
function SuiteCard({
  skin,
  templateKey,
  title,
  action,
  ornament = true,
  className = '',
  style,
  children,
}: {
  skin: PanelSkin
  templateKey: string
  title?: string
  action?: ReactNode
  ornament?: boolean
  className?: string
  style?: CSSProperties
  children: ReactNode
}) {
  return (
    <section
      className={`relative overflow-hidden rounded-[3px] px-6 py-6 sm:px-7 ${className}`}
      style={{ background: skin.paper, color: skin.ink, boxShadow: SHEET_SHADOW, ...style }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[0.45rem] rounded-[2px]"
        style={{ border: `1px solid ${skin.line}` }}
      />
      <div className="relative z-10">
        {title || action ? (
          <div className="flex flex-col items-center text-center">
            {title ? (
              <h2
                className={`text-[0.74rem] font-medium uppercase ${skin.titleClass}`}
                style={{ letterSpacing: '0.38em', color: skin.accent }}
              >
                {title}
              </h2>
            ) : null}
            {title && ornament ? (
              <TemplateOrnament templateKey={templateKey} color={skin.accent} className="mx-auto mt-2.5 block h-auto w-28" />
            ) : null}
            {action ? <div className="mt-3 flex justify-center">{action}</div> : null}
          </div>
        ) : null}
        {children}
      </div>
    </section>
  )
}

function SectionLabel({ skin, children }: { skin: PanelSkin; children: ReactNode }) {
  return (
    <p
      className={`text-center text-[0.74rem] font-medium uppercase ${skin.titleClass}`}
      style={{ letterSpacing: '0.38em', color: skin.accent }}
    >
      {children}
    </p>
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
    <div className="flex min-h-screen items-center justify-center bg-[#E8E1D5] px-4 py-10">
      <div
        className="w-full max-w-md rounded-[3px] bg-[#FBF7F0] px-8 py-10 text-center"
        style={{ boxShadow: SHEET_SHADOW }}
      >
        <p className="flex items-center justify-center gap-2.5 text-[0.7rem] font-medium uppercase tracking-[0.35em] text-ink-faint">
          <LogoMark className="h-6 w-6 rounded-md" />
          MalaikaEvents
        </p>
        <span
          className={`mt-7 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${expired ? 'bg-warning-soft text-warning' : 'bg-danger-soft text-danger'}`}
        >
          {expired ? 'Expirée' : 'Révoquée'}
        </span>
        <h1 className="mt-4 font-display text-2xl text-ink">
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
  // Guest presence confirmation (one-way): the stamped timestamp wins over
  // the payload's value so the confirmed state appears without a re-render gap.
  const [presenceStamped, setPresenceStamped] = useState<string | null>(null)
  const [presenceError, setPresenceError] = useState('')
  const [revealed, setRevealed] = useState(false)
  const onOpened = useCallback(() => setRevealed(true), [])

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

  const confirmPresenceMutation = useMutation({
    mutationFn: () => publicApi.confirmPresence(publicToken),
    onSuccess: async (result) => {
      setPresenceError('')
      setPresenceStamped(result.presence.confirmed_at)
      await queryClient.invalidateQueries({ queryKey: ['public-invitation', publicToken] })
    },
    onError: (error: unknown) => {
      setPresenceError(
        error instanceof ApiError
          ? error.message
          : 'Votre présence n’a pas pu être confirmée.',
      )
    },
  })

  useEffect(() => {
    if (!publicToken) return
    let cancelled = false

    QRCode.toDataURL(invitationUrl(publicToken), {
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

  const templateKey = data.event.template.key
  const templateDef = getTemplate(templateKey)
  const TemplateComponent = templateDef?.Component
  const skin = panelSkinFor(templateKey)
  const onDarkPaper = DARK_PANEL_KEYS.has(templateKey)
  const stage = stageFor(skin, onDarkPaper)
  const stageInk = onDarkPaper ? 'rgba(255,248,236,0.62)' : 'rgba(43,38,32,0.55)'

  // Content-gated sections: an unfilled section is hidden, never rendered empty.
  const allOutfits = data.dress_code?.images ?? []
  // The Mood Board lays the outfits out on the sheet itself (that is the
  // board); every other template shows them in the companion card.
  const outfitsOnSheet = templateKey === 'mood-board'
  const dressCode = outfitsOnSheet ? [] : allOutfits
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
    note: data.event.note ?? '',
    cover_url: data.event.cover_url,
    coverTitle: data.event.cover_title,
    board: data.event.display_config.board,
    emphasis: data.event.display_config.emphasis ?? data.event.template.config.emphasis_fields,
    guestName: data.invitation.display_name,
    // Dress code, programme and table are presented in their own companion
    // card, so the sheet stays focused on the invitation message (empty
    // hides them) — except the Mood Board, whose sheet is the outfit board.
    dressCode: outfitsOnSheet ? allOutfits.map((image) => ({ url: image.url, caption: image.caption })) : [],
    program: [],
    tableNumber: '',
    tableText: '',
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

  const confirmedAt = presenceStamped ?? data.presence?.confirmed_at ?? null
  const accentButton: CSSProperties = {
    backgroundColor: skin.accent,
    borderColor: skin.accent,
    color: skin.onAccent,
  }
  const quietLink = `inline-flex items-center gap-1.5 rounded-sm text-[0.8rem] font-medium underline decoration-1 underline-offset-[5px] transition-opacity hover:opacity-75 focus-visible:outline-none focus-visible:ring-2`

  return (
    <div
      className="min-h-screen px-3 pb-14 pt-6 sm:px-6 sm:pt-9"
      style={{ backgroundColor: stage.color, backgroundImage: stage.texture, color: skin.ink }}
    >
      <EnvelopeReveal
        token={publicToken}
        templateKey={templateKey}
        skin={skin}
        dark={onDarkPaper}
        title={data.event.title}
        guestName={data.invitation.display_name}
        stage={stage.color}
        onOpened={onOpened}
      />

      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex items-center justify-between gap-4 px-1 sm:mb-8">
          <p
            className="flex items-center gap-2.5 text-[0.68rem] font-medium uppercase tracking-[0.35em]"
            style={{ color: stageInk }}
          >
            <LogoMark className="h-6 w-6 rounded-md" />
            MalaikaEvents
          </p>
        </header>
        <h1 className="sr-only">Invitation — {data.event.title}</h1>

        <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,0.78fr)] lg:gap-10">
          <div
            className={`min-w-0 overflow-hidden rounded-[3px] [overflow-wrap:anywhere] ${rise(revealed, 0).className}`}
            style={{ boxShadow: SHEET_SHADOW, ...rise(revealed, 0).style }}
          >
            <div style={fontScaleStyle(data.event.font_size)}>
              {TemplateComponent ? (
                <TemplateComponent draft={draft} />
              ) : (
                <div className="flex min-h-[28rem] items-center justify-center bg-white p-8 text-center text-ink-soft">
                  Modèle de mise en page indisponible.
                </div>
              )}
            </div>
          </div>

          <aside className="min-w-0 space-y-6 [overflow-wrap:anywhere] lg:sticky lg:top-6">
            {/* Reply card — the guest's one task, first in the suite. */}
            <SuiteCard
              skin={skin}
              templateKey={templateKey}
              title="Répondez s’il vous plaît"
              {...rise(revealed, 1)}
            >
              <div className="mt-5 flex flex-col items-center gap-3 text-center">
                {confirmedAt ? (
                  <>
                    <Button
                      variant="primary"
                      size="md"
                      disabled
                      style={{ ...accentButton, opacity: 1 }}
                    >
                      <span className="inline-flex items-center gap-2">
                        <IconCheck className="h-5 w-5" />
                        Présence confirmée
                      </span>
                    </Button>
                    <p role="status" className="text-xs" style={{ color: skin.inkSoft }}>
                      {'Confirmée le '}
                      {new Date(confirmedAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="max-w-[18rem] text-sm leading-relaxed" style={{ color: skin.inkSoft }}>
                      Prévenez l’organisateur que vous serez présent(e).
                    </p>
                    <Button
                      variant="primary"
                      size="md"
                      loading={confirmPresenceMutation.isPending}
                      disabled={confirmPresenceMutation.isPending}
                      onClick={() => confirmPresenceMutation.mutate()}
                      style={accentButton}
                    >
                      Confirmer la présence
                    </Button>
                    {presenceError ? (
                      <p
                        role="alert"
                        className="text-sm font-medium text-danger"
                        style={onDarkPaper ? { color: '#FFB4A8' } : undefined}
                      >
                        {presenceError}
                      </p>
                    ) : null}
                  </>
                )}
              </div>

              {data.preferences.enabled ? (
                <form
                  className="mt-6 space-y-4 border-t pt-6"
                  style={{ borderColor: skin.line }}
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
                  <SectionLabel skin={skin}>Préférences</SectionLabel>
                  {data.preferences.questions.map((question) => {
                    const currentSelection = selectedOptions[question.id] ?? []
                    const isSingle = question.input_type === 'single'

                    return (
                      <fieldset key={question.id} className="rounded-[3px] border px-3.5 pb-3 pt-2.5" style={{ borderColor: skin.line, backgroundColor: skin.softBg }}>
                        <legend className="px-1 text-sm font-medium" style={{ color: skin.ink }}>{question.label}</legend>
                        {question.help_text ? (
                          <p className="mt-0.5 text-[0.72rem]" style={{ color: skin.inkSoft }}>{question.help_text}</p>
                        ) : null}

                        <div className="mt-2.5 space-y-1">
                          {question.options.map((option) => {
                            const checked = currentSelection.includes(option.id)
                            const optionId = `${question.id}-${option.id}`

                            return (
                              <label
                                key={option.id}
                                htmlFor={optionId}
                                className={`flex min-h-10 cursor-pointer items-center gap-2.5 rounded-[3px] px-2 py-1.5 text-sm transition-colors ${onDarkPaper ? 'hover:bg-white/10' : 'hover:bg-white/60'}`}
                                style={{ color: skin.ink }}
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
                      className="text-center text-sm font-medium text-success"
                      style={onDarkPaper ? { color: '#9EE6BC' } : undefined}
                    >
                      {submitMessage}
                    </p>
                  ) : null}
                  {submitError ? (
                    <p
                      role="alert"
                      className="text-center text-sm font-medium text-danger"
                      style={onDarkPaper ? { color: '#FFB4A8' } : undefined}
                    >
                      {submitError}
                    </p>
                  ) : null}

                  <div className="flex justify-center">
                    <Button
                      variant="secondary"
                      size="md"
                      type="submit"
                      loading={submitMutation.isPending}
                      disabled={submitMutation.isPending}
                      style={{ backgroundColor: 'transparent', borderColor: skin.accent, color: skin.ink }}
                    >
                      Envoyer ma réponse
                    </Button>
                  </div>
                </form>
              ) : null}
            </SuiteCard>

            {/* Practical details — with the two things a guest actually does
                with them: find the place, save the date. */}
            <SuiteCard skin={skin} templateKey={templateKey} title="L’essentiel" {...rise(revealed, 2)}>
              <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-sm">
                <dt className="text-[0.7rem] font-medium uppercase tracking-[0.2em]" style={{ color: skin.accent }}>Pour</dt>
                <dd style={{ color: skin.ink }}>{data.invitation.display_name}</dd>
                <dt className="text-[0.7rem] font-medium uppercase tracking-[0.2em]" style={{ color: skin.accent }}>Quand</dt>
                <dd style={{ color: skin.ink }}>
                  <span className="first-letter:uppercase">{formatEventDate(data.event.event_date)}</span>
                  {data.event.event_time ? ` · ${formatEventTime(data.event.event_time)}` : ''}
                </dd>
                {data.event.venue_name || data.event.venue_address ? (
                  <>
                    <dt className="text-[0.7rem] font-medium uppercase tracking-[0.2em]" style={{ color: skin.accent }}>Où</dt>
                    <dd style={{ color: skin.ink }}>
                      {data.event.venue_name}
                      {data.event.venue_address ? (
                        <span className="block text-[0.8rem]" style={{ color: skin.inkSoft }}>
                          {data.event.venue_address}
                        </span>
                      ) : null}
                    </dd>
                  </>
                ) : null}
              </dl>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2" style={{ color: skin.ink }}>
                <button
                  type="button"
                  className={quietLink}
                  style={{ textDecorationColor: skin.accent }}
                  onClick={() =>
                    downloadIcs({
                      title: data.event.title,
                      date: data.event.event_date,
                      time: data.event.event_time,
                      timezone: data.event.timezone,
                      location: [data.event.venue_name, data.event.venue_address].filter(Boolean).join(', '),
                      description: data.event.message,
                      url: invitationUrl(publicToken),
                    })
                  }
                >
                  <IconCalendar className="h-4 w-4" />
                  Ajouter au calendrier
                </button>
              </div>
            </SuiteCard>

            {dressCode.length > 0 || program.length > 0 || data.table?.enabled ? (
              <SuiteCard skin={skin} templateKey={templateKey} {...rise(revealed, 3)}>
                {dressCode.length > 0 ? (
                  <div>
                    <SectionLabel skin={skin}>Dress code</SectionLabel>
                    <TemplateOrnament templateKey={templateKey} color={skin.accent} className="mx-auto mt-2.5 block h-auto w-28" />
                    {groupDressCode(dressCode).map((group, groupIndex) => (
                      <figure key={groupIndex} className={groupIndex === 0 ? 'mt-4' : group.first ? 'mt-5' : 'mt-2'}>
                        <div className="flex items-start justify-center gap-2">
                          {group.images.map((image, index) => (
                            <img
                              key={`${image.url}-${index}`}
                              src={image.url}
                              alt={group.caption || 'Tenue proposée'}
                              loading="lazy"
                              className="aspect-[3/4] min-w-0 max-w-[6.5rem] flex-1 rounded-[2px] object-cover"
                              style={{ border: `1px solid ${skin.line}`, backgroundColor: skin.softBg }}
                            />
                          ))}
                        </div>
                        {group.caption && group.last ? (
                          <figcaption className="mt-1.5 text-center text-xs" style={{ color: skin.inkSoft }}>
                            {group.caption}
                          </figcaption>
                        ) : null}
                      </figure>
                    ))}
                  </div>
                ) : null}

                {program.length > 0 ? (
                  <div className={dressCode.length > 0 ? 'mt-7' : undefined}>
                    <SectionLabel skin={skin}>Programme</SectionLabel>
                    <TemplateOrnament templateKey={templateKey} color={skin.accent} className="mx-auto mt-2.5 block h-auto w-28" />
                    <ol className="mt-4 space-y-3 text-sm">
                      {program.map((item, index) => (
                        <li key={index} className="grid grid-cols-[5.6rem_1fr] items-baseline gap-x-3">
                          <span
                            className="whitespace-nowrap text-right text-[0.78rem] font-semibold uppercase tabular-nums"
                            style={{ color: skin.accent, letterSpacing: '0.1em' }}
                          >
                            {formatProgramRange(item.start_time, item.end_time)}
                          </span>
                          <span className="border-l pl-3 leading-snug" style={{ color: skin.ink, borderColor: skin.line }}>
                            {item.description}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : null}

                {data.table?.enabled ? (
                  <div className={dressCode.length > 0 || program.length > 0 ? 'mt-7' : undefined}>
                    <SectionLabel skin={skin}>Votre table</SectionLabel>
                    <TemplateOrnament templateKey={templateKey} color={skin.accent} className="mx-auto mt-2.5 block h-auto w-28" />
                    <div className="mt-3 flex flex-col items-center">
                      <LuxuryTable number={data.table.number} accent={skin.accent} ink={skin.ink} className="w-40 sm:w-44" />
                      {data.table.text ? (
                        <p className="mt-3 text-center text-sm italic" style={{ color: skin.inkSoft }}>
                          {data.table.text}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </SuiteCard>
            ) : null}

            {/* Access card: the QR the door team scans. */}
            <SuiteCard
              skin={skin}
              templateKey={templateKey}
              title="Carte d’accès"
              ornament={false}
              {...rise(revealed, 4)}
              action={
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold"
                  style={{ backgroundColor: skin.chipBg, borderColor: skin.line, color: skin.ink }}
                >
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: verification.result === 'valid' ? '#2F8F5B' : '#B54708' }} />
                  {STATUS_LABEL[statusKey] ?? 'Valide'}
                </span>
              }
            >
              <div className="mt-4 flex flex-col items-center text-center">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR code de vérification"
                    className="h-40 w-40 rounded-[3px] bg-white p-2"
                    style={{ border: `1px solid ${skin.line}` }}
                  />
                ) : (
                  <div className="flex h-40 w-40 items-center justify-center rounded-[3px] bg-white text-xs text-ink-faint">
                    QR
                  </div>
                )}
                <p className="mt-4 max-w-[17rem] text-sm leading-relaxed" style={{ color: skin.ink }}>
                  {verification.result === 'valid'
                    ? 'Cette invitation est actuellement valide.'
                    : verification.result === 'expired'
                      ? 'Cette invitation a expiré.'
                      : verification.result === 'revoked'
                        ? 'Cette invitation a été révoquée.'
                        : 'Ce lien est invalide.'}
                </p>
                {verification.result === 'valid' ? (
                  <p className="mt-1 max-w-[17rem] text-[0.8rem] leading-relaxed" style={{ color: skin.inkSoft }}>
                    Présentez ce code à l’entrée.
                  </p>
                ) : null}
              </div>
            </SuiteCard>
          </aside>
        </div>
      </div>

    </div>
  )
}
