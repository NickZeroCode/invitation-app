/**
 * Download actions for a rendered invitation card (PNG / JPG).
 *
 * Shared by the guest-facing public invitation page and the organizer's
 * template preview so both export the identical artwork.
 */
import { useState, type RefObject } from 'react'

import { Button } from '../design-system/Button.tsx'
import {
  exportInvitationImage,
  invitationExportFileName,
  type InvitationExportFormat,
} from '../lib/exportInvitation.ts'

interface InvitationExportButtonsProps {
  /** Wrapper around the rendered template (the exact card to capture). */
  targetRef: RefObject<HTMLElement | null>
  title: string
  guestName?: string
}

export function InvitationExportButtons({ targetRef, title, guestName }: InvitationExportButtonsProps) {
  const [busyFormat, setBusyFormat] = useState<InvitationExportFormat | null>(null)
  const [exportError, setExportError] = useState('')

  async function handleExport(format: InvitationExportFormat) {
    const node = targetRef.current
    if (!node || busyFormat) return

    setBusyFormat(format)
    setExportError('')
    try {
      await exportInvitationImage(node, format, invitationExportFileName(title, guestName, format))
    } catch {
      setExportError('L’export de l’image a échoué. Veuillez réessayer.')
    } finally {
      setBusyFormat(null)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-3">
        <Button
          variant="primary"
          size="md"
          onClick={() => void handleExport('png')}
          loading={busyFormat === 'png'}
          disabled={busyFormat !== null}
        >
          Télécharger PNG
        </Button>
        <Button
          variant="secondary"
          size="md"
          onClick={() => void handleExport('jpg')}
          loading={busyFormat === 'jpg'}
          disabled={busyFormat !== null}
        >
          Télécharger JPG
        </Button>
      </div>
      {exportError ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {exportError}
        </p>
      ) : null}
    </div>
  )
}
