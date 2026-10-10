import { Link } from 'react-router-dom'

import { LegalLinks } from '../../components/LegalLinks.tsx'
import { LogoMark } from '../../design-system/index.ts'
import { fr } from '../../locales/fr.ts'

const CURRENT_YEAR = new Date().getFullYear()

export type LegalSection = {
  title: string
  paragraphs: readonly string[]
  list: readonly string[]
  table: readonly (readonly string[])[]
}

export type LegalPageCopy = {
  title: string
  intro: string
  sections: readonly LegalSection[]
}

/**
 * Shared shell for the public legal pages (CGU, confidentialité, cookies).
 * Content lives in `fr.legal` so all three pages stay perfectly consistent.
 */
export function LegalLayout({ copy }: { copy: LegalPageCopy }) {
  return (
    <div className="flex min-h-svh flex-col bg-paper">
      <header className="border-b border-line">
        <div className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <LogoMark />
            <span className="text-sm font-semibold text-ink">{fr.appName}</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
          {copy.title}
        </h1>
        <p className="mt-5 text-base leading-relaxed text-ink-soft">{copy.intro}</p>
        <p className="mt-4 text-xs text-ink-faint">{fr.legal.updated}</p>

        <div className="mt-12 space-y-12">
          {copy.sections.map((section, sectionIndex) => (
            <section key={`${sectionIndex}-${section.title}`}>
              <h2 className="text-lg font-semibold tracking-tight text-ink">{section.title}</h2>
              {section.paragraphs.map((paragraph, paragraphIndex) => (
                <p
                  key={`${paragraphIndex}-${paragraph.slice(0, 24)}`}
                  className="mt-3 text-sm leading-relaxed text-ink-soft"
                >
                  {paragraph}
                </p>
              ))}
              {section.list.length > 0 ? (
                <ul className="mt-4 space-y-2">
                  {section.list.map((item, itemIndex) => (
                    <li
                      key={`${itemIndex}-${item.slice(0, 24)}`}
                      className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-soft"
                    >
                      <span
                        className="mt-2 h-1 w-1 shrink-0 rounded-pill bg-ink-faint"
                        aria-hidden="true"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
              {section.table.length > 0 ? (
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
                    <thead>
                      <tr>
                        {section.table[0].map((head, headIndex) => (
                          <th
                            key={`${headIndex}-${head}`}
                            scope="col"
                            className="border-b border-line pb-2 pr-4 align-bottom text-xs font-semibold uppercase tracking-wide text-ink-faint last:pr-0"
                          >
                            {head}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.table.slice(1).map((row, rowIndex) => (
                        <tr key={`${rowIndex}-${row[0]}`}>
                          {row.map((cell, cellIndex) => (
                            <td
                              key={`${cellIndex}-${cell.slice(0, 24)}`}
                              className={`border-b border-line py-3 pr-4 align-top leading-relaxed text-ink-soft last:pr-0 ${
                                cellIndex === 0 ? 'font-medium text-ink' : ''
                              }`}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </section>
          ))}
        </div>
      </main>

      <footer className="border-t border-line bg-paper">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-start gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <div>
              <p className="text-sm font-semibold text-ink">{fr.appName}</p>
              <p className="text-xs text-ink-faint">{fr.landing.footer.tagline}</p>
            </div>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <LegalLinks />
            <p className="text-xs text-ink-faint">
              © {CURRENT_YEAR} {fr.appName}. {fr.landing.footer.rights}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
