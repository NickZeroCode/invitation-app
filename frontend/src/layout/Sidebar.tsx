import { useEffect, useState, type ReactElement } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

import { useAuth } from '../auth/AuthContext.tsx'
import {
  Button,
  IconChevronLeft,
  IconClose,
  IconEvents,
  IconLogout,
  IconMenu,
  IconOverview,
  IconSettings,
  IconTemplates,
  type IconProps,
} from '../design-system/index.ts'
import { fr } from '../locales/fr.ts'

interface NavItem {
  to: string
  label: string
  icon: (props: IconProps) => ReactElement
  end?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: fr.nav.overview, icon: IconOverview, end: true },
  { to: '/evenements', label: fr.nav.events, icon: IconEvents },
  { to: '/modeles', label: fr.nav.templates, icon: IconTemplates },
  { to: '/parametres', label: fr.nav.settings, icon: IconSettings },
]

const COLLAPSE_KEY = 'nickevents.sidebar.collapsed'

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand font-display text-sm font-semibold text-white">
        N
      </span>
      {compact ? null : (
        <span className="font-display text-lg font-semibold tracking-tight text-ink">
          {fr.appName}
        </span>
      )}
    </div>
  )
}

interface SidebarContentProps {
  collapsed: boolean
  onNavigate?: () => void
}

function SidebarContent({ collapsed, onNavigate }: SidebarContentProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/connexion', { replace: true })
  }

  return (
    <div className="flex h-full flex-col">
      <div className={`flex h-16 items-center ${collapsed ? 'justify-center px-3' : 'px-5'}`}>
        <Brand compact={collapsed} />
      </div>

      <nav aria-label={fr.nav.workspace} className="flex-1 space-y-1 px-3 py-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-md text-sm font-medium transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
                collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
                isActive
                  ? 'bg-brand-soft text-brand-strong'
                  : 'text-ink-soft hover:bg-surface-muted hover:text-ink',
              ].join(' ')
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {collapsed ? null : <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className={`border-t border-line ${collapsed ? 'px-3 py-4' : 'px-5 py-4'}`}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-pill bg-brand-soft text-xs font-semibold text-brand-strong">
              {initials(user?.full_name ?? '')}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              aria-label={fr.common.logout}
              title={fr.common.logout}
              className="flex h-8 w-8 items-center justify-center rounded-md text-ink-soft transition-colors duration-150 hover:bg-surface-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <IconLogout className="h-4.5 w-4.5" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-brand-soft text-xs font-semibold text-brand-strong">
                {initials(user?.full_name ?? '')}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{user?.full_name}</p>
                <p className="truncate text-xs text-ink-faint">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 w-full justify-start"
              onClick={handleLogout}
            >
              <IconLogout className="h-4 w-4" />
              {fr.common.logout}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === '1')
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0')
  }, [collapsed])

  return (
    <>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-surface px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label={fr.common.openMenu}
          className="flex h-9 w-9 items-center justify-center rounded-md text-ink transition-colors duration-150 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <IconMenu />
        </button>
        <Brand />
        <span className="h-9 w-9" aria-hidden="true" />
      </header>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/30"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-line bg-surface shadow-pop">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label={fr.common.closeMenu}
              className="absolute right-3 top-5 flex h-9 w-9 items-center justify-center rounded-md text-ink transition-colors duration-150 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <IconClose />
            </button>
            <SidebarContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}

      {/* Desktop sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-line bg-surface transition-[width] duration-200 lg:flex ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <SidebarContent collapsed={collapsed} />
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? fr.common.expandSidebar : fr.common.collapseSidebar}
          className="absolute -right-3 top-7 flex h-6 w-6 items-center justify-center rounded-pill border border-line bg-surface text-ink-soft transition-colors duration-150 hover:bg-surface-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <IconChevronLeft className={`h-3.5 w-3.5 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </aside>
    </>
  )
}
