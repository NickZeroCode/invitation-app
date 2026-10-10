import { Link } from 'react-router-dom'

import { fr } from '../locales/fr.ts'

const LINK_CLASS =
  'text-xs text-ink-soft underline decoration-line-strong underline-offset-4 transition-colors hover:text-ink'

/** Legal navigation shared by the public footers (landing, auth, legal pages). */
export function LegalLinks({ className = '' }: { className?: string }) {
  return (
    <nav
      aria-label={fr.legal.navLabel}
      className={`flex flex-wrap items-center gap-x-5 gap-y-1.5 ${className}`}
    >
      <Link to="/cgu" className={LINK_CLASS}>
        {fr.legal.nav.cgu}
      </Link>
      <Link to="/politique-de-confidentialite" className={LINK_CLASS}>
        {fr.legal.nav.privacy}
      </Link>
      <Link to="/parametres-de-cookies" className={LINK_CLASS}>
        {fr.legal.nav.cookies}
      </Link>
    </nav>
  )
}
