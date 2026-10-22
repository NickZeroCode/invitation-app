/**
 * « Jardin » — wedding anniversary as a fine-art botanical plate.
 *
 * The years together are the focal point: the number pulled from the title
 * (« Nos 25 ans de mariage » → 25) sits inside an open laurel-and-rosebud
 * wreath drawn in engraved line work over a watercolour wash. Without a
 * number the wreath holds the couple's initials. Blush cotton paper, plum
 * ink, sage foliage — romantic, but restrained: the drawing frames, the
 * typography speaks.
 */
import { BotanicalSprig, BotanicalWreath } from './botanicals.tsx'
import {
  CoverHero,
  DressCodeSection,
  InvitationPaper,
  NoteSection,
  ProgramSection,
  TableSection,
  formatDayNumber,
  formatEventTime,
  formatMonthYear,
  formatWeekday,
  guestLabel,
  isEmphasized,
  monogramInitials,
  titleNumber,
} from './shared.tsx'
import type { TemplateProps } from './types.ts'
import { messageFontCss } from './messageFonts.ts'
import { TemplateOrnament } from './ornaments.tsx'

const PAPER = '#FBF4F0'
const PLUM = '#4E2F37'
const ROSE = '#A65A66'
const SAGE = '#6F7F63'
const SERIF = "'Cormorant Garamond', 'Playfair Display', Georgia, serif"

export function JardinFloral({ draft }: TemplateProps) {
  const titleEm = isEmphasized(draft, 'title')
  const dateEm = isEmphasized(draft, 'date')
  const venueEm = isEmphasized(draft, 'venue')
  const years = titleNumber(draft.title)
  const initials = monogramInitials(draft.title)
  const sectionOrnament = (
    <TemplateOrnament templateKey="jardin-floral" color={ROSE} className="block h-auto w-full" />
  )
  const sectionTitle = { letterSpacing: '0.16em', textTransform: 'none' as const, fontSize: '1.35em' }

  return (
    <InvitationPaper
      style={{
        backgroundColor: PAPER,
        backgroundImage: 'radial-gradient(ellipse at 50% 22%, rgba(255,255,255,0.7), transparent 62%)',
        color: PLUM,
      }}
    >
      <CoverHero
        draft={draft}
        bandColor="rgba(251,244,240,0.82)"
        paperColor={PAPER}
        eyebrowColor={PLUM}
        edgeColor="rgba(166,90,102,0.7)"
        titleClassName="font-display italic"
        titleStyle={{ fontSize: titleEm ? '3em' : '2.3em', color: PLUM }}
      />

      <div className="relative flex flex-1 flex-col">
        {/* A single hairline frame: the paper edge of a printed card. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-[2.4em]"
          style={{ border: '1px solid rgba(166,90,102,0.28)' }}
        />

        <div className="relative flex flex-1 flex-col items-center px-[6.5em] pb-[4.5em] pt-[4.6em] text-center">
          <p
            className="text-[0.9em] uppercase"
            style={{ letterSpacing: '0.44em', color: ROSE, fontFamily: "'Montserrat', 'Inter', sans-serif" }}
          >
            Avec joie, nous vous convions
          </p>

          <div className="relative mt-[1.6em] h-[17em] w-[17em]">
            <BotanicalWreath className="absolute inset-0 h-full w-full" leaf={SAGE} bud={ROSE} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pb-[1.2em]">
              {years ? (
                <>
                  <span
                    className="italic leading-none"
                    style={{ fontFamily: SERIF, fontWeight: 500, fontSize: '5.4em', color: PLUM }}
                  >
                    {years}
                  </span>
                  <span
                    className="mt-[0.2em] text-[0.82em] uppercase"
                    style={{ letterSpacing: '0.5em', color: ROSE, fontFamily: "'Montserrat', 'Inter', sans-serif" }}
                  >
                    ans
                  </span>
                </>
              ) : initials.length ? (
                <span className="italic leading-none" style={{ fontFamily: SERIF, fontSize: '3.6em', color: PLUM }}>
                  {initials.join(' & ')}
                </span>
              ) : null}
            </div>
          </div>

          <h1
            className="mt-[1.1em] max-w-[20em] break-words text-balance italic leading-[1.15]"
            style={{ fontFamily: SERIF, fontWeight: 500, fontSize: titleEm ? '3.5em' : '2.9em', color: PLUM }}
          >
            {draft.title}
          </h1>

          <p className="mt-[1.4em] text-[1.25em] italic" style={{ fontFamily: SERIF, color: ROSE }}>
            {guestLabel(draft)}
          </p>
          {draft.message ? (
            <p
              className="mt-[1em] max-w-[27em] text-pretty text-[1.15em] leading-[1.75] break-words"
              style={{ fontFamily: messageFontCss(draft.messageFont) ?? SERIF }}
            >
              {draft.message}
            </p>
          ) : null}

          {draft.event_date ? (
            <div className="mt-[2.4em] flex w-full max-w-[26em] items-center justify-center gap-[1.4em]">
              <div className="flex-1 text-right">
                <p className="text-[0.92em] uppercase" style={{ letterSpacing: '0.34em', color: ROSE }}>
                  {formatWeekday(draft.event_date)}
                </p>
              </div>
              <div
                className="flex flex-col items-center px-[1.2em]"
                style={{ borderLeft: '1px solid rgba(166,90,102,0.4)', borderRight: '1px solid rgba(166,90,102,0.4)' }}
              >
                <span className="leading-none" style={{ fontFamily: SERIF, fontWeight: 500, fontSize: dateEm ? '3.4em' : '2.8em' }}>
                  {formatDayNumber(draft.event_date)}
                </span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-[0.92em] uppercase" style={{ letterSpacing: '0.24em', color: ROSE }}>
                  {formatMonthYear(draft.event_date)}
                </p>
              </div>
            </div>
          ) : null}
          {draft.event_time ? (
            <p className="mt-[0.9em] text-[1.2em] italic" style={{ fontFamily: SERIF }}>
              à {formatEventTime(draft.event_time).replace(':', 'h')}
            </p>
          ) : null}

          {draft.venue_name || draft.venue_address ? (
            <div className="mt-[1.8em] max-w-[26em]">
              {draft.venue_name ? (
                <p className="italic" style={{ fontFamily: SERIF, fontSize: venueEm ? '1.6em' : '1.4em', color: PLUM }}>
                  {draft.venue_name}
                </p>
              ) : null}
              {draft.venue_address ? (
                <p className="mt-[0.3em] text-[1em] leading-[1.55]" style={{ opacity: 0.82 }}>
                  {draft.venue_address}
                </p>
              ) : null}
              {draft.venue_details ? (
                <p className="mt-[0.5em] text-[1em] italic" style={{ color: ROSE }}>
                  {draft.venue_details}
                </p>
              ) : null}
            </div>
          ) : null}

          <NoteSection draft={draft} ink={PLUM} />
          <ProgramSection
            draft={draft}
            accent={ROSE}
            ink={PLUM}
            ornament={sectionOrnament}
            titleClassName="font-display italic"
            titleStyle={sectionTitle}
          />
          <TableSection
            draft={draft}
            accent={ROSE}
            ink={PLUM}
            ornament={sectionOrnament}
            titleClassName="font-display italic"
            titleStyle={sectionTitle}
          />
          <DressCodeSection
            draft={draft}
            accent={ROSE}
            ink={PLUM}
            ornament={sectionOrnament}
            titleClassName="font-display italic"
            titleStyle={sectionTitle}
          />

          <div className="mt-auto flex flex-col items-center pt-[2.4em]">
            <BotanicalSprig className="h-auto w-[10em]" leaf={SAGE} bud={ROSE} />
            <p className="mt-[0.6em] text-[1.1em] italic" style={{ fontFamily: SERIF, opacity: 0.85 }}>
              Au plaisir de vous y retrouver
            </p>
          </div>
        </div>
      </div>
    </InvitationPaper>
  )
}
