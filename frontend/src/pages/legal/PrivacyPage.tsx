import { fr } from '../../locales/fr.ts'
import { LegalLayout } from './LegalLayout.tsx'

export function PrivacyPage() {
  return <LegalLayout copy={fr.legal.privacy} />
}
