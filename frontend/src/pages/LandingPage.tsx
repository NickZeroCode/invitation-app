/**
 * Public marketing homepage (`/`).
 *
 * Brand: « Nuit & Champagne » — a night stationery house. Near-black lacquer,
 * bone-white type, champagne foil, an oxblood wax accent; Bodoni Moda for the
 * voice, Cormorant italic for the second breath of a headline, Montserrat
 * small caps for labels. The page reads as numbered chapters.
 *
 *  - Hero: a framed night stage — flowing ink-and-gold silk (a tiny WebGL
 *    shader), the giant « Malaika » masthead and the real invitation suite in
 *    3D (envelope, card, wax seal) that tilts with the pointer and rises as
 *    you scroll.
 *  - The collection: a flight through space — the camera travels down a
 *    corridor of the real templates as you scroll; any card opens in a 3D
 *    viewer where it can be turned over in the hand.
 *  - One bone-paper chapter (the guest's experience) and the product
 *    miniatures are light objects set in the night.
 *
 * Every invitation shown is the real template component rendered from
 * `sampleDraft`; no stock imagery, no invented customers, prices or
 * statistics (the facts band reads the template registry). API-free and
 * without a 3D library, for a fast first paint on mobile data; rich motion
 * runs only when the visitor allows it and the device can afford it (see
 * landing/motion), and every effect has a finished still state.
 */
import '@fontsource/bodoni-moda/400.css'
import '@fontsource/bodoni-moda/400-italic.css'
import '@fontsource/bodoni-moda/500.css'

import { Fragment, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import QRCode from 'qrcode'

import { LegalLinks } from '../components/LegalLinks.tsx'
import { InvitationScene } from '../landing/InvitationScene.tsx'
import { useRichMotion } from '../landing/motion.ts'
import { Reveal } from '../landing/Reveal.tsx'
import { SilkCanvas } from '../landing/SilkCanvas.tsx'
import { TemplateGallery } from '../landing/TemplateGallery.tsx'
import { TemplateViewer } from '../landing/TemplateViewer.tsx'
import {
  BrandLockup,
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
const WRAP = 'mx-auto w-full max-w-[80rem] px-5 sm:px-8 lg:px-12'
const SECTION_Y = 'py-24 sm:py-28 lg:py-36'
const H2 = 'text-balance font-didone text-[2.5rem] font-normal leading-[1.02] tracking-[-0.025em] text-ink sm:text-[3.25rem] lg:text-[4.25rem]'
const LEAD = 'text-[1.0625rem] leading-relaxed text-ink-soft'
const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne focus-visible:ring-offset-2 focus-visible:ring-offset-nuit'

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
      className={`aspect-[3/4] w-full overflow-hidden bg-[#F3EEE6] ${className}`}
      role="img"
      aria-label={definition ? `${fr.templates.previewLabel} : ${definition.name}` : fr.templates.previewLabel}
    >
      {definition ? <definition.Component draft={sampleDraft(templateKey)} /> : null}
    </div>
  )
}

/** The house call to action: a bone pill with an ink arrow tile. */
function PrimaryCta({ to, children, className = '' }: { to: string; children: ReactNode; className?: string }) {
  return (
    <Link
      to={to}
      className={`group inline-flex min-h-[3.25rem] items-center justify-center gap-3 rounded-full bg-bone py-1.5 pl-6 pr-1.5 text-center text-[0.9375rem] font-semibold leading-snug text-nuit transition-colors hover:bg-white ${FOCUS} ${className}`}
    >
      {children}
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-nuit text-bone transition-transform duration-300 group-hover:translate-x-0.5">
        <IconArrowRight className="h-4 w-4" />
      </span>
    </Link>
  )
}

function GhostCta({ to, href, children }: { to?: string; href?: string; children: ReactNode }) {
  const className = `inline-flex h-[3.25rem] items-center justify-center rounded-full border border-bone/25 px-6 text-[0.9375rem] font-medium text-bone transition-colors hover:border-champagne hover:text-champagne ${FOCUS}`
  return to ? (
    <Link to={to} className={className}>
      {children}
    </Link>
  ) : (
    <a href={href} className={className}>
      {children}
    </a>
  )
}

/**
 * Splits a headline into its first breath and the rest — set in Bodoni, then
 * in champagne Cormorant italic (« L’élégance du papier, » / « sans ses
 * contraintes. »). Falls back to a single voice without a natural break.
 */
function twoTone(title: string): [string, string] {
  const match = title.match(/^(.{8,}?[,:;])\s+(.+)$/)
  return match ? [match[1], match[2]] : [title, '']
}

function SectionHeader({
  id,
  chapter,
  eyebrow,
  title,
  lead,
  wide = false,
  className = '',
}: {
  id: string
  /** Chapter number, set like a book's: « 03 — L’expérience invité ». */
  chapter?: number
  eyebrow?: string
  title: string
  lead?: string
  /** Full-width sections set the label in a left rail, as an editorial page. */
  wide?: boolean
  className?: string
}) {
  const [head, tail] = twoTone(title)
  const label = eyebrow ? (
    <p className="flex items-center gap-3 font-label text-[0.6875rem] font-semibold uppercase tracking-[0.24em] text-ink-faint">
      {chapter ? <span className="text-champagne">{String(chapter).padStart(2, '0')}</span> : null}
      <span aria-hidden="true" className="h-px w-6 bg-line-strong" />
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
            <em className="font-brand text-[1.08em] font-medium italic tracking-[-0.01em] text-champagne">{tail}</em>
          </>
        ) : null}
      </h2>
      {lead ? <p className={`mt-6 max-w-[36rem] ${LEAD}`}>{lead}</p> : null}
    </>
  )
  if (wide) {
    return (
      <div className={`grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10 ${className}`}>
        <div className="lg:pt-4">{label}</div>
        <div className="max-w-[52rem]">{body}</div>
      </div>
    )
  }
  return (
    <div className={`max-w-[40rem] ${className}`}>
      {label}
      <div className={label ? 'mt-6' : ''}>{body}</div>
    </div>
  )
}

function useQrDataUrl(text: string): string {
  const [url, setUrl] = useState('')
  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(text, { width: 340, margin: 1, color: { dark: '#15120e', light: '#ffffff' } })
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

  // A floating lacquer pill, legible over the night and the bone chapter.
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-5">
      <div className="pointer-events-auto mx-auto max-w-[64rem] rounded-full border border-bone/10 bg-nuit/70 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.8)] backdrop-blur-xl max-xl:rounded-[26px]">
        <div className="flex h-14 items-center justify-between gap-6 pl-5 pr-2">
          <Link to="/" aria-label={fr.appName} className={`shrink-0 rounded-sm ${FOCUS}`}>
            <BrandLockup dark />
          </Link>

          <nav aria-label={COPY.nav.ariaLabel} className="hidden items-center gap-7 whitespace-nowrap xl:flex">
            {NAV_LINKS.map(([href, label]) => (
              <a key={href} href={`#${href}`} className={`text-[0.875rem] text-bone/60 transition-colors hover:text-bone ${FOCUS}`}>
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <span className="hidden items-center gap-1.5 whitespace-nowrap sm:flex">
              <Link to="/connexion" className={`inline-flex h-10 items-center rounded-full px-4 text-[0.875rem] font-medium text-bone/80 transition-colors hover:text-bone ${FOCUS}`}>
                {COPY.nav.login}
              </Link>
              <Link to="/inscription" className={`inline-flex h-10 items-center rounded-full bg-bone px-5 text-[0.875rem] font-semibold text-nuit transition-colors hover:bg-white ${FOCUS}`}>
                {COPY.nav.signup}
              </Link>
            </span>
            <button
              type="button"
              className={`flex h-10 w-10 items-center justify-center rounded-full text-bone transition-colors hover:bg-bone/10 xl:hidden ${FOCUS}`}
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
          <div id="menu-mobile" className="border-t border-bone/10 xl:hidden">
            <nav aria-label={COPY.nav.ariaLabel} className="flex flex-col px-5 py-3">
              {NAV_LINKS.map(([href, label]) => (
                <a key={href} href={`#${href}`} onClick={() => setOpen(false)} className="border-b border-bone/10 py-3.5 font-didone text-[1.625rem] text-bone">
                  {label}
                </a>
              ))}
              <div className="mt-5 grid grid-cols-2 gap-3 pb-3">
                <Link to="/connexion" className="inline-flex h-11 items-center justify-center rounded-full border border-bone/20 text-[0.9375rem] font-medium text-bone">
                  {COPY.nav.login}
                </Link>
                <Link to="/inscription" className="inline-flex h-11 items-center justify-center rounded-full bg-bone text-[0.9375rem] font-semibold text-nuit">
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
    <div className={`theme-bone rounded-[14px] bg-[#FBF7F0] px-4 py-3.5 text-ink max-sm:[zoom:0.8] shadow-[0_2px_4px_rgba(0,0,0,0.2),0_30px_50px_-20px_rgba(0,0,0,0.75)] ${className}`}>
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
      <div className="grain relative isolate overflow-hidden rounded-[24px] bg-[#0B0907] text-bone ring-1 ring-bone/5 sm:rounded-[32px]">
        {/* Living backdrop, with a finished gradient underneath. */}
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(120%_80%_at_75%_20%,#3A2A17_0%,#140F0A_45%,#0B0907_100%)]">
          <SilkCanvas animate={rich} />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(11,9,7,0.2)_0%,transparent_30%,transparent_62%,rgba(11,9,7,0.8)_100%)]" />

        <div className="mx-auto w-full max-w-[84rem] px-5 pb-10 pt-24 sm:px-10 sm:pt-28 lg:px-14 lg:pb-14">
          {/* The masthead. */}
          <p aria-hidden="true" className="landing-rise relative select-none font-didone font-normal leading-[0.8] tracking-[-0.045em] text-bone text-[clamp(4.2rem,18vw,16rem)]">
            Malaika
            <span className="absolute -bottom-[0.2em] right-[0.02em] font-label text-[clamp(0.7rem,1.5vw,1.1rem)] font-semibold tracking-[0.5em] text-champagne sm:right-[0.06em]">
              EVENTS
            </span>
          </p>

          <div className="mt-12 grid items-end gap-14 lg:mt-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-10">
            <div className="max-w-[35rem] pb-2">
              <p className="landing-rise flex items-center gap-3 font-label text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-bone/60" style={{ ['--rise-delay' as string]: '200ms' }}>
                <span aria-hidden="true" className="h-px w-6 bg-champagne" />
                {COPY.hero.eyebrow}
              </p>
              <h1 id="hero-titre" className="mt-6 font-didone text-[2.5rem] font-normal leading-[1.04] tracking-[-0.02em] sm:text-[3.3rem] lg:text-[3.75rem]">
                <span className="sr-only">{COPY.hero.title}</span>
                <span aria-hidden="true">
                  <RisingWords text={lead} startMs={260} className="text-bone" />{' '}
                  <RisingWords text={rest} startMs={470} className="font-brand text-[1.1em] font-medium italic text-champagne" />
                </span>
              </h1>
              <p className="landing-rise mt-6 max-w-[30rem] text-[1.0625rem] leading-relaxed text-bone/70" style={{ ['--rise-delay' as string]: '700ms' }}>
                {COPY.hero.text}
              </p>
              <div className="landing-rise mt-9 flex flex-col gap-3 sm:flex-row sm:items-center" style={{ ['--rise-delay' as string]: '820ms' }}>
                <PrimaryCta to="/inscription">{COPY.hero.signupCta}</PrimaryCta>
                <GhostCta href="#modeles">{COPY.hero.secondaryCta}</GhostCta>
              </div>
              <p className="landing-rise mt-6 text-[0.875rem] text-bone/55" style={{ ['--rise-delay' as string]: '900ms' }}>
                {COPY.hero.loginPrompt}{' '}
                <Link to="/connexion" className="font-medium text-bone underline decoration-bone/30 underline-offset-4 hover:decoration-champagne">
                  {COPY.hero.primaryCta}
                </Link>
              </p>
            </div>

            <div className="landing-rise relative mx-auto w-[86%] max-w-[29rem] lg:mr-6 lg:w-full" style={{ ['--rise-delay' as string]: '300ms' }}>
              <InvitationScene animate={rich} label={COPY.hero.stageLabel} card={<TemplatePreview templateKey="floraison" />} chips={chips} />
            </div>
          </div>

          <div className="mt-10 flex items-center justify-between gap-6 border-t border-bone/10 pt-5 text-[0.75rem] text-bone/45">
            <span>{COPY.hero.footnote}</span>
            <a href="#modeles" className="inline-flex shrink-0 items-center gap-2 text-bone/60 transition-colors hover:text-bone">
              <span aria-hidden="true" className="h-1.5 w-1.5 animate-pulse rounded-full bg-champagne motion-reduce:animate-none" />
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
    <section aria-label={COPY.facts.ariaLabel}>
      <dl className={`grid grid-cols-2 lg:grid-cols-4 ${WRAP}`}>
        {facts.map(([value, label], index) => (
          <div
            key={label}
            className={`py-10 pr-4 sm:py-14 ${index % 2 === 1 ? 'pl-5 sm:pl-8' : ''} ${index > 0 ? 'lg:pl-8' : ''} ${index % 2 === 1 ? 'border-l border-line' : ''} ${index === 2 ? 'border-t border-line lg:border-l lg:border-t-0' : ''} ${index === 3 ? 'border-t border-line lg:border-t-0' : ''}`}
          >
            <dt className="sr-only">{label}</dt>
            <dd>
              <span className="foil-text block font-didone text-[4rem] leading-none tracking-[-0.03em] [font-variant-numeric:lining-nums] sm:text-[5.5rem]">{value}</span>
              <span className="mt-4 block max-w-[14rem] text-[0.875rem] leading-snug text-ink-soft">{label}</span>
            </dd>
          </div>
        ))}
      </dl>
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
  const [viewing, setViewing] = useState<number | null>(null)
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
    `shrink-0 rounded-full border px-4 py-2 text-[0.8125rem] backdrop-blur-md transition-colors ${FOCUS} ${
      selected ? 'border-bone bg-bone text-nuit' : 'border-bone/15 bg-nuit/40 text-bone/70 hover:border-bone/40 hover:text-bone'
    }`

  const filters = (
    <div role="group" aria-label={COPY.showcase.filterLabel} className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0">
      <button type="button" aria-pressed={category === null} className={chip(category === null)} onClick={() => setCategory(null)}>
        {COPY.showcase.all}
      </button>
      {categories.map(([key, label]) => (
        <button key={key} type="button" aria-pressed={category === key} className={chip(category === key)} onClick={() => setCategory(key)}>
          {label}
        </button>
      ))}
    </div>
  )

  return (
    <section id="modeles" aria-labelledby="modeles-titre" className="relative scroll-mt-0">
      <div className={`${WRAP} pt-24 sm:pt-32 lg:pt-40`}>
        <Reveal>
          <SectionHeader wide chapter={1} id="modeles-titre" eyebrow={COPY.showcase.eyebrow} title={COPY.showcase.title} lead={COPY.showcase.subtitle} />
        </Reveal>
      </div>

      <div className="mt-10 sm:mt-14">
        <TemplateGallery
          items={shown}
          animate={rich}
          renderCard={(key) => <TemplatePreview templateKey={key} />}
          trackLabel={COPY.showcase.trackLabel}
          openLabel={COPY.showcase.openLabel}
          detailLabel={COPY.showcase.detail}
          scrollHint={COPY.showcase.scrollHint}
          backdropWord={COPY.showcase.backdrop}
          filters={filters}
          onOpen={setViewing}
        />
      </div>

      <div className={`${WRAP} pb-24 sm:pb-28`}>
        <div className="flex flex-col items-start gap-6 border-t border-line pt-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-[30rem] text-[0.9375rem] text-ink-soft">
            {COPY.showcase.more.replace('{count}', String(TEMPLATES.length))}
          </p>
          <PrimaryCta to="/inscription" className="w-full sm:w-auto">
            {COPY.showcase.cta}
          </PrimaryCta>
        </div>
      </div>

      {viewing !== null ? (
        <TemplateViewer
          items={shown}
          index={Math.min(viewing, shown.length - 1)}
          onIndex={setViewing}
          onClose={() => setViewing(null)}
          renderCard={(key) => <TemplatePreview templateKey={key} />}
          animate={rich}
          brand={fr.appName}
          labels={COPY.showcase.viewer}
        />
      ) : null}
    </section>
  )
}

/* ------------------------------------------------------- problem/solution */

function ProblemSolution() {
  return (
    <section aria-labelledby="pourquoi-titre" className="border-t border-line">
      <div className={`${WRAP} ${SECTION_Y}`}>
        <Reveal>
          <SectionHeader wide chapter={2} id="pourquoi-titre" eyebrow={COPY.problem.eyebrow} title={COPY.problem.title} />
        </Reveal>
        <div className="mt-16 grid gap-4 md:grid-cols-2 lg:ml-[16.5rem]">
          <Reveal className="rounded-[22px] border border-line p-7 sm:p-10">
            <h3 className="font-label text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-ink-faint">{COPY.problem.beforeTitle}</h3>
            <ul className="mt-7 space-y-5">
              {COPY.problem.before.map((item) => (
                <li key={item} className="flex gap-3.5 text-[0.9375rem] leading-relaxed text-ink-faint line-through decoration-ink-faint/40">
                  <span aria-hidden="true" className="mt-[0.7em] h-px w-3 shrink-0 bg-ink-faint" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={120} className="relative overflow-hidden rounded-[22px] border border-champagne/30 bg-[linear-gradient(160deg,rgba(200,169,106,0.14),rgba(200,169,106,0.03)_60%)] p-7 sm:p-10">
            <h3 className="font-label text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-champagne">{COPY.problem.afterTitle}</h3>
            <ul className="mt-7 space-y-5">
              {COPY.problem.after.map((item) => (
                <li key={item} className="flex gap-3.5 text-[0.9375rem] leading-relaxed text-ink">
                  <IconCheck className="mt-1 h-4 w-4 shrink-0 text-champagne" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
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
      <circle cx="80" cy="62" r="12" fill="#7A2331" />
      <circle cx="80" cy="62" r="8.5" fill="none" stroke="#C8A96A" strokeWidth="1" />
      <text x="80" y="66" textAnchor="middle" fontFamily="'Bodoni Moda', serif" fontSize="9" fontStyle="italic" fill="#F3D9A4">
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
    <div key="rsvp" className="w-[82%] rounded-[12px] border border-line bg-surface px-4 py-4 text-left">
      <p className="text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-brand">{COPY.hero.rsvpTitle}</p>
      <div className="mt-3 rounded-full bg-ink px-3 py-2 text-center text-[0.75rem] font-medium text-bone">{COPY.hero.rsvpStatus}</div>
      <div className="mt-2.5 space-y-1.5">
        <div className="h-1.5 w-4/5 rounded-full bg-line" />
        <div className="h-1.5 w-3/5 rounded-full bg-line" />
      </div>
    </div>,
    <div key="access" className="flex w-[70%] flex-col items-center rounded-[12px] border border-line bg-surface px-4 py-4">
      {qrDataUrl ? <img src={qrDataUrl} alt="" className="h-20 w-20" /> : <span className="h-20 w-20 bg-surface-muted" />}
      <span className="mt-2.5 inline-flex items-center gap-1.5 text-[0.6875rem] font-medium text-ink-soft">
        <IconCalendar className="h-3.5 w-3.5" />
        {COPY.guest.calendar}
      </span>
    </div>,
  ]
  // The one bone-paper chapter: the guest's side is held in the hand.
  return (
    <section aria-labelledby="invite-titre" className="px-2.5 sm:px-3">
      <div className="theme-bone grain overflow-hidden rounded-[24px] bg-paper text-ink sm:rounded-[32px]">
        <div className={`${WRAP} ${SECTION_Y}`}>
          <Reveal>
            <SectionHeader wide chapter={3} id="invite-titre" eyebrow={COPY.guest.eyebrow} title={COPY.guest.title} lead={COPY.guest.subtitle} />
          </Reveal>
          <ol className="-mx-5 mt-14 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-5 px-5 pb-4 [scrollbar-width:thin] sm:mx-0 sm:mt-16 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-14 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
            {COPY.guest.steps.map((step, index) => (
              <Reveal as="li" key={step.title} delay={index * 90} className="w-[80%] shrink-0 snap-start sm:w-auto">
                <div className="flex aspect-[4/3.4] items-center justify-center overflow-hidden rounded-[18px] bg-surface shadow-[0_1px_0_rgba(21,18,14,0.06),0_30px_60px_-40px_rgba(21,18,14,0.5)]">
                  {visuals[index]}
                </div>
                <p className="mt-7 font-didone text-[1.75rem] leading-none text-brand [font-variant-numeric:lining-nums]" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="mt-3 font-didone text-[1.375rem] leading-tight text-ink">{step.title}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">{step.text}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

/* --------------------------------------------------------------- features */

/** Miniature of the real « Envoyer l'invitation » dialog. */
function SendDialogMiniature() {
  return (
    <div className="theme-bone rounded-[18px] bg-surface p-5 text-ink shadow-[0_2px_6px_rgba(0,0,0,0.3),0_50px_80px_-30px_rgba(0,0,0,0.9)]" aria-hidden="true">
      <p className="text-[0.875rem] font-semibold">{COPY.illustration.dialogTitle}</p>
      <p className="text-[0.75rem] text-ink-soft">{COPY.illustration.dialogFor}</p>
      <div className="mt-4 grid grid-cols-3 gap-1 rounded-full bg-surface-muted p-1 text-[0.75rem]">
        <span className="flex items-center justify-center gap-1.5 rounded-full py-1.5 text-ink-soft">
          <IconChat className="h-3.5 w-3.5" />
          WhatsApp
        </span>
        <span className="flex items-center justify-center gap-1.5 rounded-full bg-surface py-1.5 font-medium shadow-xs">
          <IconMail className="h-3.5 w-3.5" />
          E-mail
        </span>
        <span className="flex items-center justify-center rounded-full py-1.5 text-ink-soft">{COPY.illustration.tabLink}</span>
      </div>
      <div className="mt-4 space-y-2.5">
        <div className="rounded-[10px] border border-line px-3 py-2 text-[0.75rem]">{COPY.illustration.email}</div>
        <div className="space-y-1.5 rounded-[10px] border border-line px-3 py-2.5">
          <div className="h-1.5 w-11/12 rounded-full bg-line" />
          <div className="h-1.5 w-4/5 rounded-full bg-line" />
          <div className="h-1.5 w-2/3 rounded-full bg-line" />
        </div>
        <div className="flex items-center gap-2 rounded-[10px] border border-line bg-surface-muted/60 px-3 py-2 text-[0.75rem]">
          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-[3px] bg-brand text-white">
            <IconCheck className="h-3 w-3" />
          </span>
          {COPY.illustration.attachPdf}
        </div>
      </div>
      <div className="mt-4 rounded-full bg-ink py-2.5 text-center text-[0.75rem] font-medium text-bone">{COPY.illustration.sendEmail}</div>
    </div>
  )
}

function Features() {
  return (
    <section id="fonctionnalites" aria-labelledby="avantages-titre" className="scroll-mt-16">
      <div className={`grid gap-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20 ${WRAP} ${SECTION_Y}`}>
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Reveal>
            <SectionHeader chapter={4} id="avantages-titre" eyebrow={COPY.nav.features} title={COPY.benefits.title} lead={COPY.benefits.subtitle} />
          </Reveal>
          {/* The real send dialog, as an object set at an angle on the desk. */}
          <div className="mt-12 hidden max-w-[23rem] sm:block [perspective:1200px]">
            <div className="[transform:rotateY(14deg)_rotateX(6deg)_rotateZ(-2deg)] transition-transform duration-700 hover:[transform:rotateY(4deg)_rotateX(2deg)]">
              <SendDialogMiniature />
            </div>
          </div>
        </div>
        <ul className="border-t border-line">
          {COPY.benefits.items.map((item, index) => {
            const Icon = FEATURE_ICONS[index % FEATURE_ICONS.length]
            return (
              <Reveal as="li" key={item.title} className="group grid grid-cols-[3rem_1fr] gap-x-5 border-b border-line py-8 sm:py-9">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-line-strong text-champagne transition-colors group-hover:border-champagne">
                  <Icon className="h-[1.125rem] w-[1.125rem]" />
                </span>
                <div>
                  <h3 className="font-didone text-[1.5rem] leading-tight text-ink">{item.title}</h3>
                  <p className="mt-2.5 max-w-[34rem] text-[0.9375rem] leading-relaxed text-ink-soft">{item.text}</p>
                </div>
              </Reveal>
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
    <section id="fonctionnement" aria-labelledby="fonctionnement-titre" className="scroll-mt-16 border-t border-line">
      <div className={`${WRAP} ${SECTION_Y}`}>
        <Reveal>
          <SectionHeader wide chapter={5} id="fonctionnement-titre" eyebrow={COPY.howItWorks.eyebrow} title={COPY.howItWorks.title} lead={COPY.howItWorks.subtitle} />
        </Reveal>
        <ol className="mt-16 grid gap-px overflow-hidden rounded-[22px] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {COPY.howItWorks.steps.map((step, index) => (
            <Reveal as="li" key={step.title} delay={index * 90} className="group relative bg-paper p-7 transition-colors hover:bg-surface sm:p-8">
              {/* Engraved numerals: outlined, filled with foil on hover. */}
              <span
                aria-hidden="true"
                className="block font-didone text-[5rem] leading-none text-transparent [-webkit-text-stroke:1px_rgba(200,169,106,0.6)] transition-colors duration-500 group-hover:text-champagne/90 [font-variant-numeric:lining-nums]"
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-10 font-didone text-[1.375rem] leading-tight text-ink">{step.title}</h3>
              <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-soft">{step.text}</p>
            </Reveal>
          ))}
        </ol>
        <div className="mt-14">
          <PrimaryCta to="/inscription">{COPY.finalCta.button}</PrimaryCta>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------- occasions */

function Occasions() {
  // A typographic index of occasions, set large like a programme.
  return (
    <section id="occasions" aria-labelledby="occasions-titre" className="scroll-mt-16 border-t border-line">
      <div className={`${WRAP} ${SECTION_Y}`}>
        <Reveal>
          <SectionHeader wide chapter={6} id="occasions-titre" eyebrow={COPY.categories.eyebrow} title={COPY.categories.title} lead={COPY.categories.subtitle} />
        </Reveal>
        <ul className="mt-16 border-t border-line lg:ml-[16.5rem]">
          {COPY.categories.items.map((category, index) => (
            <li key={category.name} className="group grid grid-cols-[2.5rem_minmax(0,1fr)] items-baseline gap-x-4 border-b border-line py-6 sm:grid-cols-[3rem_minmax(0,1.5fr)_minmax(0,1fr)] sm:gap-x-8 sm:py-7">
              <span className="font-label text-[0.6875rem] font-semibold tracking-[0.2em] text-ink-faint transition-colors group-hover:text-champagne">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="font-didone text-[1.75rem] leading-tight text-ink transition-transform duration-500 group-hover:translate-x-2 sm:text-[2.25rem]">{category.name}</h3>
              <p className="col-start-2 mt-1 font-brand text-[1.125rem] italic text-ink-soft sm:col-start-3 sm:mt-0">{category.text}</p>
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
    <section id="verification" aria-labelledby="verification-titre" className="scroll-mt-16 border-t border-line">
      <div className={`grid items-center gap-16 lg:grid-cols-2 lg:gap-20 ${WRAP} ${SECTION_Y}`}>
        <Reveal>
          <SectionHeader chapter={7} id="verification-titre" eyebrow={COPY.verification.eyebrow} title={COPY.verification.title} lead={COPY.verification.text} />
          <ul className="mt-9 space-y-4">
            {COPY.verification.points.map((point) => (
              <li key={point} className="flex items-start gap-3 text-[0.9375rem] leading-relaxed text-ink-soft">
                <IconCheck className="mt-1 h-4 w-4 shrink-0 text-champagne" />
                {point}
              </li>
            ))}
          </ul>
        </Reveal>

        {/* The door: the printed access card and the verdict the scanner returns. */}
        <figure className="relative mx-auto flex w-full max-w-[28rem] flex-col items-center [perspective:1200px]">
          <div aria-hidden="true" className="absolute inset-[-10%] rounded-full bg-[radial-gradient(closest-side,rgba(200,169,106,0.18),transparent)]" />
          <div className="theme-bone relative rounded-[20px] bg-surface p-6 text-ink shadow-[0_2px_6px_rgba(0,0,0,0.3),0_60px_90px_-40px_rgba(0,0,0,0.95)] [transform:rotateX(10deg)_rotateY(-12deg)_rotateZ(1.5deg)]">
            <p className="text-center font-label text-[0.625rem] font-semibold uppercase tracking-[0.24em] text-brand">{COPY.hero.accessTitle}</p>
            {qrDataUrl ? (
              <img src={qrDataUrl} alt={COPY.verification.qrAlt} className="mt-4 h-44 w-44" />
            ) : (
              <div className="mt-4 h-44 w-44 bg-surface-muted" aria-hidden="true" />
            )}
          </div>
          <div className="theme-bone relative -mt-6 ml-24 flex w-full max-w-[17rem] items-center gap-3 rounded-full bg-surface py-2.5 pl-2.5 pr-5 text-ink shadow-[0_30px_50px_-20px_rgba(0,0,0,0.9)] [transform:translateZ(60px)]" aria-hidden="true">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success text-white">
              <IconCheck className="h-4 w-4" />
            </span>
            <span className="text-left">
              <span className="block text-[0.8125rem] font-semibold text-success">{COPY.illustration.verdict}</span>
              <span className="block text-[0.75rem] text-ink-soft">{COPY.illustration.verdictGuest}</span>
            </span>
          </div>
          <figcaption className="relative mt-8 text-[0.8125rem] text-ink-faint">{COPY.verification.qrCaption}</figcaption>
        </figure>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------- faq */

function Faq() {
  return (
    <section id="questions" aria-labelledby="questions-titre" className="scroll-mt-16 border-t border-line">
      <div className={`grid gap-14 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20 ${WRAP} ${SECTION_Y}`}>
        <Reveal>
          <SectionHeader chapter={8} id="questions-titre" eyebrow={COPY.faq.eyebrow} title={COPY.faq.title} />
          <p className="mt-6 text-[0.9375rem] leading-relaxed text-ink-soft">
            {COPY.footer.contact} :{' '}
            <a className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-champagne" href={`mailto:${COPY.footer.contactEmail}`}>
              {COPY.footer.contactEmail}
            </a>
          </p>
        </Reveal>
        <div className="border-t border-line">
          {COPY.faq.items.map((item, index) => (
            <details key={item.q} className="faq-item group border-b border-line" open={index === 0}>
              <summary className={`flex cursor-pointer list-none items-start justify-between gap-6 py-7 text-left [&::-webkit-details-marker]:hidden ${FOCUS}`}>
                <span className="font-didone text-[1.375rem] leading-snug text-ink transition-colors group-hover:text-champagne">{item.q}</span>
                <span aria-hidden="true" className="relative mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line-strong transition-colors group-open:border-champagne">
                  <span className="absolute h-px w-3 bg-ink" />
                  <span className="absolute h-3 w-px bg-ink transition-transform duration-300 group-open:scale-y-0" />
                </span>
              </summary>
              <p className="-mt-1 max-w-[36rem] pb-7 text-[0.9375rem] leading-relaxed text-ink-soft">
                {item.a}
                {index === COPY.faq.items.length - 1 ? (
                  <>
                    {' '}
                    <Link to="/politique-de-confidentialite" className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-champagne">
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
    <section aria-labelledby="final-titre" className="px-2.5 sm:px-3">
      <div className="grain relative isolate overflow-hidden rounded-[24px] bg-[#0B0907] ring-1 ring-bone/5 sm:rounded-[32px]">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(120%_90%_at_20%_80%,#3A2A17_0%,#140F0A_50%,#0B0907_100%)]">
          {/* One still frame of the same silk: the page closes as it opened. */}
          <SilkCanvas animate={false} />
        </div>
        <div className={`grid items-center gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] ${WRAP} py-24 sm:py-32`}>
          <Reveal>
            <h2 id="final-titre" className="max-w-[38rem] text-balance font-didone text-[2.75rem] font-normal leading-[1.02] tracking-[-0.025em] text-bone sm:text-[4rem]">
              {COPY.finalCta.title}
            </h2>
            <p className="mt-6 max-w-[30rem] text-[1.0625rem] leading-relaxed text-bone/70">{COPY.finalCta.text}</p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <PrimaryCta to="/inscription">{COPY.finalCta.button}</PrimaryCta>
              <GhostCta to="/connexion">{COPY.finalCta.secondary}</GhostCta>
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
  const columnTitle = 'font-label text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-ink-faint'
  const link = 'text-[0.875rem] text-ink-soft transition-colors hover:text-champagne'
  return (
    <footer className="overflow-hidden">
      <div className={`grid grid-cols-2 gap-x-8 gap-y-12 pb-12 pt-20 sm:grid-cols-3 lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))] lg:gap-10 ${WRAP}`}>
        <div className="col-span-2 sm:col-span-3 lg:col-span-1">
          <BrandLockup dark />
          <p className="mt-5 max-w-[22rem] text-[0.875rem] leading-relaxed text-ink-soft">{COPY.footer.description}</p>
          <p className="mt-4 font-brand text-[1.375rem] italic text-champagne">{COPY.footer.tagline}</p>
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
      {/* The house name, engraved across the foot of the page. */}
      <p aria-hidden="true" className="-mb-[0.18em] select-none whitespace-nowrap text-center font-didone text-[clamp(5rem,24vw,22rem)] leading-none tracking-[-0.05em] text-transparent [-webkit-text-stroke:1px_rgba(200,169,106,0.22)]">
        Malaika
      </p>
    </footer>
  )
}

/* ------------------------------------------------------------------- page */

export function LandingPage() {
  const qrDataUrl = useQrDataUrl(`${PUBLIC_SITE_URL}/`)
  return (
    <div className="theme-nuit min-h-svh bg-paper text-ink selection:bg-champagne selection:text-nuit">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-bone focus:px-4 focus:py-2 focus:text-sm focus:text-nuit"
      >
        {COPY.nav.skipToContent}
      </a>
      <SiteHeader />
      <main id="contenu">
        <Hero qrDataUrl={qrDataUrl} />
        <FactsBand />
        <Showcase />
        <ProblemSolution />
        <GuestJourney qrDataUrl={qrDataUrl} />
        <Features />
        <HowItWorks />
        <Occasions />
        <Verification qrDataUrl={qrDataUrl} />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  )
}
