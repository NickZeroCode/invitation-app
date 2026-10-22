/**
 * « Envoyer l'invitation » — the organizer sends ONE guest's invitation by
 * WhatsApp, e-mail or link, from the guest list or from the invitation page.
 *
 * Honesty rules baked into the copy and states:
 * - WhatsApp opens with the message prefilled; the organizer presses
 *   « Envoyer » in WhatsApp. We never claim it was sent.
 * - E-mail success is shown only after the server confirms the provider
 *   accepted the message — "remis au service d'envoi", not "reçu".
 * - Without a configured provider the dialog says so and offers the
 *   organizer's own mail app instead of a fake send button.
 */
import { useId, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'

import { Alert } from '../design-system/Alert.tsx'
import { Button, buttonClasses } from '../design-system/Button.tsx'
import { Field } from '../design-system/Field.tsx'
import { IconChat, IconCheck, IconExternal, IconLink, IconMail } from '../design-system/icons.tsx'
import { Input, Select, Textarea } from '../design-system/Input.tsx'
import { Modal } from '../design-system/Modal.tsx'
import { Spinner } from '../design-system/Spinner.tsx'
import { ApiError, shareApi } from '../lib/api.ts'
import type { ShareContext } from '../lib/types.ts'
import {
  COUNTRY_DIAL_CODES,
  DEFAULT_COUNTRY,
  looksLikeEmail,
  mailtoLink,
  normalizePhone,
  whatsappLink,
} from '../lib/share.ts'

type Channel = 'whatsapp' | 'email' | 'link'

const PHONE_ERRORS: Record<string, string> = {
  invalid_chars: 'Utilisez uniquement des chiffres, espaces et le signe +.',
  too_short: 'Ce numéro est trop court.',
  too_long: 'Ce numéro est trop long.',
}

const CHANNELS: { key: Channel; label: string; Icon: typeof IconMail }[] = [
  { key: 'whatsapp', label: 'WhatsApp', Icon: IconChat },
  { key: 'email', label: 'E-mail', Icon: IconMail },
  { key: 'link', label: 'Lien', Icon: IconLink },
]

export function ShareInvitationDialog({
  token,
  open,
  onClose,
}: {
  token: string
  open: boolean
  onClose: () => void
}) {
  const contextQuery = useQuery({
    queryKey: ['share-context', token],
    queryFn: () => shareApi.context(token),
    enabled: open,
    staleTime: 60_000,
  })
  const context = contextQuery.data

  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel="Envoyer l’invitation"
      title="Envoyer l’invitation"
      description={context?.can_share ? `Pour ${context.display_name}` : undefined}
    >
      <div className="overflow-y-auto px-5 py-5">
        {contextQuery.isPending ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-ink-soft">
            <Spinner className="h-4 w-4" />
            Préparation du message…
          </div>
        ) : contextQuery.isError ? (
          <Alert tone="danger">
            {contextQuery.error instanceof ApiError
              ? contextQuery.error.message
              : 'Impossible de préparer l’envoi pour le moment.'}
          </Alert>
        ) : !context?.can_share ? (
          <Alert tone="danger">Seul l’organisateur de cet événement peut envoyer cette invitation.</Alert>
        ) : (
          // Keyed by token: reopening for another guest starts from that
          // guest's own prefilled message.
          <ShareForm key={token} token={token} context={context} />
        )}
      </div>
    </Modal>
  )
}

function ShareForm({
  token,
  context,
}: {
  token: string
  context: Extract<ShareContext, { can_share: true }>
}) {
  const ids = useId()
  const [channel, setChannel] = useState<Channel>('whatsapp')
  const [message, setMessage] = useState(context.default_message)
  const [country, setCountry] = useState(DEFAULT_COUNTRY)
  const [phone, setPhone] = useState('')
  const [phoneTouched, setPhoneTouched] = useState(false)
  const [handedOff, setHandedOff] = useState(false)
  const [recipient, setRecipient] = useState('')
  const [recipientTouched, setRecipientTouched] = useState(false)
  const [subject, setSubject] = useState(context.default_subject)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const phoneResult = normalizePhone(phone, country)
  const phoneError =
    phoneTouched && !phoneResult.ok && phoneResult.reason !== 'empty'
      ? PHONE_ERRORS[phoneResult.reason]
      : undefined
  const emailValid = looksLikeEmail(recipient)
  const linkMissing = !message.includes(context.public_url)

  const emailMutation = useMutation({
    mutationFn: () =>
      shareApi.email(token, { recipient: recipient.trim(), subject: subject.trim(), message: message.trim() }),
    onSuccess: () => setSentTo(recipient.trim()),
  })
  const emailError =
    emailMutation.error instanceof ApiError
      ? (emailMutation.error.fields.recipient?.[0] ?? emailMutation.error.message)
      : emailMutation.error
        ? 'L’e-mail n’a pas pu être envoyé. Vérifiez votre connexion et réessayez.'
        : null

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(context.public_url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2400)
    } catch {
      setCopied(false)
    }
  }

  if (!context.shareable) {
    return (
      <Alert tone="warning">
        Cette invitation n’est plus active ({context.status === 'revoked' ? 'révoquée' : 'expirée'}). Votre
        invité verrait seulement un lien inactif : créez ou réactivez une invitation avant de l’envoyer.
      </Alert>
    )
  }

  return (
    <div className="space-y-5">
      <div role="tablist" aria-label="Canal d’envoi" className="grid grid-cols-3 gap-1 rounded-lg bg-surface-muted p-1">
        {CHANNELS.map(({ key, label, Icon }) => {
          const selected = channel === key
          return (
            <button
              key={key}
              type="button"
              role="tab"
              id={`${ids}-tab-${key}`}
              aria-selected={selected}
              aria-controls={`${ids}-panel`}
              onClick={() => setChannel(key)}
              className={`flex h-9 items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/35 ${
                selected ? 'bg-surface text-ink shadow-xs' : 'text-ink-soft hover:text-ink'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          )
        })}
      </div>

      <div id={`${ids}-panel`} role="tabpanel" aria-labelledby={`${ids}-tab-${channel}`} className="space-y-4">
        {channel === 'whatsapp' ? (
          <>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
              <Field id={`${ids}-country`} label="Pays">
                <Select id={`${ids}-country`} value={country} onChange={(event) => setCountry(event.target.value)}>
                  {COUNTRY_DIAL_CODES.map((entry) => (
                    <option key={entry.iso} value={entry.iso}>
                      {entry.label} (+{entry.dial})
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                id={`${ids}-phone`}
                label="Numéro WhatsApp"
                error={phoneError}
                hint={
                  phoneResult.ok
                    ? `Sera ouvert pour ${phoneResult.display}`
                    : 'Numéro local ou international (+…).'
                }
              >
                <Input
                  id={`${ids}-phone`}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="081 234 5678"
                  value={phone}
                  invalid={Boolean(phoneError)}
                  onChange={(event) => {
                    setPhone(event.target.value)
                    setHandedOff(false)
                  }}
                  onBlur={() => setPhoneTouched(true)}
                />
              </Field>
            </div>
            <MessageField id={`${ids}-message`} value={message} onChange={setMessage} linkMissing={linkMissing} url={context.public_url} />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {phoneResult.ok ? (
                <a
                  href={whatsappLink(message, phoneResult.digits)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setHandedOff(true)}
                  className={buttonClasses('primary', 'md', 'gap-2')}
                >
                  <IconChat className="h-4 w-4" />
                  Ouvrir dans WhatsApp
                </a>
              ) : (
                <Button variant="primary" size="md" disabled onClick={() => setPhoneTouched(true)}>
                  <IconChat className="h-4 w-4" />
                  Ouvrir dans WhatsApp
                </Button>
              )}
              <a
                href={whatsappLink(message)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setHandedOff(true)}
                className={buttonClasses('ghost', 'md')}
              >
                Choisir le contact dans WhatsApp
              </a>
            </div>
            {handedOff ? (
              <Alert tone="info">
                WhatsApp s’ouvre avec votre message. Appuyez sur « Envoyer » dans WhatsApp pour le
                transmettre — NickEvents ne peut pas confirmer sa réception. Rien ne s’ouvre ? Vérifiez
                que WhatsApp est installé ou utilisez l’onglet Lien.
              </Alert>
            ) : null}
          </>
        ) : null}

        {channel === 'email' ? (
          <>
            <Field
              id={`${ids}-recipient`}
              label="Adresse e-mail de l’invité"
              error={recipientTouched && recipient && !emailValid ? 'Adresse e-mail invalide.' : undefined}
            >
              <Input
                id={`${ids}-recipient`}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="invite@exemple.com"
                value={recipient}
                invalid={recipientTouched && Boolean(recipient) && !emailValid}
                onChange={(event) => {
                  setRecipient(event.target.value)
                  setSentTo(null)
                  emailMutation.reset()
                }}
                onBlur={() => setRecipientTouched(true)}
              />
            </Field>
            <Field id={`${ids}-subject`} label="Objet">
              <Input
                id={`${ids}-subject`}
                value={subject}
                maxLength={150}
                onChange={(event) => setSubject(event.target.value)}
              />
            </Field>
            <MessageField id={`${ids}-email-message`} value={message} onChange={setMessage} linkMissing={false} url={context.public_url} emailNote />
            {context.email_enabled ? (
              <>
                {sentTo ? (
                  <Alert tone="success">
                    E-mail remis au service d’envoi pour {sentTo}. La réception et l’ouverture ne sont pas
                    suivies.
                  </Alert>
                ) : null}
                {emailError ? <Alert tone="danger">{emailError}</Alert> : null}
                <Button
                  variant="primary"
                  size="md"
                  loading={emailMutation.isPending}
                  disabled={!emailValid || emailMutation.isPending || sentTo === recipient.trim()}
                  onClick={() => {
                    setRecipientTouched(true)
                    if (emailValid) emailMutation.mutate()
                  }}
                >
                  {sentTo === recipient.trim() ? (
                    <span className="inline-flex items-center gap-2">
                      <IconCheck className="h-4 w-4" />
                      Envoyé
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <IconMail className="h-4 w-4" />
                      Envoyer l’e-mail
                    </span>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Alert tone="info">
                  L’envoi direct d’e-mails n’est pas encore activé sur NickEvents. Ouvrez votre messagerie
                  avec le message prêt : vous l’enverrez vous-même.
                </Alert>
                <a
                  href={mailtoLink(recipient.trim(), subject, message)}
                  className={buttonClasses('primary', 'md', 'gap-2')}
                >
                  <IconExternal className="h-4 w-4" />
                  Ouvrir ma messagerie
                </a>
              </>
            )}
          </>
        ) : null}

        {channel === 'link' ? (
          <>
            <Field id={`${ids}-url`} label="Lien personnel de l’invité" hint="Ce lien ouvre uniquement l’invitation de cet invité.">
              <Input id={`${ids}-url`} readOnly value={context.public_url} onFocus={(event) => event.target.select()} />
            </Field>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="primary" size="md" onClick={() => void copyLink()}>
                <span className="inline-flex items-center gap-2">
                  {copied ? <IconCheck className="h-4 w-4" /> : <IconLink className="h-4 w-4" />}
                  {copied ? 'Lien copié' : 'Copier le lien'}
                </span>
              </Button>
              <a
                href={context.public_url}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses('secondary', 'md', 'gap-2')}
              >
                <IconExternal className="h-4 w-4" />
                Voir l’invitation
              </a>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

function MessageField({
  id,
  value,
  onChange,
  linkMissing,
  url,
  emailNote = false,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  linkMissing: boolean
  url: string
  emailNote?: boolean
}) {
  return (
    <Field
      id={id}
      label="Message"
      hint={
        emailNote
          ? 'Un bouton « Ouvrir mon invitation » est ajouté sous votre message.'
          : 'Vous pourrez encore le relire avant l’envoi.'
      }
      error={linkMissing ? `Le lien de l’invitation a été retiré du message. Ajoutez-le : ${url}` : undefined}
    >
      <Textarea id={id} rows={7} maxLength={1500} value={value} onChange={(event) => onChange(event.target.value)} />
    </Field>
  )
}

