/**
 * Desktop navigation rail. Collapsible to an icon rail; the main column
 * follows the width (AppShell reads the same `collapsed` state), so the
 * content always spans the remaining space.
 */
import { NavLink, useNavigate } from 'react-router-dom'

import { useAuth } from '../auth/AuthContext.tsx'
import { BrandLockup, IconLogout, IconSidebar } from '../design-system/index.ts'
import { fr } from '../locales/fr.ts'
import { NAV_ITEMS, initials } from './nav.ts'

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/connexion', { replace: true })
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex flex-col border-r border-line bg-surface transition-[width] duration-200 ease-out ${
        collapsed ? 'w-[4.5rem]' : 'w-64'
      }`}
    >
      <div className={`flex h-16 shrink-0 items-center ${collapsed ? 'justify-center' : 'justify-between pl-5 pr-3'}`}>
        {collapsed ? null : <BrandLockup />}
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? fr.common.expandSidebar : fr.common.collapseSidebar}
          title={collapsed ? fr.common.expandSidebar : fr.common.collapseSidebar}
          className="flex h-8 w-8 items-center justify-center rounded-md text-ink-faint transition-colors duration-150 hover:bg-surface-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/35"
        >
          <IconSidebar className="h-[1.15rem] w-[1.15rem]" />
        </button>
      </div>

      <nav aria-label={fr.nav.workspace} className="flex-1 space-y-0.5 px-3 pt-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              [
                'group relative flex h-9 items-center gap-3 rounded-md text-sm font-medium transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/35',
                collapsed ? 'justify-center px-0' : 'px-2.5',
                isActive
                  ? 'bg-surface-muted text-ink'
                  : 'text-ink-soft hover:bg-surface-muted/70 hover:text-ink',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                {isActive ? (
                  <span aria-hidden="true" className="absolute inset-y-2 left-0 w-[3px] rounded-r-pill bg-brand" />
                ) : null}
                <item.icon className={`h-[1.15rem] w-[1.15rem] shrink-0 ${isActive ? 'text-ink' : 'text-ink-faint group-hover:text-ink-soft'}`} />
                {collapsed ? <span className="sr-only">{item.label}</span> : <span className="truncate">{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className={`shrink-0 border-t border-line ${collapsed ? 'px-3 py-3' : 'p-3'}`}>
        <div className={`flex items-center gap-2.5 rounded-md ${collapsed ? 'flex-col' : 'px-1.5 py-1'}`}>
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-ink text-[0.6875rem] font-semibold text-white"
            title={collapsed ? user?.full_name : undefined}
          >
            {initials(user?.full_name ?? '')}
          </span>
          {collapsed ? null : (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.8125rem] font-medium text-ink">{user?.full_name}</p>
              <p className="truncate text-xs text-ink-faint">{user?.email}</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => void handleLogout()}
            aria-label={fr.common.logout}
            title={fr.common.logout}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-faint transition-colors duration-150 hover:bg-surface-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/35"
          >
            <IconLogout className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
