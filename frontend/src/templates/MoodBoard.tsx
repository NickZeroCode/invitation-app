/**
 * « Mood Board » — reproduction fidèle des planches éditoriales de référence
 * `important-template/IMG_9952.png`, `IMG_9953.png` et `IMG_9954.png`.
 *
 * Une planche terracotta posée comme un magazine : une couverture plein cadre
 * portant un grand « Save the date » en script blanc, le monogramme du couple
 * en serif élégant ceint d'une couronne végétale fine à cheval sur la fonte de
 * la photo, les prénoms en capitales espacées, le type d'événement en script,
 * une citation, le mois en lettrine serif avec le jour cerclé d'un anneau
 * organique, puis la palette du thème en pastilles allongées et les tenues en
 * photos scriptées. Tout est SVG inline pour que l'aperçu et le PDF se
 * comportent à l'identique.
 */
import type { CSSProperties, ReactNode } from 'react'
import { LuxePattern, VellumHalo, monogramFrom } from './luxeMotifs.tsx'
import { messageFontCss } from './messageFonts.ts'
import { TemplateOrnament } from './ornaments.tsx'
import {
  CoverHero,
  InvitationPaper,
  ProgramSection,
  TableSection,
  isEmphasized,
} from './shared.tsx'
import { GOLD, ROMAN_FONT, SCRIPT_FONT } from './referenceMotifs.tsx'
import type { TemplateProps } from './types.ts'

/* Planche chaude — papier ivoire, encre espresso, accent terracotta, liseré or. */
const PAPER = '#F8F1E5'
const INK = '#55240F'
const SOFT = '#93684C'
const TERRACOTTA = '#B4653A'
const LINE = '#E6CFA8'
const DEEP = '#3A1A0A'
const GOLD_SHINE = '#D9B45C'
const CIRCLE_RED = '#B23A2E'

const FRENCH_MONTHS = [
  'JANVIER', 'FÉVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN',
  'JUILLET', 'AOÛT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DÉCEMBRE',
] as const

/** Jours de la semaine, lundi en tête (planche française). */
const WEEKDAY_INITIALS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] as const

function parseIso(iso: string): Date | null {
  const parts = iso.split('-').map(Number)
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return null
  return new Date(parts[0], parts[1] - 1, parts[2])
}

/** Un dégradé doré réutilisable pour les titres brillants. */
function goldText(color: string): CSSProperties {
  return {
    backgroundImage: `linear-gradient(160deg, ${GOLD_SHINE} 0%, ${GOLD} 38%, #8A6420 52%, ${GOLD_SHINE} 68%, ${color} 100%)`,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
  }
}

/* Couverture — script « Save the date » posé sur la photo. */
function CoverScript() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-[5%] z-30 flex flex-col items-center px-[1.4em]"
      aria-hidden="true"
    >
      <p
        className="whitespace-nowrap leading-[0.95]"
        style={{
          fontFamily: SCRIPT_FONT,
          fontSize: '4.5em',
          color: '#FBF7EF',
          textShadow:
            '0 0.06em 0.32em rgba(40,15,5,0.5), 0 0.02em 0.1em rgba(40,15,5,0.6)',
          transform: 'rotate(-2deg)',
        }}
      >
        Save the date
      </p>
      {/* Éclat doré — une fine ligne brillante sous le script. */}
      <span
        className="mt-[0.55em] block h-[0.1em] w-[46%]"
        style={{
          background: `linear-gradient(90deg, transparent, ${GOLD_SHINE}, ${GOLD}, ${GOLD_SHINE}, transparent)`,
          borderRadius: '999px',
          opacity: 0.9,
        }}
      />
    </div>
  )
}

/* Monogramme — initiales serif dans une couronne végétale fine. */
function BotanicalWreath({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 220" className={className} aria-hidden="true" fill="none">
      <defs>
        <linearGradient id="mb-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7A8B5E" />
          <stop offset="1" stopColor="#4E5B3A" />
        </linearGradient>
        <linearGradient id="mb-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={GOLD_SHINE} />
          <stop offset="0.5" stopColor={GOLD} />
          <stop offset="1" stopColor="#8A6420" />
        </linearGradient>
      </defs>
      {/* double anneau or */}
      <circle cx="110" cy="110" r="104" stroke="url(#mb-gold)" strokeWidth="1.6" opacity="0.9" />
      <circle cx="110" cy="110" r="97" stroke="url(#mb-gold)" strokeWidth="0.9" strokeDasharray="2.5 4" opacity="0.55" />
      {/* branche gauche — tiges balayées */}
      <g stroke="#5E6B47" strokeWidth="1.7" strokeLinecap="round" opacity="0.9">
        <path d="M 44 132 C 30 104 36 70 62 50" />
        <path d="M 52 96 C 44 84 44 68 52 58" />
      </g>
      <g fill="url(#mb-leaf)" opacity="0.92">
        <path d="M 40 118 C 28 112 24 100 28 90 C 40 96 44 106 40 118 Z" />
        <path d="M 36 92 C 26 84 24 70 30 62 C 40 70 42 82 36 92 Z" />
        <path d="M 46 66 C 40 54 42 42 50 36 C 58 46 56 58 46 66 Z" />
        <path d="M 62 52 C 60 40 66 30 76 28 C 80 40 74 50 62 52 Z" />
      </g>
      {/* fleurs + bourgeons gauche */}
      <g>
        <g transform="translate(38 128)">
          <ellipse rx="5.4" ry="3.4" fill="#C98BA0" opacity="0.95" />
          <ellipse rx="5.4" ry="3.4" fill="#B4636F" opacity="0.9" transform="rotate(72)" />
          <ellipse rx="5.4" ry="3.4" fill="#C98BA0" opacity="0.95" transform="rotate(144)" />
          <ellipse rx="5.4" ry="3.4" fill="#B4636F" opacity="0.9" transform="rotate(216)" />
          <ellipse rx="5.4" ry="3.4" fill="#C98BA0" opacity="0.95" transform="rotate(288)" />
          <circle r="2.4" fill="#E9C4CD" />
        </g>
        <circle cx="30" cy="140" r="3" fill="#B4636F" />
        <circle cx="46" cy="142" r="2.2" fill="#C98BA0" />
        <circle cx="26" cy="120" r="2" fill="#B4636F" />
      </g>
      {/* branche droite */}
      <g stroke="#5E6B47" strokeWidth="1.7" strokeLinecap="round" opacity="0.9">
        <path d="M 176 88 C 190 116 184 150 158 170" />
        <path d="M 168 124 C 176 136 176 152 168 162" />
      </g>
      <g fill="url(#mb-leaf)" opacity="0.92">
        <path d="M 180 102 C 192 108 196 120 192 130 C 180 124 176 114 180 102 Z" />
        <path d="M 184 128 C 194 136 196 150 190 158 C 180 150 178 138 184 128 Z" />
        <path d="M 174 154 C 180 166 178 178 170 184 C 162 174 164 162 174 154 Z" />
        <path d="M 158 168 C 160 180 154 190 144 192 C 140 180 146 170 158 168 Z" />
      </g>
      <g>
        <g transform="translate(182 92)">
          <ellipse rx="5.4" ry="3.4" fill="#C98BA0" opacity="0.95" />
          <ellipse rx="5.4" ry="3.4" fill="#B4636F" opacity="0.9" transform="rotate(72)" />
          <ellipse rx="5.4" ry="3.4" fill="#C98BA0" opacity="0.95" transform="rotate(144)" />
          <ellipse rx="5.4" ry="3.4" fill="#B4636F" opacity="0.9" transform="rotate(216)" />
          <ellipse rx="5.4" ry="3.4" fill="#C98BA0" opacity="0.95" transform="rotate(288)" />
          <circle r="2.4" fill="#E9C4CD" />
        </g>
        <circle cx="190" cy="80" r="3" fill="#B4636F" />
        <circle cx="174" cy="78" r="2.2" fill="#C98BA0" />
        <circle cx="194" cy="100" r="2" fill="#B4636F" />
      </g>
    </svg>
  )
}

function Monogram({ initials }: { initials: [string, string] }) {
  return (
    <div className="relative flex h-[11em] w-[11em] items-center justify-center">
      <BotanicalWreath className="absolute inset-0 h-full w-full" />
      <span
        className="relative whitespace-nowrap leading-none"
        style={{ fontFamily: ROMAN_FONT, fontWeight: 600, fontSize: '3.6em', color: INK }}
      >
        {initials[0]}
        <span
          className="inline-block align-baseline"
          style={{
            fontSize: '0.52em',
            margin: '0 0.08em',
            ...goldText(TERRACOTTA),
            fontFamily: SCRIPT_FONT,
          }}
        >
          &amp;
        </span>
        {initials[1]}
      </span>
    </div>
  )
}

/* Calendrier — mois en lettrine, jour cerclé d'un anneau organique. */
function CalendarBoard({ iso }: { iso: string }) {
  const date = parseIso(iso)
  if (!date) return null
  const year = date.getFullYear()
  const month = date.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leading = (new Date(year, month, 1).getDay() + 6) % 7 // lundi = 0
  const cells: Array<number | null> = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, k) => k + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  const eventDay = date.getDate()
  return (
    <div className="mt-[1.7em] w-full max-w-[24em]">
      <p
        className="uppercase"
        style={{
          fontFamily: ROMAN_FONT,
          fontWeight: 600,
          fontSize: '1.5em',
          letterSpacing: '0.34em',
          color: INK,
        }}
      >
        {FRENCH_MONTHS[month]}
      </p>
      <span
        className="mx-auto mt-[0.7em] block h-[0.08em] w-[68%]"
        style={{
          background: `linear-gradient(90deg, transparent, ${GOLD_SHINE}, ${GOLD}, ${GOLD_SHINE}, transparent)`,
        }}
        aria-hidden="true"
      />
      <div className="mt-[1.1em] grid grid-cols-7 gap-y-[0.42em] text-center">
        {WEEKDAY_INITIALS.map((day) => (
          <span
            key={day}
            className="text-[0.78em] italic"
            style={{ color: SOFT, fontFamily: ROMAN_FONT, letterSpacing: '0.02em' }}
          >
            {day}
          </span>
        ))}
        {cells.map((cell, index) =>
          cell === null ? (
            <span key={`empty-${index}`} aria-hidden="true" />
          ) : (
            <span key={cell} className="flex items-center justify-center">
              {cell === eventDay ? (
                <span
                  className="flex h-[2em] w-[2em] items-center justify-center font-semibold"
                  style={{
                    color: CIRCLE_RED,
                    border: `0.13em solid ${CIRCLE_RED}`,
                    borderRadius: '50% 46% 53% 47% / 52% 49% 51% 48%',
                    transform: 'rotate(-6deg)',
                    fontSize: '1.02em',
                  }}
                >
                  {cell}
                </span>
              ) : (
                <span className="text-[1em]" style={{ color: INK, opacity: 0.86 }}>
                  {cell}
                </span>
              )}
            </span>
          ),
        )}
      </div>
    </div>
  )
}

/* Palette — pastilles allongées comme la planche de référence. */
const PALETTE: Array<[string, string]> = [
  ['#C7A76C', 'Sable'],
  ['#F3E7CD', 'Ivoire'],
  ['#9A5A40', 'Cannelle'],
  ['#55240F', 'Cacao'],
  ['#C4743C', 'Terracotta'],
]

function PaletteBoard() {
  return (
    <div className="mt-[1.6em] w-full">
      <p className="leading-none" style={{ fontFamily: SCRIPT_FONT, fontSize: '2.6em', color: INK }}>
        Palette de couleurs
      </p>
      <div className="mt-[1.6em] flex flex-wrap items-end justify-center gap-[1em]">
        {PALETTE.map(([hex, name]) => (
          <figure key={name} className="flex flex-col items-center">
            <span
              aria-hidden="true"
              className="block h-[5.4em] w-[1.6em]"
              style={{
                backgroundColor: hex,
                borderRadius: '999px',
                border: '1px solid rgba(85,36,15,0.10)',
                boxShadow:
                  'inset 0 0.3em 0.5em rgba(255,255,255,0.22), 0 0.4em 0.9em rgba(85,36,15,0.16)',
              }}
            />
            <figcaption
              className="mt-[0.7em] text-[0.72em] uppercase"
              style={{ color: SOFT, letterSpacing: '0.22em' }}
            >
              {name}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}

/* Anneaux — le motif de clôture de la planche de référence. */
function RingsFlourish({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 60" className={className} aria-hidden="true" fill="none">
      <g stroke={GOLD} strokeWidth="1.6" strokeLinecap="round">
        <circle cx="94" cy="30" r="13" />
        <circle cx="107" cy="30" r="13" />
      </g>
      <g stroke={GOLD} strokeWidth="1.4" strokeLinecap="round" opacity="0.9">
        <path d="M 30 34 C 48 20 66 20 80 30" />
        <path d="M 170 26 C 152 40 134 40 120 30" />
      </g>
      <g fill="#7A8B5E" opacity="0.9">
        <path d="M 40 30 C 34 26 32 20 34 15 C 40 19 42 25 40 30 Z" />
        <path d="M 56 24 C 52 18 52 12 56 8 C 60 14 60 20 56 24 Z" />
        <path d="M 160 30 C 166 26 168 20 166 15 C 160 19 158 25 160 30 Z" />
        <path d="M 144 24 C 148 18 148 12 144 8 C 140 14 140 20 144 24 Z" />
      </g>
      <circle cx="30" cy="30" r="2" fill={GOLD} />
      <circle cx="170" cy="30" r="2" fill={GOLD} />
    </svg>
  )
}

/* Étiquette script (Outfit women's / men's) au-dessus des photos. */
function ScriptLabel({ children }: { children: ReactNode }) {
  return (
    <p className="leading-none" style={{ fontFamily: SCRIPT_FONT, fontSize: '2.3em', color: INK }}>
      {children}
    </p>
  )
}

/* ================================================================== */
export function MoodBoard({ draft }: TemplateProps) {
  const titleEm = isEmphasized(draft, 'title')
  const initials = monogramFrom(draft.title)
  const dressCode = draft.dressCode
  const mid = Math.ceil(dressCode.length / 2)
  const women = dressCode.slice(0, mid)
  const men = dressCode.slice(mid)

  return (
    <InvitationPaper style={{ backgroundColor: PAPER, color: INK }}>
      <LuxePattern templateKey="mood-board" />
      <VellumHalo color={PAPER} />

      {/* Couverture plein cadre + grand script « Save the date ». */}
      {draft.cover_url ? (
        <div className="relative">
          <CoverHero
            draft={draft}
            bandColor="rgba(58,26,10,0.5)"
            edgeColor="rgba(217,180,92,0.9)"
            eyebrow=""
            paperColor={PAPER}
            titleStyle={{ display: 'none' }}
          />
          <CoverScript />
        </div>
      ) : null}

      <div className="relative flex flex-1 flex-col items-center px-[2.8em] pb-[3.6em] text-center">
        {/* Monogramme à cheval sur la fonte de la photo. */}
        {initials ? (
          <div className={draft.cover_url ? '-mt-[6.2em]' : 'mt-[3em]'}>
            <Monogram initials={initials} />
          </div>
        ) : null}

        {/* Prénoms en capitales espacées. */}
        <h1
          className="mt-[1.4em] break-words text-balance uppercase leading-[1.25]"
          style={{
            fontSize: titleEm ? '2.15em' : '1.85em',
            letterSpacing: '0.32em',
            color: INK,
            fontFamily: ROMAN_FONT,
            fontWeight: 600,
          }}
        >
          {draft.title}
        </h1>

        {/* Type d'événement en script doré (le message de la planche). */}
        {draft.message ? (
          <p
            className="mt-[0.5em] leading-[1.05]"
            style={{
              fontSize: '3.1em',
              fontFamily: messageFontCss(draft.messageFont) ?? SCRIPT_FONT,
              ...goldText(TERRACOTTA),
            }}
          >
            {draft.message}
          </p>
        ) : null}

        {draft.guestName?.trim() ? (
          <p className="mt-[0.9em] font-display italic" style={{ fontSize: '1.1em', color: SOFT }}>
            {draft.guestName}
          </p>
        ) : null}

        {/* Citation — la note de l'organisateur en petites capitales. */}
        {draft.note ? (
          <p
            className="mt-[1.5em] max-w-[30em] uppercase leading-[1.8]"
            style={{ fontSize: '0.78em', letterSpacing: '0.16em', color: SOFT }}
          >
            {draft.note}
          </p>
        ) : null}

        {/* Calendrier du mois, jour cerclé. */}
        <CalendarBoard iso={draft.event_date} />
        {draft.event_time ? (
          <p className="mt-[1.1em] uppercase" style={{ fontSize: '0.92em', letterSpacing: '0.4em', color: SOFT }}>
            à {draft.event_time.slice(0, 5)}
          </p>
        ) : null}

        {/* Lieu en capitales espacées. */}
        {draft.venue_name || draft.venue_address ? (
          <div
            className="mt-[1.5em] uppercase"
            style={{
              fontSize: isEmphasized(draft, 'venue') ? '1.1em' : '0.96em',
              letterSpacing: '0.26em',
              color: INK,
              lineHeight: 1.9,
            }}
          >
            {draft.venue_name ? <p>{draft.venue_name}</p> : null}
            {draft.venue_address ? <p style={{ color: SOFT }}>{draft.venue_address}</p> : null}
          </div>
        ) : null}
        {draft.venue_details ? (
          <p className="mt-[0.5em] text-[0.94em] italic" style={{ color: SOFT }}>
            {draft.venue_details}
          </p>
        ) : null}

        {/* Planche — Mood Board / Thème / Palette. */}
        <div className="mt-[3em] w-full">
          <p className="leading-none" style={{ fontFamily: SCRIPT_FONT, fontSize: '3em', ...goldText(TERRACOTTA) }}>
            Mood Board
          </p>
          <p
            className="mt-[0.6em] uppercase"
            style={{
              fontFamily: ROMAN_FONT,
              fontWeight: 600,
              fontSize: '1.5em',
              letterSpacing: '0.2em',
              color: INK,
            }}
          >
            Thème : Terracotta
          </p>
        </div>
        <PaletteBoard />

        {/* Tenues — photos sous une étiquette script. */}
        {dressCode.length ? (
          <div className="mt-[3em] w-full">
            {women.length ? (
              <div className="w-full">
                <ScriptLabel>Outfit women&rsquo;s</ScriptLabel>
                <div className="mt-[1.2em] flex flex-wrap items-start justify-center gap-[1.1em]">
                  {women.map((image, index) => (
                    <figure key={`w-${index}`} className="w-[10.6em]">
                      <img
                        src={image.url}
                        alt=""
                        className="w-full rounded-[0.3em] object-cover"
                        style={{
                          aspectRatio: '3 / 4',
                          border: `1px solid ${LINE}`,
                          boxShadow: '0 0.5em 1.1em rgba(85,36,15,0.14)',
                        }}
                      />
                      {image.caption ? (
                        <figcaption className="mt-[0.55em] text-[0.85em] italic leading-[1.4]" style={{ color: SOFT }}>
                          {image.caption}
                        </figcaption>
                      ) : null}
                    </figure>
                  ))}
                </div>
              </div>
            ) : null}
            {men.length ? (
              <div className="mt-[2.4em] w-full">
                <ScriptLabel>Outfit men&rsquo;s</ScriptLabel>
                <div className="mt-[1.2em] flex flex-wrap items-start justify-center gap-[1.1em]">
                  {men.map((image, index) => (
                    <figure key={`m-${index}`} className="w-[10.6em]">
                      <img
                        src={image.url}
                        alt=""
                        className="w-full rounded-[0.3em] object-cover"
                        style={{
                          aspectRatio: '3 / 4',
                          border: `1px solid ${LINE}`,
                          boxShadow: '0 0.5em 1.1em rgba(85,36,15,0.14)',
                        }}
                      />
                      {image.caption ? (
                        <figcaption className="mt-[0.55em] text-[0.85em] italic leading-[1.4]" style={{ color: SOFT }}>
                          {image.caption}
                        </figcaption>
                      ) : null}
                    </figure>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <ProgramSection
          draft={draft}
          accent={TERRACOTTA}
          ink={INK}
          ornament={<TemplateOrnament templateKey="mood-board" color={GOLD} />}
        />
        <TableSection
          draft={draft}
          accent={TERRACOTTA}
          ink={INK}
          ornament={<TemplateOrnament templateKey="mood-board" color={GOLD} />}
        />

        {/* Clôture — anneaux + remerciement. */}
        <div className="mt-[3.2em] flex w-full flex-col items-center">
          <RingsFlourish className="w-[11em]" />
          <p className="mt-[1.1em] max-w-[30em] text-pretty leading-[1.7]" style={{ fontSize: '0.98em', color: INK }}>
            Nous sommes ravis de vous convier à notre mariage et vous remercions
            chaleureusement de votre présence. Votre soutien et votre amour sont
            essentiels pour nous.
          </p>
          <p className="mt-[0.9em] text-[0.98em] font-semibold" style={{ color: DEEP }}>
            Merci d&rsquo;avance de partager ce moment de bonheur avec nous&nbsp;!
          </p>
        </div>
      </div>
    </InvitationPaper>
  )
}
