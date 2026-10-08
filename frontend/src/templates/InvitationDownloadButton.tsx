/**
 * Single download action for a rendered invitation card (JPG).
 *
 * Shared by the guest-facing public invitation page and the organizer's
 * template preview so both export the identical artwork. The guest view
 * passes its verification QR code, which is composited onto the downloaded
 * picture.
 */
import { useState, type CSSProperties, type RefObject } from 'react'

import { Button } from '../design-system/Button.tsx'
import { exportInvitationImage, invitationExportFileName } from '../lib/exportInvitation.ts'

interface InvitationDownloadButtonProps {
  /** Wrapper around the rendered template (the exact card to capture). */
  targetRef: RefObject<HTMLElement | null>
  title: string
  guestName?: string
  /** Verification QR code (data URL) rendered onto the exported picture. */
  qrDataUrl?: string
  /** Optional button tint (e.g. the template's accent on the public page). */
  style?: CSSProperties
}

export function InvitationDownloadButton({
  targetRef,
  title,
  guestName,
  qrDataUrl,
  style,
}: InvitationDownloadButtonProps) {
  const [busy, setBusy] = useState(false)
  const [exportError, setExportError] = useState('')

  async function handleDownload() {
    const node = targetRef.current
    if (!node || busy) return

    setBusy(true)
    setExportError('')
    try {
      await exportInvitationImage(node, invitationExportFileName(title, guestName), { qrDataUrl })
    } catch {
      setExportError('L’export de l’image a échoué. Veuillez réessayer.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        variant="primary"
        size="md"
        onClick={() => void handleDownload()}
        loading={busy}
        disabled={busy}
        style={style}
      >
        Télécharger l’invitation
      </Button>
      {exportError ? (
        <p role="alert" className="text-sm text-red-600">
          {exportError}
        </p>
      ) : null}
    </div>
  )
}
