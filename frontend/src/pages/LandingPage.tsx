/**
 * Public marketing homepage (`/`).
 *
 * Art direction: an immersive stationery house. The hero is a dark, framed
 * stage — flowing ink-and-gold silk (a tiny WebGL shader), a giant
 * « Malaika » wordmark and the real invitation suite in 3D (envelope, card,
 * wax seal) that tilts with the pointer and rises as you scroll. The
 * collection is a 3D orbit of the real templates. Below, an editorial rhythm:
 * « • label » rails, two-tone serif headlines, big numerals, sections easing
 * in as they enter. Every invitation shown is the real template component
 * rendered from `sampleDraft`; no stock imagery, no invented customers,
 * prices or statistics (the facts band reads the template registry).
 *
 * Deliberately API-free and dependency-free (no 3D library) for a fast first
 * paint on mobile data. Rich motion runs only when the visitor allows it and
 * the device can afford it (see landing/motion); every effect has a finished
 * still state.
 */
import { Fragment, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import QRCode from 'qrcode'

import { LegalLinks } from '../components/LegalLinks.tsx'
import { InvitationScene } from '../landing/InvitationScene.tsx'
import { useRichMotion } from '../landing/motion.ts'
import { Reveal } from '../landing/Reveal.tsx'
import { SilkCanvas } from '../landing/SilkCanvas.tsx'
import { TemplateOrbit } from '../landing/TemplateOrbit.tsx'
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

/**
 * Splits a headline into an ink lead and a muted continuation — the
 * two-tone editorial voice (« L’élégance du papier, » / « sans ses
 * contraintes. »). Falls back to a single tone when there is no natural break.
 */
function twoTone(title: string): [string, string] {
  const match = title.match(/^(.{8,}?[,:;])\s+(.+)$/)
  return match ? [match[1], match[2]] : [title, '']
}

function SectionHeader({
  id,
  eyebrow,
  title,
  lead,
  wide = false,
  className = '',
}: {
  id: string
  eyebrow?: string
  title: string
  lead?: string
  /** Full-width sections set the label in a left rail, as an editorial page. */
  wide?: boolean
  className?: string
}) {
  const [head, tail] = twoTone(title)
  const label = eyebrow ? (
    <p className="flex items-center gap-2.5 text-[0.8125rem] font-medium text-ink-soft">
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-ink" />
      {eyebrow}
    </p>
  ) : null
  const body = (
    <>
      <h2 id={id} className={H2}>
        {head}
        {tail ? (
          <>
            {' '}
            <span className="text-ink-faint">{tail}</span>
          </>
        ) : null}
      </h2>
      {lead ? <p className={`mt-5 max-w-[38rem] ${LEAD}`}>{lead}</p> : null}
    </>
  )
  if (wide) {
    return (
      <div className={`grid gap-5 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-10 ${className}`}>
        <div className="lg:pt-3">{label}</div>
        <div className="max-w-[48rem]">{body}</div>
      </div>
    )
  }
  return (
    <div className={`max-w-[40rem] ${className}`}>
      {label}
      <div className={label ? 'mt-5' : ''}>{body}</div>
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

  // A floating glass pill, legible over the dark hero and the paper below.
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-5">
      <div className="pointer-events-auto mx-auto max-w-[64rem] rounded-[22px] border border-white/10 bg-[#120F0C]/72 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.7)] backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between gap-6 pl-4 pr-2 sm:pl-5">
          <Link to="/" aria-label={fr.appName} className="shrink-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60">
            <BrandLockup dark />
          </Link>

          <nav aria-label={COPY.nav.ariaLabel} className="hidden items-center gap-7 whitespace-nowrap xl:flex">
            {NAV_LINKS.map(([href, label]) => (
              <a
                key={href}
                href={`#${href}`}
                className="text-[0.875rem] text-white/65 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            {/* Wrapped: buttonClasses sets its own display, which would win over `hidden`. */}
            <span className="hidden items-center gap-1.5 whitespace-nowrap sm:flex">
              <Link
                to="/connexion"
                className="inline-flex h-10 items-center rounded-[14px] px-4 text-[0.875rem] font-medium text-white/80 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
              >
                {COPY.nav.login}
              </Link>
              <Link
                to="/inscription"
                className="inline-flex h-10 items-center rounded-[14px] bg-[#F4EAD8] px-4 text-[0.875rem] font-semibold text-ink transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
              >
                {COPY.nav.signup}
              </Link>
            </span>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-[14px] text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 xl:hidden"
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
          <div id="menu-mobile" className="border-t border-white/10 xl:hidden">
            <nav aria-label={COPY.nav.ariaLabel} className="flex flex-col px-5 py-3">
              {NAV_LINKS.map(([href, label]) => (
                <a
                  key={href}
                  href={`#${href}`}
                  onClick={() => setOpen(false)}
                  className="border-b border-white/10 py-3.5 font-brand text-[1.625rem] font-semibold text-white"
                >
                  {label}
                </a>
              ))}
              <div className="mt-5 grid grid-cols-2 gap-3 pb-3">
                <Link to="/connexion" className="inline-flex h-11 items-center justify-center rounded-[14px] border border-white/20 text-[0.9375rem] font-medium text-white">
                  {COPY.nav.login}
                </Link>
                <Link to="/inscription" className="inline-flex h-11 items-center justify-center rounded-[14px] bg-[#F4EAD8] text-[0.9375rem] font-semibold text-ink">
                  {COPY.nav.signup}
                </Link>
              </div>
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  )
}

/* -------------------------------------------------------------------- hero */

/** Ivory product chip floating in the hero's 3D suite. */
function SuiteChip({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`rounded-[14px] bg-[#FBF7F0] px-4 py-3.5 text-ink max-sm:[zoom:0.8] shadow-[0_2px_4px_rgba(0,0,0,0.2),0_30px_50px_-20px_rgba(0,0,0,0.75)] ${className}`}>
      {children}
    </div>
  )
}

/** Headline words rising one after another out of their own line. */
function RisingWords({ text, startMs, className = '' }: { text: string; startMs: number; className?: string }) {
  return (
    <>
      {text.split(' ').map((word, index, words) => (
        <Fragment key={`${word}-${index}`}>
          <span className="word-mask">
            <span className={`word-rise ${className}`} style={{ ['--word-delay' as string]: `${startMs + index * 70}ms` }}>
              {word}
            </span>
          </span>
          {index < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </>
  )
}

function Hero({ qrDataUrl }: { qrDataUrl: string }) {
  const rich = useRichMotion()
  const [lead, rest] = useMemo(() => {
    const words = COPY.hero.title.split(' ')
    return [words.slice(0, 3).join(' '), words.slice(3).join(' ')]
  }, [])
  const chips = [
    {
      key: 'rsvp',
      depth: 90,
      style: { left: '-6%', top: '30%', width: '46%' },
      content: (
        <SuiteChip>
          <p className="text-[0.5625rem] font-semibold uppercase tracking-[0.18em] text-brand sm:text-[0.625rem]">{COPY.hero.rsvpTitle}</p>
          <p className="mt-1.5 text-[0.8125rem] font-medium">{COPY.hero.rsvpGuest}</p>
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-[8px] bg-success-soft px-2 py-1 text-[0.6875rem] font-medium text-success sm:text-[0.75rem]">
            <IconCheck className="h-3.5 w-3.5" />
            {COPY.hero.rsvpStatus}
          </p>
        </SuiteChip>
      ),
    },
    {
      key: 'access',
      depth: 120,
      style: { right: '-5%', top: '10%', width: '30%' },
      content: (
        <SuiteChip className="flex flex-col items-center px-3 text-center">
          <p className="whitespace-nowrap text-[0.5625rem] font-semibold uppercase tracking-[0.14em] text-brand sm:text-[0.625rem]">{COPY.hero.accessTitle}</p>
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="" className="mt-2 aspect-square w-full max-w-[5.5rem]" />
          ) : (
            <span className="mt-2 block aspect-square w-full max-w-[5.5rem] bg-surface-muted" aria-hidden="true" />
          )}
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-[0.6875rem] font-medium sm:text-[0.75rem]">
            <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
            {COPY.hero.accessStatus}
          </p>
        </SuiteChip>
      ),
    },
    {
      key: 'sent',
      depth: 60,
      style: { right: '2%', bottom: '6%' },
      content: (
        <SuiteChip className="flex items-center gap-2 whitespace-nowrap py-2.5">
          <IconChat className="h-4 w-4 text-success" />
          <span className="text-[0.75rem] font-medium">{COPY.hero.sentLabel}</span>
        </SuiteChip>
      ),
    },
  ]

  return (
    <section aria-labelledby="hero-titre" className="relative px-2.5 pt-2.5 sm:px-3 sm:pt-3">
      <div className="relative isolate overflow-hidden rounded-[22px] bg-[#0B0907] text-white sm:rounded-[30px]">
        {/* Living backdrop, with a finished gradient underneath. */}
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(120%_80%_at_75%_20%,#3A2A17_0%,#140F0A_45%,#0B0907_100%)]">
          <SilkCanvas animate={rich} />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(11,9,7,0.15)_0%,transparent_30%,transparent_65%,rgba(11,9,7,0.75)_100%)]" />

        <div className="mx-auto w-full max-w-[84rem] px-5 pb-10 pt-24 sm:px-10 sm:pt-28 lg:px-14 lg:pb-14">
          {/* The giant wordmark, set like a magazine masthead. */}
          <p aria-hidden="true" className="landing-rise relative select-none font-brand font-semibold leading-[0.78] tracking-[-0.035em] text-[#F4EAD8] text-[clamp(4.4rem,17.5vw,15.5rem)]">
            Malaika
            <span className="absolute -bottom-[0.18em] right-[0.02em] font-label text-[clamp(0.75rem,1.6vw,1.15rem)] font-semibold tracking-[0.42em] text-gold sm:right-[0.06em]">
              EVENTS
            </span>
          </p>

          <div className="mt-12 grid items-end gap-14 lg:mt-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-10">
            <div className="max-w-[34rem] pb-2">
              <p className="landing-rise flex items-center gap-2.5 text-[0.8125rem] font-medium text-white/65" style={{ ['--rise-delay' as string]: '200ms' }}>
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-gold" />
                {COPY.hero.eyebrow}
              </p>
              <h1 id="hero-titre" className="mt-5 font-brand text-[2.6rem] font-semibold leading-[1.02] tracking-[-0.015em] sm:text-[3.4rem] lg:text-[3.75rem]">
                <span className="sr-only">{COPY.hero.title}</span>
                <span aria-hidden="true">
                  <RisingWords text={lead} startMs={260} className="text-[#F8F1E4]" />{' '}
                  <RisingWords text={rest} startMs={470} className="text-[#C9A867]" />
                </span>
              </h1>
              <p className="landing-rise mt-6 max-w-[30rem] text-[1.0625rem] leading-relaxed text-white/70" style={{ ['--rise-delay' as string]: '700ms' }}>
                {COPY.hero.text}
              </p>
              <div className="landing-rise mt-9 flex flex-col gap-3 sm:flex-row sm:items-center" style={{ ['--rise-delay' as string]: '820ms' }}>
                <Link
                  to="/inscription"
                  className="group inline-flex h-[3.25rem] items-center justify-center gap-3 rounded-[16px] bg-[#F4EAD8] pl-6 pr-2 text-[0.9375rem] font-semibold text-ink transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
                >
                  {COPY.hero.signupCta}
                  <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-ink text-white transition-transform group-hover:translate-x-0.5">
                    <IconArrowRight className="h-4 w-4" />
                  </span>
                </Link>
                <a
                  href="#modeles"
                  className="inline-flex h-[3.25rem] items-center justify-center rounded-[16px] border border-white/20 px-6 text-[0.9375rem] font-medium text-white transition-colors hover:border-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
                >
                  {COPY.hero.secondaryCta}
                </a>
              </div>
              <p className="landing-rise mt-6 text-[0.875rem] text-white/55" style={{ ['--rise-delay' as string]: '900ms' }}>
                {COPY.hero.loginPrompt}{' '}
                <Link to="/connexion" className="font-medium text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">
                  {COPY.hero.primaryCta}
                </Link>
              </p>
            </div>

            <div className="landing-rise relative mx-auto w-[86%] max-w-[29rem] lg:mr-6 lg:w-full" style={{ ['--rise-delay' as string]: '300ms' }}>
              <InvitationScene
                animate={rich}
                label={COPY.hero.stageLabel}
                card={<TemplatePreview templateKey="floraison" />}
                chips={chips}
              />
            </div>
          </div>

          <div className="mt-10 flex items-center justify-between border-t border-white/10 pt-5 text-[0.75rem] text-white/45">
            <span>{COPY.hero.footnote}</span>
            <a href="#modeles" className="inline-flex items-center gap-2 text-white/60 transition-colors hover:text-white">
              <span aria-hidden="true" className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold motion-reduce:animate-none" />
              {COPY.hero.scroll}
            </a>
          </div>
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
    <section aria-label={COPY.facts.ariaLabel} className="border-b border-line">
      <dl className={`grid grid-cols-2 lg:grid-cols-4 ${WRAP}`}>
        {facts.map(([value, label], index) => (
          <div
            key={label}
            className={`py-8 pr-4 sm:py-10 ${index % 2 === 1 ? 'pl-5 sm:pl-8' : ''} ${index > 0 ? 'lg:pl-8' : ''} ${index % 2 === 1 ? 'border-l border-line' : ''} ${index === 2 ? 'border-t border-line lg:border-l lg:border-t-0' : ''} ${index === 3 ? 'border-t border-line lg:border-t-0' : ''}`}
          >
            <dt className="sr-only">{label}</dt>
            <dd>
              <span className="block font-brand text-[3.5rem] font-semibold leading-none tracking-[-0.02em] text-ink [font-variant-numeric:lining-nums] sm:text-[4.5rem]">{value}</span>
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
        <Reveal>
          <SectionHeader wide id="pourquoi-titre" eyebrow={COPY.problem.eyebrow} title={COPY.problem.title} />
        </Reveal>
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
        <Reveal>
          <SectionHeader wide id="invite-titre" eyebrow={COPY.guest.eyebrow} title={COPY.guest.title} lead={COPY.guest.subtitle} />
        </Reveal>
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
        <Reveal>
          <SectionHeader wide id="fonctionnement-titre" eyebrow={COPY.howItWorks.eyebrow} title={COPY.howItWorks.title} lead={COPY.howItWorks.subtitle} />
        </Reveal>
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
  const rich = useRichMotion()
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
  const shown = useMemo(
    () =>
      (category ? ordered.filter((template) => template.category === category) : ordered).map((template) => ({
        key: template.key,
        name: template.name,
        categoryLabel: template.categoryLabel,
        description: template.description,
      })),
    [category, ordered],
  )

  const chip = (selected: boolean) =>
    `shrink-0 rounded-full border px-4 py-2 text-[0.8125rem] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
      selected ? 'border-ink bg-ink text-white' : 'border-line bg-surface text-ink-soft hover:border-line-strong hover:text-ink'
    }`

  return (
    <section id="modeles" aria-labelledby="modeles-titre" className="scroll-mt-24 overflow-hidden border-b border-line">
      <div className={`${WRAP} ${SECTION_Y}`}>
        <Reveal>
          <SectionHeader wide id="modeles-titre" eyebrow={COPY.showcase.eyebrow} title={COPY.showcase.title} lead={COPY.showcase.subtitle} />
        </Reveal>

        <Reveal delay={100}>
          <div role="group" aria-label={COPY.showcase.filterLabel} className="-mx-5 mt-10 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 lg:ml-[14.5rem]">
            <button type="button" aria-pressed={category === null} className={chip(category === null)} onClick={() => setCategory(null)}>
              {COPY.showcase.all}
            </button>
            {categories.map(([key, label]) => (
              <button key={key} type="button" aria-pressed={category === key} className={chip(category === key)} onClick={() => setCategory(key)}>
                {label}
              </button>
            ))}
          </div>
        </Reveal>

        {/* The collection as a 3D orbit: drag, swipe, arrows or keyboard. */}
        <Reveal delay={160} className="mt-6">
          <TemplateOrbit
            items={shown}
            animate={rich}
            renderCard={(key) => <TemplatePreview templateKey={key} />}
            trackLabel={COPY.showcase.trackLabel}
            previousLabel={COPY.showcase.previous}
            nextLabel={COPY.showcase.next}
          />
          <p className="mt-3 text-[0.8125rem] text-ink-faint">{COPY.showcase.hint}</p>
        </Reveal>

        <div className="mt-12 flex flex-col items-start gap-5 border-t border-line pt-10 sm:flex-row sm:items-center sm:justify-between">
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
        <Reveal>
          <SectionHeader id="occasions-titre" eyebrow={COPY.categories.eyebrow} title={COPY.categories.title} lead={COPY.categories.subtitle} />
        </Reveal>
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
    <section aria-labelledby="final-titre" className="px-2.5 pb-2.5 sm:px-3 sm:pb-3">
      <div className="relative isolate overflow-hidden rounded-[22px] bg-[#0B0907] sm:rounded-[30px]">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(120%_90%_at_20%_80%,#3A2A17_0%,#140F0A_50%,#0B0907_100%)]">
          {/* One still frame of the same silk: the page closes as it opened. */}
          <SilkCanvas animate={false} />
        </div>
        <div className={`grid items-center gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] ${WRAP} py-20 sm:py-28`}>
          <Reveal>
            <h2 id="final-titre" className="max-w-[36rem] text-balance font-brand text-[2.6rem] font-semibold leading-[1.02] tracking-[-0.015em] text-[#F8F1E4] sm:text-[3.5rem]">
              {COPY.finalCta.title}
            </h2>
            <p className="mt-5 max-w-[30rem] text-[1.0625rem] leading-relaxed text-white/70">{COPY.finalCta.text}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/inscription"
                className="group inline-flex h-[3.25rem] items-center justify-center gap-3 rounded-[16px] bg-[#F4EAD8] pl-6 pr-2 text-[0.9375rem] font-semibold text-ink transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
              >
                {COPY.finalCta.button}
                <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-ink text-white transition-transform group-hover:translate-x-0.5">
                  <IconArrowRight className="h-4 w-4" />
                </span>
              </Link>
              <Link
                to="/connexion"
                className="inline-flex h-[3.25rem] items-center justify-center rounded-[16px] border border-white/20 px-6 text-[0.9375rem] font-medium text-white transition-colors hover:border-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
              >
                {COPY.finalCta.secondary}
              </Link>
            </div>
          </Reveal>
          <LogoArtwork className="mx-auto w-[min(70vw,20rem)] opacity-95 lg:mr-0" />
        </div>
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
      <main id="contenu" className="scroll-smooth">
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
