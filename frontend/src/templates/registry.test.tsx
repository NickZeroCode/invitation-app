import { render, screen, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { TEMPLATES, getTemplate, sampleDraft } from './registry.tsx'

// Must match the backend seed `templates_app/migrations/0002_seed_templates.py`.
const BACKEND_KEYS = [
  'heritage-luxe',
  'jardin-floral',
  'ligne-moderne',
  'confetti',
  'sceau-academique',
  'soiree-formelle',
  'memoire',
]

afterEach(cleanup)

describe('template registry', () => {
  it('exposes exactly the seeded template keys', () => {
    expect(TEMPLATES.map((t) => t.key).sort()).toEqual([...BACKEND_KEYS].sort())
    expect(new Set(TEMPLATES.map((t) => t.key)).size).toBe(TEMPLATES.length)
  })

  it('renders every template with its sample content', () => {
    for (const definition of TEMPLATES) {
      const draft = sampleDraft(definition.key)
      render(<definition.Component draft={draft} />)
      expect(screen.getByText(draft.title)).toBeInTheDocument()
      expect(draft.event_date).toBe('2026-12-12')
      cleanup()
    }
  })

  it('resolves definitions by key and falls back safely', () => {
    expect(getTemplate('confetti')?.name).toBe('Confetti')
    expect(getTemplate('inconnu')).toBeUndefined()
  })
})
