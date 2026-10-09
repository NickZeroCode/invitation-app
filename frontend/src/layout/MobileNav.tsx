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

function AccountMenu() {
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
        className="flex h-9 w-9 items-center justify-center rounded-pill bg-ink text-[0.6875rem] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/35 focus-visible:ring-offset-2"
      >
        {initials(user?.full_name ?? '')}
      </button>
      {open ? (
        <div className="absolute right-0 top-11 z-50 w-64 rounded-lg border border-line bg-surface p-1.5 shadow-pop">
          <div className="px-2.5 py-2">
            <p className="truncate text-sm font-medium text-ink">{user?.full_name}</p>
            <p className="truncate text-xs text-ink-faint">{user?.email}</p>
          </div>
          <div className="my-1 h-px bg-line" />
          <Link
            to="/parametres"
            onClick={() => setOpen(false)}
            className="flex h-10 items-center gap-2.5 rounded-md px-2.5 text-sm text-ink-soft hover:bg-surface-muted hover:text-ink"
          >
            <IconSettings className="h-4 w-4" />
            {fr.nav.settings}
          </Link>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="flex h-10 w-full items-center gap-2.5 rounded-md px-2.5 text-sm text-ink-soft hover:bg-surface-muted hover:text-ink"
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
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-surface/90 px-4 backdrop-blur-md">
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
      className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur-md"
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
                className={`flex h-12 flex-col items-center justify-center gap-1 rounded-md text-[0.6875rem] font-medium transition-colors ${
                  active ? 'text-ink' : 'text-ink-faint'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="leading-none">{item.shortLabel}</span>
                <span
                  aria-hidden="true"
                  className={`h-[3px] w-5 rounded-pill transition-colors ${active ? 'bg-brand' : 'bg-transparent'}`}
                />
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
