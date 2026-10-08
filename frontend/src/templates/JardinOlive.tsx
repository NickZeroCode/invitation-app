/**
 * « Jardin d'Olive » — fine-art botanical wedding. Soft cream paper, sage
 * watercolor bouquets in the corners, a thin gold arch around the
 * composition, olive calligraphy names and a designed date block: quiet,
 * organic luxury.
 */
import {
  CoverHero,
  DateBlock,
  DressCodeSection,
  InvitationPaper,
  ProgramSection,
  guestLabel,
  isEmphasized,
} from './shared.tsx'
import type { TemplateProps } from './types.ts'
import { messageFontCss } from './messageFonts.ts'
import { ArchFrame, SAGE, WatercolorSpray } from './florals.tsx'

const OLIVE = '#5B6B4B'
const INK = '#2C3526'
const SCRIPT_INK = '#3E4B2D'
const GOLD = '#BFA05C'
const PAPER_BG = 'radial-gradient(120% 100% at 50% 0%, #F8F4EA 0%, #F4EFE3 52%, #EFE8D8 100%)'

const LEAF_PATH = 'M0 0 C4 -6.2 12.4 -8.4 17 -2.6 C12.4 3.6 4 5.8 0 0 Z'

/** Olive divider: hairline rule, leaves and a gold diamond at centre. */
function Sprig() {
  return (
    <svg viewBox="0 0 120 24" className="h-[1.9em] w-[10em]" aria-hidden="true" fill="none">
      <path d="M4 12 H42" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" opacity="0.85" />
      <path d="M78 12 H116" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" opacity="0.85" />
      <g transform="translate(46 12) rotate(-24) scale(0.62)">
        <path d={LEAF_PATH} fill={OLIVE} opacity="0.85" />
      </g>
      <g transform="translate(74 12) rotate(204) scale(0.62)">
        <path d={LEAF_PATH} fill={OLIVE} opacity="0.85" />
      </g>
      <path d="M60 3 L67 12 L60 21 L53 12 Z" fill={GOLD} />
    </svg>
  )
}

export function JardinOlive({ draft }: TemplateProps) {
  const titleEm = isEmphasized(draft, 'title')
  const dateEm = isEmphasized(draft, 'date')
  const venueEm = isEmphasized(draft, 'venue')
  return (
    <InvitationPaper style={{ backgroundImage: PAPER_BG, color: INK }}>
      <CoverHero
        draft={draft}
        bandColor="rgba(248,244,234,0.78)"
        edgeColor="rgba(91,107,75,0.6)"
        titleStyle={{
          fontFamily: "'Great Vibes', cursive",
          fontSize: titleEm ? '3em' : '2.4em',
          color: SCRIPT_INK,
        }}
      />

      {/* Decorations frame the text zone (below the cover photo). */}
      <div className="relative flex flex-1 flex-col">
        <WatercolorSpray
          palette={SAGE}
          className="pointer-events-none absolute left-[-1.2em] top-[-1em] w-[15.5em]"
        />
        <WatercolorSpray
          palette={SAGE}
          className="pointer-events-none absolute bottom-[-1em] right-[-1.2em] w-[12em]"
          style={{ transform: 'rotate(180deg)' }}
        />
        <ArchFrame
          className="pointer-events-none absolute inset-[1.6em]"
          color={GOLD}
          opacity={0.45}
        />

        <div className="relative flex flex-1 flex-col items-center px-[6.5em] py-[6em] text-center">
        <p className="text-[1.02em] uppercase" style={{ color: OLIVE, letterSpacing: '0.52em' }}>
          Mariage
        </p>

        <p className="mt-[2em] max-w-[26em] font-display text-[1.25em] italic text-pretty" style={{ color: OLIVE }}>
          {guestLabel(draft)}
        </p>

        <h1
          className="mt-[0.5em] break-words text-balance leading-[1.22]"
          style={{
            fontSize: titleEm ? '4em' : '3em',
            fontFamily: "'Great Vibes', cursive",
            color: SCRIPT_INK,
          }}
        >
          {draft.title}
        </h1>

        <div className="mt-[1.6em]">
          <Sprig />
        </div>

        {draft.message ? (
          <p
            className="mt-[1.4em] max-w-[29em] text-pretty text-[1.2em] leading-[1.8] break-words opacity-90"
            style={{ fontFamily: messageFontCss(draft.messageFont) }}
          >
            {draft.message}
          </p>
        ) : null}

        <div className="mt-[2.3em] w-full">
          <DateBlock draft={draft} accent={OLIVE} ink={SCRIPT_INK} emphasize={dateEm} />
        </div>

        {draft.venue_name || draft.venue_address ? (
          <div className="mt-[2.1em]">
            {draft.venue_name ? (
              <p
                className="font-display text-[1.35em]"
                style={{ color: venueEm ? OLIVE : INK, fontWeight: venueEm ? 600 : 500 }}
              >
                {draft.venue_name}
              </p>
            ) : null}
            {draft.venue_address ? (
              <p className="mt-[0.45em] text-[1.1em] uppercase opacity-85" style={{ letterSpacing: '0.32em' }}>
                {draft.venue_address}
              </p>
            ) : null}
            {draft.venue_details ? (
              <p className="mt-[0.6em] text-[1.02em] italic opacity-78">{draft.venue_details}</p>
            ) : null}
          </div>
        ) : null}

        <ProgramSection
          draft={draft}
          accent={OLIVE}
          ink={INK}
          ornament={<Sprig />}
          titleStyle={{ letterSpacing: '0.52em' }}
        />
        <DressCodeSection
          draft={draft}
          accent={OLIVE}
          ink={INK}
          ornament={<Sprig />}
          titleStyle={{ letterSpacing: '0.52em' }}
        />

        <div className="mt-auto pt-[2.4em]">
          <Sprig />
          <p className="mt-[1em] text-[1.02em] italic opacity-75">
            Sous le signe de l'olivier, symbole de paix et d'amour.
          </p>
        </div>
        </div>
      </div>
    </InvitationPaper>
  )
}
