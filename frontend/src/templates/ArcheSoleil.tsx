/**
 * « Arche Soleil » — boho-luxe terracotta wedding. Sand paper, a gold
 * hexagon frame, blush & terracotta watercolor bouquets over its corners, a
 * small rising sun and terracotta-gold calligraphy names: warm, confident
 * and expensive-looking.
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
import { BLUSH, HexFrame, WatercolorSpray } from './florals.tsx'

const TERRA = '#BE5330'
const OCHRE = '#D89A52'
const PLUM = '#47282B'
const GOLD_WARM = '#C08A4A'
const PAPER_BG = 'radial-gradient(115% 95% at 50% -8%, #F7EAD8 0%, #F2E4D0 55%, #EAD6BD 100%)'

/** Terracotta-gold gradient for the calligraphy names. */
const TITLE_WARM =
  'linear-gradient(118deg, #A2543C 0%, #D89A52 42%, #B4633F 62%, #C9A24A 100%)'

/** Sun disc with rounded rays. */
function Sun({ size = '3.8em' }: { size?: string }) {
  const rays = Array.from({ length: 12 }, (_, i) => i * 30)
  return (
    <svg
      viewBox="0 0 120 120"
      style={{ width: size, height: size }}
      aria-hidden="true"
      fill="none"
    >
      <circle cx="60" cy="60" r="21" fill={OCHRE} />
      <circle cx="60" cy="60" r="27" stroke={TERRA} strokeWidth="1.2" strokeOpacity="0.55" />
      <g stroke={TERRA} strokeWidth="3.2" strokeLinecap="round" strokeOpacity="0.85">
        {rays.map((deg) => (
          <line
            key={deg}
            x1={60 + 33 * Math.cos((deg * Math.PI) / 180)}
            y1={60 + 33 * Math.sin((deg * Math.PI) / 180)}
            x2={60 + 44 * Math.cos((deg * Math.PI) / 180)}
            y2={60 + 44 * Math.sin((deg * Math.PI) / 180)}
          />
        ))}
      </g>
    </svg>
  )
}

/** Row of alternating terracotta / ochre dots. */
function DotBand() {
  return (
    <div className="flex items-center justify-center gap-[0.75em]" aria-hidden="true">
      {Array.from({ length: 9 }, (_, i) => (
        <span
          key={i}
          className="block h-[0.42em] w-[0.42em] rounded-full"
          style={{ backgroundColor: i % 2 ? OCHRE : TERRA, opacity: 0.85 }}
        />
      ))}
    </div>
  )
}

export function ArcheSoleil({ draft }: TemplateProps) {
  const titleEm = isEmphasized(draft, 'title')
  const dateEm = isEmphasized(draft, 'date')
  const venueEm = isEmphasized(draft, 'venue')
  return (
    <InvitationPaper style={{ backgroundImage: PAPER_BG, color: PLUM }}>
      <CoverHero
        draft={draft}
        bandColor="rgba(71,40,43,0.52)"
        edgeColor="rgba(216,154,82,0.85)"
        titleStyle={{
          fontFamily: "'Great Vibes', cursive",
          fontSize: titleEm ? '3em' : '2.4em',
          backgroundImage: TITLE_WARM,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        }}
      />

      {/* Decorations frame the text zone (below the cover photo). */}
      <div className="relative flex flex-1 flex-col">
        <div className="pointer-events-none absolute inset-[1.8em]">
          <HexFrame className="h-full w-full" color={GOLD_WARM} opacity={0.55} />
        </div>
        <WatercolorSpray
          palette={BLUSH}
          className="pointer-events-none absolute right-[-1em] top-[-0.8em] w-[14em]"
          style={{ transform: 'scaleX(-1)' }}
        />
        <WatercolorSpray
          palette={BLUSH}
          className="pointer-events-none absolute bottom-[-0.8em] left-[-1em] w-[14em]"
        />

        <div className="relative flex flex-1 flex-col items-center px-[6em] pt-[4.6em] pb-[4.2em] text-center">
        <Sun />
        <p
          className="mt-[1.2em] text-[1.02em] uppercase"
          style={{ color: TERRA, letterSpacing: '0.55em' }}
        >
          Invitation
        </p>

        <p className="mt-[1.9em] font-display text-[1.25em] italic" style={{ color: TERRA }}>
          {guestLabel(draft)}
        </p>

        <h1
          className="mt-[0.5em] break-words text-balance leading-[1.22]"
          style={{
            fontSize: titleEm ? '4.1em' : '3.1em',
            fontFamily: "'Great Vibes', cursive",
            backgroundImage: TITLE_WARM,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          {draft.title}
        </h1>

        {draft.message ? (
          <p
            className="mt-[1.5em] max-w-[29em] text-pretty text-[1.2em] leading-[1.75] break-words opacity-92"
            style={{ fontFamily: messageFontCss(draft.messageFont) }}
          >
            {draft.message}
          </p>
        ) : null}

        <div className="mt-[2.2em] w-full">
          <DateBlock draft={draft} accent={TERRA} ink={PLUM} emphasize={dateEm} />
        </div>

        {draft.venue_name || draft.venue_address ? (
          <div className="mt-[2.1em]">
            {draft.venue_name ? (
              <p
                className="font-display text-[1.35em]"
                style={{ color: venueEm ? TERRA : PLUM, fontWeight: venueEm ? 600 : 500 }}
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
          accent={TERRA}
          ink={PLUM}
          ornament={<DotBand />}
          titleStyle={{ letterSpacing: '0.55em' }}
        />
        <DressCodeSection
          draft={draft}
          accent={TERRA}
          ink={PLUM}
          ornament={<DotBand />}
          titleStyle={{ letterSpacing: '0.55em' }}
        />

        <div className="mt-auto w-full pt-[1.8em]">
          <DotBand />
          <p
            className="mt-[1em]"
            style={{ fontFamily: "'Great Vibes', cursive", fontSize: '1.8em', color: TERRA }}
          >
            Avec joie
          </p>
        </div>
        </div>
      </div>
    </InvitationPaper>
  )
}
