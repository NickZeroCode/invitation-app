/**
 * Desktop navigation. A white column: the menu button beside the house mark,
 * one near-black « Créer » pill for the main action, then the sections as
 * quiet rows with outline icons — the current one sits on a soft grey pill.
 * Collapsible to an icon rail; the main column follows the width (AppShell
 * reads the same `collapsed` state).
 */
import { Link, NavLink } from 'react-router-dom'

import { BrandLockup, IconMenu, IconPlus } from '../design-system/index.ts'
import { fr } from '../locales/fr.ts'
import { AccountMenu } from './MobileNav.tsx'
import { NAV_ITEMS } from './nav.ts'

export function Sidebar({
  collapsed,
  onToggle,
  showAccount = false,
}: {
  collapsed: boolean
  onToggle: () => void
  /** The account menu, for pages without the top bar (the editor). */
  showAccount?: boolean
}) {
  const focus = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30'
  return (
    <aside
      className={`app-ui fixed inset-y-0 left-0 z-30 flex flex-col bg-surface transition-[width] duration-200 ease-out ${
        collapsed ? 'w-[4.5rem]' : 'w-60'
      }`}
    >
      <div className="flex h-16 shrink-0 items-center gap-1.5 px-3.5">
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? fr.common.expandSidebar : fr.common.collapseSidebar}
          title={collapsed ? fr.common.expandSidebar : fr.common.collapseSidebar}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink transition-colors duration-150 hover:bg-surface-sunken ${focus}`}
        >
          <IconMenu className="h-5 w-5" />
        </button>
        {collapsed ? null : (
          <Link to="/accueil" aria-label={fr.appName} className={`min-w-0 rounded-full ${focus}`}>
            <BrandLockup />
          </Link>
        )}
      </div>

      <div className="px-3.5 pb-4 pt-1">
        <Link
          to="/evenements/nouveau"
          aria-label={collapsed ? fr.nav.newEvent : undefined}
          title={collapsed ? fr.nav.newEvent : undefined}
          className={`flex h-11 items-center rounded-full bg-ink text-[0.9375rem] font-medium text-white transition-colors hover:bg-[#3c3c3c] ${focus} ${
            collapsed ? 'w-11 justify-center' : 'w-fit gap-2.5 pl-3.5 pr-5'
          }`}
        >
          <IconPlus className="h-5 w-5" />
          {collapsed ? null : fr.nav.create}
        </Link>
      </div>

      <nav aria-label={fr.nav.workspace} className="flex-1 space-y-0.5 px-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              [
                'group flex h-11 items-center gap-4 rounded-full text-[0.9375rem] transition-colors duration-150',
                focus,
                collapsed ? 'justify-center px-0' : 'px-[1.125rem]',
                isActive ? 'bg-surface-sunken font-medium text-ink' : 'text-ink hover:bg-surface-muted',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-ink' : 'text-ink-soft group-hover:text-ink'}`} />
                {collapsed ? <span className="sr-only">{item.label}</span> : <span className="truncate">{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {showAccount ? (
        <div className="px-3.5 pb-4">
          <AccountMenu placement="up" />
        </div>
      ) : null}
    </aside>
  )
}
