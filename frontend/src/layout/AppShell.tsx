import { Outlet } from 'react-router-dom'

import { Sidebar } from './Sidebar.tsx'

export function AppShell() {
  return (
    <div className="min-h-svh bg-paper">
      <Sidebar />
      <div className="transition-[padding] duration-200 lg:pl-64">
        <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
