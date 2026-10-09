/**
 * Organizer workspace shell.
 *
 * - Desktop: collapsible sidebar; the main column's offset follows the
 *   sidebar width, so collapsing it hands the space to the content.
 * - Phone/tablet: top bar + bottom tab bar (thumb reach, no drawer).
 * - The event editor is a full-bleed workspace; every other page sits in a
 *   comfortable, wide reading column.
 */
import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { DESKTOP_QUERY, useMediaQuery } from '../lib/useMediaQuery.ts'
import { MobileTabBar, MobileTopBar } from './MobileNav.tsx'
import { COLLAPSE_KEY, isWorkspaceRoute } from './nav.ts'
import { Sidebar } from './Sidebar.tsx'

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
      <div className="min-h-svh bg-paper">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
        <div
          className={`min-w-0 transition-[padding] duration-200 ease-out ${collapsed ? 'pl-[4.5rem]' : 'pl-64'}`}
        >
          {workspace ? (
            <main className="min-w-0">
              <Outlet />
            </main>
          ) : (
            <main className="mx-auto w-full max-w-[90rem] px-8 py-9 xl:px-12">
              <Outlet />
            </main>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-paper">
      <MobileTopBar />
      {workspace ? (
        <main className="min-w-0 pb-[4.75rem]">
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
