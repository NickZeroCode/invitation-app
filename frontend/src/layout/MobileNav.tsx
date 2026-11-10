/**
 * Phone navigation: a slim top bar (brand + account menu) and a thumb-reach
 * bottom tab bar. No drawer to open for everyday navigation.
 */
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../auth/AuthContext.tsx'
import { BrandLockup, IconLogout, IconSettings } from '../design-system/index.ts'
import { fr } from '../locales/fr.ts'
import { NAV_ITEMS, initials } from './nav.ts'

export function AccountMenu({ placement = 'down' }: { placement?: 'down' | 'up' }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return undefined
    function onPointer(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [open])

  async function handleLogout() {
    setOpen(false)
    await logout()
    navigate('/connexion', { replace: true })
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={fr.nav.account}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-[0.75rem] font-medium text-white transition-colors hover:bg-[#3c3c3c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2"
      >
        {initials(user?.full_name ?? '')}
      </button>
      {open ? (
        <div className={`absolute z-50 w-64 rounded-md border border-line bg-surface p-1.5 shadow-pop ${placement === 'up' ? 'bottom-12 left-0' : 'right-0 top-12'}`}>
          <div className="px-2.5 py-2">
            <p className="truncate text-sm font-medium text-ink">{user?.full_name}</p>
            <p className="truncate text-xs text-ink-faint">{user?.email}</p>
          </div>
          <div className="my-1 h-px bg-line" />
          <Link
            to="/parametres"
            onClick={() => setOpen(false)}
            className="flex h-10 items-center gap-2.5 rounded-full px-3 text-sm text-ink-soft hover:bg-surface-muted hover:text-ink"
          >
            <IconSettings className="h-4 w-4" />
            {fr.nav.settings}
          </Link>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="flex h-10 w-full items-center gap-2.5 rounded-full px-3 text-sm text-ink-soft hover:bg-surface-muted hover:text-ink"
          >
            <IconLogout className="h-4 w-4" />
            {fr.common.logout}
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function MobileTopBar() {
  return (
    <header className="app-ui sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-surface px-4">
      <Link to="/accueil" aria-label={fr.appName}>
        <BrandLockup />
      </Link>
      <AccountMenu />
    </header>
  )
}

export function MobileTabBar() {
  const { pathname } = useLocation()
  return (
    <nav
      aria-label={fr.nav.workspace}
      className="app-ui pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4 px-2 pt-1.5">
        {NAV_ITEMS.map((item) => {
          // Event sub-pages (guests, responses) keep the Events tab lit.
          const active = item.end ? pathname === item.to : pathname.startsWith(item.to)
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                aria-label={item.label}
                className={`flex h-14 flex-col items-center justify-center gap-1 text-[0.6875rem] transition-colors ${
                  active ? 'font-medium text-ink' : 'text-ink-soft'
                }`}
              >
                <span className={`flex h-7 w-14 items-center justify-center rounded-full transition-colors ${active ? 'bg-surface-sunken' : ''}`}>
                  <item.icon className="h-5 w-5" />
                </span>
                <span className="leading-none">{item.shortLabel}</span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
