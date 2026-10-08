/**
 * Single download action for a rendered invitation card (PDF).
 *
 * Shared by the guest-facing public invitation page and the organizer's
 * template preview so both export the identical artwork. The PDF is composed
 * of the cover photo, the full-bleed card, the dress-code / programme page
 * and the centered verification QR code.
 */
import { useState, type CSSProperties, type RefObject } from 'react'

import { Button } from '../design-system/Button.tsx'
import { exportInvitationPdf } from '../lib/exportInvitationPdf.ts'
import type { DressCodeEntry, ProgramEntry } from './types.ts'

interface InvitationDownloadButtonProps {
  /** Wrapper around the rendered template (the exact card to capture). */
  targetRef: RefObject<HTMLElement | null>
  title: string
  guestName?: string
  /** Template key — gives the dress-code / programme page its tone. */
  templateKey: string
  /** Dress-code gallery rendered on the PDF's details page. */
  dressCode?: DressCodeEntry[]
  /** Programme steps rendered on the PDF's details page. */
  program?: ProgramEntry[]
  /** Verification URL encoded on the PDF's final QR page. */
  qrText?: string
  /** Optional button tint (e.g. the template's accent on the public page). */
  style?: CSSProperties
}

export function InvitationDownloadButton({
  targetRef,
  title,
  guestName,
  templateKey,
  dressCode = [],
  program = [],
  qrText,
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
      await exportInvitationPdf({
        cardNode: node,
        templateKey,
        dressCode,
        program,
        title,
        guestName,
        qrText,
      })
    } catch (error) {
      console.error('[exportInvitationPdf] failed', error)
      setExportError('L’export du PDF a échoué. Veuillez réessayer.')
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
