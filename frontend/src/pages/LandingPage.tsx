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
  IconCheck,
  IconEvents,
  IconInbox,
  IconTemplates,
  LogoArtwork,
  LogoMark,
} from '../design-system/index.ts'
import { fr } from '../locales/fr.ts'
import { getTemplate, sampleDraft, TEMPLATES } from '../templates/registry.tsx'

const CURRENT_YEAR = new Date().getFullYear()

const CTA_BASE =
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40'
const PRIMARY_CTA = `${CTA_BASE} h-10 px-5 text-sm bg-brand text-white hover:bg-brand-strong`
const SECONDARY_CTA = `${CTA_BASE} h-10 px-5 text-sm border border-line-strong bg-surface text-ink hover:bg-surface-muted`
const HEADER_CTA = `${CTA_BASE} h-8 px-3 text-xs bg-brand text-white hover:bg-brand-strong`

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
      className={`aspect-[3/4] w-full overflow-hidden rounded-md border border-line bg-surface-muted ${className}`}
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
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-30 focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        {fr.landing.nav.skipToContent}
      </a>

      <header className="sticky top-0 z-20 border-b border-line bg-paper">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/">
            <BrandLockup />
          </Link>
          <nav
            aria-label={fr.landing.nav.ariaLabel}
            className="hidden items-center gap-7 text-sm text-ink-soft sm:flex"
          >
            <a className="transition-colors hover:text-ink" href="#modeles">
              {fr.landing.nav.templates}
            </a>
            <a className="transition-colors hover:text-ink" href="#avantages">
              {fr.landing.nav.benefits}
            </a>
            <a className="transition-colors hover:text-ink" href="#fonctionnement">
              {fr.landing.nav.howItWorks}
            </a>
            <a className="transition-colors hover:text-ink" href="#verification">
              {fr.landing.nav.verification}
            </a>
          </nav>
          <Link to="/connexion" className={HEADER_CTA}>
            {fr.landing.nav.login}
          </Link>
        </div>
      </header>

      <main id="contenu">
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-brand">
              {fr.landing.hero.eyebrow}
            </p>
            <h1 className="mt-5 font-display text-4xl leading-[1.08] text-ink sm:text-5xl lg:text-6xl">
              {fr.landing.hero.title}
            </h1>
            <p className="mt-6 text-base leading-relaxed text-ink-soft sm:text-lg">
              {fr.landing.hero.text}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to="/connexion" className={PRIMARY_CTA}>
                {fr.landing.hero.primaryCta}
              </Link>
              <a href="#modeles" className={SECONDARY_CTA}>
                {fr.landing.hero.secondaryCta}
              </a>
            </div>
            <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-ink-soft">
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

          <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
            {HERO_TEMPLATE_KEYS.map((templateKey, index) => (
              <div
                key={templateKey}
                className={
                  index === 0
                    ? 'mx-auto w-full max-w-[260px] sm:max-w-none'
                    : 'hidden sm:block'
                }
              >
                <TemplatePreview
                  templateKey={templateKey}
                  className={
                    index === 1 ? 'sm:mt-10' : index === 2 ? 'sm:mt-5' : ''
                  }
                />
              </div>
            ))}
          </div>
        </section>

        <section
          id="avantages"
          aria-labelledby="avantages-titre"
          className="scroll-mt-20 border-t border-line bg-surface"
        >
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="max-w-2xl">
              <h2
                id="avantages-titre"
                className="font-display text-3xl leading-tight text-ink sm:text-4xl"
              >
                {fr.landing.benefits.title}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-ink-soft">
                {fr.landing.benefits.subtitle}
              </p>
            </div>
            <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {fr.landing.benefits.items.map((item, index) => {
                const Icon = BENEFIT_ICONS[index % BENEFIT_ICONS.length]
                return (
                  <li key={item.title}>
                    <Icon className="h-6 w-6 text-brand" />
                    <h3 className="mt-4 text-base font-semibold text-ink">
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
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="max-w-2xl">
              <h2
                id="fonctionnement-titre"
                className="font-display text-3xl leading-tight text-ink sm:text-4xl"
              >
                {fr.landing.howItWorks.title}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-ink-soft">
                {fr.landing.howItWorks.subtitle}
              </p>
            </div>
            <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {fr.landing.howItWorks.steps.map((step, index) => (
                <li key={step.title} className="border-t border-line pt-5">
                  <p className="font-display text-2xl text-brand">
                    {String(index + 1).padStart(2, '0')}
                  </p>
                  <h3 className="mt-3 text-base font-semibold text-ink">
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
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="max-w-2xl">
              <h2
                id="occasions-titre"
                className="font-display text-3xl leading-tight text-ink sm:text-4xl"
              >
                {fr.landing.categories.title}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-ink-soft">
                {fr.landing.categories.subtitle}
              </p>
            </div>
            <ul className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
              {fr.landing.categories.items.map((category) => (
                <li key={category.name} className="border-t border-line pt-4">
                  <h3 className="text-sm font-semibold text-ink">{category.name}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
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
          className="scroll-mt-20 border-t border-line bg-surface"
        >
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-20">
            <div>
              <h2
                id="verification-titre"
                className="font-display text-3xl leading-tight text-ink sm:text-4xl"
              >
                {fr.landing.verification.title}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-ink-soft">
                {fr.landing.verification.text}
              </p>
              <ul className="mt-6 space-y-3">
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
              <div className="w-full max-w-sm rounded-md border border-line bg-surface-muted p-8">
                <div className="flex flex-col items-center text-center">
                  <Badge tone="brand">{fr.appName}</Badge>
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt={fr.landing.verification.qrAlt}
                      className="mt-5 h-40 w-40 rounded-xl bg-white p-2 shadow-sm"
                    />
                  ) : (
                    <div
                      className="mt-5 h-40 w-40 rounded-xl bg-white"
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
          className="scroll-mt-20 border-t border-line"
        >
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="max-w-2xl">
              <h2
                id="modeles-titre"
                className="font-display text-3xl leading-tight text-ink sm:text-4xl"
              >
                {fr.landing.showcase.title}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-ink-soft">
                {fr.landing.showcase.subtitle}
              </p>
            </div>
            <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {TEMPLATES.map((template) => (
                <li key={template.key}>
                  <TemplatePreview templateKey={template.key} />
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold text-ink">
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
            <div className="mt-12 flex justify-center">
              <Link to="/connexion" className={PRIMARY_CTA}>
                {fr.landing.showcase.cta}
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-line bg-ink">
          <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-20">
            {/* The full logo lockup, plateless on the dark band. */}
            <LogoArtwork className="w-[min(64vw,24rem)]" />
            <h2 className="mt-10 font-display text-3xl leading-tight text-white sm:text-4xl">
              {fr.landing.finalCta.title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-white/75">
              {fr.landing.finalCta.text}
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                to="/connexion"
                className={`${CTA_BASE} h-10 px-5 text-sm bg-white text-brand-strong hover:bg-brand-soft`}
              >
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
          <p className="text-xs text-ink-faint">
            © {CURRENT_YEAR} {fr.appName}. {fr.landing.footer.rights}
          </p>
        </div>
      </footer>
    </div>
  )
}
