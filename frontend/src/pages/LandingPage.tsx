/**
 * Public marketing homepage (`/`).
 *
 * Brand: « Malachite ». Named for the banded green stone of the Katanga
 * copper belt: warm paper, green-black ink, flat malachite, pale jade on the
 * dark stages and a single vermilion wax-seal accent. Flat colour only — no
 * gradients, no glass, no italics; depth comes from geometry, perspective
 * and shadow. Bodoni Moda (roman) carries the voice, Montserrat small caps
 * the labels. The page reads as numbered chapters on paper, between three
 * malachite stages:
 *
 *  - The opening: a curtain counts in (once per visit), then the hero — a
 *    living slab of malachite (a tiny WebGL shader drawing the stone's flat
 *    bands), the « MalaikaEvents » masthead and the real invitation suite in
 *    3D (envelope, card, wax seal) that tilts with the pointer and rises as
 *    you scroll.
 *  - The collection: the camera travels down a corridor of the real
 *    templates as you scroll; any card opens in a 3D viewer where it can be
 *    turned over in the hand.
 *  - The close: the same stone, still, with the signature.
 *
 * Every invitation shown is the real template component rendered from
 * `sampleDraft`; no stock imagery, no invented customers, prices or
 * statistics (the facts band reads the template registry). API-free and
 * without a 3D library, for a fast first paint on mobile data; rich motion
 * runs only when the visitor allows it and the device can afford it (see
 * landing/motion), and every effect has a finished still state.
 */
import { Fragment, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import QRCode from 'qrcode'

import { LegalLinks } from '../components/LegalLinks.tsx'
import { IntroCurtain } from '../landing/IntroCurtain.tsx'
import { KinshasaClock } from '../landing/KinshasaClock.tsx'
import { MalachiteCanvas } from '../landing/MalachiteCanvas.tsx'
import { useRichMotion } from '../landing/motion.ts'
import { Reveal } from '../landing/Reveal.tsx'
import { StillLife, WindowLight } from '../landing/StillLife.tsx'
import { TemplateGallery } from '../landing/TemplateGallery.tsx'
import { TemplateViewer } from '../landing/TemplateViewer.tsx'
import {
  BrandLockup,
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
const H2 = 'statement text-balance text-[clamp(2rem,4vw,4.25rem)] leading-[1] text-ink'
const LEAD = 'text-[1.0625rem] leading-relaxed text-ink-soft'
const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-paper'

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
      className={`aspect-[3/4] w-full overflow-hidden bg-[#F3EFE7] [font-family:var(--font-sans)] ${className}`}
      role="img"
      aria-label={definition ? `${fr.templates.previewLabel} : ${definition.name}` : fr.templates.previewLabel}
    >
      {definition ? <definition.Component draft={sampleDraft(templateKey)} /> : null}
    </div>
  )
}

/** A label that rolls to a second copy of itself on hover (see `.roll`). */
function Roll({ children }: { children: string }) {
  return (
    <span className="roll">
      <span>{children}</span>
      <span aria-hidden="true">{children}</span>
    </span>
  )
}

/** The main action: solid lime. */
function PrimaryCta({ to, children, className = '' }: { to: string; children: string; onDark?: boolean; className?: string }) {
  return (
    <Link to={to} className={`btn-primary ${className}`}>
      {children}
    </Link>
  )
}

/** The secondary action: dark glass with a fine, light-catching border. */
function GhostCta({ to, href, children }: { to?: string; href?: string; children: string }) {
  return to ? (
    <Link to={to} className="btn-outline">
      {children}
    </Link>
  ) : (
    <a href={href} className="btn-outline">
      {children}
    </a>
  )
}

/**
 * Splits a headline into its first breath and the rest, the rest set in the
 * grey of secondary text (« L’élégance du papier, » / « sans ses
 * contraintes. »). Falls back to a single tone without a natural break.
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
      {chapter ? <span className="text-brand">{String(chapter).padStart(2, '0')}</span> : null}
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
            <span className="text-ink-faint">{tail}</span>
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
    QRCode.toDataURL(text, { width: 340, margin: 1, color: { dark: '#0f1714', light: '#ffffff' } })
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
    <header className="fixed inset-x-0 top-0 z-40 bg-paper/75 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-[90rem] items-center justify-between gap-6 px-5 sm:px-8">
        <Link to="/" aria-label={fr.appName} className="btn-ghost shrink-0 -ml-3">
          <BrandLockup />
        </Link>

        <nav aria-label={COPY.nav.ariaLabel} className="hidden items-center gap-1 whitespace-nowrap xl:flex">
          {NAV_LINKS.map(([href, label]) => (
            <a key={href} href={`#${href}`} className="btn-ghost text-[0.9375rem]">
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-2 sm:flex">
            <Link to="/connexion" className="btn-outline">
              {COPY.nav.login}
            </Link>
            <Link to="/inscription" className="btn-primary">
              {COPY.nav.signup}
            </Link>
          </span>
          <button
            type="button"
            className="btn-outline btn-icon xl:hidden"
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
        <div id="menu-mobile" className="border-t border-line bg-paper xl:hidden">
          <nav aria-label={COPY.nav.ariaLabel} className="mx-auto flex max-w-[90rem] flex-col px-5 py-3 sm:px-8">
            {NAV_LINKS.map(([href, label], index) => (
              <a key={href} href={`#${href}`} onClick={() => setOpen(false)} className="flex items-baseline gap-4 border-b border-line py-4 font-brand text-[1.75rem] text-ink">
                <span className="text-[0.75rem] font-semibold text-ink-faint">{String(index + 1).padStart(2, '0')}</span>
                {label}
              </a>
            ))}
            <div className="mt-5 grid grid-cols-2 gap-3 pb-3">
              <Link to="/connexion" className="btn-outline">
                {COPY.nav.login}
              </Link>
              <Link to="/inscription" className="btn-primary">
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

/** Headline words rising one after another out of their own line. */
function RisingWords({ text, startMs, className = '', caps = false }: { text: string; startMs: number; className?: string; caps?: boolean }) {
  return (
    <>
      {text.split(' ').map((word, index, words) => (
        <Fragment key={`${word}-${index}`}>
          <span className={caps ? 'word-mask-caps' : 'word-mask'}>
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

/** The guest's printed access card, as it lies on the table. */
function AccessCardPrint({ qrDataUrl }: { qrDataUrl: string }) {
  return (
    <div className="flex flex-col items-center px-[10%] pb-[12%] pt-[11%] text-center text-[#0f1012] [font-family:var(--font-sans)]">
      <p className="text-[clamp(0.375rem,0.7vw,0.5625rem)] font-semibold uppercase tracking-[0.22em] text-[#c8432b]">{COPY.hero.accessTitle}</p>
      {qrDataUrl ? (
        <img src={qrDataUrl} alt="" className="mt-[10%] aspect-square w-[80%] mix-blend-multiply" />
      ) : (
        <span aria-hidden="true" className="mt-[10%] block aspect-square w-[80%] bg-[#ece8e1]" />
      )}
      <p className="mt-[9%] text-[clamp(0.45rem,0.85vw,0.6875rem)] font-medium">{COPY.hero.rsvpGuest}</p>
      <p className="mt-[3%] text-[clamp(0.375rem,0.65vw,0.5rem)] uppercase tracking-[0.2em] text-[#74777b]">{COPY.hero.accessStatus}</p>
    </div>
  )
}

/** A circled footnote number set in the statement (① ② ③). */
function NoteMark({ n }: { n: number }) {
  return (
    <span className="relative -top-[1.15em] ml-[0.06em] inline-flex h-[0.62em] w-[0.62em] items-center justify-center rounded-full border-[0.045em] border-current font-grotesk text-[0.36em] font-semibold leading-none">
      {n}
    </span>
  )
}

function Hero({ qrDataUrl, rich }: { qrDataUrl: string; rich: boolean }) {
  return (
    <section aria-labelledby="hero-titre" className="relative px-2.5 pt-2.5 sm:px-3 sm:pt-3">
      {/* A warm stone table in daylight. */}
      <div className="relative isolate overflow-hidden rounded-[24px] bg-[#e9e5de] sm:rounded-[32px]">
        {/* Daylight through a window falls across the table, fading toward the copy. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-20 w-full opacity-[0.38] mix-blend-multiply [mask-image:linear-gradient(to_right,transparent_8%,black_55%)] lg:w-[72%] lg:[mask-image:linear-gradient(to_right,transparent,black_40%)]"
        >
          <WindowLight animate={rich} />
        </div>
        <div className="mx-auto grid w-full max-w-[88rem] items-center gap-4 px-5 pt-24 sm:px-10 sm:pt-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-2 lg:px-14">
          <div className="relative z-10 max-w-[40rem] lg:py-8">
            <p className="mark-label landing-rise flex items-center gap-3 text-ink-soft" style={{ ['--rise-delay' as string]: '200ms' }}>
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-brand" />
              {COPY.hero.eyebrow}
            </p>
            <h1 id="hero-titre" className="mt-6">
              <span className="sr-only">{COPY.hero.title}</span>
              <span aria-hidden="true" className="statement block text-[clamp(2.25rem,4.6vw,4.75rem)] max-sm:leading-[1]">
                <RisingWords caps text={COPY.hero.statementLead} startMs={260} />
              </span>
            </h1>
            <p aria-hidden="true" className="statement landing-rise mt-[0.06em] text-[clamp(2.25rem,4.6vw,4.75rem)] text-ink-soft max-sm:leading-[1]" style={{ ['--rise-delay' as string]: '650ms' }}>
              {COPY.hero.statement.map((part, index) =>
                'name' in part ? (
                  <Fragment key={index}>
                    <span className="statement-name">{part.name}</span>
                    <NoteMark n={part.note} />
                  </Fragment>
                ) : (
                  <Fragment key={index}>{part.text}</Fragment>
                ),
              )}
            </p>
            <p className="landing-rise mt-8 max-w-[34rem] text-[1.0625rem] leading-relaxed text-ink-soft" style={{ ['--rise-delay' as string]: '800ms' }}>
              {COPY.hero.text}
            </p>
            <div className="landing-rise mt-8 flex flex-col gap-3 sm:flex-row sm:items-center" style={{ ['--rise-delay' as string]: '880ms' }}>
              <PrimaryCta to="/inscription">{COPY.hero.signupCta}</PrimaryCta>
              <GhostCta href="#modeles">{COPY.hero.secondaryCta}</GhostCta>
            </div>
            <p className="landing-rise mt-6 text-[0.875rem] text-ink-faint" style={{ ['--rise-delay' as string]: '940ms' }}>
              {COPY.hero.loginPrompt}{' '}
              <Link to="/connexion" className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                {COPY.hero.primaryCta}
              </Link>
            </p>
          </div>

          <div className="landing-rise relative mx-auto -mb-6 w-full max-w-[44rem] lg:-mr-10 lg:mb-0" style={{ ['--rise-delay' as string]: '150ms' }}>
            <StillLife
              animate={rich}
              label={COPY.hero.stageLabel}
              card={<TemplatePreview templateKey="heritage-luxe" />}
              accessCard={<AccessCardPrint qrDataUrl={qrDataUrl} />}
            />
          </div>
        </div>

        {/* Printer's marks along the foot of the table. */}
        <div className="mx-auto w-full max-w-[88rem] px-5 pb-6 sm:px-10 lg:px-14">
          <div className="mark-label flex flex-col gap-4 border-t border-line pt-5 text-ink-faint lg:flex-row lg:items-center lg:justify-between">
            <ol aria-hidden="true" className="flex flex-col gap-2 text-ink-soft sm:flex-row sm:flex-wrap sm:gap-x-6">
              {COPY.hero.notes.map((note, index) => (
                <li key={note} className="flex items-center gap-2">
                  <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-current text-[0.5625rem] leading-none">{index + 1}</span>
                  {note}
                </li>
              ))}
            </ol>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <KinshasaClock city={COPY.hero.clockCity} />
              <a href="#modeles" className="inline-flex items-center gap-2 text-ink-soft transition-colors hover:text-ink">
                <span aria-hidden="true" className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand motion-reduce:animate-none" />
                <Roll>{COPY.hero.scroll}</Roll>
              </a>
              <span>©{CURRENT_YEAR}</span>
            </div>
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
              <span className="statement block text-[4rem] text-ink sm:text-[5.5rem]">{value}</span>
              <span className="mt-4 block max-w-[14rem] text-[0.875rem] leading-snug text-ink-soft">{label}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

/* -------------------------------------------------------------- showcase */

function Showcase({ rich }: { rich: boolean }) {
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


  const filters = (
    <div role="group" aria-label={COPY.showcase.filterLabel} className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0">
      <button type="button" aria-pressed={category === null} className="tag" onClick={() => setCategory(null)}>
        {COPY.showcase.all}
      </button>
      {categories.map(([key, label]) => (
        <button key={key} type="button" aria-pressed={category === key} className="tag" onClick={() => setCategory(key)}>
          {label}
        </button>
      ))}
    </div>
  )

  // A full-bleed malachite stage for the collection.
  return (
    <section id="modeles" aria-labelledby="modeles-titre" className="relative scroll-mt-0 border-y border-line bg-paper text-ink">
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
          cursorLabel={COPY.showcase.cursor}
          filters={filters}
          onOpen={setViewing}
        />
      </div>

      <div className={`${WRAP} pb-24 sm:pb-28`}>
        <div className="flex flex-col items-start gap-6 border-t border-line pt-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-[30rem] text-[0.9375rem] text-ink-soft">
            {COPY.showcase.more.replace('{count}', String(TEMPLATES.length))}
          </p>
          <PrimaryCta to="/inscription" onDark className="w-full sm:w-auto">
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
    <section aria-labelledby="pourquoi-titre">
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
          <Reveal delay={120} className="rounded-[22px] bg-brand p-7 text-paper sm:p-10">
            <h3 className="font-label text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-paper/70">{COPY.problem.afterTitle}</h3>
            <ul className="mt-7 space-y-5">
              {COPY.problem.after.map((item) => (
                <li key={item} className="flex gap-3.5 text-[0.9375rem] leading-relaxed">
                  <IconCheck className="mt-1 h-4 w-4 shrink-0 text-paper" />
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
      <rect x="4" y="8" width="152" height="96" rx="3" fill="#E6E0D4" />
      <path d="M4 104 L80 58 L156 104 Z" fill="#DDD6C8" />
      <path d="M4 8 L80 64 L156 8 Z" fill="#F1ECE3" stroke="rgba(15,23,20,0.1)" />
      <circle cx="80" cy="62" r="12" fill="#C8432B" />
      <circle cx="80" cy="62" r="8.5" fill="none" stroke="#A9351F" strokeWidth="1.5" />
      <text x="80" y="66" textAnchor="middle" fontFamily="'Bodoni Moda', serif" fontSize="9" fill="#F5F2EC">
        GE
      </text>
    </svg>
  )
}

function GuestJourney({ qrDataUrl }: { qrDataUrl: string }) {
  const visuals: ReactNode[] = [
    <MiniEnvelope key="envelope" />,
    <div key="sheet" className="w-[62%] shadow-[0_14px_30px_-16px_rgba(15,23,20,0.45)]">
      <TemplatePreview templateKey="heritage-luxe" />
    </div>,
    <div key="rsvp" className="w-[82%] rounded-[12px] border border-line bg-surface px-4 py-4 text-left">
      <p className="text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-brand">{COPY.hero.rsvpTitle}</p>
      <div className="mt-3 rounded-full bg-brand px-3 py-2 text-center text-[0.75rem] font-medium text-paper">{COPY.hero.rsvpStatus}</div>
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
  // The guest's side, set on a sheet of its own.
  return (
    <section aria-labelledby="invite-titre" className="px-2.5 sm:px-3">
      <div className="overflow-hidden rounded-[24px] bg-surface-muted sm:rounded-[32px]">
        <div className={`${WRAP} ${SECTION_Y}`}>
          <Reveal>
            <SectionHeader wide chapter={3} id="invite-titre" eyebrow={COPY.guest.eyebrow} title={COPY.guest.title} lead={COPY.guest.subtitle} />
          </Reveal>
          <ol className="-mx-5 mt-14 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-5 px-5 pb-4 [scrollbar-width:thin] sm:mx-0 sm:mt-16 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-14 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
            {COPY.guest.steps.map((step, index) => (
              <Reveal as="li" key={step.title} delay={index * 90} className="w-[80%] shrink-0 snap-start sm:w-auto">
                <div className="flex aspect-[4/3.4] items-center justify-center overflow-hidden rounded-[18px] bg-paper">{visuals[index]}</div>
                <p className="mt-7 font-brand text-[1.75rem] leading-none text-brand [font-variant-numeric:lining-nums]" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="mt-3 font-brand text-[1.375rem] leading-tight text-ink">{step.title}</h3>
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
    <div className="rounded-[18px] bg-surface p-5 text-ink shadow-[0_2px_6px_rgba(15,23,20,0.12),0_50px_80px_-30px_rgba(15,23,20,0.45)]" aria-hidden="true">
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
        <div className="flex items-center gap-2 rounded-[10px] border border-line bg-surface-muted px-3 py-2 text-[0.75rem]">
          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-[3px] bg-brand text-paper">
            <IconCheck className="h-3 w-3" />
          </span>
          {COPY.illustration.attachPdf}
        </div>
      </div>
      <div className="mt-4 rounded-full bg-brand py-2.5 text-center text-[0.75rem] font-medium text-paper">{COPY.illustration.sendEmail}</div>
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
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-line-strong text-brand transition-colors group-hover:border-brand group-hover:bg-brand group-hover:text-paper">
                  <Icon className="h-[1.125rem] w-[1.125rem]" />
                </span>
                <div>
                  <h3 className="font-brand text-[1.5rem] leading-tight text-ink">{item.title}</h3>
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
            <Reveal as="li" key={step.title} delay={index * 90} className="group relative bg-paper p-7 transition-colors duration-500 hover:bg-brand sm:p-8">
              {/* Engraved numerals: outlined, filled on hover. */}
              <span
                aria-hidden="true"
                className="statement block text-[5rem] text-transparent [-webkit-text-stroke:1.5px_var(--color-brand)] transition-colors duration-500 group-hover:text-paper group-hover:[-webkit-text-stroke:1px_transparent] [font-variant-numeric:lining-nums]"
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-10 font-brand text-[1.375rem] leading-tight text-ink transition-colors duration-500 group-hover:text-paper">{step.title}</h3>
              <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-soft transition-colors duration-500 group-hover:text-paper/80">{step.text}</p>
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
              <span className="font-label text-[0.6875rem] font-semibold tracking-[0.2em] text-ink-faint transition-colors group-hover:text-brand">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="font-brand text-[1.75rem] leading-tight text-ink transition-[color,transform] duration-500 group-hover:translate-x-2 group-hover:text-brand sm:text-[2.25rem]">{category.name}</h3>
              <p className="col-start-2 mt-1 text-[0.9375rem] text-ink-soft sm:col-start-3 sm:mt-0">{category.text}</p>
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
                <IconCheck className="mt-1 h-4 w-4 shrink-0 text-brand" />
                {point}
              </li>
            ))}
          </ul>
        </Reveal>

        {/* The door: the printed access card and the verdict the scanner returns. */}
        <figure className="relative mx-auto flex w-full max-w-[28rem] flex-col items-center py-6 [perspective:1200px]">
          <div aria-hidden="true" className="absolute left-1/2 top-1/2 aspect-square w-[88%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-soft" />
          <div className="relative rounded-[20px] bg-surface p-6 text-ink shadow-[0_2px_6px_rgba(15,23,20,0.12),0_60px_90px_-40px_rgba(15,23,20,0.55)] [transform:rotateX(10deg)_rotateY(-12deg)_rotateZ(1.5deg)]">
            <p className="text-center font-label text-[0.625rem] font-semibold uppercase tracking-[0.24em] text-brand">{COPY.hero.accessTitle}</p>
            {qrDataUrl ? (
              <img src={qrDataUrl} alt={COPY.verification.qrAlt} className="mt-4 h-44 w-44" />
            ) : (
              <div className="mt-4 h-44 w-44 bg-surface-muted" aria-hidden="true" />
            )}
          </div>
          <div className="relative -mt-6 ml-24 flex w-full max-w-[17rem] items-center gap-3 rounded-full bg-ink py-2.5 pl-2.5 pr-5 text-paper shadow-[0_30px_50px_-20px_rgba(15,23,20,0.6)]" aria-hidden="true">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper text-brand">
              <IconCheck className="h-4 w-4" />
            </span>
            <span className="text-left">
              <span className="block text-[0.8125rem] font-semibold text-paper">{COPY.illustration.verdict}</span>
              <span className="block text-[0.75rem] text-paper/70">{COPY.illustration.verdictGuest}</span>
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
            <a className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-brand" href={`mailto:${COPY.footer.contactEmail}`}>
              {COPY.footer.contactEmail}
            </a>
          </p>
        </Reveal>
        <div className="border-t border-line">
          {COPY.faq.items.map((item, index) => (
            <details key={item.q} className="faq-item group border-b border-line" open={index === 0}>
              <summary className={`flex cursor-pointer list-none items-start justify-between gap-6 py-7 text-left [&::-webkit-details-marker]:hidden ${FOCUS}`}>
                <span className="font-brand text-[1.375rem] leading-snug text-ink transition-colors group-hover:text-brand">{item.q}</span>
                <span aria-hidden="true" className="relative mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line-strong transition-colors group-open:border-brand group-open:bg-brand">
                  <span className="absolute h-px w-3 bg-ink group-open:bg-paper" />
                  <span className="absolute h-3 w-px bg-ink transition-transform duration-300 group-open:scale-y-0" />
                </span>
              </summary>
              <p className="-mt-1 max-w-[36rem] pb-7 text-[0.9375rem] leading-relaxed text-ink-soft">
                {item.a}
                {index === COPY.faq.items.length - 1 ? (
                  <>
                    {' '}
                    <Link to="/politique-de-confidentialite" className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-brand">
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
      <div className="relative isolate overflow-hidden rounded-[24px] border border-line bg-paper text-ink sm:rounded-[32px]">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-paper">
          {/* The same stone, still: the page closes as it opened. */}
          <MalachiteCanvas animate={false} still={73} />
        </div>
        <div className={`grid items-center gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] ${WRAP} py-24 sm:py-32`}>
          <Reveal>
            <h2 id="final-titre" className="statement max-w-[44rem] text-balance text-[clamp(2.3rem,5vw,4.75rem)]">
              {COPY.finalCta.title}
            </h2>
            <p className="mt-6 max-w-[30rem] text-[1.0625rem] leading-relaxed text-ink-soft">{COPY.finalCta.text}</p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <PrimaryCta to="/inscription" onDark>
                {COPY.finalCta.button}
              </PrimaryCta>
              <GhostCta to="/connexion">{COPY.finalCta.secondary}</GhostCta>
            </div>
          </Reveal>
          <div className="mx-auto rounded-[28px] border border-line bg-surface px-10 py-12 lg:mr-0">
            <LogoArtwork className="w-[min(64vw,17rem)]" />
          </div>
        </div>
      </div>
    </section>
  )
}

/* ----------------------------------------------------------------- footer */

function SiteFooter() {
  const columnTitle = 'font-label text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-ink-faint'
  const link = 'text-[0.875rem] text-ink-soft transition-colors hover:text-brand'
  return (
    <footer className="overflow-hidden">
      <div className={`grid grid-cols-2 gap-x-8 gap-y-12 pb-12 pt-20 sm:grid-cols-3 lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))] lg:gap-10 ${WRAP}`}>
        <div className="col-span-2 sm:col-span-3 lg:col-span-1">
          <BrandLockup />
          <p className="mt-5 max-w-[22rem] text-[0.875rem] leading-relaxed text-ink-soft">{COPY.footer.description}</p>
          <p className="mt-4 font-brand text-[1.375rem] text-brand">{COPY.footer.tagline}</p>
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
      {/* The house name, set across the foot of the page in a tone of the paper. */}
      <p aria-hidden="true" className="statement -mb-[0.1em] select-none whitespace-nowrap text-center text-[10.2vw] text-surface-sunken">
        MalaikaEvents
      </p>
    </footer>
  )
}

/* ------------------------------------------------------------------- page */

export function LandingPage() {
  const qrDataUrl = useQrDataUrl(`${PUBLIC_SITE_URL}/`)
  const rich = useRichMotion()
  return (
    <div className="theme-site min-h-svh bg-paper text-ink">
      <IntroCurtain enabled={rich} />
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-paper"
      >
        {COPY.nav.skipToContent}
      </a>
      <SiteHeader />
      <main id="contenu">
        <Hero qrDataUrl={qrDataUrl} rich={rich} />
        <FactsBand />
        <Showcase rich={rich} />
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
