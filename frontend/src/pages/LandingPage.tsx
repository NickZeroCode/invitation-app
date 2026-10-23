/**
 * Public marketing homepage (`/`).
 *
 * Art direction: an editorial stationery studio. Warm paper, ink, one gold
 * accent; Playfair for display, Inter for reading. Every invitation shown is
 * the real template component rendered from `sampleDraft`, and the small UI
 * pieces (reply card, access card, send dialog) mirror the actual product —
 * no stock imagery, no invented customers, prices or statistics. The figures
 * in the facts band are read from the template registry.
 *
 * Deliberately API-free for a fast first paint. Motion is limited to a short
 * hero entrance and hover states, and is disabled for reduced-motion users.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import QRCode from 'qrcode'

import { LegalLinks } from '../components/LegalLinks.tsx'
import {
  BrandLockup,
  buttonClasses,
  IconArrowRight,
  IconBan,
  IconCalendar,
  IconChat,
  IconCheck,
  IconClose,
  IconDownload,
  IconInbox,
  IconMail,
  IconMenu,
  IconQr,
  IconShirt,
  IconUsers,
  LogoArtwork,
} from '../design-system/index.ts'
import { PUBLIC_SITE_URL } from '../lib/publicUrl.ts'
import { fr } from '../locales/fr.ts'
import { getTemplate, sampleDraft, TEMPLATES } from '../templates/registry.tsx'

const CURRENT_YEAR = new Date().getFullYear()
const COPY = fr.landing

/** One measure and one padding scale for the whole page. */
const WRAP = 'mx-auto w-full max-w-[76rem] px-5 sm:px-8 lg:px-10'
const SECTION_Y = 'py-20 sm:py-24 lg:py-32'
const H2 = 'text-balance font-brand text-[2.375rem] font-semibold leading-[1.02] tracking-[-0.01em] text-ink sm:text-[3rem] lg:text-[3.5rem]'
const LEAD = 'text-[1.0625rem] leading-relaxed text-ink-soft'
const EYEBROW = 'font-label text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-brand'

/** The curated first view of the collection (covers every event type). */
const FEATURED_KEYS = [
  'heritage-luxe',
  'floraison',
  'confetti',
  'kasai',
  'sceau-academique',
  'jardin-floral',
  'soiree-formelle',
  'ligne-moderne',
  'memoire',
]

const NAV_LINKS: Array<[string, string]> = [
  ['modeles', COPY.nav.templates],
  ['fonctionnalites', COPY.nav.features],
  ['fonctionnement', COPY.nav.howItWorks],
  ['questions', COPY.nav.faq],
]

const FEATURE_ICONS = [IconChat, IconUsers, IconQr, IconInbox, IconShirt, IconDownload, IconBan]

/* ------------------------------------------------------------------ parts */

function TemplatePreview({ templateKey, className = '' }: { templateKey: string; className?: string }) {
  const definition = getTemplate(templateKey)
  return (
    <div
      className={`aspect-[3/4] w-full overflow-hidden bg-surface-muted ${className}`}
      role="img"
      aria-label={definition ? `${fr.templates.previewLabel} : ${definition.name}` : fr.templates.previewLabel}
    >
      {definition ? <definition.Component draft={sampleDraft(templateKey)} /> : null}
    </div>
  )
}

function SectionHeader({
  id,
  eyebrow,
  title,
  lead,
  className = '',
}: {
  id: string
  eyebrow?: string
  title: string
  lead?: string
  className?: string
}) {
  return (
    <div className={`max-w-[38rem] ${className}`}>
      {eyebrow ? <p className={EYEBROW}>{eyebrow}</p> : null}
      <h2 id={id} className={`${H2} ${eyebrow ? 'mt-4' : ''}`}>
        {title}
      </h2>
      {lead ? <p className={`mt-5 ${LEAD}`}>{lead}</p> : null}
    </div>
  )
}

/** Small product card used in the hero composition. */
function FloatingCard({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={`rounded-md border border-line bg-surface px-4 py-3.5 shadow-[0_1px_2px_rgba(26,24,21,0.06),0_18px_40px_-18px_rgba(26,24,21,0.35)] ${className}`}
    >
      {children}
    </div>
  )
}

function useQrDataUrl(text: string): string {
  const [url, setUrl] = useState('')
  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(text, { width: 340, margin: 1, color: { dark: '#1a1815', light: '#ffffff' } })
      .then((value) => {
        if (!cancelled) setUrl(value)
      })
      .catch(() => {
        if (!cancelled) setUrl('')
      })
    return () => {
      cancelled = true
    }
  }, [text])
  return url
}

/* ------------------------------------------------------------------ header */

function SiteHeader() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return undefined
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/90 backdrop-blur-md">
      <div className={`flex h-16 items-center justify-between gap-6 ${WRAP}`}>
        <Link to="/" aria-label={fr.appName} className="shrink-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40">
          <BrandLockup />
        </Link>

        <nav aria-label={COPY.nav.ariaLabel} className="hidden items-center gap-9 lg:flex">
          {NAV_LINKS.map(([href, label]) => (
            <a
              key={href}
              href={`#${href}`}
              className="relative text-[0.875rem] text-ink-soft transition-colors after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-ink after:transition-transform hover:text-ink hover:after:scale-x-100"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Wrapped: buttonClasses sets its own display, which would win over `hidden`. */}
          <span className="hidden items-center gap-2 sm:flex">
            <Link to="/connexion" className={buttonClasses('ghost', 'sm', 'text-ink-soft')}>
              {COPY.nav.login}
            </Link>
            <Link to="/inscription" className={buttonClasses('primary', 'sm')}>
              {COPY.nav.signup}
            </Link>
          </span>
          <button
            type="button"
            className="-mr-2 flex h-10 w-10 items-center justify-center rounded-md text-ink transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 lg:hidden"
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? COPY.nav.closeMenu : COPY.nav.openMenu}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <IconClose className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div id="menu-mobile" className="border-t border-line bg-paper lg:hidden">
          <nav aria-label={COPY.nav.ariaLabel} className={`flex flex-col py-3 ${WRAP}`}>
            {NAV_LINKS.map(([href, label]) => (
              <a
                key={href}
                href={`#${href}`}
                onClick={() => setOpen(false)}
                className="border-b border-line/70 py-3.5 font-brand text-[1.625rem] font-semibold text-ink"
              >
                {label}
              </a>
            ))}
            <div className="mt-5 grid grid-cols-2 gap-3 pb-3">
              <Link to="/connexion" className={buttonClasses('secondary', 'md', 'w-full justify-center')}>
                {COPY.nav.login}
              </Link>
              <Link to="/inscription" className={buttonClasses('primary', 'md', 'w-full justify-center')}>
                {COPY.nav.signup}
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  )
}

/* -------------------------------------------------------------------- hero */

function Hero({ qrDataUrl }: { qrDataUrl: string }) {
  return (
    <section aria-labelledby="hero-titre" className="relative overflow-hidden border-b border-line">
      <div className={`grid items-center gap-14 pb-20 pt-14 sm:pt-20 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10 lg:pb-28 lg:pt-24 ${WRAP}`}>
        <div className="landing-rise max-w-[36rem]">
          <p className={EYEBROW}>{COPY.hero.eyebrow}</p>
          <h1
            id="hero-titre"
            className="mt-5 font-brand text-[3rem] font-semibold leading-[0.98] tracking-[-0.015em] text-ink sm:text-[4rem] lg:text-[4.625rem]"
          >
            {COPY.hero.title}
          </h1>
          <p className={`mt-6 max-w-[32rem] ${LEAD}`}>{COPY.hero.text}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link to="/inscription" className={buttonClasses('primary', 'lg', 'justify-center gap-2')}>
              {COPY.hero.signupCta}
              <IconArrowRight className="h-4 w-4" />
            </Link>
            <a href="#modeles" className={buttonClasses('secondary', 'lg', 'justify-center')}>
              {COPY.hero.secondaryCta}
            </a>
          </div>
          <p className="mt-6 text-[0.875rem] text-ink-soft">
            {COPY.hero.loginPrompt}{' '}
            <Link to="/connexion" className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
              {COPY.hero.primaryCta}
            </Link>
          </p>
        </div>

        {/* Product stage: a real invitation, the guest's reply and access card. */}
        <div className="landing-rise relative mx-auto w-full max-w-[30rem] lg:mr-0" style={{ ['--rise-delay' as string]: '120ms' }} role="group" aria-label={COPY.hero.stageLabel}>
          <div className="canvas-grid absolute -inset-x-6 -inset-y-8 rounded-xl border border-line sm:-inset-x-10" aria-hidden="true" />
          <div className="relative mx-auto w-[74%] rotate-[-1.5deg] shadow-[0_2px_4px_rgba(26,24,21,0.08),0_30px_60px_-24px_rgba(26,24,21,0.45)]">
            <TemplatePreview templateKey="floraison" />
          </div>

          <FloatingCard className="absolute -left-1 bottom-[14%] w-[12.75rem] sm:-left-6 sm:w-[15.5rem]">
            <p className="text-[0.5625rem] font-semibold uppercase tracking-[0.16em] text-brand sm:text-[0.625rem] sm:tracking-[0.2em]">{COPY.hero.rsvpTitle}</p>
            <p className="mt-2 text-[0.8125rem] font-medium text-ink">{COPY.hero.rsvpGuest}</p>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-sm bg-success-soft px-2 py-1 text-[0.75rem] font-medium text-success">
              <IconCheck className="h-3.5 w-3.5" />
              {COPY.hero.rsvpStatus}
            </p>
          </FloatingCard>

          <FloatingCard className="absolute -right-1 top-[8%] flex w-[7.25rem] flex-col items-center px-3 text-center sm:-right-6 sm:w-[9.5rem] sm:px-4">
            <p className="whitespace-nowrap text-[0.5625rem] font-semibold uppercase tracking-[0.12em] text-brand sm:text-[0.625rem] sm:tracking-[0.2em]">{COPY.hero.accessTitle}</p>
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="" className="mt-2.5 h-16 w-16 sm:h-[5.5rem] sm:w-[5.5rem]" />
            ) : (
              <span className="mt-2.5 block h-16 w-16 bg-surface-muted sm:h-[5.5rem] sm:w-[5.5rem]" aria-hidden="true" />
            )}
            <p className="mt-2 inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-ink">
              <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
              {COPY.hero.accessStatus}
            </p>
          </FloatingCard>

          <FloatingCard className="absolute -bottom-5 right-[8%] flex items-center gap-2 py-2.5">
            <IconChat className="h-4 w-4 text-success" />
            <span className="text-[0.75rem] font-medium text-ink">{COPY.hero.sentLabel}</span>
          </FloatingCard>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------- facts */

function FactsBand() {
  const occasions = new Set(TEMPLATES.map((template) => template.category)).size
  const facts: Array<[string, string]> = [
    [String(TEMPLATES.length), COPY.facts.templates],
    [String(occasions), COPY.facts.occasions],
    ['3', COPY.facts.channels],
    ['0', COPY.facts.app],
  ]
  return (
    <section aria-label={COPY.facts.ariaLabel} className="border-b border-line bg-surface">
      <dl className={`grid grid-cols-2 lg:grid-cols-4 ${WRAP}`}>
        {facts.map(([value, label], index) => (
          <div
            key={label}
            className={`py-8 pr-4 sm:py-10 ${index % 2 === 1 ? 'pl-5 sm:pl-8' : ''} ${index > 0 ? 'lg:pl-8' : ''} ${index % 2 === 1 ? 'border-l border-line' : ''} ${index === 2 ? 'border-t border-line lg:border-l lg:border-t-0' : ''} ${index === 3 ? 'border-t border-line lg:border-t-0' : ''}`}
          >
            <dt className="sr-only">{label}</dt>
            <dd>
              <span className="block font-brand text-[2.75rem] font-semibold leading-none text-ink [font-variant-numeric:lining-nums] sm:text-[3.25rem]">{value}</span>
              <span className="mt-3 block max-w-[14rem] text-[0.875rem] leading-snug text-ink-soft">{label}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

/* ------------------------------------------------------- problem/solution */

function ProblemSolution() {
  return (
    <section aria-labelledby="pourquoi-titre" className="border-b border-line">
      <div className={`${WRAP} ${SECTION_Y}`}>
        <SectionHeader id="pourquoi-titre" eyebrow={COPY.problem.eyebrow} title={COPY.problem.title} />
        <div className="mt-14 grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-2">
          <div className="bg-paper p-7 sm:p-10">
            <h3 className="font-label text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-ink-faint">{COPY.problem.beforeTitle}</h3>
            <ul className="mt-6 space-y-4">
              {COPY.problem.before.map((item) => (
                <li key={item} className="flex gap-3 text-[0.9375rem] leading-relaxed text-ink-soft">
                  <span aria-hidden="true" className="mt-[0.7em] h-px w-3 shrink-0 bg-ink-faint" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-surface p-7 sm:p-10">
            <h3 className="font-label text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-brand">{COPY.problem.afterTitle}</h3>
            <ul className="mt-6 space-y-4">
              {COPY.problem.after.map((item) => (
                <li key={item} className="flex gap-3 text-[0.9375rem] leading-relaxed text-ink">
                  <IconCheck className="mt-1 h-4 w-4 shrink-0 text-brand" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------- guest journey */

function MiniEnvelope() {
  return (
    <svg viewBox="0 0 160 110" className="h-auto w-[78%]" aria-hidden="true">
      <rect x="4" y="8" width="152" height="96" rx="3" fill="#EDE3D0" />
      <path d="M4 104 L80 58 L156 104 Z" fill="#E6DAC2" />
      <path d="M4 8 L80 64 L156 8 Z" fill="#F2EADB" stroke="rgba(60,40,20,0.12)" />
      <circle cx="80" cy="62" r="12" fill="#8F6518" />
      <circle cx="80" cy="62" r="8.5" fill="none" stroke="#C9A24E" strokeWidth="1" />
      <text x="80" y="66" textAnchor="middle" fontFamily="'Playfair Display', serif" fontSize="9" fontStyle="italic" fill="#F6E7C4">
        GE
      </text>
    </svg>
  )
}

function GuestJourney({ qrDataUrl }: { qrDataUrl: string }) {
  const visuals: ReactNode[] = [
    <MiniEnvelope key="envelope" />,
    <div key="sheet" className="w-[62%] shadow-[0_14px_30px_-16px_rgba(26,24,21,0.45)]">
      <TemplatePreview templateKey="heritage-luxe" />
    </div>,
    <div key="rsvp" className="w-[82%] rounded-md border border-line bg-surface px-4 py-4 text-left">
      <p className="text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-brand">{COPY.hero.rsvpTitle}</p>
      <div className="mt-3 rounded-sm bg-ink px-3 py-2 text-center text-[0.75rem] font-medium text-white">
        {COPY.hero.rsvpStatus}
      </div>
      <div className="mt-2.5 space-y-1.5">
        <div className="h-1.5 w-4/5 rounded-full bg-line" />
        <div className="h-1.5 w-3/5 rounded-full bg-line" />
      </div>
    </div>,
    <div key="access" className="flex w-[70%] flex-col items-center rounded-md border border-line bg-surface px-4 py-4">
      {qrDataUrl ? <img src={qrDataUrl} alt="" className="h-20 w-20" /> : <span className="h-20 w-20 bg-surface-muted" />}
      <span className="mt-2.5 inline-flex items-center gap-1.5 text-[0.6875rem] font-medium text-ink-soft">
        <IconCalendar className="h-3.5 w-3.5" />
        {COPY.guest.calendar}
      </span>
    </div>,
  ]
  return (
    <section aria-labelledby="invite-titre" className="border-b border-line bg-surface">
      <div className={`${WRAP} ${SECTION_Y}`}>
        <SectionHeader id="invite-titre" eyebrow={COPY.guest.eyebrow} title={COPY.guest.title} lead={COPY.guest.subtitle} />
        <ol className="-mx-5 mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-5 px-5 pb-4 [scrollbar-width:thin] sm:mx-0 sm:mt-14 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-12 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
          {COPY.guest.steps.map((step, index) => (
            <li key={step.title} className="w-[80%] shrink-0 snap-start sm:w-auto">
              <div className="flex aspect-[4/3.4] items-center justify-center overflow-hidden rounded-lg border border-line bg-paper">
                {visuals[index]}
              </div>
              <p className="mt-6 font-brand text-[1.5rem] font-semibold leading-none text-gold [font-variant-numeric:lining-nums]" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </p>
              <h3 className="mt-3 font-brand text-[1.375rem] font-semibold leading-tight text-ink">{step.title}</h3>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* --------------------------------------------------------------- features */

/** Miniature of the real « Envoyer l'invitation » dialog. */
function SendDialogMiniature() {
  return (
    <div className="rounded-lg border border-line bg-surface p-5 shadow-[0_24px_50px_-28px_rgba(26,24,21,0.4)]" aria-hidden="true">
      <p className="text-[0.875rem] font-semibold text-ink">{COPY.illustration.dialogTitle}</p>
      <p className="text-[0.75rem] text-ink-soft">{COPY.illustration.dialogFor}</p>
      <div className="mt-4 grid grid-cols-3 gap-1 rounded-md bg-surface-muted p-1 text-[0.75rem]">
        <span className="flex items-center justify-center gap-1.5 rounded-sm py-1.5 text-ink-soft">
          <IconChat className="h-3.5 w-3.5" />
          WhatsApp
        </span>
        <span className="flex items-center justify-center gap-1.5 rounded-sm bg-surface py-1.5 font-medium text-ink shadow-xs">
          <IconMail className="h-3.5 w-3.5" />
          E-mail
        </span>
        <span className="flex items-center justify-center rounded-sm py-1.5 text-ink-soft">{COPY.illustration.tabLink}</span>
      </div>
      <div className="mt-4 space-y-2.5">
        <div className="rounded-md border border-line px-3 py-2 text-[0.75rem] text-ink">{COPY.illustration.email}</div>
        <div className="space-y-1.5 rounded-md border border-line px-3 py-2.5">
          <div className="h-1.5 w-11/12 rounded-full bg-line" />
          <div className="h-1.5 w-4/5 rounded-full bg-line" />
          <div className="h-1.5 w-2/3 rounded-full bg-line" />
        </div>
        <div className="flex items-center gap-2 rounded-md border border-line bg-surface-muted/60 px-3 py-2 text-[0.75rem] text-ink">
          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-[3px] bg-brand text-white">
            <IconCheck className="h-3 w-3" />
          </span>
          {COPY.illustration.attachPdf}
        </div>
      </div>
      <div className="mt-4 rounded-md bg-ink py-2 text-center text-[0.75rem] font-medium text-white">{COPY.illustration.sendEmail}</div>
    </div>
  )
}

function Features() {
  return (
    <section id="fonctionnalites" aria-labelledby="avantages-titre" className="scroll-mt-16 border-b border-line">
      <div className={`grid gap-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20 ${WRAP} ${SECTION_Y}`}>
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeader id="avantages-titre" eyebrow={COPY.nav.features} title={COPY.benefits.title} lead={COPY.benefits.subtitle} />
          <div className="mt-10 hidden max-w-[24rem] sm:block">
            <SendDialogMiniature />
          </div>
        </div>
        <ul className="divide-y divide-line border-y border-line">
          {COPY.benefits.items.map((item, index) => {
            const Icon = FEATURE_ICONS[index % FEATURE_ICONS.length]
            return (
              <li key={item.title} className="grid grid-cols-[2.25rem_1fr] gap-x-4 py-7 sm:py-8">
                <Icon className="mt-0.5 h-5 w-5 text-brand" />
                <div>
                  <h3 className="font-brand text-[1.375rem] font-semibold leading-tight text-ink">{item.title}</h3>
                  <p className="mt-2 max-w-[34rem] text-[0.9375rem] leading-relaxed text-ink-soft">{item.text}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------ how it works */

function HowItWorks() {
  return (
    <section id="fonctionnement" aria-labelledby="fonctionnement-titre" className="scroll-mt-16 border-b border-line bg-surface">
      <div className={`${WRAP} ${SECTION_Y}`}>
        <SectionHeader id="fonctionnement-titre" title={COPY.howItWorks.title} lead={COPY.howItWorks.subtitle} />
        <ol className="relative mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {/* The timeline rule behind the step markers (desktop). */}
          <span aria-hidden="true" className="absolute left-0 right-0 top-[0.6875rem] hidden h-px bg-line-strong lg:block" />
          {COPY.howItWorks.steps.map((step, index) => (
            <li key={step.title} className="relative">
              <span className="relative flex items-center gap-3">
                <span aria-hidden="true" className="h-[1.375rem] w-[1.375rem] rounded-full border border-brand bg-surface p-[5px]">
                  <span className="block h-full w-full rounded-full bg-brand" />
                </span>
                <span className="font-brand text-[1.5rem] font-semibold leading-none text-gold [font-variant-numeric:lining-nums]">{String(index + 1).padStart(2, '0')}</span>
              </span>
              <h3 className="mt-5 font-brand text-[1.375rem] font-semibold leading-tight text-ink">{step.title}</h3>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">{step.text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-14">
          <Link to="/inscription" className={buttonClasses('primary', 'lg', 'gap-2')}>
            {COPY.finalCta.button}
            <IconArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------- showcase */

function Showcase() {
  const categories = useMemo(() => {
    const seen = new Map<string, string>()
    for (const template of TEMPLATES) if (!seen.has(template.category)) seen.set(template.category, template.categoryLabel)
    return Array.from(seen.entries())
  }, [])
  // The whole collection, curated pieces first, then the rest in catalog order.
  const ordered = useMemo(() => {
    const featured = FEATURED_KEYS.map((key) => getTemplate(key)).filter(
      (template): template is NonNullable<typeof template> => Boolean(template),
    )
    return [...featured, ...TEMPLATES.filter((template) => !FEATURED_KEYS.includes(template.key))]
  }, [])
  const [category, setCategory] = useState<string | null>(null)
  const shown = category ? ordered.filter((template) => template.category === category) : ordered

  const trackRef = useRef<HTMLUListElement>(null)
  const [edges, setEdges] = useState({ start: true, end: false })
  const updateEdges = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const max = track.scrollWidth - track.clientWidth
    setEdges({ start: track.scrollLeft <= 4, end: track.scrollLeft >= max - 4 })
  }, [])
  useEffect(() => {
    const track = trackRef.current
    if (!track) return undefined
    track.scrollLeft = 0
    updateEdges()
    if (typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(updateEdges)
    observer.observe(track)
    return () => observer.disconnect()
  }, [category, updateEdges])

  /** Page by what is visible, snapping lands each card cleanly. */
  const page = (direction: 1 | -1) => {
    const track = trackRef.current
    if (!track) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    track.scrollBy({ left: direction * track.clientWidth * 0.9, behavior: reduce ? 'auto' : 'smooth' })
  }

  const chip = (selected: boolean) =>
    `shrink-0 rounded-sm border px-3.5 py-2 text-[0.8125rem] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
      selected ? 'border-ink bg-ink text-white' : 'border-line bg-surface text-ink-soft hover:border-line-strong hover:text-ink'
    }`
  const arrow =
    'flex h-11 w-11 items-center justify-center rounded-full border border-line-strong bg-surface text-ink transition-colors hover:border-ink disabled:cursor-default disabled:opacity-35 disabled:hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40'

  return (
    <section id="modeles" aria-labelledby="modeles-titre" className="scroll-mt-16 overflow-hidden border-b border-line">
      <div className={`${WRAP} ${SECTION_Y}`}>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeader id="modeles-titre" eyebrow={COPY.showcase.eyebrow} title={COPY.showcase.title} lead={COPY.showcase.subtitle} />
          <div className="hidden shrink-0 items-center gap-3 sm:flex">
            <button type="button" className={arrow} onClick={() => page(-1)} disabled={edges.start} aria-label={COPY.showcase.previous}>
              <IconArrowRight className="h-4 w-4 rotate-180" />
            </button>
            <button type="button" className={arrow} onClick={() => page(1)} disabled={edges.end} aria-label={COPY.showcase.next}>
              <IconArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div role="group" aria-label={COPY.showcase.filterLabel} className="-mx-5 mt-10 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
          <button type="button" aria-pressed={category === null} className={chip(category === null)} onClick={() => setCategory(null)}>
            {COPY.showcase.all}
          </button>
          {categories.map(([key, label]) => (
            <button key={key} type="button" aria-pressed={category === key} className={chip(category === key)} onClick={() => setCategory(key)}>
              {label}
            </button>
          ))}
        </div>

        {/* Horizontal collection: swipe on phones, arrows or keyboard on
            desktop. The track bleeds to the screen edge so the next card
            always peeks in, signalling there is more to see. */}
        <ul
          ref={trackRef}
          onScroll={updateEdges}
          tabIndex={0}
          aria-label={COPY.showcase.trackLabel}
          className="-mx-5 mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-5 px-5 pb-6 [scrollbar-width:thin] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 sm:-mx-8 sm:gap-7 sm:scroll-px-8 sm:px-8 lg:-mx-10 lg:scroll-px-10 lg:px-10"
        >
          {shown.map((template) => (
            <li
              key={template.key}
              className="group w-[78%] shrink-0 snap-start [contain-intrinsic-size:auto_34rem] [content-visibility:auto] sm:w-[42%] lg:w-[29%] xl:w-[27%]"
            >
              <div className="overflow-hidden rounded-sm border border-line shadow-[0_1px_2px_rgba(26,24,21,0.05)] transition-shadow duration-300 group-hover:shadow-[0_24px_48px_-24px_rgba(26,24,21,0.35)]">
                <TemplatePreview templateKey={template.key} />
              </div>
              <div className="mt-5 flex items-baseline justify-between gap-3">
                <h3 className="font-brand text-[1.625rem] font-semibold leading-tight text-ink">{template.name}</h3>
                <span className="shrink-0 text-[0.6875rem] uppercase tracking-[0.12em] text-ink-faint">{template.categoryLabel}</span>
              </div>
              <p className="mt-2 text-[0.875rem] leading-relaxed text-ink-soft">{template.description}</p>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col items-start gap-5 border-t border-line pt-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-[30rem] text-[0.9375rem] text-ink-soft">
            {COPY.showcase.more.replace('{count}', String(TEMPLATES.length))}
          </p>
          <Link to="/inscription" className={buttonClasses('primary', 'lg', 'h-auto! min-h-11 w-full justify-center gap-2 whitespace-normal! py-3 text-center leading-snug sm:w-auto')}>
            {COPY.showcase.cta}
            <IconArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------- occasions */

function Occasions() {
  return (
    <section id="occasions" aria-labelledby="occasions-titre" className="scroll-mt-16 border-b border-line bg-surface">
      <div className={`grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20 ${WRAP} ${SECTION_Y}`}>
        <SectionHeader id="occasions-titre" title={COPY.categories.title} lead={COPY.categories.subtitle} />
        <ul className="grid border-t border-line sm:grid-cols-2 sm:gap-x-10">
          {COPY.categories.items.map((category) => (
            <li key={category.name} className="border-b border-line py-5">
              <h3 className="font-brand text-[1.625rem] font-semibold leading-tight text-ink">{category.name}</h3>
              <p className="mt-1 text-[0.875rem] text-ink-soft">{category.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------ verification */

function Verification({ qrDataUrl }: { qrDataUrl: string }) {
  return (
    <section id="verification" aria-labelledby="verification-titre" className="scroll-mt-16 border-b border-line">
      <div className={`grid items-center gap-14 lg:grid-cols-2 lg:gap-20 ${WRAP} ${SECTION_Y}`}>
        <div>
          <SectionHeader id="verification-titre" eyebrow={COPY.verification.eyebrow} title={COPY.verification.title} lead={COPY.verification.text} />
          <ul className="mt-8 space-y-4">
            {COPY.verification.points.map((point) => (
              <li key={point} className="flex items-start gap-3 text-[0.9375rem] leading-relaxed text-ink-soft">
                <IconCheck className="mt-1 h-4 w-4 shrink-0 text-brand" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* The door: the printed QR and the verdict the scanner returns. */}
        <figure className="canvas-grid relative mx-auto flex w-full max-w-[28rem] flex-col items-center rounded-xl border border-line px-6 py-12 sm:px-10">
          <div className="rounded-md border border-line bg-surface p-5 shadow-[0_24px_50px_-28px_rgba(26,24,21,0.45)]">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt={COPY.verification.qrAlt} className="h-44 w-44" />
            ) : (
              <div className="h-44 w-44 bg-surface-muted" aria-hidden="true" />
            )}
          </div>
          <div className="mt-6 flex w-full max-w-[17rem] items-center gap-3 rounded-md border border-success/30 bg-success-soft px-4 py-3" aria-hidden="true">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success text-white">
              <IconCheck className="h-4 w-4" />
            </span>
            <span className="text-left">
              <span className="block text-[0.8125rem] font-semibold text-success">{COPY.illustration.verdict}</span>
              <span className="block text-[0.75rem] text-ink-soft">{COPY.illustration.verdictGuest}</span>
            </span>
          </div>
          <figcaption className="mt-5 text-[0.8125rem] text-ink-faint">{COPY.verification.qrCaption}</figcaption>
        </figure>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------- faq */

function Faq() {
  return (
    <section id="questions" aria-labelledby="questions-titre" className="scroll-mt-16 border-b border-line bg-surface">
      <div className={`grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20 ${WRAP} ${SECTION_Y}`}>
        <div>
          <SectionHeader id="questions-titre" eyebrow={COPY.faq.eyebrow} title={COPY.faq.title} />
          <p className="mt-5 text-[0.9375rem] leading-relaxed text-ink-soft">
            {COPY.footer.contact} :{' '}
            <a className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink" href={`mailto:${COPY.footer.contactEmail}`}>
              {COPY.footer.contactEmail}
            </a>
          </p>
        </div>
        <div className="border-t border-line">
          {COPY.faq.items.map((item, index) => (
            <details key={item.q} className="faq-item group border-b border-line" open={index === 0}>
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 [&::-webkit-details-marker]:hidden">
                <span className="font-brand text-[1.3125rem] font-semibold leading-snug text-ink">{item.q}</span>
                <span aria-hidden="true" className="relative mt-1.5 h-3 w-3 shrink-0">
                  <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-ink" />
                  <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-ink transition-transform duration-200 group-open:scale-y-0" />
                </span>
              </summary>
              <p className="-mt-1 max-w-[36rem] pb-6 text-[0.9375rem] leading-relaxed text-ink-soft">
                {item.a}
                {index === COPY.faq.items.length - 1 ? (
                  <>
                    {' '}
                    <Link to="/politique-de-confidentialite" className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                      {COPY.faq.privacyLink}
                    </Link>
                    .
                  </>
                ) : null}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------- final cta */

function FinalCta() {
  return (
    <section aria-labelledby="final-titre" className="bg-ink">
      <div className={`grid items-center gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] ${WRAP} py-20 sm:py-24`}>
        <div>
          <h2 id="final-titre" className="max-w-[34rem] text-balance font-brand text-[2.375rem] font-semibold leading-[1.02] tracking-[-0.01em] text-white sm:text-[3rem]">
            {COPY.finalCta.title}
          </h2>
          <p className="mt-5 max-w-[30rem] text-[1.0625rem] leading-relaxed text-white/70">{COPY.finalCta.text}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link to="/inscription" className={buttonClasses('secondary', 'lg', 'justify-center gap-2')}>
              {COPY.finalCta.button}
              <IconArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/connexion"
              className="inline-flex h-12 items-center justify-center rounded-md border border-white/25 px-6 text-[0.9375rem] font-medium text-white transition-colors hover:border-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              {COPY.finalCta.secondary}
            </Link>
          </div>
        </div>
        <LogoArtwork className="mx-auto w-[min(70vw,20rem)] opacity-95 lg:mr-0" />
      </div>
    </section>
  )
}

/* ----------------------------------------------------------------- footer */

function SiteFooter() {
  const columnTitle = 'font-label text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-ink'
  const link = 'text-[0.875rem] text-ink-soft transition-colors hover:text-ink'
  return (
    <footer className="bg-paper">
      <div className={`grid grid-cols-2 gap-x-8 gap-y-12 py-16 sm:grid-cols-3 lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))] lg:gap-10 ${WRAP}`}>
        <div className="col-span-2 sm:col-span-3 lg:col-span-1">
          <BrandLockup />
          <p className="mt-5 max-w-[22rem] text-[0.875rem] leading-relaxed text-ink-soft">{COPY.footer.description}</p>
          <p className="mt-4 font-brand text-[1.25rem] italic text-ink">{COPY.footer.tagline}</p>
        </div>
        <nav aria-label={COPY.footer.product}>
          <p className={columnTitle}>{COPY.footer.product}</p>
          <ul className="mt-5 space-y-3">
            {[
              ['modeles', COPY.nav.templates],
              ['fonctionnalites', COPY.nav.features],
              ['fonctionnement', COPY.nav.howItWorks],
              ['verification', COPY.nav.verification],
              ['questions', COPY.nav.faq],
            ].map(([href, label]) => (
              <li key={href}>
                <a className={link} href={`#${href}`}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label={COPY.footer.account}>
          <p className={columnTitle}>{COPY.footer.account}</p>
          <ul className="mt-5 space-y-3">
            <li>
              <Link className={link} to="/inscription">
                {COPY.nav.signup}
              </Link>
            </li>
            <li>
              <Link className={link} to="/connexion">
                {COPY.nav.login}
              </Link>
            </li>
          </ul>
        </nav>
        <div className="col-span-2 sm:col-span-1">
          <p className={columnTitle}>{COPY.footer.contact}</p>
          <ul className="mt-5 space-y-3">
            <li>
              <a className={link} href={`mailto:${COPY.footer.contactEmail}`}>
                {COPY.footer.contactEmail}
              </a>
            </li>
            <li>
              <a className={link} href={PUBLIC_SITE_URL}>
                {COPY.footer.site}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className={`flex flex-col gap-4 py-7 sm:flex-row sm:items-center sm:justify-between ${WRAP}`}>
          <p className="text-[0.8125rem] text-ink-faint">
            © {CURRENT_YEAR} {fr.appName}. {COPY.footer.rights}
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <LegalLinks />
            <a href="#contenu" className="text-xs text-ink-soft underline decoration-line-strong underline-offset-4 hover:text-ink">
              {COPY.footer.backToTop}
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ------------------------------------------------------------------- page */

export function LandingPage() {
  const qrDataUrl = useQrDataUrl(`${PUBLIC_SITE_URL}/`)
  return (
    <div className="min-h-svh bg-paper text-ink">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-40 focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        {COPY.nav.skipToContent}
      </a>
      <SiteHeader />
      <main id="contenu">
        <Hero qrDataUrl={qrDataUrl} />
        <FactsBand />
        <ProblemSolution />
        <GuestJourney qrDataUrl={qrDataUrl} />
        <Features />
        <HowItWorks />
        <Showcase />
        <Occasions />
        <Verification qrDataUrl={qrDataUrl} />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  )
}
