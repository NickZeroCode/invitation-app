/**
 * Organizer workspace shell.
 *
 * - Desktop: collapsible sidebar; the main column's offset follows the
 *   sidebar width, so collapsing it hands the space to the content.
 * - Phone/tablet: top bar + bottom tab bar (thumb reach, no drawer).
 * - The event editor is a full-bleed workspace; every other page sits in a
 *   comfortable, wide reading column.
 */
import { useEffect, useState, type FormEvent } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import { IconSearch } from '../design-system/index.ts'
import { DESKTOP_QUERY, useMediaQuery } from '../lib/useMediaQuery.ts'
import { fr } from '../locales/fr.ts'
import { AccountMenu, MobileTabBar, MobileTopBar } from './MobileNav.tsx'
import { COLLAPSE_KEY, isWorkspaceRoute } from './nav.ts'
import { Sidebar } from './Sidebar.tsx'

/** Searches the events list (`/evenements?q=`), Kaggle-style pill. */
function SearchBar() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  function submit(event: FormEvent) {
    event.preventDefault()
    const q = query.trim()
    navigate(q ? `/evenements?q=${encodeURIComponent(q)}` : '/evenements')
  }
  return (
    <form role="search" onSubmit={submit} className="w-full max-w-[36rem]">
      <label className="flex h-12 items-center gap-3 rounded-full border border-line-strong bg-surface px-5 transition-colors focus-within:border-ink hover:border-ink-faint">
        <IconSearch className="h-5 w-5 shrink-0 text-ink" />
        <span className="sr-only">{fr.nav.search}</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={fr.nav.search}
          className="h-full w-full min-w-0 bg-transparent text-sm font-light text-ink placeholder:text-ink-soft focus:outline-none"
        />
      </label>
    </form>
  )
}

export function AppShell() {
  const isDesktop = useMediaQuery(DESKTOP_QUERY, true)
  const { pathname } = useLocation()
  const workspace = isWorkspaceRoute(pathname)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === '1')

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0')
  }, [collapsed])

  // Return to the top of each new page (lists can be long on phones).
  useEffect(() => {
    if (typeof window.scrollTo === 'function' && !navigator.userAgent.includes('jsdom')) {
      window.scrollTo({ top: 0 })
    }
  }, [pathname])

  if (isDesktop) {
    return (
      <div className="app-ui min-h-svh bg-paper">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} showAccount={workspace} />
        <div
          className={`min-w-0 transition-[padding] duration-200 ease-out ${collapsed ? 'pl-[4.5rem]' : 'pl-60'}`}
        >
          {workspace ? (
            <main className="min-w-0">
              <Outlet />
            </main>
          ) : (
            <>
              <header className="sticky top-0 z-20 flex h-[4.5rem] items-center justify-between gap-6 bg-paper px-8 xl:px-12">
                <SearchBar />
                <AccountMenu />
              </header>
              <main className="mx-auto w-full max-w-[90rem] px-8 pb-12 pt-3 xl:px-12">
                <Outlet />
              </main>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="app-ui min-h-svh bg-paper">
      <MobileTopBar />
      {/* Workspace pages paint their own full-height backgrounds (down under the
          fixed tab bar) so no paper band can show below their content. */}
      {workspace ? (
        <main className="min-w-0">
          <Outlet />
        </main>
      ) : (
        <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-6 sm:px-6">
          <Outlet />
        </main>
      )}
      <MobileTabBar />
    </div>
  )
}
