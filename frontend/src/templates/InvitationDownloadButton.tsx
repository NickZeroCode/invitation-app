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
import { ExportImagesError, exportInvitationPdf } from '../lib/exportInvitationPdf.ts'
import type { RefreshedImageUrls } from '../lib/pdfImages.ts'
import { fr } from '../locales/fr.ts'
import type { DressCodeEntry, ProgramEntry, TableEntry } from './types.ts'

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
  /** Table assignment rendered on the PDF's details page. */
  table?: TableEntry
  /** Verification URL encoded on the PDF's final QR page. */
  qrText?: string
  /** Re-reads the event so expired storage URLs can be replaced (used once). */
  refresh?: () => Promise<RefreshedImageUrls | null>
  /** Same-origin URL of the saved cover — tried before the storage URL. */
  coverFileUrl?: string
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
  table,
  qrText,
  refresh,
  coverFileUrl,
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
        table,
        title,
        guestName,
        qrText,
        refresh,
        coverFileUrl,
      })
    } catch (error) {
      console.error('[exportInvitationPdf] failed', error)
      setExportError(
        error instanceof ExportImagesError
          ? fr.common.exportImagesFailed
          : 'L’export du PDF a échoué. Veuillez réessayer.',
      )
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
