/**
 * « Brume Bleue » — reproduction of `very_beautiful template/Screenshot 2026-10-08 021752.png`.
 *
 * White paper with dusty-blue watercolour eucalyptus cascades at the top and
 * bottom-left, letterspaced caps intro, calligraphy names on one line around
 * an ornamental ampersand, a rule-divided « SAM | 28 | AOÛT » date row and a
 * script « réception à suivre » sign-off.
 */
import { messageFontCss } from './messageFonts.ts'
import { TemplateOrnament } from './ornaments.tsx'
import {
  CoverHero,
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
  ROMAN_FONT,
  SCRIPT_FONT,
  formatMonthShort,
  formatYearOnly,
  splitNames,
} from './referenceMotifs.tsx'
import type { TemplateProps } from './types.ts'
import { Bouquet } from './paintedFlora.tsx'
import type { FloraItem } from './paintedFlora.tsx'

const PAPER = '#FBFCFD'
const INK = '#3D4E6B'
const SOFT = '#7A8FB4'

const FOLIAGE_TOP_RIGHT: FloraItem[] = [
  { k: 'spray', x: 120, y: 10, s: 1.05, r: 200, p: 'eucalyptus', len: 120, n: 9, round: true, curve: 0.3 },
  { k: 'spray', x: 160, y: 0, s: 1.1, r: 170, p: 'blueLeaf', len: 140, n: 9, curve: -0.2 },
  { k: 'spray', x: 200, y: 30, s: 1, r: 230, p: 'dustyBlue', len: 130, n: 8, curve: 0.25 },
  { k: 'spray', x: 90, y: 0, s: 0.8, r: 150, p: 'blueLeaf', len: 110, n: 8 },
  { k: 'spray', x: 210, y: 90, s: 0.8, r: 250, p: 'eucalyptus', len: 100, n: 7, round: true },
  { k: 'spray', x: 140, y: 0, s: 0.9, r: 185, p: 'dustyBlue', len: 120, n: 8, round: true, curve: -0.3 },
  { k: 'spray', x: 220, y: 60, s: 0.9, r: 215, p: 'blueLeaf', len: 120, n: 8 },
  { k: 'berries', x: 150, y: 120, s: 1.3, r: 160, p: 'dustyBlue' },
  { k: 'berries', x: 104, y: 92, s: 1, r: 200, p: 'blueLeaf' },
  { k: 'berries', x: 196, y: 150, s: 1.1, r: 140, p: 'dustyBlue' },
]

const FOLIAGE_TOP_LEFT: FloraItem[] = [
  { k: 'spray', x: 50, y: 0, s: 0.8, r: 165, p: 'blueLeaf', len: 110, n: 7 },
  { k: 'spray', x: 80, y: 0, s: 0.55, r: 200, p: 'eucalyptus', len: 90, n: 6, round: true },
  { k: 'berries', x: 30, y: 70, s: 0.9, r: 190, p: 'dustyBlue' },
]

const FOLIAGE_BOTTOM_LEFT: FloraItem[] = [
  { k: 'spray', x: 20, y: 220, s: 1.15, r: 25, p: 'blueLeaf', len: 150, n: 9, curve: 0.25 },
  { k: 'spray', x: 0, y: 200, s: 1, r: 55, p: 'eucalyptus', len: 120, n: 8, round: true },
  { k: 'spray', x: 50, y: 220, s: 0.95, r: 5, p: 'dustyBlue', len: 130, n: 8, curve: -0.2 },
  { k: 'spray', x: 0, y: 150, s: 0.7, r: 70, p: 'blueLeaf', len: 100, n: 7 },
  { k: 'spray', x: 30, y: 220, s: 0.9, r: 40, p: 'dustyBlue', len: 120, n: 8, round: true },
  { k: 'berries', x: 70, y: 120, s: 1.1, r: 20, p: 'dustyBlue' },
]

export function BrumeBleue({ draft }: TemplateProps) {
  const titleEm = isEmphasized(draft, 'title')
  const dateEm = isEmphasized(draft, 'date')
  const venueEm = isEmphasized(draft, 'venue')
  const names = splitNames(draft.title)
  return (
    <InvitationPaper style={{ backgroundColor: PAPER, color: INK }}>

      <CoverHero
        draft={draft}
        bandColor="rgba(48,62,92,0.58)"
        edgeColor="rgba(194,154,78,0.9)"
        eyebrow="Joignez-vous à nous"
        paperColor={PAPER}
        titleStyle={{
          fontFamily: SCRIPT_FONT,
          fontSize: titleEm ? '4.3em' : '3.4em',
          color: '#F4F2EA',
          textShadow: '0 0.05em 0.3em rgba(30,40,64,0.55)',
        }}
      />

      {/* Painted dusty-blue eucalyptus: a dense spill at top-right, a
          lighter sprig top-left, a rising cluster at bottom-left. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <Bouquet items={FOLIAGE_TOP_RIGHT} viewBox="0 0 220 200" className="absolute -right-[1em] -top-[1em] h-[19em] w-[21em]" />
        <Bouquet items={FOLIAGE_TOP_LEFT} viewBox="0 0 120 120" className="absolute left-[6em] -top-[0.8em] h-[9em] w-[9em]" />
        <Bouquet items={FOLIAGE_BOTTOM_LEFT} viewBox="0 0 200 220" className="absolute -bottom-[1em] -left-[1em] h-[20em] w-[18em]" />
      </div>

      <div className="relative flex flex-1 flex-col items-center px-[6.2em] pb-[9em] pt-[12em] text-center">
        <p
          className="uppercase"
          style={{ fontFamily: ROMAN_FONT, fontWeight: 600, fontSize: '1.2em', letterSpacing: '0.16em', color: INK }}
        >
          Avec leurs familles
        </p>

        <h1 className="mt-[1.5em] break-words text-balance leading-[1.2]" style={{ color: SOFT }}>
          <span className="sr-only">{draft.title}</span>
          {names ? (
            <span
              aria-hidden="true"
              className="inline-flex flex-wrap items-baseline justify-center gap-x-[0.45em]"
            >
              <span style={{ fontFamily: SCRIPT_FONT, fontSize: titleEm ? '3.9em' : '3.2em' }}>
                {names[0]}
              </span>
              <span
                className="italic"
                style={{
                  fontFamily: ROMAN_FONT,
                  fontSize: titleEm ? '2.6em' : '2.2em',
                  color: INK,
                }}
              >
                &amp;
              </span>
              <span style={{ fontFamily: SCRIPT_FONT, fontSize: titleEm ? '3.9em' : '3.2em' }}>
                {names[1]}
              </span>
            </span>
          ) : (
            <span style={{ fontFamily: SCRIPT_FONT, fontSize: titleEm ? '3.9em' : '3.2em' }}>
              {draft.title}
            </span>
          )}
        </h1>

        {draft.guestName?.trim() ? (
          <p className="mt-[1em] font-display italic" style={{ fontSize: '1.12em', color: SOFT }}>
            {draft.guestName}
          </p>
        ) : null}

        <p
          className="mt-[1.7em] uppercase"
          style={{ fontFamily: ROMAN_FONT, fontWeight: 600, fontSize: '1.2em', letterSpacing: '0.16em', color: INK }}
        >
          On vous convie à nous rejoindre
        </p>
        <p className="mt-[0.3em] italic" style={{ fontFamily: ROMAN_FONT, fontSize: '1.35em', color: INK }}>
          pour célébrer notre mariage
        </p>

        {draft.message ? (
          <p
            className="mt-[1.1em] max-w-[26em] text-pretty leading-[1.7] break-words"
            style={{ fontSize: '1.1em', fontFamily: messageFontCss(draft.messageFont) }}
          >
            {draft.message}
          </p>
        ) : null}

        <div
          className="mt-[1.8em] flex items-stretch justify-center"
          style={{ transform: dateEm ? 'scale(1.12)' : undefined, color: SOFT, fontFamily: ROMAN_FONT, fontWeight: 600, fontSize: '1.25em' }}
        >
          <p className="flex items-center px-[0.85em] uppercase" style={{ letterSpacing: '0.22em' }}>
            {formatWeekday(draft.event_date).slice(0, 3)}
          </p>
          <span style={{ width: 2, backgroundColor: SOFT }} />
          <p
            className="flex items-center px-[0.5em] leading-none"
            style={{ fontSize: '2.3em' }}
          >
            {formatDayNumber(draft.event_date)}
          </p>
          <span style={{ width: 2, backgroundColor: SOFT }} />
          <p className="flex items-center px-[0.85em] uppercase" style={{ letterSpacing: '0.22em' }}>
            {formatMonthShort(draft.event_date)}
          </p>
        </div>

        <p className="mt-[1em] uppercase" style={{ fontFamily: ROMAN_FONT, fontWeight: 600, fontSize: '1.2em', letterSpacing: '0.16em', color: INK }}>
          {formatYearOnly(draft.event_date)}
        </p>
        <p className="mt-[0.2em] italic" style={{ fontFamily: ROMAN_FONT, fontSize: '1.35em', color: INK }}>
          à {formatEventTime(draft.event_time)}
        </p>

        {draft.venue_name || draft.venue_address ? (
          <div
            className="mt-[1.5em] uppercase"
            style={{ fontFamily: ROMAN_FONT, fontWeight: 600, fontSize: venueEm ? '1.3em' : '1.15em', color: INK, lineHeight: 1.6 }}
          >
            {draft.venue_name ? (
              <p style={{ letterSpacing: '0.26em', fontWeight: 600 }}>{draft.venue_name}</p>
            ) : null}
            {draft.venue_address ? (
              <p style={{ letterSpacing: '0.22em', fontSize: '0.86em', opacity: 0.85 }}>
                {draft.venue_address}
              </p>
            ) : null}
            {draft.venue_details ? (
              <p className="text-[0.82em] italic opacity-75" style={{ letterSpacing: '0.06em' }}>
                {draft.venue_details}
              </p>
            ) : null}
          </div>
        ) : null}

        <p className="mt-[1.2em] flex flex-col items-center" style={{ fontFamily: SCRIPT_FONT, fontSize: '2em', color: SOFT }}>
          réception à suivre
          <svg viewBox="0 0 200 14" className="-mt-[0.35em] h-[0.45em] w-[5.4em]" aria-hidden="true">
            <path d="M2 10 C 50 2, 120 14, 198 4" fill="none" stroke={SOFT} strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </p>

        <NoteSection draft={draft} ink={INK} />
        <ProgramSection
          draft={draft}
          accent={SOFT}
          ink={INK}
          ornament={<TemplateOrnament templateKey="brume-bleue" color={SOFT} />}
        />
        <TableSection
          draft={draft}
          accent={SOFT}
          ink={INK}
          ornament={<TemplateOrnament templateKey="brume-bleue" color={SOFT} />}
        />
        <DressCodeSection
          draft={draft}
          accent={SOFT}
          ink={INK}
          ornament={<TemplateOrnament templateKey="brume-bleue" color={SOFT} />}
        />
      </div>
    </InvitationPaper>
  )
}
