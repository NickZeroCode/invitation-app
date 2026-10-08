/**
 * « Héritage » — cream & gold atelier wedding. Gold line-art roses in the
 * corners, an inset double gold frame, calligraphy names in gold leaf and a
 * designed date block: the heirloom card of the wedding set.
 */
import { DateBlock, InvitationPaper, guestLabel, isEmphasized } from './shared.tsx'
import type { TemplateProps } from './types.ts'
import { messageFontCss } from './messageFonts.ts'
import { FlourishRule, GoldRoseCorner, PaperGrain } from './florals.tsx'

const GOLD = '#A67C3D'
const INK = '#2B2620'
const PAPER_BG = '#FBF5EA'

/** Gold-leaf gradient for the calligraphy names. */
const TITLE_GOLD =
  'linear-gradient(118deg, #9C7531 0%, #D9B96C 34%, #B0873C 52%, #E7CE8E 76%, #A67C3D 100%)'

export function HeritageLuxe({ draft }: TemplateProps) {
  const titleEm = isEmphasized(draft, 'title')
  const dateEm = isEmphasized(draft, 'date')
  const venueEm = isEmphasized(draft, 'venue')
  return (
    <InvitationPaper style={{ backgroundColor: PAPER_BG, color: INK }}>
      <PaperGrain opacity={0.05} />
      <GoldRoseCorner className="pointer-events-none absolute left-[0.4em] top-[0.4em] w-[11em] opacity-90" />
      <GoldRoseCorner
        className="pointer-events-none absolute bottom-[0.4em] right-[0.4em] w-[11em] opacity-90"
        style={{ transform: 'rotate(180deg)' }}
      />

      {/* Inset double gold frame. */}
      <div className="pointer-events-none absolute inset-[2.2em]" aria-hidden="true">
        <div className="absolute inset-0 border" style={{ borderColor: 'rgba(166,124,61,0.5)' }} />
        <div className="absolute inset-[0.55em] border" style={{ borderColor: 'rgba(166,124,61,0.24)' }} />
      </div>

      <div className="relative flex flex-1 flex-col items-center px-[7em] py-[5em] text-center">
        <p className="mt-[4.8em] text-[1em] uppercase" style={{ color: GOLD, letterSpacing: '0.38em' }}>
          Vous êtes invités
        </p>
        <FlourishRule className="mt-[1.3em] h-[1.4em] w-[17em]" color={GOLD} />

        {draft.cover_url ? (
          <div
            data-export-skip=""
            className="mt-[2.4em] w-full max-w-[22em] rounded-t-[11em] rounded-b-[0.8em] p-[0.4em]"
            style={{ border: '1px solid rgba(166,124,61,0.55)' }}
          >
            <img
              src={draft.cover_url}
              alt=""
              className="w-full rounded-t-[10.3em] rounded-b-[0.45em]"
              style={{ border: '1px solid rgba(166,124,61,0.3)' }}
            />
          </div>
        ) : null}

        <p className="mt-[2.3em] font-display text-[1.15em] italic" style={{ color: GOLD }}>
          {guestLabel(draft)}
        </p>
        <h1
          className="mt-[0.5em] break-words text-balance leading-[1.22]"
          style={{
            fontSize: titleEm ? '4.1em' : '3.1em',
            fontFamily: "'Great Vibes', cursive",
            backgroundImage: TITLE_GOLD,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          {draft.title}
        </h1>

        {draft.message ? (
          <p
            className="mt-[1.7em] max-w-[30em] text-pretty text-[1.2em] leading-[1.75] break-words opacity-92"
            style={{ fontFamily: messageFontCss(draft.messageFont) }}
          >
            {draft.message}
          </p>
        ) : null}

        <div className="mt-[2.4em] w-full">
          <DateBlock draft={draft} accent={GOLD} ink={INK} emphasize={dateEm} />
        </div>

        {draft.venue_name || draft.venue_address ? (
          <div className="mt-[2.3em]">
            {draft.venue_name ? (
              <p
                className="font-display text-[1.3em]"
                style={{ color: venueEm ? GOLD : INK, fontWeight: venueEm ? 600 : 400, letterSpacing: '0.04em' }}
              >
                {draft.venue_name}
              </p>
            ) : null}
            {draft.venue_address ? (
              <p className="mt-[0.5em] text-[1.05em] uppercase opacity-85" style={{ letterSpacing: '0.32em' }}>
                {draft.venue_address}
              </p>
            ) : null}
            {draft.venue_details ? (
              <p className="mt-[0.7em] text-[1.02em] italic opacity-80">{draft.venue_details}</p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-auto w-full pt-[2.5em]">
          <FlourishRule className="mx-auto h-[1.4em] w-[17em]" color={GOLD} />
          <p
            className="mt-[1em]"
            style={{ fontFamily: "'Great Vibes', cursive", fontSize: '1.8em', color: GOLD }}
          >
            Réception à suivre
          </p>
        </div>
      </div>
    </InvitationPaper>
  )
}
