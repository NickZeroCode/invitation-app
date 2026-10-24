import { cleanup, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TEMPLATES, emptyDraft } from './registry.tsx'

const GUEST = 'M. Jean Kabila Test'
const MESSAGE = 'Un message unique pour vérifier l’ordre.'
const NOTE = 'Une note pratique placée en bas.'
const VENUE = 'Salle Unique du Test'

const before = (a: Element, b: Element) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)

describe('reading order in every template', () => {
  it.each(TEMPLATES.map((template) => [template.key, template] as const))(
    '%s addresses the guest above the message and keeps the note at the bottom',
    (_key, template) => {
      render(
        <template.Component
          draft={emptyDraft({
            title: 'Titre',
            event_date: '2026-12-12',
            guestName: GUEST,
            message: MESSAGE,
            note: NOTE,
            venue_name: VENUE,
          })}
        />,
      )
      // Some templates set names or venues in capitals, or inside a longer line.
      const find = (text: string) => screen.getByText(new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'))
      const guest = find(GUEST)
      const message = find(MESSAGE)
      const note = find(NOTE)
      const venue = find(VENUE)
      expect(before(guest, message)).toBe(true)
      expect(before(message, note)).toBe(true)
      expect(before(venue, note)).toBe(true)
      cleanup()
    },
  )
})
