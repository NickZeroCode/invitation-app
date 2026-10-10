import { fr } from '../../locales/fr.ts'
import { LegalLayout } from './LegalLayout.tsx'

export function CookiesPage() {
  return <LegalLayout copy={fr.legal.cookies} />
}
