/**
 * Sign-in and sign-up share one quiet card on a white page: the house mark,
 * the page title, two tabs to move between the forms, then the form itself.
 * Legal links and the copyright sit under the card.
 */
import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'

import { LegalLinks } from '../components/LegalLinks.tsx'
import { BrandLockup } from '../design-system/index.ts'
import { fr } from '../locales/fr.ts'

const CURRENT_YEAR = new Date().getFullYear()

const TABS: Array<[string, string]> = [
  ['/connexion', fr.auth.tabSignIn],
  ['/inscription', fr.auth.tabSignUp],
]

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="app-ui flex min-h-svh flex-col items-center bg-paper px-4 py-10 sm:py-16">
      <div className="w-full max-w-[28rem] rounded-xl border border-line bg-surface">
        <div className="px-6 pt-9 text-center sm:px-10">
          <Link to="/" aria-label={fr.appName} className="inline-flex rounded-full p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30">
            <BrandLockup />
          </Link>
          <h1 className="mt-6 text-[2rem] font-normal leading-tight tracking-[-0.01em] text-ink">{title}</h1>
          <p className="mt-1.5 text-[0.9375rem] font-light text-ink-soft">{subtitle}</p>
          <nav aria-label={fr.auth.tabsLabel} className="mt-6 flex justify-center gap-7">
            {TABS.map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `relative pb-3 text-[0.9375rem] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 ${
                    isActive
                      ? 'text-ink after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:rounded-full after:bg-ink'
                      : 'text-ink-soft hover:text-ink'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="border-t border-line px-6 py-8 sm:px-10">{children}</div>
      </div>
      <div className="mt-6 flex flex-col items-center gap-2 text-center">
        <LegalLinks />
        <p className="text-xs text-ink-faint">
          © {CURRENT_YEAR} {fr.appName}
        </p>
      </div>
    </div>
  )
}
