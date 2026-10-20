/**
 * « Mood Board » — reproduction of the editorial save-the-date references
 * `important-template/IMG_9952.png`, `IMG_9953.png` and `IMG_9954.png`.
 *
 * A warm terracotta mood-board laid out like a magazine board: a full-bleed
 * cover carrying a script « Save the date », a monogrammed wreath of fine
 * gold sprigs around the couple's initials, the names set in wide-spaced
 * caps, a letterpress calendar card with the day circled in terracotta, and
 * the event's own palette drawn as colour chips. Every drawing is inline SVG
 * so the screen preview and the PDF export scale identically.
 */
import { LuxePattern, VellumHalo, monogramFrom } from './luxeMotifs.tsx'
import { messageFontCss } from './messageFonts.ts'
import { TemplateOrnament } from './ornaments.tsx'
import {
  CoverHero,
  DressCodeSection,
  InvitationPaper,
  NoteSection,
  ProgramSection,
  TableSection,
  isEmphasized,
} from './shared.tsx'
import { GOLD, ROMAN_FONT, SCRIPT_FONT } from './referenceMotifs.tsx'
import type { TemplateProps } from './types.ts'

/* Warm terracotta board — caramel paper, burnt-sienna ink, terracotta accent. */
const PAPER = '#F8F1E5'
const INK = '#55240F'
const SOFT = '#93684C'
const TERRACOTTA = '#B4653A'
const LINE = '#E6CFA8'

/** The event's palette, drawn as rounded chips like the reference mood board. */
const PALETTE: Array<[string, string]> = [
  ['#C08A52', 'Sable'],
  ['#F4E7CF', 'Ivoire'],
  ['#8A4B33', 'Cannelle'],
  ['#55240F', 'Cacao'],
  ['#C4743C', 'Terracotta'],
]

/** "Lun Mar … Dim" weekday initials, Monday-first (French board). */
const WEEKDAY_INITIALS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] as const

function parseIso(iso: string): Date | null {
  const parts = iso.split('-').map(Number)
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return null
  return new Date(parts[0], parts[1] - 1, parts[2])
}

/**
 * Letterpress calendar card for the event month: a grid of days starting on
 * Monday, the event day circled in a hand-drawn terracotta ring.
 */
function CalendarBoard({ iso, accent }: { iso: string; accent: string }) {
  const date = parseIso(iso)
  if (!date) return null
  const year = date.getFullYear()
  const month = date.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  // JS weekday (0 = Sunday) → Monday-first column (0 = Monday).
  const leading = (new Date(year, month, 1).getDay() + 6) % 7
  const cells: Array<number | null> = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, k) => k + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  const eventDay = date.getDate()
  return (
    <div
      className="mx-auto mt-[1.6em] w-full max-w-[24em] rounded-[0.6em] px-[1.7em] py-[1.5em]"
      style={{
        backgroundColor: '#FFFFFF',
        border: `1px solid ${LINE}`,
        boxShadow: '0 0.9em 2.2em rgba(85,36,15,0.10)',
      }}
    >
      <div className="grid grid-cols-7 gap-y-[0.5em] text-center">
        {WEEKDAY_INITIALS.map((day) => (
          <span
            key={day}
            className="text-[0.72em] italic"
            style={{ color: SOFT, fontFamily: ROMAN_FONT, letterSpacing: '0.04em' }}
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
                  className="flex h-[1.95em] w-[1.95em] items-center justify-center font-semibold"
                  style={{
                    color: accent,
                    border: `0.14em solid ${accent}`,
                    borderRadius: '50% 47% 52% 48% / 52% 50% 50% 48%',
                    transform: 'rotate(-5deg)',
                    fontSize: '1.02em',
                  }}
                >
                  {cell}
                </span>
              ) : (
                <span className="text-[0.98em]" style={{ color: INK, opacity: 0.82 }}>
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

/** The couple's palette, drawn as a row of rounded colour chips. */
function PaletteBoard() {
  return (
    <div className="mt-[3em] w-full">
      <p
        className="text-[1em] uppercase"
        style={{ letterSpacing: '0.34em', color: SOFT }}
      >
        Palette de couleurs
      </p>
      <div className="mt-[1.5em] flex flex-wrap items-end justify-center gap-[1.1em]">
        {PALETTE.map(([hex, name]) => (
          <figure key={name} className="flex flex-col items-center">
            <span
              aria-hidden="true"
              className="block h-[4.6em] w-[2.25em]"
              style={{
                backgroundColor: hex,
                borderRadius: '999px',
                border: `1px solid rgba(85,36,15,0.12)`,
                boxShadow: '0 0.4em 0.9em rgba(85,36,15,0.14)',
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

/** Fine gold sprigs framing the monogram wreath (the reference's ring florals). */
function WreathSprigs({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true" fill="none">
      <g stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" opacity="0.9">
        <path d="M 34 118 C 30 92 40 66 62 52" />
        <path d="M 166 82 C 170 108 160 134 138 148" />
      </g>
      {/* left sprig leaves + bloom */}
      <g fill={GOLD} opacity="0.85">
        <path d="M 44 104 C 34 100 30 90 32 82 C 42 86 46 94 44 104 Z" />
        <path d="M 40 84 C 32 78 30 68 34 62 C 42 68 44 76 40 84 Z" />
        <path d="M 52 62 C 48 52 50 42 56 38 C 62 46 60 56 52 62 Z" />
        <circle cx="30" cy="120" r="3.2" />
        <circle cx="36" cy="128" r="2.2" />
        <circle cx="25" cy="112" r="2" />
      </g>
      {/* right sprig leaves + bloom */}
      <g fill={GOLD} opacity="0.85">
        <path d="M 156 96 C 166 100 170 110 168 118 C 158 114 154 106 156 96 Z" />
        <path d="M 160 116 C 168 122 170 132 166 138 C 158 132 156 124 160 116 Z" />
        <path d="M 148 138 C 152 148 150 158 144 162 C 138 154 140 144 148 138 Z" />
        <circle cx="170" cy="80" r="3.2" />
        <circle cx="164" cy="72" r="2.2" />
        <circle cx="175" cy="88" r="2" />
      </g>
    </svg>
  )
}

export function MoodBoard({ draft }: TemplateProps) {
  const titleEm = isEmphasized(draft, 'title')
  const initials = monogramFrom(draft.title)
  return (
    <InvitationPaper style={{ backgroundColor: PAPER, color: INK }}>
      <LuxePattern templateKey="mood-board" />
      <VellumHalo color={PAPER} />

      <CoverHero
        draft={draft}
        bandColor="rgba(85,36,15,0.55)"
        edgeColor="rgba(176,135,60,0.9)"
        eyebrow="Save the date"
        paperColor={PAPER}
        titleStyle={{
          fontFamily: SCRIPT_FONT,
          fontSize: titleEm ? '4.6em' : '3.7em',
          color: '#F8F1E5',
          textShadow: '0 0.05em 0.3em rgba(40,15,5,0.55)',
        }}
      />

      <div className="relative flex flex-1 flex-col items-center px-[3em] pb-[3.4em] pt-[3.6em] text-center">
        {/* Monogrammed wreath — the couple's initials ringed in gold sprigs. */}
        {initials ? (
          <div className="relative flex h-[10em] w-[10em] items-center justify-center">
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full"
              style={{ border: `1.5px solid ${GOLD}`, opacity: 0.85 }}
            />
            <span
              aria-hidden="true"
              className="absolute inset-[0.45em] rounded-full"
              style={{ border: `1px dashed ${GOLD}`, opacity: 0.5 }}
            />
            <WreathSprigs className="absolute inset-0 h-full w-full" />
            <span
              className="relative whitespace-nowrap leading-none"
              style={{ fontFamily: SCRIPT_FONT, fontSize: '3.4em', color: INK }}
            >
              {initials[0]}
              <span style={{ fontSize: '0.6em', margin: '0 0.06em', color: TERRACOTTA }}>&amp;</span>
              {initials[1]}
            </span>
          </div>
        ) : null}

        {/* Names in wide-spaced caps. */}
        <h1
          className="mt-[1.5em] break-words text-balance uppercase leading-[1.3]"
          style={{
            fontSize: titleEm ? '2.1em' : '1.8em',
            letterSpacing: '0.3em',
            color: INK,
            fontFamily: ROMAN_FONT,
            fontWeight: 600,
          }}
        >
          {draft.title}
        </h1>

        {draft.guestName?.trim() ? (
          <p className="mt-[1em] font-display italic" style={{ fontSize: '1.15em', color: SOFT }}>
            {draft.guestName}
          </p>
        ) : null}

        {draft.message ? (
          <p
            className="mt-[1.3em] max-w-[26em] text-pretty leading-[1.7] break-words"
            style={{
              fontSize: '1.5em',
              color: TERRACOTTA,
              fontFamily: messageFontCss(draft.messageFont) ?? SCRIPT_FONT,
            }}
          >
            {draft.message}
          </p>
        ) : null}

        {/* Letterpress calendar card with the day circled. */}
        <CalendarBoard iso={draft.event_date} accent={TERRACOTTA} />
        {draft.event_time ? (
          <p
            className="mt-[1.2em] uppercase"
            style={{ fontSize: '0.98em', letterSpacing: '0.4em', color: SOFT }}
          >
            à {draft.event_time.slice(0, 5)}
          </p>
        ) : null}

        {draft.venue_name || draft.venue_address ? (
          <div
            className="mt-[1.5em] uppercase"
            style={{
              fontSize: isEmphasized(draft, 'venue') ? '1.12em' : '0.98em',
              letterSpacing: '0.26em',
              color: INK,
              lineHeight: 1.9,
            }}
          >
            {draft.venue_name ? <p>{draft.venue_name}</p> : null}
            {draft.venue_address ? <p>{draft.venue_address}</p> : null}
          </div>
        ) : null}
        {draft.venue_details ? (
          <p className="mt-[0.5em] text-[0.95em] italic opacity-80" style={{ color: SOFT }}>
            {draft.venue_details}
          </p>
        ) : null}

        {/* The event's own palette as colour chips. */}
        <PaletteBoard />

        <NoteSection draft={draft} ink={INK} />
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
        <DressCodeSection
          draft={draft}
          accent={TERRACOTTA}
          ink={INK}
          ornament={<TemplateOrnament templateKey="mood-board" color={GOLD} />}
        />
      </div>
    </InvitationPaper>
  )
}
