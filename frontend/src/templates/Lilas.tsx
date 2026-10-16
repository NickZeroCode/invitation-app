/**
 * « Lilas » — reproduction of `very_beautiful template/Screenshot 2026-10-08 022420.png`.
 *
 * White textured paper wreathed by purple clematis blooms at the top-left and
 * bottom-right, a single name in huge charcoal calligraphy trailing a long
 * flourish, letterspaced caps chrome, the month above a rule-flanked
 * « SAMEDI —— 29 —— » date row and caps venue lines.
 */
import { PaperGrain } from './florals.tsx'
import { messageFontCss } from './messageFonts.ts'
import { TemplateOrnament } from './ornaments.tsx'
import {
  DressCodeSection,
  InvitationPaper,
  NoteSection,
  ProgramSection,
  TableSection,
  formatDayNumber,
  formatEventTime,
  formatWeekday,
  isEmphasized,
} from './shared.tsx'
import {
  FloralWreath,
  LILAC,
  SCRIPT_FONT,
  formatMonthOnly,
} from './referenceMotifs.tsx'
import type { TemplateProps } from './types.ts'

const PAPER = '#FCFBF9'
const INK = '#2E3B33'
const PLUM = '#7C6AA8'

/** Long calligraphic swash trailing under the name. */
function NameFlourish({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 260 40" className="h-[1.6em] w-[16em]" aria-hidden="true">
      <path
        d="M 22 26 C 70 8, 150 6, 214 20 C 238 25, 236 36, 218 33 C 206 31, 210 22, 226 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function Lilas({ draft }: TemplateProps) {
  const titleEm = isEmphasized(draft, 'title')
  const dateEm = isEmphasized(draft, 'date')
  const venueEm = isEmphasized(draft, 'venue')
  return (
    <InvitationPaper style={{ backgroundColor: PAPER, color: INK }}>
      <PaperGrain opacity={0.045} />

      {/* Purple clematis wreaths wrapping the diagonal */}
      <FloralWreath
        palette={LILAC}
        className="pointer-events-none absolute -left-[10em] -top-[10em] h-[27em] w-[28.5em]"
        style={{ transform: 'rotate(-12deg)' }}
      />
      <FloralWreath
        palette={LILAC}
        className="pointer-events-none absolute -bottom-[11.5em] -right-[13em] h-[26em] w-[27em]"
        style={{ transform: 'rotate(168deg)' }}
      />

      <div className="relative flex flex-1 flex-col items-center px-[6em] pb-[3.8em] pt-[5.6em] text-center">
        <h1
          className="break-words leading-[1.1]"
          style={{
            fontFamily: SCRIPT_FONT,
            fontSize: titleEm ? '6.5em' : '5.3em',
            color: INK,
            transform: 'rotate(-3deg)',
          }}
        >
          {draft.title}
        </h1>
        <NameFlourish color={PLUM} />

        {draft.guestName?.trim() ? (
          <p className="mt-[0.6em] font-display italic" style={{ fontSize: '1.12em', color: PLUM }}>
            {draft.guestName}
          </p>
        ) : null}

        <p
          className="mt-[1.4em] uppercase"
          style={{ fontSize: '1em', letterSpacing: '0.32em', lineHeight: 2.1 }}
        >
          Célébration d'anniversaire
          <br />
          Rejoignez-nous pour une fête au jardin
        </p>

        {draft.message ? (
          <p
            className="mt-[1.1em] max-w-[25em] text-pretty leading-[1.7] break-words"
            style={{ fontSize: '1.1em', fontFamily: messageFontCss(draft.messageFont) }}
          >
            {draft.message}
          </p>
        ) : null}

        <p
          className="mt-[1.9em] uppercase"
          style={{ letterSpacing: '0.42em', fontSize: '1.15em' }}
        >
          {formatMonthOnly(draft.event_date)}
        </p>

        <div
          className="mt-[1.1em] flex w-full max-w-[20em] items-center gap-[0.8em]"
          style={{ transform: dateEm ? 'scale(1.12)' : undefined }}
        >
          <p className="whitespace-nowrap uppercase" style={{ letterSpacing: '0.22em' }}>
            {formatWeekday(draft.event_date)}
          </p>
          <div className="h-[1px] flex-1" style={{ backgroundColor: INK, opacity: 0.5 }} />
          <p className="font-display leading-none" style={{ fontSize: '2.4em', fontWeight: 600 }}>
            {formatDayNumber(draft.event_date)}
          </p>
          <div className="h-[1px] flex-1" style={{ backgroundColor: INK, opacity: 0.5 }} />
          <p className="whitespace-nowrap uppercase" style={{ letterSpacing: '0.22em' }}>
            {formatEventTime(draft.event_time)}
          </p>
        </div>

        {draft.venue_name || draft.venue_address ? (
          <div
            className="mt-[1.6em] uppercase"
            style={{ fontSize: venueEm ? '1.12em' : '0.98em', letterSpacing: '0.2em', lineHeight: 2 }}
          >
            {draft.venue_name ? <p>{draft.venue_name}</p> : null}
            {draft.venue_address ? <p>{draft.venue_address}</p> : null}
            {draft.venue_details ? (
              <p className="text-[0.92em] italic opacity-80" style={{ letterSpacing: '0.08em' }}>
                {draft.venue_details}
              </p>
            ) : null}
          </div>
        ) : null}

        <NoteSection draft={draft} ink={INK} />
        <ProgramSection
          draft={draft}
          accent={PLUM}
          ink={INK}
          ornament={<TemplateOrnament templateKey="lilas" color={PLUM} />}
        />
        <TableSection
          draft={draft}
          accent={PLUM}
          ink={INK}
          ornament={<TemplateOrnament templateKey="lilas" color={PLUM} />}
        />
        <DressCodeSection
          draft={draft}
          accent={PLUM}
          ink={INK}
          ornament={<TemplateOrnament templateKey="lilas" color={PLUM} />}
        />
      </div>
    </InvitationPaper>
  )
}
