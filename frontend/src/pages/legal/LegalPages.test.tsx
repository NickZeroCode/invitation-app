import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { fr } from '../../locales/fr.ts'
import { CguPage } from './CguPage.tsx'
import { CookiesPage } from './CookiesPage.tsx'
import { PrivacyPage } from './PrivacyPage.tsx'

function renderPage(path: string, element: ReactElement) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={path} element={element} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('legal pages smoke', () => {
  it('renders the CGU page with every section', () => {
    renderPage('/cgu', <CguPage />)
    expect(screen.getByRole('heading', { level: 1, name: fr.legal.cgu.title })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(fr.legal.cgu.sections.length)
    expect(screen.getByRole('link', { name: fr.legal.nav.privacy })).toHaveAttribute(
      'href',
      '/politique-de-confidentialite',
    )
  })

  it('renders the privacy page with its data tables', () => {
    renderPage('/politique-de-confidentialite', <PrivacyPage />)
    expect(screen.getByRole('heading', { level: 1, name: fr.legal.privacy.title })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(fr.legal.privacy.sections.length)
    expect(screen.getAllByRole('table')).toHaveLength(
      fr.legal.privacy.sections.filter((section) => section.table.length > 0).length,
    )
  })

  it('renders the cookies page with the cookie table', () => {
    renderPage('/parametres-de-cookies', <CookiesPage />)
    expect(screen.getByRole('heading', { level: 1, name: fr.legal.cookies.title })).toBeInTheDocument()
    expect(screen.getByText('sessionid')).toBeInTheDocument()
    expect(screen.getByText('csrftoken')).toBeInTheDocument()
  })
})
