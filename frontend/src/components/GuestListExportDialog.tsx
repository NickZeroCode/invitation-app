/**
 * « Exporter la liste des invités » — the guest list as an Excel workbook,
 * downloaded or e-mailed (to the organizer, a caterer, the venue…).
 *
 * The workbook is built by the server, so both routes deliver the same file.
 * As with invitation e-mails, success is shown only once the provider
 * accepted the message; without a configured provider the dialog says so.
 */
import { useEffect, useId, useState } from 'react'
import { useMutation } from '@tanstack/react-query'

import { useAuth } from '../auth/AuthContext.tsx'
import { Alert } from '../design-system/Alert.tsx'
import { Button } from '../design-system/Button.tsx'
import { Field } from '../design-system/Field.tsx'
import { IconCheck, IconDownload, IconMail } from '../design-system/icons.tsx'
import { Input, Textarea } from '../design-system/Input.tsx'
import { Modal } from '../design-system/Modal.tsx'
import { ApiError, eventsApi } from '../lib/api.ts'
import { looksLikeEmail } from '../lib/share.ts'
import { fr } from '../locales/fr.ts'

const COPY = fr.guests.exportList

function saveFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.fields.recipient?.[0] ?? error.message
  return fallback
}

export function GuestListExportDialog({
  eventId,
  open,
  onClose,
}: {
  eventId: number
  open: boolean
  onClose: () => void
}) {
  return (
    <Modal open={open} onClose={onClose} ariaLabel={COPY.title} title={COPY.title} description={COPY.description}>
      <div className="overflow-y-auto px-5 py-5">
        {/* Remounted on each opening: a fresh form every time. */}
        {open ? <ExportForm eventId={eventId} /> : null}
      </div>
    </Modal>
  )
}

function ExportForm({ eventId }: { eventId: number }) {
  const ids = useId()
  const { user } = useAuth()
  const [recipient, setRecipient] = useState(user?.email ?? '')
  const [recipientEdited, setRecipientEdited] = useState(false)
  const [recipientTouched, setRecipientTouched] = useState(false)
  // Prefill with the organizer's own address once the session is known,
  // never over an address they have started typing.
  useEffect(() => {
    if (!recipientEdited && user?.email) setRecipient(user.email)
  }, [recipientEdited, user?.email])
  const [message, setMessage] = useState('')
  const [downloadedAs, setDownloadedAs] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const emailValid = looksLikeEmail(recipient.trim())

  const downloadMutation = useMutation({
    mutationFn: () => eventsApi.exportGuests(eventId),
    onSuccess: ({ blob, filename }) => {
      saveFile(blob, filename)
      setDownloadedAs(filename)
    },
  })

  const emailMutation = useMutation({
    mutationFn: () => eventsApi.emailGuests(eventId, { recipient: recipient.trim(), message: message.trim() }),
    onSuccess: () => setSentTo(recipient.trim()),
  })

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-line bg-surface-muted/60 px-4 py-3 text-sm leading-relaxed text-ink-soft">
        <p className="font-medium text-ink">{COPY.contentsTitle}</p>
        <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
          {COPY.contents.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <section aria-labelledby={`${ids}-download`} className="space-y-3">
        <h3 id={`${ids}-download`} className="text-sm font-semibold text-ink">
          {COPY.downloadTitle}
        </h3>
        {downloadMutation.isError ? (
          <Alert tone="danger">{errorMessage(downloadMutation.error, COPY.downloadError)}</Alert>
        ) : null}
        {downloadedAs ? <Alert tone="success">{COPY.downloaded.replace('{file}', downloadedAs)}</Alert> : null}
        <Button
          variant="primary"
          size="md"
          loading={downloadMutation.isPending}
          disabled={downloadMutation.isPending}
          onClick={() => {
            setDownloadedAs(null)
            downloadMutation.mutate()
          }}
        >
          <span className="inline-flex items-center gap-2">
            <IconDownload className="h-4 w-4" />
            {downloadMutation.isPending ? COPY.preparing : COPY.downloadButton}
          </span>
        </Button>
      </section>

      <section aria-labelledby={`${ids}-email`} className="space-y-3 border-t border-line pt-5">
        <h3 id={`${ids}-email`} className="text-sm font-semibold text-ink">
          {COPY.emailTitle}
        </h3>
        <Field
          id={`${ids}-recipient`}
          label={COPY.recipientLabel}
          hint={COPY.recipientHint}
          error={recipientTouched && recipient.trim() && !emailValid ? COPY.recipientInvalid : undefined}
        >
          <Input
            id={`${ids}-recipient`}
            type="email"
            inputMode="email"
            autoComplete="email"
            value={recipient}
            invalid={recipientTouched && Boolean(recipient.trim()) && !emailValid}
            onChange={(event) => {
              setRecipient(event.target.value)
              setRecipientEdited(true)
              setSentTo(null)
            }}
            onBlur={() => setRecipientTouched(true)}
          />
        </Field>
        <Field id={`${ids}-message`} label={COPY.messageLabel} hint={COPY.messageHint}>
          <Textarea
            id={`${ids}-message`}
            rows={3}
            maxLength={1500}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        </Field>
        {emailMutation.isError ? (
          <Alert tone="danger">{errorMessage(emailMutation.error, COPY.emailError)}</Alert>
        ) : null}
        {sentTo ? <Alert tone="success">{COPY.sent.replace('{recipient}', sentTo)}</Alert> : null}
        <Button
          variant="secondary"
          size="md"
          loading={emailMutation.isPending}
          disabled={!emailValid || emailMutation.isPending || sentTo === recipient.trim()}
          onClick={() => {
            setRecipientTouched(true)
            if (emailValid) emailMutation.mutate()
          }}
        >
          <span className="inline-flex items-center gap-2">
            {sentTo === recipient.trim() ? <IconCheck className="h-4 w-4" /> : <IconMail className="h-4 w-4" />}
            {emailMutation.isPending ? COPY.sending : sentTo === recipient.trim() ? COPY.sentButton : COPY.emailButton}
          </span>
        </Button>
      </section>
    </div>
  )
}
