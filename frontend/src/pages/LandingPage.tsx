/**
 * Public marketing homepage (`/`).
 *
 * Deliberately static and API-free for fast first paint: every invitation
 * preview is the real template component fed by `sampleDraft`, so the page
 * always shows genuine product output — never stock illustration.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import QRCode from 'qrcode'

import {
  Badge,
  BrandLockup,
  buttonClasses,
  IconCheck,
  IconEvents,
  IconInbox,
  IconTemplates,
  LogoArtwork,
  LogoMark,
} from '../design-system/index.ts'
import { LegalLinks } from '../components/LegalLinks.tsx'
import { fr } from '../locales/fr.ts'
import { getTemplate, sampleDraft, TEMPLATES } from '../templates/registry.tsx'

const CURRENT_YEAR = new Date().getFullYear()

/** Shared page rhythm — one measure, one padding scale, everywhere. */
const SECTION = 'mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'
const SECTION_Y = 'py-20 lg:py-28'

/** Small-caps eyebrow framed by hairline rules — the page's editorial signature. */
const EYEBROW =
  'inline-flex items-center justify-center gap-3 text-[0.6875rem] font-semibold uppercase tracking-[0.24em] text-brand'

const HERO_TEMPLATE_KEYS = ['heritage-luxe', 'confetti', 'soiree-formelle']

const BENEFIT_ICONS = [IconTemplates, IconEvents, IconCheck, IconInbox]

function TemplatePreview({
  templateKey,
  className = '',
}: {
  templateKey: string
  className?: string
}) {
  const definition = getTemplate(templateKey)
  return (
    <div
      className={`aspect-[3/4] w-full overflow-hidden rounded-lg border border-line bg-surface-muted ${className}`}
      role="img"
      aria-label={
        definition
          ? `${fr.templates.previewLabel} : ${definition.name}`
          : fr.templates.previewLabel
      }
    >
      {definition ? (
        <definition.Component draft={sampleDraft(templateKey)} />
      ) : null}
    </div>
  )
}

export function LandingPage() {
  const [qrDataUrl, setQrDataUrl] = useState('')

  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(`${window.location.origin}/`, {
      width: 340,
      margin: 1,
      color: { dark: '#1a261f', light: '#ffffff' },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url)
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl('')
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="min-h-svh bg-paper">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-30 focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        {fr.landing.nav.skipToContent}
      </a>

      <header className="sticky top-0 z-20 border-b border-line/70 bg-paper/85 backdrop-blur-md">
        <div className={`flex h-16 items-center justify-between gap-4 ${SECTION}`}>
          <Link to="/">
            <BrandLockup />
          </Link>
          <nav
            aria-label={fr.landing.nav.ariaLabel}
            className="hidden items-center gap-8 text-[0.9375rem] text-ink-soft lg:flex"
          >
            {[
              ['modeles', fr.landing.nav.templates],
              ['avantages', fr.landing.nav.benefits],
              ['fonctionnement', fr.landing.nav.howItWorks],
              ['verification', fr.landing.nav.verification],
            ].map(([href, label]) => (
              <a
                key={href}
                className="underline-offset-4 transition-colors hover:text-ink hover:underline"
                href={`#${href}`}
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden sm:block">
              <Link to="/connexion" className={buttonClasses('ghost', 'sm', 'text-ink-soft')}>
                {fr.landing.nav.login}
              </Link>
            </span>
            <Link to="/inscription" className={buttonClasses('primary', 'sm')}>
              {fr.landing.nav.signup}
            </Link>
          </div>
        </div>
      </header>

      <main id="contenu">
        <section className="relative">
          <div className={`pb-16 pt-16 text-center sm:pt-20 lg:pb-20 lg:pt-24 ${SECTION}`}>
            <div className="mx-auto max-w-3xl">
              <p className={EYEBROW}>
                <span aria-hidden="true" className="hidden h-px w-8 bg-gold sm:block" />
                {fr.landing.hero.eyebrow}
                <span aria-hidden="true" className="hidden h-px w-8 bg-gold sm:block" />
              </p>
              <h1 className="mt-6 font-display text-[2.75rem] leading-[1.05] tracking-[-0.015em] text-ink sm:text-6xl lg:text-7xl">
                {fr.landing.hero.title}
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg">
                {fr.landing.hero.text}
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <Link to="/inscription" className={buttonClasses('primary', 'lg')}>
                  {fr.landing.hero.signupCta}
                </Link>
                <Link to="/connexion" className={buttonClasses('secondary', 'lg')}>
                  {fr.landing.hero.primaryCta}
                </Link>
                <a href="#modeles" className={buttonClasses('ghost', 'lg')}>
                  {fr.landing.hero.secondaryCta}
                </a>
              </div>
              <ul className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-x-7 gap-y-2 text-[0.8125rem] text-ink-soft">
                {(
                  [
                    fr.landing.hero.point1,
                    fr.landing.hero.point2,
                    fr.landing.hero.point3,
                  ] as const
                ).map((point) => (
                  <li key={point} className="flex items-center gap-2">
                    <IconCheck className="h-4 w-4 text-brand" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* The collection itself, staged on the drafting canvas. */}
          <div className="canvas-grid border-y border-line">
            <div className={`pb-16 pt-14 lg:pb-20 lg:pt-16 ${SECTION}`}>
              <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
                {HERO_TEMPLATE_KEYS.map((templateKey, index) => (
                  <div
                    key={templateKey}
                    className={
                      index === 0
                        ? 'mx-auto w-full max-w-[280px] sm:max-w-none'
                        : 'hidden sm:block'
                    }
                  >
                    <TemplatePreview
                      templateKey={templateKey}
                      className={
                        index === 0
                          ? 'shadow-canvas'
                          : index === 1
                            ? 'shadow-raised sm:mt-12'
                            : 'shadow-raised sm:mt-6'
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          id="avantages"
          aria-labelledby="avantages-titre"
          className="scroll-mt-20 border-t border-line bg-surface"
        >
          <div className={`${SECTION} ${SECTION_Y}`}>
            <div className="max-w-2xl">
              <h2
                id="avantages-titre"
                className="font-display text-3xl leading-tight tracking-[-0.01em] text-ink sm:text-4xl lg:text-[2.75rem]"
              >
                {fr.landing.benefits.title}
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
                {fr.landing.benefits.subtitle}
              </p>
            </div>
            <ul className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {fr.landing.benefits.items.map((item, index) => {
                const Icon = BENEFIT_ICONS[index % BENEFIT_ICONS.length]
                return (
                  <li key={item.title} className="border-t border-line-strong pt-6">
                    <Icon className="h-6 w-6 text-brand" />
                    <h3 className="mt-5 text-base font-semibold tracking-[-0.005em] text-ink">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                      {item.text}
                    </p>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>

        <section
          id="fonctionnement"
          aria-labelledby="fonctionnement-titre"
          className="scroll-mt-20 border-t border-line"
        >
          <div className={`${SECTION} ${SECTION_Y}`}>
            <div className="max-w-2xl">
              <h2
                id="fonctionnement-titre"
                className="font-display text-3xl leading-tight tracking-[-0.01em] text-ink sm:text-4xl lg:text-[2.75rem]"
              >
                {fr.landing.howItWorks.title}
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
                {fr.landing.howItWorks.subtitle}
              </p>
            </div>
            <ol className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {fr.landing.howItWorks.steps.map((step, index) => (
                <li key={step.title} className="border-t border-line-strong pt-6">
                  <p className="font-display text-3xl leading-none text-gold">
                    {String(index + 1).padStart(2, '0')}
                  </p>
                  <h3 className="mt-4 text-base font-semibold tracking-[-0.005em] text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                    {step.text}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          id="occasions"
          aria-labelledby="occasions-titre"
          className="scroll-mt-20 border-t border-line"
        >
          <div className={`${SECTION} ${SECTION_Y}`}>
            <div className="max-w-2xl">
              <h2
                id="occasions-titre"
                className="font-display text-3xl leading-tight tracking-[-0.01em] text-ink sm:text-4xl lg:text-[2.75rem]"
              >
                {fr.landing.categories.title}
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
                {fr.landing.categories.subtitle}
              </p>
            </div>
            <ul className="mt-12 grid gap-x-10 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
              {fr.landing.categories.items.map((category) => (
                <li key={category.name} className="border-t border-line pt-4">
                  <h3 className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-ink">
                    {category.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                    {category.text}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          id="verification"
          aria-labelledby="verification-titre"
          className="canvas-grid scroll-mt-20 border-t border-line"
        >
          <div
            className={`grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16 ${SECTION} ${SECTION_Y}`}
          >
            <div>
              <h2
                id="verification-titre"
                className="font-display text-3xl leading-tight tracking-[-0.01em] text-ink sm:text-4xl lg:text-[2.75rem]"
              >
                {fr.landing.verification.title}
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
                {fr.landing.verification.text}
              </p>
              <ul className="mt-8 space-y-3.5">
                {fr.landing.verification.points.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-soft"
                  >
                    <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-center">
              <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-8 shadow-canvas">
                <div className="flex flex-col items-center text-center">
                  <Badge tone="brand">{fr.appName}</Badge>
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt={fr.landing.verification.qrAlt}
                      className="mt-6 h-40 w-40 rounded-xl bg-white p-2 shadow-sm ring-1 ring-line"
                    />
                  ) : (
                    <div
                      className="mt-6 h-40 w-40 rounded-xl bg-white ring-1 ring-line"
                      aria-hidden="true"
                    />
                  )}
                  <p className="mt-5 text-sm font-medium text-ink">
                    {fr.landing.verification.qrCaption}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="modeles"
          aria-labelledby="modeles-titre"
          className="scroll-mt-20 border-t border-line bg-surface"
        >
          <div className={`${SECTION} ${SECTION_Y}`}>
            <div className="max-w-2xl">
              <h2
                id="modeles-titre"
                className="font-display text-3xl leading-tight tracking-[-0.01em] text-ink sm:text-4xl lg:text-[2.75rem]"
              >
                {fr.landing.showcase.title}
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
                {fr.landing.showcase.subtitle}
              </p>
            </div>
            <ul className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {TEMPLATES.map((template) => (
                <li key={template.key}>
                  <TemplatePreview templateKey={template.key} className="shadow-card" />
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold tracking-[-0.005em] text-ink">
                      {template.name}
                    </h3>
                    <Badge tone="neutral">{template.categoryLabel}</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                    {template.description}
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-14 flex justify-center">
              <Link to="/connexion" className={buttonClasses('primary', 'lg')}>
                {fr.landing.showcase.cta}
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-line bg-ink">
          <div className={`flex flex-col items-center text-center ${SECTION} ${SECTION_Y}`}>
            {/* The full logo lockup, plateless on the dark band. */}
            <LogoArtwork className="w-[min(64vw,24rem)]" />
            <h2 className="mt-10 font-display text-3xl leading-tight tracking-[-0.01em] text-white sm:text-4xl lg:text-[2.75rem]">
              {fr.landing.finalCta.title}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/75">
              {fr.landing.finalCta.text}
            </p>
            <div className="mt-9 flex justify-center">
              <Link to="/connexion" className={buttonClasses('secondary', 'lg')}>
                {fr.landing.finalCta.button}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-paper">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
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
