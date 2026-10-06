import { Link } from 'react-router-dom'

import { fr } from '../locales/fr.ts'

export function NotFoundPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-paper px-6 text-center">
      <p className="font-display text-5xl font-semibold text-brand">404</p>
      <h1 className="mt-3 text-xl font-semibold tracking-tight text-ink">{fr.notFound.title}</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-soft">{fr.notFound.description}</p>
      <Link
        to="/"
        className="mt-6 inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        {fr.notFound.action}
      </Link>
    </div>
  )
}
